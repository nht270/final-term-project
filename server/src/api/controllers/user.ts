import { Response } from 'express'
import { getSocketIO } from '../../socketIO.js'
import { LimitOptions, ITEM_COUNT_PER_PAGE, MAX_DISTANCE_ALLOWED_ORDER } from '../config.js'
import { UserRequest } from '../middlewares/authorization.js'
import { FormDataRequest } from '../middlewares/formDataExtract.js'
import * as BranchService from '../services/branch.js'
import * as CartService from '../services/cart.js'
import * as CouponService from '../services/coupon.js'
import * as NotificationService from '../services/notification.js'
import * as OrderService from '../services/order.js'
import * as ProductPriceService from '../services/productPrice.js'
import * as RatingService from '../services/rating.js'
import * as UserAccountService from '../services/userAccount.js'
import * as MapUtil from '../utils/map.js'
import { calculateDeliveryCharge } from '../utils/misc.js'
import { deleteImage, uploadImage } from '../utils/storageImage.js'

export async function getInformation(req: UserRequest, res: Response) {
    const userAccountId = req.userAccountId
    if (!userAccountId) {
        res.status(400).json('Unknown error')
        return
    }

    const userInfomation = await UserAccountService.getInformation(userAccountId)

    if (userInfomation) {
        res.json(userInfomation)
    } else {
        res.status(400).json('Not found user infomations')
    }
}

export async function updateInformation(req: FormDataRequest<UserRequest>, res: Response) {
    const { userAccountId } = req

    if (!userAccountId || !req.fields) {
        res.status(400).json('Unknown error')
        return
    }

    const information = req.fields as UserAccountService.InformationToUpdateUserAccount
    const oldInfomation = await UserAccountService.getInformation(userAccountId)
    const oldAvatar = String(oldInfomation?.avatar || '')
    information.avatar = oldAvatar

    if (req.files && req.files.avatarFile) {
        const avatarFile = Array.isArray(req.files.avatarFile) ? req.files.avatarFile[0] : req.files.avatarFile
        const newAvatar = await uploadImage(avatarFile.filepath)
        information.avatar = newAvatar
    }

    const success = await UserAccountService.updateInformation(userAccountId, information)
    if (success) {
        if (information.avatar !== oldAvatar) {
            await deleteImage(oldAvatar)
        }

        res.json('Update successful')
    } else {
        res.status(400).json('Update failure')
    }
}

export async function updatePassword(req: UserRequest, res: Response) {
    const { userAccountId } = req
    const { oldPassword = '', newPassword = '' } = req.body
    if (!userAccountId) {
        res.status(400).json('Unknown error')
        return
    }

    const success = await UserAccountService.updatePassword(userAccountId, oldPassword, newPassword)

    if (success) {
        res.json('Update successful')
    } else {
        res.status(400).json('Update failure')
    }
}

export async function deleteAccount(req: UserRequest, res: Response) {
    const { userAccountId } = req
    if (!userAccountId) {
        res.status(400).json('Unknown error')
        return
    }

    const success = await UserAccountService.deleteAccount(userAccountId)

    if (success) {
        res.json('Delete successful')
    } else {
        res.status(400).json('Delete failure')
    }
}

export async function getCart(req: UserRequest, res: Response) {
    const { userAccountId } = req
    if (!userAccountId) {
        res.status(400).json('Unknown error')
        return
    }

    const cartDetail = await CartService.getCart(userAccountId)
    res.json(cartDetail)
}

export async function getCartDetail(req: UserRequest, res: Response) {
    const { userAccountId } = req
    const productPriceId = req.params['productPriceId']
    if (!userAccountId) {
        res.status(400).json('Unknown error')
        return
    }

    const cartDetail = await CartService.getExtraCartDetail(userAccountId, productPriceId)
    res.json(cartDetail)
}

export async function addToCart(req: UserRequest, res: Response) {
    const { userAccountId } = req
    const { productPriceId, quality } = req.body
    if (!userAccountId) {
        res.status(400).json('Unknown error')
        return
    }

    const success = await CartService.addToCart(userAccountId, { productPriceId, quality })
    if (success) {
        res.json('Added')
    } else {
        res.status(400).json('Error')
    }
}

