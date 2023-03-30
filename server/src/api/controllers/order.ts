import { Request, Response } from 'express'
import { MAX_DISTANCE_ALLOWED_ORDER } from '../config.js'
import * as BranchService from '../services/branch.js'
import * as CouponService from '../services/coupon.js'
import * as OrderService from '../services/order.js'
import * as ProductPriceService from '../services/productPrice.js'
import * as MapUtil from '../utils/map.js'
import { calculateDeliveryCharge } from '../utils/misc.js'

export async function getOrder(req: Request, res: Response) {
    const orderId = req.params['orderId']
    const order = await OrderService.getOrderById(orderId)
    res.json(order)
}

export async function createOrder(req: Request, res: Response) {
    const information: OrderService.InformationToCreateOrder = req.body['order']
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
            amountOfDecreaseMoney
        )

    if (orderId) {
        res.json(orderId)
    } else {
        res.status(400).json('Error when create order')
    }
}

export async function cancelOrder(req: Request, res: Response) {
    const orderId = req.params['orderId']
    const success = await OrderService.cancelOrderById(orderId)
    if (success) {
        res.json(`Cancel order #${orderId} success`)
    } else {
        res.status(400).json(`Cancel order #${orderId} success`)
    }
}