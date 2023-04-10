import { AdminType } from '../store/reducer'
import { jsonRequest, SERVER_ORIGIN } from './general'

interface SignInResult {
    accessToken: string,
    refreshToken: string,
}

interface UserSignInResult extends SignInResult {
    verified: boolean
}

interface StaffSignInResult extends SignInResult {
    firstLogin: boolean
}

export interface AdminSignInResult extends SignInResult {
    firstLogin: boolean
}

const USER_SIGN_IN_ENDPOINT = SERVER_ORIGIN + '/sign-in/user'
const STAFF_SIGNIN_ENDPOINT = SERVER_ORIGIN + '/sign-in/staff'
const ADMIN_SIGN_IN_ENDPOINT = SERVER_ORIGIN + '/sign-in/admin'
const VERIFY_USER_ENDPOINT = SERVER_ORIGIN + '/sign-up/verify'
const FORGOT_PASSWORD_ENDPOINT = SERVER_ORIGIN + '/sign-in/forgot'
const RESET_PASSWORD_ENDPOINT = SERVER_ORIGIN + '/sign-in/reset'

export async function signInForUser(email: string, password: string) {
    const response = await jsonRequest(USER_SIGN_IN_ENDPOINT, 'POST', JSON.stringify({ email, password }))
    if (response.ok) {
        const data: UserSignInResult = await response.json()
        return data
    }

    return null
}

export async function signInForStaff(phone: string, password: string) {
    const response = await jsonRequest(STAFF_SIGNIN_ENDPOINT, 'POST', JSON.stringify({ phone, password }))
    if (response.ok) {
        const data: StaffSignInResult = await response.json()
        return data
    }

    return null
}

export async function signInForAdmin(username: string, password: string) {
    const response = await jsonRequest(ADMIN_SIGN_IN_ENDPOINT, 'POST', JSON.stringify({ username, password }))
    if (response.ok) {
        const data: AdminSignInResult = await response.json()
        return data
    }

    return null
}

export async function verifyUser(token: string) {
    const response = await jsonRequest(VERIFY_USER_ENDPOINT + '/' + token, 'GET')
    return response.ok
}

export async function forgotPassword(email: string) {
    const response = await jsonRequest(FORGOT_PASSWORD_ENDPOINT, 'POST', JSON.stringify({ email }))
    return response.ok
}

export async function resetPassword(token: string, newPassword: string) {
    const response = await jsonRequest(RESET_PASSWORD_ENDPOINT + '/' + token, 'POST', JSON.stringify({ newPassword }))
    return response.ok
}