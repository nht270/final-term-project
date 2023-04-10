import { OkPacket, RowDataPacket } from 'mysql2'
import pool from '../db.js'
import { convertUnderscorePropertiesToCamelCase } from '../utils/dataMapping.js'
import { createUid } from '../utils/uid.js'

interface Banner {
    id: string,
    title: string,
    linkTo: string,
    image: string
}

export type InformationToCreateBanner = Omit<Banner, 'id'>
export type InformationToUpdateBanner = Omit<Banner, 'id'>

export async function getBanners() {
    const getBannersQuery = 'select id, title, link_to, image from banner'
    const [bannerRowDatas] = await pool.query(getBannersQuery) as RowDataPacket[][]
    return bannerRowDatas.map(convertUnderscorePropertiesToCamelCase) as Banner[]
}

export async function getBanner(id: string) {
    const getBannerQuery = 'select id, title, link_to, image from banner where id=?'
    const [bannerRowDatas] = await pool.query(getBannerQuery, [id]) as RowDataPacket[][]
    return convertUnderscorePropertiesToCamelCase(bannerRowDatas[0] || null) as Banner | null
}

export async function addBanner(information: InformationToCreateBanner) {
    const bannerId = createUid(20)
    const { title, linkTo, image } = information
    const addBannerQuery = 'insert into banner(`id`, `title`, `link_to`, `image`) values (?)'
    const [result] = await pool.query(addBannerQuery, [[bannerId, title, linkTo, image]]) as OkPacket[]
    return result.affectedRows > 0
}

export async function updateBanner(id: string, information: InformationToUpdateBanner) {
    const { title, linkTo, image } = information
    const updateBannerQuery = 'update banner set title=?, link_to=?, image=? where id=?'
    const [result] = await pool.query(updateBannerQuery, [title, linkTo, image, id]) as OkPacket[]
    return result.affectedRows > 0
}

export async function deleteBanner(id: string) {
    const deleteBannerQuery = 'delete from banner where id=?'
    const [result] = await pool.query(deleteBannerQuery, [id]) as OkPacket[]
    return result.affectedRows > 0
}