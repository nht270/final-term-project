import { Router } from 'express'
import * as ProductSizeControllor from '../controllers/productSize.js'

const router = Router()

router.get('/', ProductSizeControllor.getProductSizes)
router.get('/:id', ProductSizeControllor.getProductSize)

export default router