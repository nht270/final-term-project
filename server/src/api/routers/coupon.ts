import { Router } from 'express'
import * as CouponController from '../controllers/coupon.js'
import CouponValidate from '../validations/coupon.js'

const router = Router()

router.get('/', CouponController.getCoupons)
router.get('/:couponCode', CouponController.getCoupon)
router.get('/search/:text', CouponController.searchCoupon)
router.post('/decrease-money', CouponValidate.calculateAmountOfDecreaseMoney, CouponController.calculateAmountOfDecreaseMoney)
router.post('/relation', CouponValidate.findRelationCoupons, CouponController.findRelationCoupons)

export default router