import { OkPacket, RowDataPacket } from 'mysql2'
import { escape, PoolConnection } from 'mysql2/promise'
import { LimitOptions, MAX_DELIVERING_ORDER } from '../config.js'
import pool from '../db.js'
import { convertUnderscorePropertiesToCamelCase, decodeGender, encodeGender } from '../utils/dataMapping.js'
import { createLimitSql, hashText } from '../utils/misc.js'
import { createUid } from '../utils/uid.js'

interface StaffSignInResult {
    id: string,
    firstLogin: boolean
}

interface StaffAccount {
    id: string,
    branchId: string,
    branchName: string,
    name: string,
    phone: string,
    deliveringCount: number,
    avatar?: string
}

interface ExtraStaffAccount {
    id: string,
    phone: string,
    name: string,
    branchId: string,
    branchName: string,
    deliveringCount: number,
    gender: string,
    dateOfBirth: Date | string,
    avatar?: string,
    email?: string,
    firstLogin: boolean
}

export type InformationToCreateStaffAccount = Omit<ExtraStaffAccount, 'id' | 'branchName' | 'firstLogin' | 'deliveringCount'>
export type InformationToUpdateStaffAccount = Omit<ExtraStaffAccount, 'id' | 'branchName' | 'firstLogin' | 'deliveringCount' | 'branchId'>

const DEFAULT_PASSWORD = 'default0'

export async function signIn(phone: string, password: string) {
    const findStaffIdQuery = 'select id, first_login from staff_account where phone=? and password=? and deleted_at is null'
    const hashedPassword = hashText(password)
    const [staffRowDatas] = await pool.query(findStaffIdQuery, [phone, hashedPassword]) as RowDataPacket[][]
    return convertUnderscorePropertiesToCamelCase(staffRowDatas[0] || null) as StaffSignInResult | null
}

export async function getStaffAccounts(limit?: LimitOptions) {
    let getStaffAccountsQuery = 'select staff_account.id, branch_id, branch.name as branch_name, staff_account.name, staff_account.phone, delivering_count, avatar from staff_account inner join branch on branch_id=branch.id where staff_account.deleted_at is null'
    if (limit) {
        getStaffAccountsQuery += ' ' + createLimitSql(limit)
    }

    const [staffAccountRowDatas] = await pool.query(getStaffAccountsQuery) as RowDataPacket[][]
    return staffAccountRowDatas.map(convertUnderscorePropertiesToCamelCase) as StaffAccount[]
}

export async function getInformation(staffAccountId: string) {
    const getInformationQuery = 'select staff_account.id, branch_id, branch.name as branch_name, staff_account.name, staff_account.phone, delivering_count, gender, date_of_birth, avatar, email, first_login from staff_account inner join branch on branch_id=branch.id where staff_account.id=? and staff_account.deleted_at is null'
    const [staffRowDatas] = await pool.query(getInformationQuery, [staffAccountId]) as RowDataPacket[][]

    if (Array.isArray(staffRowDatas) && staffRowDatas.length > 0) {
        const staffAccount = staffRowDatas[0]
        // remap data
        staffAccount['gender'] = decodeGender(staffAccount['gender'])
        return convertUnderscorePropertiesToCamelCase(staffAccount) as ExtraStaffAccount
    }

    return null
}

export async function addStaffAccount(staffInformation: InformationToCreateStaffAccount) {
    const id = createUid(20)
    const { name, branchId, phone, gender, dateOfBirth, avatar, email } = staffInformation

    const existsPhone = await checkExistsPhone(phone)
    if (existsPhone) { return false }

    const addStaffAccountQuery = 'insert into staff_account(`id`, `branch_id`, `name`, `phone`, `password`, `gender`, `date_of_birth`, `avatar`, `email`, `first_login`) values(?)'
    const [result] = await pool.query(addStaffAccountQuery, [[id, branchId, name, phone, DEFAULT_PASSWORD, encodeGender(gender as string), new Date(dateOfBirth as Date | string), avatar, email, true]]) as OkPacket[]
    return result.affectedRows > 0
}

