import { OkPacket, PoolConnection, RowDataPacket } from 'mysql2/promise'
import pool from '../db.js'
import { convertUnderscorePropertiesToCamelCase } from '../utils/dataMapping.js'
import { ORDER_STATUS, TemporaryOrderDetail } from './order.js'
import * as ProductPriceService from './productPrice.js'

export interface OrderDetail {
    orderId: string,
    productPriceId: string,
    quality: number,
    priceAtPurchase: number
}

export async function getOrderDetails(orderId: string, continueWithConnection?: PoolConnection) {
    const connection = continueWithConnection || pool
    const getOrderDetailsQuery = 'select order_id, product_price_id, quality, price_at_purchase from order_detail where order_id=?'
    const [orderDetailRowDatas] = await connection.query(getOrderDetailsQuery, [orderId]) as RowDataPacket[][]
    return orderDetailRowDatas.map(convertUnderscorePropertiesToCamelCase) as OrderDetail[]
}

export async function addOrderDetails(orderId: string, details: TemporaryOrderDetail[], connection: PoolConnection) {
    const addOrderDetailsQuery = 'insert into order_detail(`order_id`, `product_price_id`, `quality`, `price_at_purchase`) values ?'
    const orderDetailRowDatas = details.map(detail => [orderId, detail.productPriceId, detail.quality, detail.price])

    const [result] = await connection.query(addOrderDetailsQuery, [orderDetailRowDatas]) as OkPacket[]
    return result.affectedRows > 0
}

export async function boughtProduct(userAccountId: string, productId: string) {
    const productPricesOfProduct = await ProductPriceService.getProductPricesByProductId(productId)
    const productPriceIdsOfProduct = productPricesOfProduct
        .flatMap(productPrice => productPrice.id ? [String(productPrice.id)] : [])
    if (productPriceIdsOfProduct.length <= 0) return false
    const countOrderDetailQuery =
        'select count(*) as order_detail_count from order_detail \
        inner join ace_coffee_db.order on order_detail.order_id = ace_coffee_db.order.id \
        inner join user_account on ace_coffee_db.order.user_account_id =  user_account.id \
        where order_detail.product_price_id in ? and user_account.id =? and ace_coffee_db.order.status=?'
    const [rowDatas] = await pool.query(countOrderDetailQuery, [[productPriceIdsOfProduct], userAccountId, ORDER_STATUS.received]) as RowDataPacket[][]
    return Boolean(rowDatas?.[0]?.['order_detail_count'] > 0)
}