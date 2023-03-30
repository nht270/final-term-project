import { jsonRequest, SERVER_ORIGIN } from './general'
import { GoongIoCoordinate } from './map'


const ORDER_ENDPOINT = SERVER_ORIGIN + '/order'

export interface Order {
    id: string,
    customerName: string,
    phone: string,
    email?: string,
    userAccountId?: string,
    branchId: string,
    couponCode?: string,
    receivedType: string,
    receivedAddress: string,
    receivedAt?: Date | string
    deliveryCharge: number,
    subtotalPrice: number,
    totalPrice: number,
    status: string,
    note?: string,
    createdAt: Date | string
    details: OrderDetail[]
}

export interface OrderDetail {
    orderId: string,
    productPriceId: string,
    quality: number,
    priceAtPurchase: number
}

export interface TemporaryOrder {
    branchId: string,
    details: TemporaryOrderDetail[]
}

export interface TemporaryOrderDetail {
    productPriceId: string,
    quality: number,
    price: number
}

export interface InformationToCreateOrder {
    customerName: string,
    phone: string,
    email?: string,
    userAccountId?: string,
    branchId: string,
    couponCode?: string,
    receivedType: string,
    receivedAddress: string,
    details: Omit<TemporaryOrderDetail, 'price'>[]
}

export async function createOrder(information: InformationToCreateOrder, receivedAddressCoordinate: GoongIoCoordinate) {
    const response = await jsonRequest(ORDER_ENDPOINT, 'POST', JSON.stringify({ order: information, receivedAddressCoordinate: receivedAddressCoordinate }))
    if (response.ok) {
        return await response.json() as string
    }

    return ''
}

export async function getOrder(orderId: string) {
    const response = await jsonRequest(ORDER_ENDPOINT + '/' + orderId, 'GET')
    if (response.ok) {
        const order: Order | null = await response.json()
        return order
    }

    return null
}

export async function cancelOrder(orderId: string) {
    const response = await jsonRequest(`${ORDER_ENDPOINT}/${orderId}/cancel`, 'PATCH')
    return response.ok
}