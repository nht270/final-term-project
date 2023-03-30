import { OkPacket, RowDataPacket } from 'mysql2'
import { LimitOptions } from '../config.js'
import pool from '../db.js'
import { convertUnderscorePropertiesToCamelCase } from '../utils/dataMapping.js'
import { createLimitSql } from '../utils/misc.js'
import { createUid } from '../utils/uid.js'

export interface Promotion {
    id: string,
    title: string,
    content: string,
    coverImage: string,
    couponCode: string,
    createdAt: Date | string,
    updatedAt?: Date | string
}

export type InformationToCreatePromotion = Omit<Promotion, 'id' | 'createdAt' | 'updatedAt'>
export type InformationToUpdatePromotion = Omit<Promotion, 'id' | 'createdAt' | 'updatedAt'>

export async function getPromotions(limit?: LimitOptions) {
    let getPromotionsQuery = 'select id, title, content, cover_image, coupon_code, created_at, updated_at from promotion where deleted_at is null'
    if (limit) {
        getPromotionsQuery += ' ' + createLimitSql(limit)
    }

    const [promotionRowDatas] = await pool.query(getPromotionsQuery) as RowDataPacket[][]
    return promotionRowDatas.map(convertUnderscorePropertiesToCamelCase) as Promotion[]
}

export async function getPromotion(id: string) {
    const getPromotionQuery = 'select id, title, content, cover_image, coupon_code, created_at, updated_at from promotion where deleted_at is null and id=?'
    const [promotionRowDatas] = await pool.query(getPromotionQuery, [id]) as RowDataPacket[][]
    return convertUnderscorePropertiesToCamelCase(promotionRowDatas[0] || null) as Promotion | null
}

export async function addPromotion(information: InformationToCreatePromotion) {
    const id = createUid(20)
    const { title, content, coverImage, couponCode } = information
    const addPromotionQuery = 'insert into promotion(`id`, `title`, `content`, `cover_image`, `coupon_code`, `created_at`) values (?)'
    const [result] = await pool.query(addPromotionQuery, [[id, title, content, coverImage, couponCode, new Date()]]) as OkPacket[]
    return result.affectedRows > 0
}

export async function updatePromotion(id: string, promotion: InformationToUpdatePromotion) {
    const { title, content, coverImage, couponCode } = promotion
    const updatePromotionQuery = 'update promotion set title=?, content=?, cover_image=?, coupon_code=?, updated_at=? where id=? and deleted_at is null'
    const [result] = await pool.query(updatePromotionQuery, [title, content, coverImage, couponCode, new Date(), id]) as OkPacket[]
    return result.affectedRows > 0
}

export async function deletePromotion(id: string) {
    const deletePromotionQuery = 'update promotion set deleted_at=? where id=? and deleted_at is null'
    const [result] = await pool.query(deletePromotionQuery, [new Date(), id]) as OkPacket[]
    return result.affectedRows > 0
}

export async function searchPromotionByTitle(title: string, limit?: LimitOptions) {
    let searchPromotionByTitleQuery = 'select id, title, content, cover_image, coupon_code, created_at, updated_at from promotion where title like ? and deleted_at is null'
    if (limit) {
        searchPromotionByTitleQuery += ' ' + createLimitSql(limit)
    }

    const [promotionRowDatas] = await pool.query(searchPromotionByTitleQuery, [`%${title}%`]) as RowDataPacket[][]
    return promotionRowDatas.map(convertUnderscorePropertiesToCamelCase)
}