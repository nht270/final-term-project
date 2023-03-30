import { Router } from 'express'
import * as BannerController from '../controllers/banner.js'

const router = Router()

router.get('/', BannerController.getBanners)
router.get('/:bannerId', BannerController.getBanner)

export default router