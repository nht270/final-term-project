import { formDataRequestAndAutoRefreshToken, jsonRequestAndAutoRefreshToken, PaginatedResponseData, SERVER_ORIGIN } from './general'
import { GoongIoCoordinate } from './map'
import { InformationToCreateOrder, Order } from './order'
import { Rating } from './rating'

export type Gender = 'male' | 'female' | 'other'

export interface UserAccount {
    id: string,
    phone?: string,
    name: string,
    gender: Gender,
    dateOfBirth: Date | string,
    avatar?: string,
    email: string,
    address?: string,
    longitude?: string,
    latitude?: string
}

export type InformationToUpdateUserAccount = Omit<UserAccount, 'id'>

export type Cart = CartDetail[]

export interface CartDetail {
    productPriceId: string,
    quality: number
}

export interface ExtraCartDetail extends CartDetail {
    price: number,
    productName: string,
    productSizeId: string,
    productSizeName: string,
    productCoverImage: string
}

export interface Notification {
    id: string,
    content: string,
    seen: boolean,
    createdAt: Date | string,
    linkTo?: string,
    userAccountId: string
}

export type InformationToCreateRating = Pick<Rating, 'productId' | 'star' | 'content'>
export type InformationToUpdateRating = Pick<Rating, 'star' | 'content'>


export interface GetOrderOptions {
    page: number,
    sort?: OrderSortType
}

export interface OrderFilters {
    status?: string,
    createdFrom?: Date,
    createdTo?: Date,
    searchString?: string   // customer name or phone in order
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

export type OrderSortType = typeof ORDER_SORT_TYPES[number]

export const ORDER_SORT_TYPES = ['newest', 'oldest'] as const

const USER_INFORMATION_ENDPOINT = SERVER_ORIGIN + '/user/information'
const USER_PASSWORD_ENDPOINT = SERVER_ORIGIN + '/user/password'
const USER_ACCOUNT_ENDPOINT = SERVER_ORIGIN + '/user/account'
const CART_ENDPOINT = SERVER_ORIGIN + '/user/cart'
const ORDER_ENDPOINT = SERVER_ORIGIN + '/user/order'
const NOTIFICATION_ENDPOINT = SERVER_ORIGIN + '/user/notification'
const RATING_ENDPOINT = SERVER_ORIGIN + '/user/rating'
const CHECK_LOCK_ENDPOINT = SERVER_ORIGIN + '/user/lock'

export async function getInformation() {
    const response = await jsonRequestAndAutoRefreshToken(USER_INFORMATION_ENDPOINT, 'GET')
    if (response.ok) {
        const information: UserAccount = await response.json()
        return information
    }
    return null
}

export async function updateInformation(information: InformationToUpdateUserAccount, avatarFile?: File) {
    const formData = new FormData()
    const { name, phone, address, email, gender, dateOfBirth, longitude, latitude } = information

    formData.append('name', name)
    formData.append('email', email)
    formData.append('gender', gender)
    formData.append('dateOfBirth', (new Date(dateOfBirth)).toISOString())
    phone && formData.append('phone', phone)
    address && formData.append('address', address)
    longitude && formData.append('longitude', String(longitude))
    latitude && formData.append('latitude', String(latitude))
    avatarFile && formData.append('avatarFile', avatarFile)

    const response = await formDataRequestAndAutoRefreshToken(USER_INFORMATION_ENDPOINT, 'PUT', formData)

    return response.ok
}

export async function updatePassword(oldPassword: string, newPassword: string) {
    const response = await jsonRequestAndAutoRefreshToken(USER_PASSWORD_ENDPOINT, 'PATCH', JSON.stringify({ oldPassword, newPassword }))
    return response.ok
}

export async function deleteAccount() {
    const response = await jsonRequestAndAutoRefreshToken(USER_ACCOUNT_ENDPOINT, 'DELETE')
    return response.ok
}

export async function getCart() {
    const response = await jsonRequestAndAutoRefreshToken(CART_ENDPOINT, 'GET')
    if (response.ok) {
        const cart: Cart = await response.json()
        return cart
    }

    return []
}

export async function getCartDetail(productPriceId: string) {
    const response = await jsonRequestAndAutoRefreshToken(CART_ENDPOINT + '/' + productPriceId, 'GET')
    if (response.ok) {
        const cartDetail: ExtraCartDetail | null = await response.json()
        return cartDetail
    }

    return null
}

export async function addToCart(productPriceId: string, quality = 1) {
    const response = await jsonRequestAndAutoRefreshToken(CART_ENDPOINT, 'POST', JSON.stringify({ productPriceId, quality }))
    return response.ok
}

export async function updateCartDetail(productPriceId: string, quality = 1) {
    const response = await jsonRequestAndAutoRefreshToken(CART_ENDPOINT + '/' + productPriceId, 'PUT', JSON.stringify({ quality }))
    return response.ok
}

export async function deleteCartDetail(productPriceId: string) {
    const response = await jsonRequestAndAutoRefreshToken(CART_ENDPOINT + '/' + productPriceId, 'DELETE')
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
        const data = await response.json()
        return data
    }

