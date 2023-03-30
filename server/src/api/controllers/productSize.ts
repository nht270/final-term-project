import { Request, Response } from 'express'
import * as ProductSizeService from '../services/productSize.js'

export async function getProductSizes(req: Request, res: Response) {
    const productSizes = await ProductSizeService.getProductSizes()
    res.json(productSizes)
}

export async function getProductSize(req: Request, res: Response) {
    const id = String(req.params['id']) || ''
    const options: ProductSizeService.GetProductSizeOptions = {}

    if (req.query['includeDeleted'] === 'true') {
        options.includeDeleted = true
    }

    const size = await ProductSizeService.getProductSize(id, options)
    res.json(size)
}