import { Router } from 'express'
import * as SignInController from '../controllers/signIn.js'
import SignInValidate from '../validations/signIn.js'
const router = Router()

router.post('/admin', SignInValidate.signInAdmin, SignInController.signInAdmin)
router.post('/user', SignInValidate.signInUser, SignInController.signInUser)
router.post('/staff', SignInValidate.signInStaff, SignInController.signInStaff)
router.post('/forgot', SignInValidate.forgotPassword, SignInController.forgotPassword)
router.post('/reset/:token', SignInValidate.resetPassword, SignInController.resetPassword)

export default router