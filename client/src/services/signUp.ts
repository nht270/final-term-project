import { formDataRequest, jsonRequest, SERVER_ORIGIN } from './general'

type Gender = 'male' | 'female' | 'other'

export interface InformationToSignUpUserAccount {
    email: string,
    name: string,
    gender: Gender,
    dateOfBirth: Date | string,
    phone?: string,
    address?: string,
    longitude?: string,
    latitude?: string,
    password: string,
    avatarFile?: File
}

const USER_SIGN_UP_ENDPOINT = SERVER_ORIGIN + '/sign-up'
const CHECK_EXISTS_EMAIL_ENDPOINT = SERVER_ORIGIN + '/sign-up/exists-email'
const VERIFY_USER_ENDPOINT = SERVER_ORIGIN + '/sign-up/verify'

export async function signUp(information: InformationToSignUpUserAccount) {

    const formData = new FormData()
    const { avatarFile, name, phone, password, address, email, gender, dateOfBirth, longitude, latitude } = information
    formData.append('name', name)
    formData.append('email', email)
    formData.append('password', password)
    formData.append('gender', gender)
    formData.append('dateOfBirth', new Date(dateOfBirth).toISOString())
    phone && formData.append('phone', phone)
    address && formData.append('address', address)
    longitude && formData.append('longitude', String(longitude))
    latitude && formData.append('latitude', String(latitude))
    avatarFile && formData.append('avatarFile', avatarFile)

    const response = await formDataRequest(USER_SIGN_UP_ENDPOINT, 'POST', formData)
    return response.ok
}

export async function checkExistsEmail(email: string) {
    const response = await jsonRequest(CHECK_EXISTS_EMAIL_ENDPOINT, 'POST', JSON.stringify({ email }))
    if (response.ok) {
        const exists: boolean = await response.json()
        return exists
    }

    return false
}

export async function verifyUser(token: string) {
    const response = await jsonRequest(VERIFY_USER_ENDPOINT + '/' + token, 'GET')
    return response.ok
}