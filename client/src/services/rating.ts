import { jsonRequest, PaginatedResponseData, SERVER_ORIGIN } from './general'

const RATING_ENDPOINT = SERVER_ORIGIN + '/rating'

export interface Rating {
    productId: string,
    userAccountId: string,
    star: number,
    content: string,
    status?: RatingStatus,
    createdAt: Date | string,
    updatedAt?: Date | string
    userName: string
    userAvatar: string
}

export interface GetRatingOptions {
    page: number,
    sort?: SortType
}

export interface RatingFilters {
    star?: number,
    searchString?: string,   // content or user name of rating
}

export type SortType = typeof SORT_TYPES[number]
export type RatingStatus = 'lock' | 'unavailable'

export const SORT_TYPES = ['newest', 'oldest'] as const

export async function getRatings(productId: string, options?: GetRatingOptions, filters?: RatingFilters): Promise<PaginatedResponseData<Rating[]>> {
    const getRatingsUrl = new URL(RATING_ENDPOINT + '/' + productId)

    getRatingsUrl.searchParams.set('page', String(options?.page && options.page > 0 ? options.page : 1))

    if (options) {
        options.sort && SORT_TYPES.includes(options.sort) && getRatingsUrl.searchParams.set('sort', options.sort)
    }

    if (filters) {
        filters.star && Number.isSafeInteger(filters.star) && getRatingsUrl.searchParams.set('star', String(filters.star))
        filters.searchString && getRatingsUrl.searchParams.set('q', filters.searchString)
    }

    const response = await jsonRequest(getRatingsUrl, 'GET')
    if (response.ok) {
        return await response.json()
    }

    return { hasNextPage: false, data: [] }
}

export async function getAverageStar(productId: string) {
    const response = await jsonRequest(`${RATING_ENDPOINT}/${productId}/average-star`, 'GET')
    if (response.ok) {
        const star: null | number = await response.json()
        return star
    }

    return null
}