import { Request, Response } from 'express'
import { LimitOptions, ITEM_COUNT_PER_PAGE } from '../config.js'
import * as PromotionService from '../services/promotion.js'

export async function getPromotions(req: Request, res: Response) {
    const page = req.query['page']
    const pageNumber = Number(page)
    let limit: LimitOptions | undefined
    if (page && Number.isSafeInteger(pageNumber) && pageNumber > 0) {
        limit = { amount: ITEM_COUNT_PER_PAGE, offset: ITEM_COUNT_PER_PAGE * (pageNumber - 1) }
    }

    const promotions = await PromotionService.getPromotions(limit)
    res.json({ hasNextPage: promotions.length === ITEM_COUNT_PER_PAGE, data: promotions })
}

export async function getPromotion(req: Request, res: Response) {
    const id = String(req.params['id']) || ''
    const promotion = await PromotionService.getPromotion(id)
    res.json(promotion)
}

export async function searchPromotionByTitle(req: Request, res: Response) {
    const title = req.params['title']
    const page = req.query['page']
    const pageNumber = Number(page)
    let limit: LimitOptions | undefined
    if (page && Number.isSafeInteger(pageNumber) && pageNumber > 0) {
        limit = { amount: ITEM_COUNT_PER_PAGE, offset: ITEM_COUNT_PER_PAGE * (pageNumber - 1) }
    }

    const promotions = await PromotionService.searchPromotionByTitle(title, limit)
    res.json({ hasNextPage: promotions.length === ITEM_COUNT_PER_PAGE, data: promotions })
}