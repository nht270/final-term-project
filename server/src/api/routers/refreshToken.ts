import { Router } from 'express'
import * as RefreshTokenController from '../controllers/refreshToken.js'
import RefreshTokenValidate from '../validations/refreshToken.js'

const router = Router()

router.post('/admin', RefreshTokenValidate.refreshTokenForAdmin, RefreshTokenController.refreshTokenForAdmin)
router.post('/user', RefreshTokenValidate.refreshTokenForUser, RefreshTokenController.refreshTokenForUser)
router.post('/staff', RefreshTokenValidate.refreshTokenForStaff, RefreshTokenController.refreshTokenForStaff)

export default router