import dotenv from 'dotenv'
import { escape, OkPacket, RowDataPacket } from 'mysql2'
import { LimitOptions, MAX_DELIVERING_ORDER } from '../config.js'
import pool from '../db.js'
import { convertUnderscorePropertiesToCamelCase } from '../utils/dataMapping.js'
import { createLimitSql } from '../utils/misc.js'
import { createUid } from '../utils/uid.js'
import * as OrderConfirmService from './orderConfirm.js'
import * as OrderDetailService from './orderDetail.js'
import * as ProductPriceService from './productPrice.js'
import * as StaffAccountService from './staffAccount.js'

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
    details: OrderDetailService.OrderDetail[]
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
    deliveryCharge: number,
    details: Omit<TemporaryOrderDetail, 'price'>[]
}

export interface GetOrderOptions {
    limit?: LimitOptions,
    sort?: SortType
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

export type TimeType = typeof TIME_TYPES[number]
export type SortType = typeof SORT_TYPES[number]

dotenv.config()

const MIN_STAFF_AT_SHOP = 2

export const ORDER_STATUS = {
    waitVerify: 'waitVerify',
    verified: 'verified',
    waitReceive: 'waitReceive',
    received: 'received',
    cancelled: 'cancelled'
}

export const TIME_TYPES = ['day', 'month', 'year'] as const
export const SORT_TYPES = ['newest', 'oldest'] as const

const MYSQL_DB = process.env.MYSQL_DB || 'ace_coffee_db'

export async function getAllOrders(options?: GetOrderOptions, filters?: OrderFilters) {
    let getAllOrdersQuery = `select id, customer_name, phone, email, user_account_id, branch_id, coupon_code, received_type, received_address, received_at, delivery_charge, subtotal_price, total_price, status, note, created_at from ${MYSQL_DB}.order`

    if (filters) {
        const filterSql = createFilterSql(filters)
        if (filterSql) {
            getAllOrdersQuery += ` where ${filterSql}`
        }
    }

    if (options) {
        if (options.sort) {
            getAllOrdersQuery += ' ' + createSortSql(options.sort)
        }

        if (options.limit) {
            getAllOrdersQuery += ' ' + createLimitSql(options.limit)
        }
    }

    const [orderRowDatas] = await pool.query(getAllOrdersQuery) as RowDataPacket[][]
    return orderRowDatas.map(convertUnderscorePropertiesToCamelCase) as Order[]
}
export async function getOrdersByUserAccount(userAccountId: string, options?: GetOrderOptions, filters?: OrderFilters) {
    let getOrdersByUserAccountQuery = `select id, customer_name, phone, email, user_account_id, branch_id, coupon_code, received_type, received_address, received_at, delivery_charge, subtotal_price, total_price, status, note, created_at from ${MYSQL_DB}.order where user_account_id=?`

    if (filters) {
        const filterSql = createFilterSql(filters)
        if (filterSql) {
            getOrdersByUserAccountQuery += ` and ${filterSql}`
        }
    }

    if (options) {
        if (options.sort) {
            getOrdersByUserAccountQuery += ' ' + createSortSql(options.sort)
        }

        if (options.limit) {
            getOrdersByUserAccountQuery += ' ' + createLimitSql(options.limit)
        }
    }

    const [orderRowDatas] = await pool.query(getOrdersByUserAccountQuery, [userAccountId]) as RowDataPacket[][]
    return orderRowDatas.map(convertUnderscorePropertiesToCamelCase) as Order[]
}

export async function getOrdersByBranch(branchId: string, options?: GetOrderOptions, filters?: OrderFilters) {
    let getOrdersByBranchQuery = `select id, customer_name, phone, email, user_account_id, branch_id, coupon_code, received_type, received_address, received_at, delivery_charge, subtotal_price, total_price, status, note, created_at from ${MYSQL_DB}.order where branch_id=?`

    if (filters) {
        const filterSql = createFilterSql(filters)
        if (filterSql) {
            getOrdersByBranchQuery += ` and ${filterSql}`
        }
    }

    if (options) {
        if (options.sort) {
            getOrdersByBranchQuery += ' ' + createSortSql(options.sort)
        }

        if (options.limit) {
            getOrdersByBranchQuery += ' ' + createLimitSql(options.limit)
        }
    }

    const [orderRowDatas] = await pool.query(getOrdersByBranchQuery, [branchId]) as RowDataPacket[][]
    return orderRowDatas.map(convertUnderscorePropertiesToCamelCase) as Order[]
}

export async function getOrderById(orderId: string) {
    const getOrderQuery = `select id, customer_name, phone, email, user_account_id, branch_id, coupon_code, received_type, received_address, received_at, delivery_charge, subtotal_price, total_price, status, note, created_at from ${MYSQL_DB}.order where id=?`
    const [orderRowDatas] = await pool.query(getOrderQuery, [orderId]) as RowDataPacket[][]
    if (orderRowDatas.length <= 0) { return null }

    const details = await OrderDetailService.getOrderDetails(orderId)

    return convertUnderscorePropertiesToCamelCase({ ...orderRowDatas[0], details }) as Order
}

export async function createOrder(information: InformationToCreateOrder, amountOfDecreaseMoney: number, userAccountId?: string) {
    const orderId = createUid(20)
    const { customerName, phone, email, branchId, couponCode, receivedType, receivedAddress, deliveryCharge, details } = information
    if (details.length <= 0) { return '' }
    const temporaryOrderDetails = (await Promise.all(
        details.map(async (detail) => {
            const productPrice = await ProductPriceService.getProductPrice(detail.productPriceId)
            if (!productPrice) { return null }
            const { price } = productPrice
            return { ...detail, price }
        })
    )).flatMap(detail => detail ? [detail] : [])

    const subtotalPrice = calculateTemporaryTotalPrice(temporaryOrderDetails)
    const totalPrice = subtotalPrice + Number(deliveryCharge || 0) - Number(amountOfDecreaseMoney || 0)
    const createOrderQuery = 'insert into ' + MYSQL_DB + '.order(`id`, `customer_name`, `phone`, `email`, `user_account_id`, `branch_id`, `coupon_code`, `received_type`, `received_address`, `delivery_charge`, `subtotal_price`, `total_price`, `status`, `created_at`) values (?)'
    const poolConnection = await pool.getConnection()
    try {
        await poolConnection.beginTransaction()
        await poolConnection.query(createOrderQuery, [[orderId, customerName, phone, email, userAccountId, branchId, couponCode, receivedType, receivedAddress, deliveryCharge, subtotalPrice, totalPrice, ORDER_STATUS.waitVerify, new Date()]])
        await OrderDetailService.addOrderDetails(orderId, temporaryOrderDetails, poolConnection)
        await poolConnection.commit()
        return orderId
    } catch (error) {
        await poolConnection.rollback()
        console.log(error)
        return ''
    } finally {
        poolConnection.release()
    }
}

export async function cancelOrderByUser(userAccountId: string, orderId: string) {
    const cancelOrderQuery = `update ${MYSQL_DB}.order set status=? where user_account_id=? and id=? and status in ?`
    const [result] = await pool.query(cancelOrderQuery, [ORDER_STATUS.cancelled, userAccountId, orderId, [[ORDER_STATUS.waitVerify]]]) as OkPacket[]
    return result.affectedRows > 0
}

export async function cancelOrderById(orderId: string) {
    const cancelOrderQuery = `update ${MYSQL_DB}.order set status=? where id=? and status in ?`
    const [result] = await pool.query(cancelOrderQuery, [ORDER_STATUS.cancelled, orderId, [[ORDER_STATUS.waitVerify]]]) as OkPacket[]
    return result.affectedRows > 0
}

export async function verifyOrderByStaff(staffAccountId: string, orderId: string) {
    const staffAccount = await StaffAccountService.getInformation(staffAccountId)
    if (!staffAccount) { return false }
    if (!await canVerifyOrder(staffAccountId)) { return false }

    const verifyOrderQuery = `update ${MYSQL_DB}.order set status=? where branch_id=? and id=? and status in ?`
    const poolConnection = await pool.getConnection()

    try {
        await poolConnection.beginTransaction()
        const [statusUpdateResult] = await poolConnection.query(verifyOrderQuery, [ORDER_STATUS.verified, staffAccount.branchId, orderId, [[ORDER_STATUS.waitVerify]]]) as OkPacket[]
        if (statusUpdateResult.affectedRows <= 0) {
            throw new Error(`Don't verify order #${orderId}`)
        }
        await OrderConfirmService.confirmOrder({ staffAccountId, orderId, action: 'verify' }, poolConnection)
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

export async function deliveryOrderByStaff(staffAccountId: string, orderId: string) {
    const staffAccount = await StaffAccountService.getInformation(staffAccountId)
    if (!staffAccount) { return false }
    if (!await canDeliveryOrder(staffAccountId)) { return false }

    const deliveryOrderQuery = `update ${MYSQL_DB}.order set status=? where branch_id=? and id=? and status in ?`
    const poolConnection = await pool.getConnection()

    try {
        await poolConnection.beginTransaction()
        const [statusUpdateResult] = await poolConnection.query(deliveryOrderQuery, [ORDER_STATUS.waitReceive, staffAccount.branchId, orderId, [[ORDER_STATUS.verified]]]) as OkPacket[]
        if (statusUpdateResult.affectedRows <= 0) {
            throw new Error(`Don't delivery order #${orderId}`)
        }
        const setDeliveryForStaffResult = await StaffAccountService.increaseDeliveringCount(staffAccountId, poolConnection)
        if (!setDeliveryForStaffResult) {
            throw new Error(`Don't set delivery for staff #${staffAccountId}`)
        }

        await OrderConfirmService.confirmOrder({ staffAccountId, orderId, action: 'delivery' }, poolConnection)
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

export async function verifyReceivedOrderByStaff(staffAccountId: string, orderId: string) {
    const staffAccount = await StaffAccountService.getInformation(staffAccountId)
    if (!staffAccount) { return false }
    if (!await canVerifyReceivedOrder(staffAccountId, orderId)) { return false }

    const verifyReceivedOrderQuery = `update ${MYSQL_DB}.order set status=?, received_at=? where branch_id=? and id=? and status in ?`
    const poolConnection = await pool.getConnection()

    try {
        await poolConnection.beginTransaction()
        const [statusUpdateResult] = await poolConnection.query(verifyReceivedOrderQuery, [ORDER_STATUS.received, new Date(), staffAccount.branchId, orderId, [[ORDER_STATUS.waitReceive]]]) as OkPacket[]
        if (statusUpdateResult.affectedRows <= 0) {
            throw new Error(`Don't verify received order #${orderId}`)
        }

        const unsetDeliveryForStaffResult = await StaffAccountService.decreaseDeliveringCount(staffAccountId, poolConnection)
        if (!unsetDeliveryForStaffResult) {
            throw new Error(`Don't unset delivery for staff #${staffAccountId}`)
        }

        await OrderConfirmService.confirmOrder({ staffAccountId, orderId, action: 'verifyReceived' }, poolConnection)
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

export async function cancelOrderByStaff(staffAccountId: string, orderId: string, reason: string) {
    const staffAccount = await StaffAccountService.getInformation(staffAccountId)
    if (!staffAccount) { return false }
    if (!await canCancelOrder(staffAccountId, orderId)) { return false }

    const cancelOrderQuery = `update ${MYSQL_DB}.order set status=?, note=? where branch_id=? and id=? and status in ?`
    const poolConnection = await pool.getConnection()

    try {
        await poolConnection.beginTransaction()
        const [statusUpdateResult] = await poolConnection.query(cancelOrderQuery, [ORDER_STATUS.cancelled, reason, staffAccount.branchId, orderId, [[ORDER_STATUS.waitVerify, ORDER_STATUS.waitReceive]]]) as OkPacket[]
        if (statusUpdateResult.affectedRows <= 0) {
            throw new Error(`Don't cancel order #${orderId}`)
        }

        if (staffAccount.deliveringCount > 0) {
            const unsetDeliveryForStaffResult = await StaffAccountService.decreaseDeliveringCount(staffAccountId, poolConnection)
            if (!unsetDeliveryForStaffResult) {
                throw new Error(`Don't unset delivery for staff #${staffAccountId}`)
            }
        }

        await OrderConfirmService.confirmOrder({ staffAccountId, orderId, action: 'cancel' }, poolConnection)
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

export async function canVerifyOrder(staffAccountId: string) {
    const staffAccount = await StaffAccountService.getInformation(staffAccountId)
    const deliveringCount = Number(staffAccount?.['deliveringCount'])
    if (deliveringCount >= MAX_DELIVERING_ORDER) { return false }
    return true
}

export async function canDeliveryOrder(staffAccountId: string) {
    const staffAccount = await StaffAccountService.getInformation(staffAccountId)
    if (!staffAccount) { return false }

    // if this staff is delivering and not greater or equal max delivering order then allow deliver
    if (staffAccount.deliveringCount !== 0 && staffAccount.deliveringCount < MAX_DELIVERING_ORDER) return true

    // else check current staff count at shop have less than min staff allowed at shop
    const notDeliveringAtBranchCount = await StaffAccountService.countNotDeliveringStaff(staffAccount.branchId)
    if (notDeliveringAtBranchCount <= MIN_STAFF_AT_SHOP) { return false }
    return true
}

export async function canVerifyReceivedOrder(staffAccountId: string, orderId: string) {
    const isDeliveryStaffOfOrder = await OrderConfirmService.isDeliveryStaffOfOrder(staffAccountId, orderId)
    return isDeliveryStaffOfOrder
}

export async function canCancelOrder(staffAccountId: string, orderId: string) {
    const order = await getOrderById(orderId)
    const staffAccount = await StaffAccountService.getInformation(staffAccountId)
    if (!order || !staffAccount) { return false }

    const isDeliveryStaffOfOrder = await OrderConfirmService.isDeliveryStaffOfOrder(staffAccountId, orderId)

    if (order.status === ORDER_STATUS.waitReceive) {
        return isDeliveryStaffOfOrder
    }

    if (order.status === ORDER_STATUS.waitVerify) {
        return staffAccount.deliveringCount <= 0
    }

    return false
}

export function calculateTemporaryTotalPrice(orderItems: TemporaryOrderDetail[]) {
    const totalPrice = orderItems
        .map(({ price, quality }) => price * quality)
        .reduce((totalPrice, price) => totalPrice + price, 0)

    return totalPrice
}

export async function statisOrdersByBranch(branchId: string, fromDate: Date, toDate: Date, timeType: TimeType = 'day', separated = '-') {
    const statisOrdersQuery = `select\ 
    sum(if(status = 'received', 1, 0 )) as received_count,\
    sum(if (status='received' or status='cancelled',  1, 0)) as total_count,\
    sum(if(status='cancelled', 1, 0)) as cancelled_count,\
    sum(if(status = 'received', total_price, 0 )) as received_total_price,\
    sum(if (status='received' or status='cancelled',  total_price, 0)) as total_price,\
    sum(if(status='cancelled', total_price, 0)) as cancelled_total_price,\
    date_format(created_at, ?) as date\
    from ${MYSQL_DB}.order \
    where branch_id=? and date(created_at) >= date(?) and date(created_at) <= date(?)\
    group by date order by created_at`
    const DAY_SPECIFIER = '%d'
    const MONTH_SPECIFIER = '%m'
    const YEAR_SPECIFIER = '%Y'
    const STATIS_DATE_FORMATE: Record<TimeType, string> = {
        'day': [DAY_SPECIFIER, MONTH_SPECIFIER, YEAR_SPECIFIER].join(separated),
        'month': [MONTH_SPECIFIER, YEAR_SPECIFIER].join(separated),
        'year': [YEAR_SPECIFIER].join(separated)
    }

    const [statisOrdersRowDatas] = await pool.query(statisOrdersQuery, [STATIS_DATE_FORMATE[timeType], branchId, fromDate, toDate]) as RowDataPacket[][]
    return statisOrdersRowDatas.map(convertUnderscorePropertiesToCamelCase) as StatisOrderItem[]
}

function createSortSql(sort: SortType) {
    switch (sort) {
        case 'newest':
            return 'order by created_at desc'
        case 'oldest':
            return 'order by created_at asc'
        default:
            return ''
    }
}

function createFilterSql(filters: OrderFilters) {
    const orderFilterConditions: string[] = []

    if (filters.status) {
        orderFilterConditions.push(`status=${escape(filters.status)}`)
    }

    if (filters.createdFrom && !isNaN(filters.createdFrom.getTime())) {
        orderFilterConditions.push(`date(created_at) >= date(${escape(filters.createdFrom)})`)
    }

    if (filters.createdTo && !isNaN(filters.createdTo.getTime())) {
        orderFilterConditions.push(`date(created_at) <= date(${escape(filters.createdTo)})`)
    }

    if (filters.searchString) {
        const searchStringConditions: string[] = []
        searchStringConditions.push(`customer_name like ${escape(`%${filters.searchString}%`)}`)
        searchStringConditions.push(`phone like ${escape(`%${filters.searchString}%`)}`)
        orderFilterConditions.push(`(${searchStringConditions.join(' or ')})`)
    }

    return orderFilterConditions.join(' and ')
}