import { Router } from 'express'
import * as ProductPriceController from '../controllers/productPrice.js'

const router = Router()

router.get('/', ProductPriceController.getProductPrices)
router.get('/:id', ProductPriceController.getProductPrice)

export default router