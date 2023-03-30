import { jsonRequest, SERVER_ORIGIN } from './general'
const CATEGORY_ENDPOINT = SERVER_ORIGIN + '/category'

export interface Category {
    id: string,
    name: string
}

export async function getCategories() {
    const response = await jsonRequest(CATEGORY_ENDPOINT, 'GET')
    if (response && response.ok) {
        const categories: Category[] = await response.json()
        return categories
    }
    return []
}

export async function getCategory(id: string) {
    const response = await jsonRequest(CATEGORY_ENDPOINT + '/' + id, 'GET')
    if (response.ok) {
        const category: Category | null = await response.json()
        return category
    }
    return null
}