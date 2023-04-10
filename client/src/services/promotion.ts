import { jsonRequest, PaginatedResponseData, SERVER_ORIGIN } from './general'

const PROMOTION_ENDPOINT = SERVER_ORIGIN + '/promotion'

export interface Promotion {
    id: string,
    title: string,
    content: string,
    coverImage: string,
    couponCode: string,
    createdAt: Date | string,
    updatedAt?: Date | string
}

export async function getPromotions(page = 1): Promise<PaginatedResponseData<Promotion[]>> {
    const getPromotionUrl = new URL(PROMOTION_ENDPOINT)
    getPromotionUrl.searchParams.append('page', String(page))

    const response = await jsonRequest(getPromotionUrl, 'GET')
    if (response.ok) {
        const data = await response.json()
        return data
    }
    return { hasNextPage: false, data: [] }
}

export async function getPromotion(id: string) {
    const response = await jsonRequest(PROMOTION_ENDPOINT + '/' + id, 'GET')
    if (response.ok) {
        const promotion: Promotion | null = await response.json()
        return promotion
    }
    return null
}

export async function searchPromotionByTitle(title: string, page = 1): Promise<PaginatedResponseData<Promotion[]>> {
    const searchPromotionByTitleUrl = new URL(`${PROMOTION_ENDPOINT}/search/${title}`)
    searchPromotionByTitleUrl.searchParams.append('page', String(page))
    const response = await jsonRequest(searchPromotionByTitleUrl, 'GET')
    if (response.ok) {
        const result = await response.json()
        return result
    }

    return { hasNextPage: false, data: [] }
}