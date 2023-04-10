import { NextFunction, Response } from 'express'
import { AdminRequest, StaffRequest } from './authorization.js'

export async function preventFirstLogin(req: AdminRequest | StaffRequest, res: Response, next: NextFunction) {
    const firstLogin = !!req.firstLogin
    if (firstLogin) {
        res.status(400).json('Required change password before use this feature')
    } else {
        next()
    }
}