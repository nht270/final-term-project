import { Request, Response } from 'express'
import * as ProductPriceService from '../services/productPrice.js'

export async function getProductPrices(req: Request, res: Response) {
    const productPrices = await ProductPriceService.getProductPrices()
    res.json(productPrices)
}

export async function getProductPrice(req: Request, res: Response) {
    const id = String(req.params['id']) || ''
    const options: ProductPriceService.GetProductPriceOptions = {}
    req.query['includeDeleted'] && (options.includeDeleted = req.query['includeDeleted'] === 'true')

    const productPrice = await ProductPriceService.getProductPrice(id, options)
    res.json(productPrice)
}