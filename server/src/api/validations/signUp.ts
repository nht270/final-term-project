import { NextFunction, Request, Response } from 'express'
import Joi from 'joi'
import { FormDataRequest } from '../middlewares/formDataExtract.js'
import * as GeneralValidate from './general.js'

const signUpUserSchema = Joi.object({
    email: Joi.string().email().required(),
    name: GeneralValidate.vietnameseSchema.required(),
    gender: GeneralValidate.genderSchema.required(),
    dateOfBirth: Joi.string().isoDate().required(),
    phone: GeneralValidate.phoneSchema,
    address: Joi.string(),
    longitude: Joi.string().regex(GeneralValidate.COORDINATE_REGEX).when('address', { is: Joi.exist(), then: Joi.required() }),
    latitude: Joi.string().regex(GeneralValidate.COORDINATE_REGEX).when('address', { is: Joi.exist(), then: Joi.required() }),
    password: GeneralValidate.passwordSchema.required()
}).unknown()

const checkExistsEmailSchema = Joi.object({
    email: Joi.string().email().required()
}).unknown()

export default class SignUpValidate {
    static signUpUser(req: FormDataRequest<Request>, res: Response, next: NextFunction) {
        const validationResult = signUpUserSchema.validate(req.fields)
        if (validationResult.error) {
            res.status(400).json(validationResult.error.message)
            return
        }

        if (req.files && req.files.avatarFile) {
            const imageValidateResult = GeneralValidate.imageFileSchema.validate(req.files.avatarFile)
            if (imageValidateResult.error) {
                res.status(400).json(imageValidateResult.error.message)
                return
            }
        }

        next()
    }

    static checkExistsEmail(req: Request, res: Response, next: NextFunction) {
        const validationResult = checkExistsEmailSchema.validate(req.body)
        if (validationResult.error) {
            res.status(400).json(validationResult.error.message)
            return
        }
        next()
    }
}
