import { NextFunction, Response } from 'express'
import Joi from 'joi'
import { StaffRequest } from '../middlewares/authorization.js'
import { FormDataRequest } from '../middlewares/formDataExtract.js'
import { TIME_TYPES } from '../services/order.js'
import * as GeneralValidate from './general.js'

const updateInformationSchema = Joi.object({
    phone: GeneralValidate.phoneSchema.required(),
    name: GeneralValidate.vietnameseSchema.required(),
    gender: GeneralValidate.genderSchema.required(),
    dateOfBirth: Joi.string().isoDate().required(),
    avatar: Joi.string(),
    email: Joi.string().email(),
}).unknown()

const checkExistsPhoneSchema = Joi.object({
    phone: GeneralValidate.phoneSchema.required()
}).unknown()

const cancelOrderSchema = Joi.object({
    reason: Joi.string().required()
}).unknown()

const statisOrdersSchema = Joi.object({
    fromDate: Joi.string().isoDate().required(),
    toDate: Joi.string().isoDate().required(),
    timeType: Joi.valid(...TIME_TYPES)
}).unknown()

export default class StaffValidate {
    static updateInformation(req: FormDataRequest<StaffRequest>, res: Response, next: NextFunction) {
        const validationResult = updateInformationSchema.validate(req.fields)
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

    static updatePassword(req: StaffRequest, res: Response, next: NextFunction) {
        const validationResult = GeneralValidate.updatePasswordSchema.validate(req.body)
        if (validationResult.error) {
            res.status(400).json(validationResult.error.message)
            return
        }

        next()
    }

    static checkExistsPhone(req: StaffRequest, res: Response, next: NextFunction) {
        const validationResult = checkExistsPhoneSchema.validate(req.body)
        if (validationResult.error) {
            res.status(400).json(validationResult.error.message)
            return
        }

        next()
    }

    static cancelOrder(req: StaffRequest, res: Response, next: NextFunction) {
        const validationResult = cancelOrderSchema.validate(req.body)
        if (validationResult.error) {
            res.status(400).json(validationResult.error.message)
            return
        }

        next()
    }

    static statisOrders(req: StaffRequest, res: Response, next: NextFunction) {
        const validationResult = statisOrdersSchema.validate(req.query)
        if (validationResult.error) {
            res.status(400).json(validationResult.error.message)
            return
        }

        next()
    }
}