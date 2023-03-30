import { RowDataPacket } from 'mysql2'
import { OkPacket, PoolConnection } from 'mysql2/promise'
import pool from '../db.js'
import { convertUnderscorePropertiesToCamelCase } from '../utils/dataMapping.js'
import { createUid } from '../utils/uid.js'

export interface ProductPrice {
    id: string,
    productId: string,
    productSizeId: string,
    price: number
}

export interface InformationToCreateProductPrice {
    productSizeId: string,
    price: number
}

export interface InformationToUpdateProductPrice extends InformationToCreateProductPrice {
    productPriceId?: string
}

export interface GetProductPriceOptions {
    includeDeleted?: boolean
}

export async function getProductPrices() {
    const getProductPricesQuery = 'select id, product_id, product_size_id, price from product_price where deleted_at is null'
    const [productPriceRowDatas] = await pool.query(getProductPricesQuery) as RowDataPacket[][]
    return productPriceRowDatas.map(convertUnderscorePropertiesToCamelCase) as ProductPrice[]
}

export async function getProductPrice(id: string, options?: GetProductPriceOptions) {
    let getProductPriceQuery = 'select id, product_id, product_size_id, price from product_price where id=?'
    if (!options || !options.includeDeleted) {
        getProductPriceQuery += `and deleted_at is null`
    }
    const [productPriceRowDatas] = await pool.query(getProductPriceQuery, [id]) as RowDataPacket[][]
    return convertUnderscorePropertiesToCamelCase(productPriceRowDatas[0] || null) as ProductPrice | null
}

export async function getProductPricesByProductId(productId: string, continueWithConnection?: PoolConnection) {
    const connection = continueWithConnection || pool
    const getProductPricesByProductIdQuery = 'select id, product_id, product_size_id, price from product_price where deleted_at is null and product_id=?'
    const [productPriceRowDatas] = await connection.query(getProductPricesByProductIdQuery, [productId]) as RowDataPacket[][]
    return productPriceRowDatas.map(convertUnderscorePropertiesToCamelCase) as ProductPrice[]
}

export async function addProductPrices(productId: string, informations: InformationToCreateProductPrice[], connection: PoolConnection) {
    const productPriceRowDatas = informations.map(information => {
        const productPriceId = createUid(20)
        const { productSizeId, price } = information
        const createdAt = new Date()
        const priceRowData = [productPriceId, productId, productSizeId, price, createdAt]
        return priceRowData
    })

    const addProductPricesQuery = 'insert into product_price(`id`, `product_id`, `product_size_id`, `price`, `created_at`) values ?'
    const [result] = await connection.query(addProductPricesQuery, [productPriceRowDatas]) as OkPacket[]
    return result.affectedRows > 0
}

export async function updateProductPrices(productId: string, informations: InformationToUpdateProductPrice[], connection: PoolConnection) {
    const productPriceRowDatas = informations.map(information => {
        const { productSizeId, price } = information
        const productPriceId = information.productPriceId || createUid(20)
        const createdAt = new Date()
        const deletedAt = null
        const priceRowData = [productPriceId, productId, productSizeId, price, createdAt, deletedAt]
        return priceRowData
    })

    const productPriceIdsNeedUpdate = informations
        .flatMap(({ productPriceId }) => productPriceId ? [productPriceId] : [])
    const deleteUnusedProductPricesQuery = 'update product_price set deleted_at=? where id not in ? and product_id=?'
    const deleteAllProductPricesQuery = 'update product_price set deleted_at=? where product_id=?'
    const replaceProductPricesQuery = 'replace into product_price(`id`, `product_id`, `product_size_id`, `price`, `created_at`, `deleted_at`) values ?'
    if (productPriceIdsNeedUpdate.length > 0) {
        await connection.query(deleteUnusedProductPricesQuery, [new Date(), [productPriceIdsNeedUpdate], productId])
    } else {
        await connection.query(deleteAllProductPricesQuery, [new Date(), productId])
    }
    await connection.query(replaceProductPricesQuery, [productPriceRowDatas])
    return true
}

export async function deleteProductPricesByProductId(productId: string, connection: PoolConnection) {
    const deleteProductPricesByProductIdQuery = 'update product_price set deleted_at=? where product_id=?'
    const [result] = await connection.query(deleteProductPricesByProductIdQuery, [new Date(), productId]) as OkPacket[]
    return result.affectedRows > 0
}