export async function updateCartDetail(req: UserRequest, res: Response) {
    const { userAccountId } = req
    const productPriceId = req.params['productPriceId']
    const { quality } = req.body
    if (!userAccountId) {
        res.status(400).json('Unknown error')
        return
    }

    const success = await CartService.updateCartDetail(userAccountId, { productPriceId, quality })
    if (success) {
        res.json('Updated')
    } else {
        res.status(400).json('Error')
    }
}

export async function deleteCartDetail(req: UserRequest, res: Response) {
    const { userAccountId } = req
    const productPriceId = req.params['productPriceId']
    if (!userAccountId) {
        res.status(400).json('Unknown error')
        return
    }

    const success = await CartService.deleteCartDetail(userAccountId, productPriceId)
    if (success) {
        res.json('Deleted')
    } else {
        res.status(400).json('Error')
    }
}

export async function createOrder(req: UserRequest, res: Response) {
    const { userAccountId } = req

    if (!userAccountId) {
        res.status(400).json('Unknown error')
        return
    }

    const isLockedUser = await UserAccountService.checkLock(userAccountId)
    if (isLockedUser) {
        res.status(403).json('User not allowed order')
        return
    }

    const information = req.body['order'] as OrderService.InformationToCreateOrder
    const orderDetailsBeMappingPrice = await Promise.all(information.details.map(async (detail) => {
        const productPrice = await ProductPriceService.getProductPrice(detail.productPriceId)
        const price = Number(productPrice?.price) || 0
        return { ...detail, price }
    }))

    let amountOfDecreaseMoney = 0
    if (information.couponCode) {
        const coupon = await CouponService.getCoupon(information.couponCode)
        if (coupon) {
            amountOfDecreaseMoney = CouponService.calculateDecreaseMoneyForOrder(coupon, { ...information, details: orderDetailsBeMappingPrice })
        }
    }

    const branchBeOrder = await BranchService.getBranch(information.branchId)
    if (!branchBeOrder) {
        res.status(400).json(`Branch #${information.branchId} not found`)
        return
    }

    const branchCoordinate: MapUtil.GoongIoCoordinate = {
        longitude: branchBeOrder.longitude,
        latitude: branchBeOrder.latitude
    }

    const receivedAddressCoordinate: MapUtil.GoongIoCoordinate = req.body['receivedAddressCoordinate']
    const deliveryDistanceByMeter = await MapUtil.getLengthFromOriginToDestinationGoongIo(branchCoordinate, receivedAddressCoordinate)

    if (deliveryDistanceByMeter < 0) {
        res.status(400).json('Error calculate delivery distance')
        return
    }

    if (deliveryDistanceByMeter > MAX_DISTANCE_ALLOWED_ORDER) {
        res.status(400).json('Orver max distance allowed order')
        return
    }

    const deliveryCharge = information.receivedType === 'delivery' ? calculateDeliveryCharge(deliveryDistanceByMeter) : 0
    const orderId =
        await OrderService.createOrder(
            {
                ...information,
                details: orderDetailsBeMappingPrice,
                deliveryCharge
            },
            amountOfDecreaseMoney,
            userAccountId
        )

    if (orderId) {
        const productPriceIdsInUserCart = information.details.map(({ productPriceId }) => productPriceId)
        await Promise.all(productPriceIdsInUserCart.map(productPriceId => CartService.deleteCartDetail(userAccountId, productPriceId)))
        const notificationContent = `Đơn hàng #${orderId} đã được đặt`
        const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000'
        const notificationLink = CLIENT_ORIGIN + '/user/order-history/' + orderId
        await NotificationService.addNotification({ content: notificationContent, linkTo: notificationLink, userAccountId })
        const socketIO = getSocketIO()
        socketIO.to(userAccountId).emit('newNotification')
        res.json(orderId)
    } else {
        res.status(400).json('Error when create order')
    }
}

