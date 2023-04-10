import dotenv from 'dotenv'
import { Request, Response } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { EXPIRE_TIME_OF_ACCESS_TOKEN, EXPIRE_TIME_OF_REFRESH_TOKEN, EXPIRE_TIME_OF_RESET_PASSWORD_TOKEN } from '../config.js'
import * as AdminAccountService from '../services/adminAccount.js'
import * as StaffAccountSerive from '../services/staffAccount.js'
import * as UserAccountService from '../services/userAccount.js'
import { sendMail } from '../utils/mail.js'

dotenv.config()

export async function signInAdmin(req: Request, res: Response) {
    const { username, password } = req.body
    const adminSignInResult = await AdminAccountService.signIn(username, password)

    if (adminSignInResult) {
        const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'token'
        const JWT_REFRESH_SECRET_KEY = process.env.JWT_REFRESH_SECRET_KEY || 'refresh'
        const { username, type, firstLogin } = adminSignInResult
        const accessToken = jwt.sign(
            { username, type, firstLogin, role: 'admin' },
            JWT_SECRET_KEY,
            { expiresIn: EXPIRE_TIME_OF_ACCESS_TOKEN }
        )
        const refreshToken = jwt.sign(
            { username, type, firstLogin, role: 'admin' },
            JWT_REFRESH_SECRET_KEY,
            { expiresIn: EXPIRE_TIME_OF_REFRESH_TOKEN }
        )

        res.json({ accessToken, refreshToken, firstLogin })
    } else {
        res.status(404).json('Not found this admin')
    }
}

export async function signInUser(req: Request, res: Response) {
    const { email, password } = req.body
    const userSignInResult = await UserAccountService.signIn(email, password)

    if (userSignInResult) {
        const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'token'
        const JWT_REFRESH_SECRET_KEY = process.env.JWT_REFRESH_SECRET_KEY || 'refresh'
        const accessToken = jwt.sign({ ...userSignInResult, role: 'user' }, JWT_SECRET_KEY, { expiresIn: EXPIRE_TIME_OF_ACCESS_TOKEN })
        const refreshToken = jwt.sign({ ...userSignInResult, role: 'user' }, JWT_REFRESH_SECRET_KEY, { expiresIn: EXPIRE_TIME_OF_REFRESH_TOKEN })
        res.json({ accessToken, refreshToken, verified: userSignInResult.verified })
    } else {
        res.status(404).json('Not found this user')
    }
}

export async function signInStaff(req: Request, res: Response) {
    const { phone, password } = req.body

    const staffSigInResult = await StaffAccountSerive.signIn(phone, password)
    if (staffSigInResult) {
        const { id: staffAccountId, firstLogin } = staffSigInResult
        const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'token'
        const JWT_REFRESH_SECRET_KEY = process.env.JWT_REFRESH_SECRET_KEY || 'refresh'
        const accessToken = jwt.sign({ id: staffAccountId, firstLogin, role: 'staff' }, JWT_SECRET_KEY, { expiresIn: EXPIRE_TIME_OF_ACCESS_TOKEN })
        const refreshToken = jwt.sign({ id: staffAccountId, firstLogin, role: 'staff' }, JWT_REFRESH_SECRET_KEY, { expiresIn: EXPIRE_TIME_OF_REFRESH_TOKEN })
        res.json({ accessToken, refreshToken, firstLogin })
    } else {
        res.status(404).json('Not found this staff')
    }
}

export async function forgotPassword(req: Request, res: Response) {
    const email = String(req.body['email'] || '')
    if (!email) {
        res.status(400).json('Miss email')
        return
    }

    const userAccountId = await UserAccountService.getId(email)
    if (!userAccountId) {
        res.status(400).json('Not found user')
        return
    }

    const JWT_RESET_PASSWORD_SECRET_KEY = process.env.JWT_RESET_PASSWORD_SECRET_KEY || 'token'
    const CLIENT_URL_FOR_RESET_PASSWORD = process.env.CLIENT_URL_FOR_RESET_PASSWORD || 'http://localhost:3000'
    const resetPasswordToken = jwt.sign({ id: userAccountId }, JWT_RESET_PASSWORD_SECRET_KEY, { expiresIn: EXPIRE_TIME_OF_RESET_PASSWORD_TOKEN })
    const mailContent =
        'Truy cập liên kết bên dưới để đặt lại mật khẩu\n' +
        `${CLIENT_URL_FOR_RESET_PASSWORD}/${resetPasswordToken}`
    const mailSubject = 'Đặt lại mật khẩu'
    sendMail(email, mailContent, mailSubject)
    res.json('Sent reset password link')
}

export async function resetPassword(req: Request, res: Response) {
    const newPassword = String(req.body['newPassword'] || '')
    const token = req.params['token']
    if (!newPassword) {
        res.status(400).json('Miss password')
        return
    }

    try {
        const JWT_RESET_PASSWORD_SECRET_KEY = process.env.JWT_RESET_PASSWORD_SECRET_KEY || 'token'
        const jwtPayload = jwt.verify(token, JWT_RESET_PASSWORD_SECRET_KEY) as JwtPayload
        const userId: string = jwtPayload['id'] || ''
        const success = await UserAccountService.forceUpdatePassword(userId, newPassword)

        if (success) {
            res.json('Reset password successful')
        } else {
            res.status(400).json('Reset password failure')
        }
    } catch (error) {
        res.status(400).json('Token expired or invalid')
    }
}