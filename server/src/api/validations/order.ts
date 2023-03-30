import { NextFunction, Request, Response } from 'express'
import * as GeneralValidate from './general.js'

export default class OrderValidate {

    static createOrder(req: Request, res: Response, next: NextFunction) {
        const validationResult = GeneralValidate.createOrderSchema.validate(req.body)
        if (validationResult.error) {
            res.status(400).json(validationResult.error.message)
            return
        }

        next()
    }
}
