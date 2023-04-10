import { NextFunction, Request, Response } from 'express'
import Joi from 'joi'

const refreshTokenchema = Joi.object({
    refreshToken: Joi.string().required()
}).unknown()

export default class RefreshTokenValidate {

    static refreshTokenForAdmin(req: Request, res: Response, next: NextFunction) {
        const validationResult = refreshTokenchema.validate(req.body)
        if (validationResult.error) {
            res.status(400).json(validationResult.error.message)
            return
        }
        next()
    }

    static refreshTokenForUser(req: Request, res: Response, next: NextFunction) {
        const validationResult = refreshTokenchema.validate(req.body)
        if (validationResult.error) {
            res.status(400).json(validationResult.error.message)
            return
        }
        next()
    }

    static refreshTokenForStaff(req: Request, res: Response, next: NextFunction) {
        const validationResult = refreshTokenchema.validate(req.body)
        if (validationResult.error) {
            res.status(400).json(validationResult.error.message)
            return
        }
        next()
    }
}
