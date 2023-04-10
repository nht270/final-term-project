import { OkPacket, RowDataPacket } from 'mysql2'
import pool from '../db.js'
import { convertUnderscorePropertiesToCamelCase } from '../utils/dataMapping.js'
import { hashText } from '../utils/misc.js'

type AdminAccountType = 'store' | 'website'

interface AdminSignInResult {
    username: string,
    type: AdminAccountType
    firstLogin: boolean
}

type AdminAccount = AdminSignInResult

export async function signIn(username: string, password: string) {
    const findAdminAccountQuery = `select username, type, first_login from admin_account where username=? and password=?`
    const hashedPassword = hashText(password)
    const [adminAccountRowDatas] = await pool.query(findAdminAccountQuery, [username, hashedPassword]) as RowDataPacket[][]
    const adminAccount = convertUnderscorePropertiesToCamelCase(adminAccountRowDatas[0] || null) as AdminSignInResult | null
    return adminAccount
}

export async function getInformation(username: string) {
    const getInformationQuery = 'select username, type, first_login from admin_account where username=?'
    const [adminAccountRowDatas] = await pool.query(getInformationQuery, [username]) as RowDataPacket[][]

    return convertUnderscorePropertiesToCamelCase(adminAccountRowDatas[0] || null) as AdminAccount || null
}

export async function updatePassword(username: string, oldPassword: string, newPassword: string) {
    const updatePasswordQuery = 'update admin_account set password=?, first_login=false where username=? and password=?'
    const hashedOldPassword = hashText(oldPassword)
    const hashedNewPassword = hashText(newPassword)
    const [result] = await pool.query(updatePasswordQuery, [hashedNewPassword, username, hashedOldPassword]) as OkPacket[]
    return result.affectedRows > 0
}