import { Router } from 'express'
import * as StaffController from '../controllers/staff.js'
import { extractFormData } from '../middlewares/formDataExtract.js'
import StaffValidate from '../validations/staff.js'

const router = Router()

router.get('/information', StaffController.getInformation)
router.put('/information', extractFormData, StaffValidate.updateInformation, StaffController.updateInformation)
router.patch('/password', StaffValidate.updatePassword, StaffController.updatePassword)
router.post('/exists-phone', StaffValidate.checkExistsPhone, StaffController.checkExistsPhone)
router.get('/order', StaffController.getOrders)
router.patch('/order/:orderId/verify', StaffController.verifyOrder)
router.patch('/order/:orderId/delivery', StaffController.deliveryOrder)
router.patch('/order/:orderId/verify-received', StaffController.verifyReceivedOrder)
router.patch('/order/:orderId/cancel', StaffValidate.cancelOrder, StaffController.cancelOrder)

router.post('/order/:orderId/can-verify', StaffController.canVerifyOrder)
router.post('/order/:orderId/can-delivery', StaffController.canDeliveryOrder)
router.post('/order/:orderId/can-verify-received', StaffController.canVerifyReceivedOrder)
router.post('/order/:orderId/can-cancel', StaffController.canCancelOrder)
router.get('/statis', StaffValidate.statisOrders, StaffController.statisOrders)


export default router