    return { hasNextPage: false, data: [] }
}

export async function createOrder(information: InformationToCreateOrder, receivedAddressCoordinate: GoongIoCoordinate) {
    const response = await jsonRequestAndAutoRefreshToken(ORDER_ENDPOINT, 'POST', JSON.stringify({ order: information, receivedAddressCoordinate }))
    if (response.ok) {
        return await response.json() as string
    }

    return ''
}

export async function cancelOrder(orderId: string) {
    const response = await jsonRequestAndAutoRefreshToken(ORDER_ENDPOINT + '/' + orderId + '/cancel', 'PATCH')
    return response.ok
}

export async function getNotifications(page = 1): Promise<PaginatedResponseData<Notification[]>> {
    const getNotificationsUrl = new URL(NOTIFICATION_ENDPOINT)
    getNotificationsUrl.searchParams.append('page', String(page))
    const response = await jsonRequestAndAutoRefreshToken(getNotificationsUrl, 'GET')
    if (response.ok) {
        const data = await response.json()
        return data
    }

    return { hasNextPage: false, data: [] }
}

export async function markNotificationIsSeen(notificationIds: string[]) {
    const response = await jsonRequestAndAutoRefreshToken(NOTIFICATION_ENDPOINT + '/mark-is-seen', 'PATCH', JSON.stringify({ notificationIds }))
    return response.ok
}

export async function getOwnRating(productId: string) {
    const response = await jsonRequestAndAutoRefreshToken(RATING_ENDPOINT + '/' + productId, 'GET')
    if (response.ok) {
        const rating: Rating = await response.json()
        return rating
    }
    return null
}

export async function canRating(productId: string) {
    const response = await jsonRequestAndAutoRefreshToken(RATING_ENDPOINT + '/' + productId + '/can-rating', 'GET')
    if (response.ok) {
        const isAllowedRating: boolean = await response.json()
        return isAllowedRating
    }

    return false
}

export async function addRating(information: InformationToCreateRating) {
    const response = await jsonRequestAndAutoRefreshToken(RATING_ENDPOINT, 'POST', JSON.stringify(information))
    return response.ok
}

export async function updateRating(productId: string, information: InformationToUpdateRating) {
    const response = await jsonRequestAndAutoRefreshToken(RATING_ENDPOINT + '/' + productId, 'PUT', JSON.stringify(information))
    return response.ok
}

export async function deleteRating(productId: string) {
    const response = await jsonRequestAndAutoRefreshToken(RATING_ENDPOINT + '/' + productId, 'DELETE')
    return response.ok
}

export async function checkLock() {
    const response = await jsonRequestAndAutoRefreshToken(CHECK_LOCK_ENDPOINT, 'GET')
    if (response.ok) {
        const isLocked: boolean = await response.json()
        return isLocked
    }

    return false
}