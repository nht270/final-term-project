import { OkPacket, RowDataPacket } from 'mysql2'
import { LimitOptions } from '../config.js'
import pool from '../db.js'
import { convertUnderscorePropertiesToCamelCase } from '../utils/dataMapping.js'
import { createLimitSql } from '../utils/misc.js'
import { createUid } from '../utils/uid.js'

interface Notification {
    id: string,
    content: string,
    seen: boolean,
    createdAt: Date | string,
    linkTo?: string,
    userAccountId: string
}

type InformationToCreateNotification = Omit<Notification, 'id' | 'createdAt' | 'seen'>

export async function getNotifications(userAccountId: string, limit?: LimitOptions) {
    let getNotificationsQuery = 'select id, content, seen, created_at, link_to from notification where user_account_id=? order by created_at desc'
    if (limit) {
        getNotificationsQuery += ' ' + createLimitSql(limit)
    }

    const [notificationRowDatas] = await pool.query(getNotificationsQuery, [userAccountId]) as RowDataPacket[][]
    return notificationRowDatas.map(convertUnderscorePropertiesToCamelCase) as Notification[]
}

export async function addNotification(information: InformationToCreateNotification) {
    const { content, linkTo, userAccountId } = information
    const notificationId = createUid(20)
    const addNotificationQuery = 'insert into notification(`id`, `content`, `seen`, `created_at`, `link_to`, `user_account_id`) values (?)'
    const [result] = await pool.query(addNotificationQuery, [[notificationId, content, false, new Date(), linkTo, userAccountId]]) as OkPacket[]
    return result.affectedRows > 0
}

export async function markIsSeen(notificationIds: string[]) {
    if (notificationIds.length <= 0) { return false }
    const markIsSeenQuery = 'update notification set seen=true where id in ?'
    const [result] = await pool.query(markIsSeenQuery, [[notificationIds]]) as OkPacket[]
    return result.affectedRows > 0
}