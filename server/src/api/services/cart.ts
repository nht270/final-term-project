import { OkPacket, RowDataPacket } from 'mysql2'
import { LimitOptions } from '../config.js'
import pool from '../db.js'
import { convertUnderscorePropertiesToCamelCase } from '../utils/dataMapping.js'
import { createLimitSql } from '../utils/misc.js'

type Cart = CartDetail[]

interface CartDetail {
    productPriceId: string,
    quality: number
}

interface ExtraCartDetail extends CartDetail {
    price: number,
    productName: string,
    productSizeId: string,
    productSizeName: string,
    productCoverImage: string
}

type InformationToCreateCartDetail = CartDetail
type InformationToUpdateCartDetail = CartDetail

export async function getCart(userAccountId: string, limit?: LimitOptions) {
    let getCartQuery =
        'select product_price_id, quality from cart_detail \
        inner join product_price on cart_detail.product_price_id = product_price.id \
        where product_price.deleted_at is null and cart_detail.user_account_id=?'
    if (limit) {
        getCartQuery += ' ' + createLimitSql(limit)
    }

    const [cartDetailRowDatas] = await pool.query(getCartQuery, [userAccountId]) as RowDataPacket[][]
    return cartDetailRowDatas.map(convertUnderscorePropertiesToCamelCase) as Cart
}

export async function getExtraCartDetail(userAccountId: string, productPriceId: string) {
    const getCartDetailItemQuery =
        'select cart_detail.product_price_id, quality, price, \
        product.name as product_name, product_size.id as product_size_id, \
        product_size.name as product_size_name, \
        product.cover_image as product_cover_image\
        from ace_coffee_db.cart_detail \
        inner join product_price on \
        cart_detail.product_price_id = product_price.id\
        inner join product on \
        product_price.product_id = product.id\
        inner join product_size on \
        product_price.product_size_id = product_size.id\
        where product_price.deleted_at is null \
        and cart_detail.user_account_id=?\
        and cart_detail.product_price_id = ?'
    const [cartDetailItemRowDatas] = await pool.query(getCartDetailItemQuery, [userAccountId, productPriceId]) as RowDataPacket[][]
    return convertUnderscorePropertiesToCamelCase(cartDetailItemRowDatas[0] || null) as ExtraCartDetail | null
}

export async function updateCartDetail(userAccountId: string, information: InformationToUpdateCartDetail) {
    const updateCartDetailItemQuery =
        'update cart_detail set quality=? \
        where user_account_id=? and product_price_id=?\
        and (select count(id) from product_price where id=? and deleted_at is null) > 0'
    const { productPriceId, quality } = information
    const [result] = await pool.query(updateCartDetailItemQuery, [quality, userAccountId, productPriceId, productPriceId]) as OkPacket[]
    return result.affectedRows > 0
}

export async function addToCart(userAccountId: string, information: InformationToCreateCartDetail) {
    try {
        const { productPriceId, quality } = information
        const addToCartQuery = 'insert into cart_detail(`user_account_id`, `product_price_id`, `quality`) values (?) on duplicate key update quality=quality + ?'
        const [result] = await pool.query(addToCartQuery, [[userAccountId, productPriceId, quality], quality]) as OkPacket[]
        return result.affectedRows > 0
    } catch (error) {
        console.log(error)
        return false
    }
}

export async function deleteCartDetail(userAccountId: string, productPriceId: string) {
    const deleteCartDetailItemQuery = 'delete from cart_detail where user_account_id=? and product_price_id=?'
    const [result] = await pool.query(deleteCartDetailItemQuery, [userAccountId, productPriceId]) as OkPacket[]
    return result.affectedRows > 0
}