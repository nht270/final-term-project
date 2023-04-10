import { OkPacket, RowDataPacket } from 'mysql2'
import { PoolConnection } from 'mysql2/promise'
import { LimitOptions } from '../config.js'
import pool from '../db.js'
import { convertUnderscorePropertiesToCamelCase, decodeGender, encodeGender } from '../utils/dataMapping.js'
import { createLimitSql, hashText } from '../utils/misc.js'
import { createUid } from '../utils/uid.js'
import { setUnavailableRating } from './rating.js'

interface UserSignInResult {
    id: string,
    verified: boolean
}

interface UserAccount {
    id: string,
    phone?: string,
    name: string,
    gender: string,
    dateOfBirth: Date | string,
    avatar?: string,
    email: string,
    address?: string,
    longitude?: string,
    latitude?: string
}

interface ShortUserAccount {
    id: string,
    name: string,
    avatar?: string,
    locked: boolean
}

export type InformationToCreateUserAccount = Omit<UserAccount, 'id'> & { password: string }
export type InformationToUpdateUserAccount = Omit<UserAccount, 'id'>

export async function signIn(email: string, password: string) {
    const findUserAccountQuery = 'select id, verified from user_account where email=? and password=? and deleted_at is null and verified=true'
    const hashedPassword = hashText(password)
    const [userAccountRowDatas] = await pool.query(findUserAccountQuery, [email, hashedPassword]) as RowDataPacket[][]
    return convertUnderscorePropertiesToCamelCase(userAccountRowDatas[0] || null) as UserSignInResult | null
}

export async function getUserAccounts(limit?: LimitOptions) {
    let getUserAccountsQuery = 'select id, name, avatar, locked from user_account where deleted_at is null'
    if (limit) {
        getUserAccountsQuery += ' ' + createLimitSql(limit)
    }

    const [userAccountRowDatas] = await pool.query(getUserAccountsQuery) as RowDataPacket[][]
    return userAccountRowDatas.map(convertUnderscorePropertiesToCamelCase) as ShortUserAccount[]
}

export async function getInformation(userAccountId: string) {
    const findUserInformationQuery = 'select phone, name, gender, date_of_birth, avatar, email, address, longitude, latitude from user_account where id=? and deleted_at is null'
    const [userInformationRowDatas] = await pool.query(findUserInformationQuery, [userAccountId]) as RowDataPacket[][]

    if (Array.isArray(userInformationRowDatas) && userInformationRowDatas.length > 0) {
        // remap data
        userInformationRowDatas[0].gender = decodeGender(userInformationRowDatas[0].gender)
        return convertUnderscorePropertiesToCamelCase(userInformationRowDatas[0] || null) as UserAccount | null
    }

    return null
}

export async function updateInformation(userAccountId: string, information: InformationToUpdateUserAccount) {
    const { email, name, gender, dateOfBirth, phone, avatar, address, longitude, latitude } = information
    const updateUserInformationQuery = 'update user_account set phone=?, name=?, gender=?, date_of_birth=?, avatar=?, email=?, address=?, longitude=?, latitude=?  where id=? and deleted_at is null'
    const [result] = await pool.query(
        updateUserInformationQuery,
        [phone, name, encodeGender(gender as string), new Date(dateOfBirth as string), avatar, email, address, longitude, latitude, userAccountId]
    ) as OkPacket[]

    return result.affectedRows > 0
}

export async function updatePassword(userAccountId: string, oldPassword: string, newPassword: string) {
    const updatePasswordQuery = 'update user_account set password=? where id=? and password=?'
    const hashedOldPassword = hashText(oldPassword)
    const hashedNewPassword = hashText(newPassword)
    const [result] = await pool.query(updatePasswordQuery, [hashedNewPassword, userAccountId, hashedOldPassword]) as OkPacket[]

    return result.affectedRows > 0
}

