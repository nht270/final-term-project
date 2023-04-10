import { NextFunction, Request, Response } from 'express'
import Joi from 'joi'
import * as GeneralValidate from './general.js'

const calculateAmountOfDecreaseMoneySchema = Joi.object({
    couponCode: Joi.string().required(),
    order: GeneralValidate.TemporaryOrderSchema.required()
}).unknown()

const getRelationCouponsSchema = Joi.object({
    order: GeneralValidate.TemporaryOrderSchema.required()
}).unknown()

export default class CouponValidate {
    static calculateAmountOfDecreaseMoney(req: Request, res: Response, next: NextFunction) {
        const validationResult = calculateAmountOfDecreaseMoneySchema.validate(req.body)
        if (validationResult.error) {
            res.status(400).json(validationResult.error.message)
            return
        }
        next()
    }

    static findRelationCoupons(req: Request, res: Response, next: NextFunction) {
        const validationResult = getRelationCouponsSchema.validate(req.body)
        if (validationResult.error) {
            res.status(400).json(validationResult.error.message)
            return
        }
        next()
    }
}
