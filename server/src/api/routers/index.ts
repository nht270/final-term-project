import { Router } from 'express'
import { authorizationAdmin, authorizationStaff, authorizationUser } from '../middlewares/authorization.js'
import adminRouter from './admin.js'
import bannerRouter from './banner.js'
import branchRouter from './branch.js'
import categoryRouter from './category.js'
import couponRouter from './coupon.js'
import imageRouter from './image.js'
import newsRouter from './news.js'
import orderRouter from './order.js'
import productRouter from './product.js'
import productPriceRouter from './productPrice.js'
import productSizeRouter from './productSize.js'
import promotionRouter from './promotion.js'
import ratingRouter from './rating.js'
import refreshTokenRouter from './refreshToken.js'
import signInRouter from './signIn.js'
import signUpRouter from './signUp.js'
import staffRouter from './staff.js'
import userRouter from './user.js'

const router = Router()

router.use('/sign-in', signInRouter)
router.use('/admin', authorizationAdmin, adminRouter)
router.use('/user', authorizationUser, userRouter)
router.use('/refresh', refreshTokenRouter)
router.use('/sign-up', signUpRouter)
router.use('/category', categoryRouter)
router.use('/product-size', productSizeRouter)
router.use('/product', productRouter)
router.use('/branch', branchRouter)
router.use('/image', imageRouter)
router.use('/news', newsRouter)
router.use('/coupon', couponRouter)
router.use('/product-price', productPriceRouter)
router.use('/promotion', promotionRouter)
router.use('/staff', authorizationStaff, staffRouter)
router.use('/order', orderRouter)
router.use('/rating', ratingRouter)
router.use('/banner', bannerRouter)

export default router