export async function deleteAccount(userAccountId: string) {
    const poolConnection = await pool.getConnection()
    try {
        await poolConnection.beginTransaction()
        const deleteAccountQuery = 'update user_account set deleted_at=? where id=? and deleted_at is null'
        const [result] = await poolConnection.query(deleteAccountQuery, [new Date(), userAccountId]) as OkPacket[]
        if (result.affectedRows <= 0) {
            throw new Error('Not yet delete user account')
        }
        await setUnavailableRating(userAccountId, poolConnection)
        await poolConnection.commit()
        return true
    } catch (error) {
        console.log(error)
        await poolConnection.rollback()
        return false
    } finally {
        poolConnection.release()
    }
}

export async function forceUpdatePassword(userAccountId: string, password: string) {
    const updatePasswordQuery = 'update user_account set password=? where id=? and deleted_at is null'
    const hashedPassword = hashText(password)
    try {
        const [result] = await pool.query(updatePasswordQuery, [hashedPassword, userAccountId]) as OkPacket[]
        return result.affectedRows > 0
    } catch (error) {
        console.log(error)
        return false
    }
}

export async function getId(email: string) {
    const getIdQuery = 'select id from user_account where email=? and deleted_at is null'
    const [result] = await pool.query(getIdQuery, [email]) as RowDataPacket[]
    return result.length > 0 ? result[0].id : ''
}

export async function createAccount(information: InformationToCreateUserAccount) {
    const id = createUid(20)
    const { email, name, password, gender, dateOfBirth, phone, avatar, address, longitude, latitude } = information
    const hashedPassword = hashText(password)
    const createUserAccountQuery = 'insert into user_account(`id`, `phone`, `name`, `password`, `gender`, `date_of_birth`, `avatar`, `email`, `address`, `longitude`, `latitude`) values(?)'
    const poolConnection = await pool.getConnection()

    try {
        await poolConnection.beginTransaction()
        const isExistsEmail = await checkExistsEmail(String(email), poolConnection)

        if (isExistsEmail) { throw new Error(`Email '${email}' is registered`) }

        const [result] = await poolConnection.query(
            createUserAccountQuery,
            [[id, phone, name, hashedPassword, encodeGender(gender as string), new Date(dateOfBirth as string), avatar, email, address, longitude, latitude]]
        ) as OkPacket[]

        await poolConnection.commit()
        return result.affectedRows > 0 ? id : ''
    } catch (error) {
        console.log(error)
        await poolConnection.rollback()
        return ''
    } finally {
        poolConnection.release()
    }
}

export async function checkExistsEmail(email: string, continueWithConnection?: PoolConnection) {
    const connection = continueWithConnection || pool
    const checkExistsEmailQuery = 'select email from user_account where email=? and deleted_at is null'
    const [result] = await connection.query(checkExistsEmailQuery, [email]) as RowDataPacket[][]
    return result.length > 0
}

export async function verifyEmail(id: string) {
    const verifyEmailQuery = 'update user_account set verified=true where id=? and deleted_at is null'
    const [result] = await pool.query(verifyEmailQuery, [id]) as OkPacket[]
    return result.affectedRows > 0
}

export async function lockAccount(userAccountId: string) {
    const lockAccountQuery = 'update user_account set locked=true where id=? and locked=false and deleted_at is null'
    const [result] = await pool.query(lockAccountQuery, [userAccountId]) as OkPacket[]
    return result.affectedRows > 0
}

export async function unlockAccount(userAccountId: string) {
    const lockAccountQuery = 'update user_account set locked=false where id=? and locked=true and deleted_at is null'
    const [result] = await pool.query(lockAccountQuery, [userAccountId]) as OkPacket[]
    return result.affectedRows > 0
}

export async function checkLock(userAccountId: string) {
    const checkLockQuery = 'select count(id) as locked_count from user_account where id=? and locked=true'
    const [rowDatas] = await pool.query(checkLockQuery, [userAccountId]) as RowDataPacket[][]
    return Boolean(rowDatas[0]['locked_count'])
}