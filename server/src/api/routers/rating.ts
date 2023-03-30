import { Router } from 'express'
import * as RatingController from '../controllers/rating.js'

const router = Router()

router.get('/:productId', RatingController.getRatings)
router.get('/:productId/average-star', RatingController.getAverageStar)

export default router