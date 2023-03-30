import { OkPacket, RowDataPacket } from 'mysql2'
import pool from '../db.js'
import { convertUnderscorePropertiesToCamelCase } from '../utils/dataMapping.js'
import { createUid } from '../utils/uid.js'

interface Branch {
    id: string,
    name: string,
    phone: string,
    address: string,
    openedAt: string,
    closedAt: string,
    longitude: string,
    latitude: string,
}

export type InformationToCreateBranch = Omit<Branch, 'id'>
export type InformationToUpdateBranch = Omit<Branch, 'id'>

const DEFAULT_OPEN_TIME = '07:00:00'
const DEFAULT_CLOSE_TIME = '20:00:00'

export async function getBranches() {
    const getBranchesQuery = 'select id, name, phone, address, opened_at, closed_at, longitude, latitude from branch where deleted_at is null'
    const [branchRowDatas] = await pool.query(getBranchesQuery) as RowDataPacket[][]
    return branchRowDatas.map(convertUnderscorePropertiesToCamelCase) as Branch[]
}

export async function getBranch(id: string) {
    const getBranchQuery = 'select id, name, phone, address, opened_at, closed_at, longitude, latitude from branch where id=? and deleted_at is null'
    const [branchRowDatas] = await pool.query(getBranchQuery, [id]) as RowDataPacket[][]
    return convertUnderscorePropertiesToCamelCase(branchRowDatas[0] || null) as Branch | null
}

export async function addBranch(information: InformationToCreateBranch) {
    const id = createUid(20)
    const { name, phone, address, openedAt = DEFAULT_OPEN_TIME, closedAt = DEFAULT_CLOSE_TIME, longitude, latitude } = information
    const addBranchQuery = 'insert into branch(`id`, `name`, `phone`, `address`, `opened_at`, `closed_at`, `longitude`, `latitude`) values (?)'
    const [result] = await pool.query(addBranchQuery, [[id, name, phone, address, openedAt, closedAt, longitude, latitude]]) as OkPacket[]

    return result.affectedRows > 0
}

export async function updateBranch(id: string, information: InformationToUpdateBranch) {
    const { name, phone, address, openedAt = DEFAULT_OPEN_TIME, closedAt = DEFAULT_CLOSE_TIME, longitude, latitude } = information
    const updateBranchQuery = 'update branch set name=?, phone=?, address=?, opened_at=?, closed_at=?, longitude=?, latitude=? where id=? and deleted_at is null'
    const [result] = await pool.query(updateBranchQuery, [name, phone, address, openedAt, closedAt, longitude, latitude, id]) as OkPacket[]
    return result.affectedRows > 0
}

export async function deleteBranch(id: string) {
    const deleteBranchQuery = 'update branch set deleted_at=? where id=? and deleted_at is null'
    const [result] = await pool.query(deleteBranchQuery, [new Date(), id]) as OkPacket[]
    return result.affectedRows > 0
}

export async function search(text: string) {
    const searchQuery = 'select id, name, phone, address, opened_at, closed_at, longitude, latitude from branch where (deleted_at is null) and (name like ? or address like ?)'
    const [branchRowDatas] = await pool.query(searchQuery, [`%${text}%`, `%${text}%`]) as RowDataPacket[][]
    return branchRowDatas.map(convertUnderscorePropertiesToCamelCase) as Branch[]
}