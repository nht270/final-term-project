import { OkPacket, RowDataPacket } from 'mysql2'
import { PoolConnection } from 'mysql2/promise'
import pool from '../db.js'
import { Coupon } from './coupon.js'
import * as OrderService from './order.js'

export interface CouponOnBranch extends Coupon {
    branchIds: string[]
}

export async function getBranchIds(couponCode: string) {
    const getBranchesQuery = `select branch_id from coupon_on_branch where coupon_code=?`
    const [couponOnBranchRowDatas] = await pool.query(getBranchesQuery, [couponCode]) as RowDataPacket[][]
    return couponOnBranchRowDatas.map((couponOnBranchRowData) => String(couponOnBranchRowData?.['branch_id'] || ''))
}

export async function addBranches(couponCode: string, branchIds: string[], connection: PoolConnection) {
    const addBranchesQuery = 'insert into coupon_on_branch(`coupon_code`, `branch_id`) values ?'
    const [result] = await connection.query(addBranchesQuery, [branchIds.map(branchId => [couponCode, branchId])]) as OkPacket[]
    return result.affectedRows > 0
}

export async function updateBranches(couponCode: string, branchIds: string[], connection: PoolConnection) {
    const deleteBranchesQuery = 'delete from coupon_on_branch where coupon_code=?'
    const addBranchesQuery = 'insert into coupon_on_branch(`coupon_code`, `branch_id`) values ?'

    await connection.query(deleteBranchesQuery, [couponCode])
    await connection.query(addBranchesQuery, [branchIds.map(branchId => [couponCode, branchId])])

    return true
}

export async function deleteBranches(couponCode: string, connection: PoolConnection) {
    const deleteBranchesQuery = 'delete from coupon_on_branch where coupon_code=?'
    const [result] = await connection.query(deleteBranchesQuery, [couponCode]) as OkPacket[]
    return result.affectedRows > 0
}

export function matchCondition(coupon: CouponOnBranch, order: OrderService.TemporaryOrder) {
    return coupon.branchIds.includes(order.branchId)
}

export async function getRelationCouponCodes(branchId: string) {
    const getRelationCouponCodeQuery = 'select coupon_code from coupon_on_branch where branch_id=?'
    const [couponOnBranchRowDatas] = await pool.query(getRelationCouponCodeQuery, [branchId]) as RowDataPacket[][]
    return couponOnBranchRowDatas.map(rowData => String(rowData['coupon_code']) || '').filter(couponCode => couponCode !== '')
}