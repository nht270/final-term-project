import { Router } from 'express'
import * as ProductController from '../controllers/product.js'
const router = Router()

router.get('/', ProductController.getProducts)
router.get('/:id', ProductController.getProduct)

export default router