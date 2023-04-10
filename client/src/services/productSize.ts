import { jsonRequest, SERVER_ORIGIN } from './general'
const PRODUCT_SIZE_ENDPOINT = SERVER_ORIGIN + '/product-size'

export interface ProductSize {
    id: string,
    name: string
}

export interface GetProductSizeOptions {
    includeDeleted?: boolean
}

export async function getProductSizes() {
    const response = await jsonRequest(PRODUCT_SIZE_ENDPOINT, 'GET')
    if (response && response.ok) {
        const productSizes: ProductSize[] = await response.json()
        return productSizes
    }
    return []
}

export async function getProductSize(id: string, options?: GetProductSizeOptions) {
    const getProductSizeUrl = new URL(`${PRODUCT_SIZE_ENDPOINT}/${id}`)
    if (options && options.includeDeleted) {
        getProductSizeUrl.searchParams.set('includeDeleted', 'true')
    }

    const response = await jsonRequest(getProductSizeUrl, 'GET')
    if (response && response.ok) {
        const productSizes: ProductSize | null = await response.json()
        return productSizes
    }
    return null
}