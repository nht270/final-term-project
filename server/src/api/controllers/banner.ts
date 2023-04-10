import { Request, Response } from 'express'
import * as BannerService from '../services/banner.js'

export async function getBanners(req: Request, res: Response) {
    const banners = await BannerService.getBanners()
    res.json(banners)
}

export async function getBanner(req: Request, res: Response) {
    const bannerId = req.params['bannerId']
    if (!bannerId) {
        res.status(400).json('Uknown error')
        return
    }

    const banner = await BannerService.getBanner(bannerId)
    res.json(banner)
}