import { OkPacket, RowDataPacket } from 'mysql2'
import { PoolConnection } from 'mysql2/promise'
import pool from '../db.js'
import { Coupon } from './coupon.js'
import * as OrderService from './order.js'

export interface CouponOnProduct extends Coupon {
    productPriceIds: string[]
}

export async function getProductPriceIds(couponCode: string) {
    const getProductPriceIdsQuery = `select product_price_id from coupon_on_product where coupon_code=?`
    const [couponOnProductRowDatas] = await pool.query(getProductPriceIdsQuery, [couponCode]) as RowDataPacket[][]
    return couponOnProductRowDatas.map(couponOnProductRowData => String(couponOnProductRowData?.['product_price_id'] || ''))
}

export async function addProductPrices(couponCode: string, productPriceIds: string[], connection: PoolConnection) {
    const addProductPricesQuery = 'insert into coupon_on_product(`coupon_code`, `product_price_id`) values ?'
    const [result] = await connection.query(addProductPricesQuery, [productPriceIds.map(productPriceId => [couponCode, productPriceId])]) as OkPacket[]
    return result.affectedRows > 0
}

export async function updateProductPrices(couponCode: string, productPriceIds: string[], connection: PoolConnection) {
    const deleteCouponOnProductQuery = 'delete from coupon_on_product where coupon_code=?'
    const addCouponOnProductQuery = 'insert into coupon_on_product(`coupon_code`, `product_price_id`) values ?'
    await connection.query(deleteCouponOnProductQuery, [couponCode]) as OkPacket[]
    await connection.query(addCouponOnProductQuery, [productPriceIds.map(productPriceId => [couponCode, productPriceId])]) as OkPacket[]
    return true
}

export async function deleteProductPrices(couponCode: string, connection: PoolConnection) {
    const deleteProductPricesQuery = 'delete from coupon_on_product where coupon_code=?'
    const [result] = await connection.query(deleteProductPricesQuery, [couponCode]) as OkPacket[]
    return result.affectedRows > 0
}

export function matchCondition(coupon: CouponOnProduct, order: OrderService.TemporaryOrder) {
    const matchedProductPriceIdsInOrder = getMatchedProductPriceIds(coupon, order)
    return matchedProductPriceIdsInOrder.length > 0
}

export function getMatchedProductPriceIds(coupon: CouponOnProduct, order: OrderService.TemporaryOrder) {
    const productPriceIdsOfOrder = order.details.map(({ productPriceId }) => productPriceId)
    return productPriceIdsOfOrder.filter(productPriceIdOfOrder => coupon.productPriceIds.includes(productPriceIdOfOrder))
}

export async function getRelationCouponCodes(productPriceIds: string[]) {
    const getRelationCouponCodeQuery = 'select coupon_code from coupon_on_product where product_price_id in ? group by coupon_code'
    const [couponOnProductRowDatas] = await pool.query(getRelationCouponCodeQuery, [[productPriceIds]]) as RowDataPacket[][]
    return couponOnProductRowDatas.map(rowData => String(rowData['coupon_code']) || '').filter(couponCode => couponCode !== '')
}