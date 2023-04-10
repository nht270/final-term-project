import { OkPacket, RowDataPacket } from 'mysql2'
import { LimitOptions } from '../config.js'
import pool from '../db.js'
import { convertUnderscorePropertiesToCamelCase } from '../utils/dataMapping.js'
import { createLimitSql } from '../utils/misc.js'
import { createUid } from '../utils/uid.js'

export interface News {
    id: string,
    title: string,
    content: string,
    coverImage: string,
    createdAt: Date | string,
    updatedAt: Date | string,
}

export type InformationToCreateNews = Omit<News, 'id' | 'createdAt' | 'updatedAt'>
export type InformationToUpdateNews = Omit<News, 'id' | 'createdAt' | 'updatedAt'>

export async function getNewsList(limit?: LimitOptions) {
    let getNewsListQuery = 'select id, title, content, cover_image, created_at, updated_at from news where deleted_at is null'
    if (limit) {
        getNewsListQuery += ' ' + createLimitSql(limit)
    }

    const [newsRowDatas] = await pool.query(getNewsListQuery) as RowDataPacket[][]
    return newsRowDatas.map(convertUnderscorePropertiesToCamelCase) as News[]
}

export async function getNews(id: string) {
    const getNewsQuery = 'select id, title, content, cover_image, created_at, updated_at from news where id=? and deleted_at is null'
    const [newsRowDatas] = await pool.query(getNewsQuery, [id]) as RowDataPacket[][]
    return convertUnderscorePropertiesToCamelCase(newsRowDatas[0] || null) as News | null
}

export async function addNews(information: InformationToCreateNews) {
    const id = createUid(20)
    const { title, content, coverImage } = information
    const addNewsQuery = 'insert into news(`id`, `title`, `content`, `cover_image`, `created_at`) values (?)'
    const [result] = await pool.query(addNewsQuery, [[id, title, content, coverImage, new Date()]]) as OkPacket[]
    return result.affectedRows > 0
}

export async function updateNews(id: string, news: InformationToUpdateNews) {
    const { title, content, coverImage } = news
    const updateNewsQuery = 'update news set title=?, content=?, cover_image=?, updated_at=? where id=? and deleted_at is null'
    const [result] = await pool.query(updateNewsQuery, [title, content, coverImage, new Date(), id]) as OkPacket[]
    return result.affectedRows > 0
}

export async function deleteNews(id: string) {
    const deleteNewsQuery = 'update news set deleted_at=? where id=? and deleted_at is null'
    const [result] = await pool.query(deleteNewsQuery, [new Date(), id]) as OkPacket[]
    return result.affectedRows > 0
}

export async function searchNewsByTitle(title: string, limit?: LimitOptions) {
    let searchNewsByTitleQuery = 'select id, title, content, cover_image, created_at, updated_at from news where title like ? and deleted_at is null'
    if (limit) {
        searchNewsByTitleQuery += ' ' + createLimitSql(limit)
    }

    const [newsRowDatas] = await pool.query(searchNewsByTitleQuery, [`%${title}%`]) as RowDataPacket[][]
    return newsRowDatas.map(convertUnderscorePropertiesToCamelCase) as News[]
}