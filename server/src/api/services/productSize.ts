import { OkPacket, RowDataPacket } from 'mysql2'
import pool from '../db.js'
import { convertUnderscorePropertiesToCamelCase } from '../utils/dataMapping.js'
import { createUid } from '../utils/uid.js'

export interface ProductSize {
    id: string,
    name: string
}

export interface GetProductSizeOptions {
    includeDeleted?: boolean
}

export async function getProductSizes() {
    const getProductSizesQuery = 'select id, name from product_size where deleted_at is null'
    const [productSizeRowDatas] = await pool.query(getProductSizesQuery) as RowDataPacket[]

    return productSizeRowDatas as ProductSize[]
}

export async function getProductSize(id: string, options?: GetProductSizeOptions) {
    let getProductSizeQuery = 'select id, name from product_size where id=?'
    if (!options || !options.includeDeleted) {
        getProductSizeQuery += ' and deleted_at is null'
    }

    const [productSizeRowDatas] = await pool.query(getProductSizeQuery, [id]) as RowDataPacket[][]
    return convertUnderscorePropertiesToCamelCase(productSizeRowDatas[0] || null) as ProductSize | null
}

export async function addProductSize(name: string) {
    const id = createUid(20)
    const addProductSizeQuery = 'insert into product_size(`id`, `name`) values(?)'
    const [result] = await pool.query(addProductSizeQuery, [[id, name]]) as OkPacket[]

    return result.affectedRows > 0
}

export async function updateProductSize(id: string, name: string) {
    const updateProductSizeQuery = 'update product_size set name=? where id=? and deleted_at is null'
    const [result] = await pool.query(updateProductSizeQuery, [name, id]) as OkPacket[]

    return result.affectedRows > 0
}

export async function deleteProductSize(id: string) {
    const deleteProductSizeQuery = 'update product_size set deleted_at=? where id=? and deleted_at is null'
    const [result] = await pool.query(deleteProductSizeQuery, [new Date(), id]) as OkPacket[]

    return result.affectedRows > 0
}