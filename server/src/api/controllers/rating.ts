import { Request, Response } from 'express'
import { ITEM_COUNT_PER_PAGE } from '../config.js'
import * as RatingService from '../services/rating.js'

export async function getRatings(req: Request, res: Response) {
    const productId = req.params['productId']
    const options: RatingService.GetRatingOptions = {}
    const filters: RatingService.RatingFilters = {}

    if (req.query['sort']) {
        const sortType = String(req.query['sort'] || '') as RatingService.SortType
        if (RatingService.SORT_TYPES.includes(sortType)) {
            options.sort = sortType
        }
    }

    if (req.query['star']) {
        const star = Number(req.query['star'])
        if (Number.isSafeInteger(star)) {
            filters.star = star
        }
    }

    if (req.query['q']) {
        filters.searchString = String(req.query['q'])
    }

    if (req.query['page']) {
        const page = Number(req.query['page'])
        if (Number.isSafeInteger(page) && page > 0) {
            options.limit = { amount: ITEM_COUNT_PER_PAGE, offset: ITEM_COUNT_PER_PAGE * (page - 1) }
        }
    }

    const ratings = await RatingService.getRatings(productId, options, filters)
    res.json({ hasNextPage: ratings.length === ITEM_COUNT_PER_PAGE, data: ratings })
}

export async function getAverageStar(req: Request, res: Response) {
    const productId = req.params['productId']
    const averageStar = await RatingService.getAverageStar(productId)
    res.json(averageStar)
}