import { Router } from 'express'
import * as OrderController from '../controllers/order.js'
import OrderValidate from '../validations/order.js'

const router = Router()

router.get('/:orderId', OrderController.getOrder)
router.post('/', OrderValidate.createOrder, OrderController.createOrder)
router.patch('/:orderId/cancel', OrderController.cancelOrder)

export default router