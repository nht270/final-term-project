import dotenv from 'dotenv'
import { Response } from 'express'
import { getSocketIO } from '../../socketIO.js'
import { LimitOptions, ITEM_COUNT_PER_PAGE } from '../config.js'
import { StaffRequest } from '../middlewares/authorization.js'
import { FormDataRequest } from '../middlewares/formDataExtract.js'
import * as NotificationService from '../services/notification.js'
import * as OrderService from '../services/order.js'
import * as StaffAccountService from '../services/staffAccount.js'
import { deleteImage, uploadImage } from '../utils/storageImage.js'

dotenv.config()

export async function getInformation(req: StaffRequest, res: Response) {
    const { staffAccountId } = req
    if (!staffAccountId) {
        res.status(400).json('Miss credential')
        return
    }

    const information = await StaffAccountService.getInformation(staffAccountId)
    if (!information) {
        res.status(400).json('Not found this staff')
        return
    }

    res.json(information)
}

export async function updateInformation(req: FormDataRequest<StaffRequest>, res: Response) {
    const { staffAccountId } = req
    if (!staffAccountId) {
        res.status(400).json('Miss credential')
        return
    }

    if (!staffAccountId || !req.fields) {
        res.status(400).json('Error unknown')
        return
    }

    const information = req.fields as StaffAccountService.InformationToUpdateStaffAccount
    const oldInformation = await StaffAccountService.getInformation(staffAccountId)
    const oldAvatar = String(oldInformation?.avatar || '')
    let newAvatar = ''
    information.avatar = oldAvatar

    if (req.files && req.files.avatarFile) {
        const avatarFile = Array.isArray(req.files.avatarFile) ? req.files.avatarFile[0] : req.files.avatarFile
        newAvatar = await uploadImage(avatarFile.filepath)
        information.avatar = newAvatar

    }

    const success = await StaffAccountService.updateInformation(staffAccountId, information)
    if (success) {
        if (information.avatar !== oldAvatar) {
            await deleteImage(oldAvatar)
        }

        res.json('Update successful')
    } else {
        res.status(400).json('Update failure')
    }
}

export async function updatePassword(req: StaffRequest, res: Response) {
    const { staffAccountId } = req
    const { oldPassword, newPassword } = req.body
    if (!staffAccountId) {
        res.status(400).json('Miss credential')
        return
    }

    const success = await StaffAccountService.updatePassword(staffAccountId, oldPassword, newPassword)
    if (success) {
        res.json('Update successful')
    } else {
        res.status(400).json('Update failure')
    }
}

export async function checkExistsPhone(req: StaffRequest, res: Response) {
    const phone = String(req.body.phone || '')

    if (!phone) {
        res.status(400).json('Miss phone number')
    }

    const exists = await StaffAccountService.checkExistsPhone(phone)
    res.json(exists)
}

export async function getOrders(req: StaffRequest, res: Response) {
    const { staffAccountId } = req

    if (!staffAccountId) {
        res.status(400).json('Unknown error')
        return
    }

    const staffAccount = await StaffAccountService.getInformation(staffAccountId)
    if (!staffAccount) {
        res.status(400).json('Unknown error')
        return
    }

    const options: OrderService.GetOrderOptions = {}
    const filters: OrderService.OrderFilters = {}

    if (req.query['sort']) {
        const sortType = String(req.query['sort'] || '') as OrderService.SortType
        if (OrderService.SORT_TYPES.includes(sortType)) {
            options.sort = sortType
        }
    }

    if (req.query['createdFrom']) {
        const createdFrom = new Date(String(req.query['createdFrom']))
        if (!isNaN(createdFrom.getTime())) {
            filters.createdFrom = createdFrom
        }
    }

    if (req.query['createdTo']) {
        const createdTo = new Date(String(req.query['createdTo']))
        if (!isNaN(createdTo.getTime())) {
            filters.createdTo = createdTo
        }
    }

    if (req.query['status']) {
        filters.status = String(req.query['status'])
    }

    if (req.query['q']) {
        filters.searchString = String(req.query['q'])
    }

    if (req.query['page']) {
        const page = Number(req.query['page'])
        if (Number.isSafeInteger(page) && page > 0) {
            options.limit = { amount: ITEM_COUNT_PER_PAGE, offset: ITEM_COUNT_PER_PAGE * (page - 1) }
        }
    }

    const orders = await OrderService.getOrdersByBranch(staffAccount.branchId, options, filters)
    res.json({ hasNextPage: orders.length === ITEM_COUNT_PER_PAGE, data: orders })
}

export async function verifyOrder(req: StaffRequest, res: Response) {
    const { staffAccountId } = req
    const orderId = req.params['orderId']
    if (!staffAccountId || !orderId) {
        res.status(400).json('Unknown error')
        return
    }

    const success = await OrderService.verifyOrderByStaff(staffAccountId, orderId)
    if (success) {
        const order = await OrderService.getOrderById(orderId)
        if (order && order.userAccountId) {
            const notificationContent = `Đơn hàng #${orderId} đã được duyệt`
            const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000'
            const notificationLink = CLIENT_ORIGIN + '/user/order-history/' + orderId

            await NotificationService.addNotification({ content: notificationContent, linkTo: notificationLink, userAccountId: order.userAccountId })
            const socketIO = getSocketIO()
            socketIO.to(order.userAccountId).emit('newNotification')
        }

        res.json('Successful')
    } else {
        res.status(400).json('Failure')
    }
}