export async function getNotifications(req: UserRequest, res: Response) {
    const { userAccountId } = req

    if (!userAccountId) {
        res.status(400).json('Unknown error')
        return
    }

    const page = req.query['page']
    const pageNumber = Number(page)
    let limit: LimitOptions | undefined
    if (page && Number.isSafeInteger(pageNumber) && pageNumber > 0) {
        limit = { amount: ITEM_COUNT_PER_PAGE, offset: ITEM_COUNT_PER_PAGE * (pageNumber - 1) }
    }

    const notifications = await NotificationService.getNotifications(userAccountId, limit)

    res.json({ hasNextPage: notifications.length === ITEM_COUNT_PER_PAGE, data: notifications })
}

export async function markNotificationIsSeen(req: UserRequest, res: Response) {
    const { userAccountId } = req
    const notificationIds: string[] = Array.isArray(req.body.notificationIds) ? req.body.notificationIds : []

    if (!userAccountId) {
        res.status(400).json('Unknown error')
        return
    }

    const success = await NotificationService.markIsSeen(notificationIds)
    res.json(success)
}

export async function getOrders(req: UserRequest, res: Response) {
    const { userAccountId } = req
    if (!userAccountId) {
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

    const orders = await OrderService.getOrdersByUserAccount(userAccountId, options, filters)
    res.json({ hasNextPage: orders.length === ITEM_COUNT_PER_PAGE, data: orders })
}

export async function cancelOrder(req: UserRequest, res: Response) {
    const userAccountId = req.userAccountId
    const orderId = req.params['orderId']
    if (!userAccountId) {
        res.status(400).json('Unknown error')
        return
    }

    const success = await OrderService.cancelOrderByUser(userAccountId, orderId)
    if (success) {
        const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000'
        const notificationContent = `Đơn hàng #${orderId} đã được hủy`
        const notificationLink = CLIENT_ORIGIN + '/user/order-history/' + orderId
        await NotificationService.addNotification({ content: notificationContent, linkTo: notificationLink, userAccountId })
        const socketIO = getSocketIO()
        socketIO.to(userAccountId).emit('newNotification')
        res.json('Successful')
    } else {
        res.status(400).json('Failure')
    }
}

export async function getOwnRating(req: UserRequest, res: Response) {
    const { userAccountId } = req
    const productId = req.params['productId']
    if (!userAccountId) {
        res.status(400).json('Unknown error')
        return
    }
    const rating = await RatingService.getOwnRating(userAccountId, productId)
    res.json(rating)
}

export async function canRating(req: UserRequest, res: Response) {
    const { userAccountId } = req
    const productId = req.params['productId']
    if (!userAccountId) {
        res.status(400).json('Unknown error')
        return
    }
    const canRating = await RatingService.canRating(userAccountId, productId)
    res.json(canRating)
}

export async function addRating(req: UserRequest, res: Response) {
    const { userAccountId } = req
    const information = req.body as RatingService.InformationToCreateRating
    if (!userAccountId) {
        res.status(400).json('Unknown error')
        return
    }

    const success = await RatingService.addRating(userAccountId, information)
    if (success) {
        res.json('Successful')
    } else {
        res.status(400).json('Failure')
    }
}

export async function updateRating(req: UserRequest, res: Response) {
    const userAccountId = req.userAccountId
    const productId = req.params['productId']
    const information = req.body as RatingService.InformationToUpdateRating
    if (!userAccountId || !productId) {
        res.status(400).json('Unknown error')
        return
    }
    const success = await RatingService.updateRating(userAccountId, productId, information)
    if (success) {
        res.json('Successful')
    } else {
        res.status(400).json('Failure')
    }
}

export async function deleteRating(req: UserRequest, res: Response) {
    const userAccountId = req.userAccountId
    const productId = req.params['productId']
    if (!userAccountId || !productId) {
        res.status(400).json('Unknown error')
        return
    }
    const success = await RatingService.deleteRating(userAccountId, productId)
    if (success) {
        res.json('Successful')
    } else {
        res.status(400).json('Failure')
    }
}

export async function checkLock(req: UserRequest, res: Response) {
    const userAccountId = req.userAccountId
    if (!userAccountId) {
        res.status(400).json('Unknown error')
        return
    }
    const isLocked = await UserAccountService.checkLock(userAccountId)
    res.json(isLocked)
}