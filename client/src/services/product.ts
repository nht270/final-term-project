import { jsonRequest, PaginatedResponseData, SERVER_ORIGIN } from './general'

const PRODUCT_ENDPOINT = SERVER_ORIGIN + '/product'

export interface Product {
    id: string,
    name: string,
    description: string,
    status: string,
    createdAt: string | Date,
    categoryId: string,
    categoryName: string,
    coverImage: string,
    images?: string[]
    priceSizeCombines?: PriceSizeCombine[]
}

export interface PriceSizeCombine {
    productPriceId: string,
    productSizeId: string,
    productSizeName: string,
    price: number
}

export interface GetProductFilter {
    status?: 'hide' | 'show' | 'all',
    searchString?: string // for id, name, description, category name
    fromDate?: Date,
    toDate?: Date,
    categoryId?: string
}

export interface GetProductOptions {
    page?: number,
    include?: IncludeOptions,
    filter?: GetProductFilter,
    sort?: SortType
}

export interface IncludeOptions {
    images?: boolean,
    priceAndSize?: boolean,
}

export const SORT_TYPES = ['highPopular', 'highRating', 'newest', 'oldest'] as const
export type SortType = typeof SORT_TYPES[number]

export interface SearchProductItem {
    name: string,
    productPriceId: string,
    productSizeName: string
}

export async function getProducts(options: GetProductOptions): Promise<PaginatedResponseData<Product[]>> {
    const getProductsUrl = new URL(PRODUCT_ENDPOINT)
    getProductsUrl.searchParams.append('page', String(options.page || 1))

    if (options.include) {
        const includedProperties = []
        if (options.include.images) { includedProperties.push('images') }
        if (options.include.priceAndSize) { includedProperties.push('priceAndSize') }

        if (includedProperties.length > 0) {
            getProductsUrl.searchParams.append('includes', includedProperties.join(','))
        }
    }

    if (options.filter) {
        options.filter.status && getProductsUrl.searchParams.append('status', options.filter.status)
        options.filter.categoryId && getProductsUrl.searchParams.append('categoryId', options.filter.categoryId)
        options.filter.fromDate && getProductsUrl.searchParams.append('fromDate', options.filter.fromDate.toISOString())
        options.filter.toDate && getProductsUrl.searchParams.append('toDate', options.filter.toDate.toISOString())
        options.filter.searchString && getProductsUrl.searchParams.append('s', options.filter.searchString)
    }

    if (options.sort) {
        getProductsUrl.searchParams.append('sort', options.sort)
    }

    const response = await jsonRequest(getProductsUrl.href, 'GET')

    if (response.ok) {
        return await response.json()
    }

    return { hasNextPage: false, data: [] }
}

export async function getProduct(id: string, include?: IncludeOptions) {
    if (!id) { return null }

    const getProductUrl = new URL(PRODUCT_ENDPOINT + '/' + id)
    if (include) {
        const includedProperties = []
        if (include.images) { includedProperties.push('images') }
        if (include.priceAndSize) { includedProperties.push('priceAndSize') }

        if (includedProperties.length > 0) {
            getProductUrl.searchParams.append('includes', includedProperties.join(','))
        }
    }

    const response = await jsonRequest(getProductUrl.href, 'GET')

    if (response.ok) {
        const products: Product = await response.json()
        return products
    }

    return null
}