import { Router } from 'express'
import * as CategoryController from '../controllers/category.js'

const router = Router()

router.get('/', CategoryController.getCategories)
router.get('/:categoryId', CategoryController.getCategory)

export default router