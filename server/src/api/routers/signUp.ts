import Router from 'express'
import * as SignUpController from '../controllers/signUp.js'
import { extractFormData } from '../middlewares/formDataExtract.js'
import SignUpValidate from '../validations/signUp.js'

const router = Router()

router.post('/', extractFormData, SignUpValidate.signUpUser, SignUpController.signUpUser)
router.post('/exists-email', SignUpValidate.checkExistsEmail, SignUpController.checkExistsEmail)
router.get('/verify/:token', SignUpController.verifyUser)

export default router