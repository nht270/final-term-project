import { Router } from 'express'
import * as UserController from '../controllers/user.js'
import { extractFormData } from '../middlewares/formDataExtract.js'
import UserValidate from '../validations/user.js'

const router = Router()

router.get('/information', UserController.getInformation)
router.put('/information', extractFormData, UserValidate.updateInformation, UserController.updateInformation)
router.patch('/password', UserValidate.updatePassword, UserController.updatePassword)
router.delete('/account', UserController.deleteAccount)
router.get('/cart', UserController.getCart)
router.get('/cart/:productPriceId', UserController.getCartDetail)
router.post('/cart', UserValidate.addToCart, UserController.addToCart)
router.put('/cart/:productPriceId', UserValidate.updateCartDetail, UserController.updateCartDetail)
router.delete('/cart/:productPriceId', UserController.deleteCartDetail)
router.get('/order', UserController.getOrders)
router.post('/order', UserValidate.createOrder, UserController.createOrder)
router.patch('/order/:orderId/cancel', UserController.cancelOrder)
router.get('/notification', UserController.getNotifications)
router.patch('/notification/mark-is-seen', UserValidate.markNotificationIsSeen, UserController.markNotificationIsSeen)
router.get('/rating/:productId', UserController.getOwnRating)
router.get('/rating/:productId/can-rating', UserController.canRating)
router.post('/rating', UserValidate.addRating, UserController.addRating)
router.put('/rating/:productId', UserValidate.updateRating, UserController.updateRating)
router.delete('/rating/:productId', UserController.deleteRating)
router.get('/lock', UserController.checkLock)

export default router