export async function deliveryOrder(req: StaffRequest, res: Response) {
    const { staffAccountId } = req
    const orderId = req.params['orderId']
    if (!staffAccountId || !orderId) {
        res.status(400).json('Unknown error')
        return
    }

    const success = await OrderService.deliveryOrderByStaff(staffAccountId, orderId)
    if (success) {
        const order = await OrderService.getOrderById(orderId)
        if (order && order.userAccountId) {
            const notificationContent = `Đơn hàng #${orderId} đã được vận chuyển`
            const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000'
            const notificationLink = CLIENT_ORIGIN + '/user/order-history/' + orderId

            await NotificationService.addNotification({ content: notificationContent, linkTo: notificationLink, userAccountId: order.userAccountId })
            const socketIO = getSocketIO()
            socketIO.to(order.userAccountId).emit('newNotification')
        }
        res.json('Successful')
    } else {
        res.status(400).json('Failure')
    }
}

export async function verifyReceivedOrder(req: StaffRequest, res: Response) {
    const { staffAccountId } = req
    const orderId = req.params['orderId']
    if (!staffAccountId || !orderId) {
        res.status(400).json('Unknown error')
        return
    }

    const success = await OrderService.verifyReceivedOrderByStaff(staffAccountId, orderId)
    if (success) {
        const order = await OrderService.getOrderById(orderId)
        if (order && order.userAccountId) {
            const notificationContent = `Đơn hàng #${orderId} đã được nhận`
            const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000'
            const notificationLink = CLIENT_ORIGIN + '/user/order-history/' + orderId

            await NotificationService.addNotification({ content: notificationContent, linkTo: notificationLink, userAccountId: order.userAccountId })
            const socketIO = getSocketIO()
            socketIO.to(order.userAccountId).emit('newNotification')
        }
        res.json('Successful')
    } else {
        res.status(400).json('Failure')
    }
}

export async function cancelOrder(req: StaffRequest, res: Response) {
    const { staffAccountId } = req
    const orderId = req.params['orderId']
    const reason = req.body['reason']
    if (!staffAccountId || !orderId || !reason) {
        res.status(400).json('Unknown error')
        return
    }

    const success = await OrderService.cancelOrderByStaff(staffAccountId, orderId, reason)
    if (success) {
        const order = await OrderService.getOrderById(orderId)
        if (order && order.userAccountId) {
            const notificationContent = `Đơn hàng #${orderId} đã được hủy`
            const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000'
            const notificationLink = CLIENT_ORIGIN + '/user/order-history/' + orderId

            await NotificationService.addNotification({ content: notificationContent, linkTo: notificationLink, userAccountId: order.userAccountId })
            const socketIO = getSocketIO()
            socketIO.to(order.userAccountId).emit('newNotification')
        }
        res.json('Successful')
    } else {
        res.status(400).json('Failure')
    }
}

export async function canVerifyOrder(req: StaffRequest, res: Response) {
    const { staffAccountId } = req
    const orderId = req.params['orderId']
    if (!staffAccountId || !orderId) {
        res.status(400).json('Unknown error')
        return
    }

    const result = await OrderService.canVerifyOrder(staffAccountId)
    res.json(result)
}

export async function canDeliveryOrder(req: StaffRequest, res: Response) {
    const { staffAccountId } = req
    const orderId = req.params['orderId']
    if (!staffAccountId || !orderId) {
        res.status(400).json('Unknown error')
        return
    }

    const result = await OrderService.canDeliveryOrder(staffAccountId)
    res.json(result)
}

export async function canVerifyReceivedOrder(req: StaffRequest, res: Response) {
    const { staffAccountId } = req
    const orderId = req.params['orderId']
    if (!staffAccountId || !orderId) {
        res.status(400).json('Unknown error')
        return
    }

    const result = await OrderService.canVerifyReceivedOrder(staffAccountId, orderId)
    res.json(result)
}

export async function canCancelOrder(req: StaffRequest, res: Response) {
    const { staffAccountId } = req
    const orderId = req.params['orderId']
    if (!staffAccountId || !orderId) {
        res.status(400).json('Unknown error')
        return
    }

    const result = await OrderService.canCancelOrder(staffAccountId, orderId)
    res.json(result)
}

export async function statisOrders(req: StaffRequest, res: Response) {
    const { staffAccountId } = req
    const timeType = req.query['timeType'] as OrderService.TimeType
    const fromDate = new Date(String(req.query['fromDate']))
    const toDate = new Date(String(req.query['toDate']))

    if (!staffAccountId) {
        res.status(400).json('Unknown error')
        return
    }

    const staffAccount = await StaffAccountService.getInformation(staffAccountId)
    if (!staffAccount) {
        res.status(400).json('Unknown error')
        return
    }

    const result = await OrderService.statisOrdersByBranch(staffAccount.branchId, fromDate, toDate, timeType)
    res.json(result)
}