export async function updatePassword(staffAccountId: string, oldPassword: string, newPassword: string) {
    const updatePasswordQuery = 'update staff_account set password=?, first_login=false where id=? and password=?'
    const hashedOldPassword = hashText(oldPassword)
    const hashedNewPassword = hashText(newPassword)
    const [result] = await pool.query(updatePasswordQuery, [hashedNewPassword, staffAccountId, hashedOldPassword]) as OkPacket[]
    return result.affectedRows > 0
}

export async function updateBranch(staffAccountId: string, branchId: string) {
    const updateBranchQuery = 'update staff_account set branch_id=? where id=? and deleted_at is null and delivering_count=0'
    const [result] = await pool.query(updateBranchQuery, [branchId, staffAccountId]) as OkPacket[]
    return result.affectedRows > 0
}

export async function updateInformation(staffAccountId: string, information: InformationToUpdateStaffAccount) {
    const { name, phone, gender, dateOfBirth, avatar, email } = information

    const existsPhone = await checkExistsPhone(phone, staffAccountId)
    if (existsPhone) { return false }

    const updateInformationQuery = 'update staff_account set name=?, phone=?, gender=?, date_of_birth=?, avatar=?, email=? where id=? and deleted_at is null'
    const [result] = await pool.query(updateInformationQuery, [name, phone, encodeGender(gender as string), new Date(dateOfBirth as string), avatar, email, staffAccountId]) as OkPacket[]
    return result.affectedRows > 0
}

export async function deleteAccount(staffAccountId: string) {
    const deleteAccountQuery = 'update staff_account set deleted_at=? where id=? and deleted_at is null and delivering_count=0'
    const [result] = await pool.query(deleteAccountQuery, [new Date(), staffAccountId]) as OkPacket[]
    return result.affectedRows > 0
}

export async function resetPassword(staffAccountId: string, defaultPassword = DEFAULT_PASSWORD) {
    const resetPasswordQuery = 'update staff_account set password=?, first_login=true where id=? and deleted_at is null'
    const hashedDefaultPassword = hashText(defaultPassword)
    const [result] = await pool.query(resetPasswordQuery, [hashedDefaultPassword, staffAccountId]) as OkPacket[]
    return result.affectedRows > 0
}

export async function checkExistsPhone(phone: string, staffAccountId?: string) {
    let checkExistsPhoneQuery = 'select phone from staff_account where phone=? and deleted_at is null'
    if (staffAccountId) {
        checkExistsPhoneQuery += ` and id<> ${escape(staffAccountId)}`
    }

    const [result] = await pool.query(checkExistsPhoneQuery, [phone]) as RowDataPacket[][]
    return result.length > 0
}

export async function countNotDeliveringStaff(branchId: string) {
    const countNotDeliveringStaffQuery = 'select count(id) as not_delivering_staff_count from staff_account where branch_id=? and delivering_count=0 and deleted_at is null'
    const [rowDatas] = await pool.query(countNotDeliveringStaffQuery, [branchId]) as RowDataPacket[][]
    return Number(rowDatas?.[0]?.['not_delivering_staff_count']) || 0
}

export async function increaseDeliveringCount(staffAccountId: string, connection: PoolConnection) {
    const setDeliveryQuery = `update staff_account set delivering_count=delivering_count + 1 where id=? and delivering_count<${MAX_DELIVERING_ORDER}`
    const [result] = await connection.query(setDeliveryQuery, [staffAccountId]) as OkPacket[]
    return result.affectedRows > 0
}

export async function decreaseDeliveringCount(staffAccountId: string, connection: PoolConnection) {
    const setDeliveryQuery = 'update staff_account set delivering_count=delivering_count-1 where id=? and delivering_count>0'
    const [result] = await connection.query(setDeliveryQuery, [staffAccountId]) as OkPacket[]
    return result.affectedRows > 0
}