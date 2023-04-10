import { Router } from 'express'
import * as NewsController from '../controllers/news.js'

const router = Router()

router.get('/', NewsController.getNewsList)
router.get('/:id', NewsController.getNews)
router.get('/search/:title', NewsController.searchNewsByTitle)

export default router