import { formDataRequestAndAutoRefreshToken, jsonRequestAndAutoRefreshToken, PaginatedResponseData, SERVER_ORIGIN } from './general'
import { Order } from './order'

export type GENDER = 'male' | 'female' | 'other'
export interface ExtraStaffAccount {
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

export interface StatisOrderItem {
    receivedCount: number,
    totalCount: number,
    cancelledCount: number,
    receivedTotalPrice: number,
    totalPrice: number,
    cancelledTotalPrice: number,
    date: string
}

export interface GetOrderOptions {
    page?: number,
    sort?: OrderSortType
}

export interface OrderFilters {
    status?: string,
    createdFrom?: Date,
    createdTo?: Date,
    searchString?: string   // customer name or phone in order
}

export type OrderSortType = typeof ORDER_SORT_TYPES[number]

export type TimeType = typeof TIME_TYPE[number]

export type InformationToUpdateStaffAccount = Omit<ExtraStaffAccount, 'id' | 'branchName' | 'firstLogin' | 'deliveringCount' | 'branchId'>

export const ORDER_SORT_TYPES = ['newest', 'oldest'] as const

const STAFF_INFORMATION_ENDPOINT = SERVER_ORIGIN + '/staff/information'
const PASSWORD_ENDPOINT = SERVER_ORIGIN + '/staff/password'
const EXISTS_PHONE_ENDPOINT = SERVER_ORIGIN + '/staff/exists-phone'
const ORDER_ENDPOINT = SERVER_ORIGIN + '/staff/order'
const STATIS_ENDPOINT = SERVER_ORIGIN + '/staff/statis'

export const TIME_TYPE = ['day', 'month', 'year'] as const

export async function getInformation() {
    const response = await jsonRequestAndAutoRefreshToken(STAFF_INFORMATION_ENDPOINT, 'GET')
    if (response.ok) {
        const infomation: ExtraStaffAccount = await response.json()
        return infomation
    }

    return null
}

export async function updatePassword(oldPassword: string, newPassword: string) {
    const response = await jsonRequestAndAutoRefreshToken(PASSWORD_ENDPOINT, 'PATCH', JSON.stringify({ oldPassword, newPassword }))
    return response.ok
}

export async function checkExistsPhone(phone: string) {
    const response = await jsonRequestAndAutoRefreshToken(EXISTS_PHONE_ENDPOINT, 'POST', JSON.stringify({ phone }))
    if (response.ok) {
        const exists: boolean = await response.json()
        return exists
    }

    return false
}

export async function updateInformation(information: InformationToUpdateStaffAccount, avatarFile?: File) {
    const formData = new FormData()
    const { name, phone, email, gender, dateOfBirth } = information
    formData.append('phone', phone)
    formData.append('name', name)
    formData.append('gender', gender)
    formData.append('dateOfBirth', (new Date(dateOfBirth)).toISOString())
    email && formData.append('email', email)
    avatarFile && formData.append('avatarFile', avatarFile)

    const response = await formDataRequestAndAutoRefreshToken(STAFF_INFORMATION_ENDPOINT, 'PUT', formData)

    return response.ok
}

export async function getOrders(options?: GetOrderOptions, filters?: OrderFilters): Promise<PaginatedResponseData<Order[]>> {
    const getOrdersUrl = new URL(ORDER_ENDPOINT)
    getOrdersUrl.searchParams.append('page', String(options?.page && options.page > 0 ? options.page : 1))

    if (options) {
        if (options.sort && ORDER_SORT_TYPES.includes(options.sort)) {
            getOrdersUrl.searchParams.append('sort', options.sort)
        }
    }

    if (filters) {
        filters.status && getOrdersUrl.searchParams.append('status', filters.status)
        filters.createdFrom && getOrdersUrl.searchParams.append('createdFrom', filters.createdFrom.toISOString())
        filters.createdTo && getOrdersUrl.searchParams.append('createdTo', filters.createdTo.toISOString())
        filters.searchString && getOrdersUrl.searchParams.append('q', filters.searchString)
    }
    const response = await jsonRequestAndAutoRefreshToken(getOrdersUrl, 'GET')
    if (response.ok) {
        const result = await response.json()
        return result
    }

    return { hasNextPage: false, data: [] }
}

export async function verifyOrder(orderId: string) {
    const response = await jsonRequestAndAutoRefreshToken(ORDER_ENDPOINT + '/' + orderId + '/verify', 'PATCH')
    return response.ok
}

export async function deliveryOrder(orderId: string) {
    const response = await jsonRequestAndAutoRefreshToken(ORDER_ENDPOINT + '/' + orderId + '/delivery', 'PATCH')
    return response.ok
}

export async function verifyReceivedOrder(orderId: string) {
    const response = await jsonRequestAndAutoRefreshToken(ORDER_ENDPOINT + '/' + orderId + '/verify-received', 'PATCH')
    return response.ok
}

export async function cancelOrder(orderId: string, reason: string) {
    const response = await jsonRequestAndAutoRefreshToken(ORDER_ENDPOINT + '/' + orderId + '/cancel', 'PATCH', JSON.stringify({ reason }))
    return response.ok
}


export async function canVerifyOrder(orderId: string) {
    const response = await jsonRequestAndAutoRefreshToken(ORDER_ENDPOINT + '/' + orderId + '/can-verify', 'POST')
    if (response.ok) {
        return Boolean(await response.json())
    }
    return false
}

export async function canDeliveryOrder(orderId: string) {
    const response = await jsonRequestAndAutoRefreshToken(ORDER_ENDPOINT + '/' + orderId + '/can-delivery', 'POST')
    if (response.ok) {
        return Boolean(await response.json())
    }
    return false
}

export async function canVerifyReceivedOrder(orderId: string) {
    const response = await jsonRequestAndAutoRefreshToken(ORDER_ENDPOINT + '/' + orderId + '/can-verify-received', 'POST')
    if (response.ok) {
        return Boolean(await response.json())
    }
    return false
}

export async function canCancelOrder(orderId: string) {
    const response = await jsonRequestAndAutoRefreshToken(ORDER_ENDPOINT + '/' + orderId + '/can-cancel', 'POST')
    if (response.ok) {
        return Boolean(await response.json())
    }
    return false
}

export async function statisOrders(fromDate: Date, toDate: Date, timeType: TimeType = 'day') {
    const statisOrdersUrl = new URL(STATIS_ENDPOINT)
    statisOrdersUrl.searchParams.append('fromDate', fromDate.toISOString())
    statisOrdersUrl.searchParams.append('toDate', toDate.toISOString())
    statisOrdersUrl.searchParams.append('timeType', timeType)

    const response = await jsonRequestAndAutoRefreshToken(statisOrdersUrl, 'GET')

    if (response.ok) {
        const statisOrdersResult: StatisOrderItem[] = await response.json()
        return statisOrdersResult
    }

    return []
}