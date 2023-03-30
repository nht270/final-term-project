import { Router } from 'express'
import * as PromtionController from '../controllers/promotion.js'

const router = Router()
router.get('/', PromtionController.getPromotions)
router.get('/:id', PromtionController.getPromotion)
router.get('/search/:title', PromtionController.searchPromotionByTitle)

export default router