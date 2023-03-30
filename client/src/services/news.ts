import { jsonRequest, PaginatedResponseData, SERVER_ORIGIN } from './general'

const NEWS_ENDPOINT = SERVER_ORIGIN + '/news'

export interface News {
    id: string,
    title: string,
    content: string,
    coverImage: string,
    createdAt: Date | string,
    updatedAt?: Date | string
}

export async function getNewsList(page = 1): Promise<PaginatedResponseData<News[]>> {
    const getNewsListUrl = new URL(NEWS_ENDPOINT)
    getNewsListUrl.searchParams.append('page', String(page))

    const response = await jsonRequest(getNewsListUrl, 'GET')
    if (response.ok) {
        const data = await response.json()
        return data
    }

    return { hasNextPage: false, data: [] }
}

export async function getNews(id: string) {
    const response = await jsonRequest(NEWS_ENDPOINT + '/' + id, 'GET')
    if (response.ok) {
        const news: News | null = await response.json()
        return news
    }

    return null
}

export async function searchNewsByTitle(title: string, page = 1): Promise<PaginatedResponseData<News[]>> {
    const searchNewsByTitleUrl = new URL(`${NEWS_ENDPOINT}/search/${title}`)
    searchNewsByTitleUrl.searchParams.append('page', String(page))

    const response = await jsonRequest(searchNewsByTitleUrl, 'GET')
    if (response.ok) {
        const result = await response.json()
        return result
    }

    return { hasNextPage: false, data: [] }
}