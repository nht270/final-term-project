import { Router } from 'express'
import * as ImageControlloer from '../controllers/image.js'
import { extractFormData } from '../middlewares/formDataExtract.js'
import ImageValidate from '../validations/image.js'

const router = Router()

router.post('/upload', extractFormData, ImageValidate.imageUpload, ImageControlloer.imageUpload)

export default router