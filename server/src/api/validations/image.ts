import { NextFunction, Request, Response } from 'express'
import Joi from 'joi'
import { FormDataRequest } from '../middlewares/formDataExtract.js'
import * as GeneralValidate from './general.js'

const imageUploadSchema = Joi.object({
    imageFile: GeneralValidate.imageFileSchema.required()
}).unknown()

export default class ImageValidate {
    static imageUpload(req: FormDataRequest<Request>, res: Response, next: NextFunction) {
        if (!req.files) {
            res.json('Require image file')
            return
        }
        const validationResult = imageUploadSchema.validate(req.files)
        if (validationResult.error) {
            res.status(400).json(validationResult.error.message)
            return
        }
        next()
    }
}