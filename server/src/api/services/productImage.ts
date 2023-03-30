import { OkPacket, RowDataPacket } from 'mysql2'
import { PoolConnection } from 'mysql2/promise'
import pool from '../db.js'

export async function getProductImages(productId: string, continueWithConnection?: PoolConnection) {
    const connection = continueWithConnection || pool
    const getProductImagesQuery = 'select image from product_image where product_id=?'
    const [imageRowDatas] = await connection.query(getProductImagesQuery, [productId]) as RowDataPacket[][]
    const images = imageRowDatas.map(({ image }) => image as string)
    return images
}

export async function addProductImages(productId: string, images: string[], connection: PoolConnection) {
    const addProductImagesQuery = 'insert into product_image(`product_id`, `image`) values ?'
    const [result] = await connection.query(addProductImagesQuery, [images.map(image => [productId, image])]) as OkPacket[]
    return result.affectedRows > 0
}

export async function updateProductImages(productId: string, images: string[], connection: PoolConnection) {
    await deleteProductImages(productId, connection)
    if (images.length > 0) {
        await addProductImages(productId, images, connection)
    }
    return true
}

export async function deleteProductImages(productId: string, connection: PoolConnection) {
    const deleteProductImagesQuery = 'delete from product_image where product_id=?'
    const [result] = await connection.query(deleteProductImagesQuery, [productId]) as OkPacket[]
    return result.affectedRows > 0
}