import { jsonRequest, SERVER_ORIGIN } from './general'

const PRODUCT_PRICE_ENDPOINT = SERVER_ORIGIN + '/product-price'

export interface ProductPrice {
    id: string,
    productId: string,
    productSizeId: string,
    price: number
}

export interface GetProductPriceOptions {
    includeDeleted?: boolean
}

export async function getProductPrices() {
    const response = await jsonRequest(PRODUCT_PRICE_ENDPOINT, 'GET')
    if (response.ok) {
        const productPrices: ProductPrice[] = await response.json()
        return productPrices
    }
    return []
}

export async function getProductPrice(productPriceId: string, options?: GetProductPriceOptions) {
    const getProductPriceUrl = new URL(PRODUCT_PRICE_ENDPOINT + '/' + productPriceId)
    if (options && options.includeDeleted) {
        getProductPriceUrl.searchParams.append('includeDeleted', String(options.includeDeleted))
    }

    const response = await jsonRequest(getProductPriceUrl, 'GET')
    if (response.ok) {
        const productPrice: ProductPrice | null = await response.json()
        return productPrice
    }
    return null
}