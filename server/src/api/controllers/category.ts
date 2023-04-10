import { Request, Response } from 'express'
import * as CategorySevice from '../services/category.js'

export async function getCategories(req: Request, res: Response) {
    const categories = await CategorySevice.getCategories()
    res.json(categories)
}

export async function getCategory(req: Request, res: Response) {
    const categoryId = req.params['categoryId']
    const category = await CategorySevice.getCategory(categoryId)
    res.json(category)
}