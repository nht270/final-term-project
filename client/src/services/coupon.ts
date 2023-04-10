import { jsonRequest, PaginatedResponseData, SERVER_ORIGIN } from './general'
import { Order, TemporaryOrder } from './order'
import * as BranchService from './branch'
import * as ProductPriceService from './productPrice'
import * as ProductSizeService from './productSize'
import * as ProductService from './product'
import { filterNull } from '../utils/filter'

export interface Coupon {
    couponCode: string,
    type: CouponType,
    beginAt: Date | string,
    finishAt: Date | string,
    decrease: number,
    unit: CouponUnit,
    appliedScopes: string | string[]
}

export type CouponType = typeof COUPON_TYPE[number]
export type CouponUnit = typeof COUPON_UNIT[number]

export const COUPON_TYPE = ['order', 'product'] as const
export const COUPON_UNIT = ['money', 'percent'] as const
export const APPLIED_SCOPES = ['branch', 'order', 'product'] as const

export interface CouponOnBranch extends Coupon {
    branchIds: string[]
}

export interface CouponOnOrder extends Coupon {
    totalPriceFrom: number,
    totalPriceTo?: number
}

export interface CouponOnProduct extends Coupon {
    productPriceIds: string[]
}

const COUPON_ENDPOINT = SERVER_ORIGIN + '/coupon'

export async function getCoupons(page = 1): Promise<PaginatedResponseData<Coupon[]>> {
    const getCouponUrl = new URL(COUPON_ENDPOINT)
    getCouponUrl.searchParams.append('page', String(page))

    const response = await jsonRequest(getCouponUrl, 'GET')
    if (response.ok) {
        const data = await response.json()
        return data
    }
    return { hasNextPage: false, data: [] }
}

export async function getCoupon(couponCode: string) {
    const response = await jsonRequest(COUPON_ENDPOINT + '/' + couponCode, 'GET')
    if (response.ok) {
        const data: null | Coupon = await response.json()
        if (data) { return data }
    }
    return null
}

export async function search(text: string) {
    const response = await jsonRequest(COUPON_ENDPOINT + '/search/' + text, 'GET')
    if (response.ok) {
        const coupons: Coupon[] = await response.json()
        return coupons
    }
    return []
}

export async function getRelationCouponOfOrder(order: TemporaryOrder) {
    const response = await jsonRequest(COUPON_ENDPOINT + '/relation', 'POST', JSON.stringify({ order }))
    if (response.ok) {
        const coupons: Coupon[] = await response.json()
        return coupons
    }

    return []
}

export async function getMountOfDecreaseMoney(couponCode: string, order: TemporaryOrder) {
    const response = await jsonRequest(COUPON_ENDPOINT + '/decrease-money', 'POST', JSON.stringify({ couponCode, order }))
    if (response.ok) {
        const decreaseMoney: number = await response.json()
        return decreaseMoney
    }
    return 0
}

export function createDiscountLabel({ decrease, unit, type }: Coupon) {
    const discountLabel =
        `Giảm ${decrease.toLocaleString('vi-VN')} ${unit === 'percent' ? '%' : 'VNĐ'}` +
        `${type === 'order' ? ' cho đơn hàng' : 'cho sản phẩm'}`
    return discountLabel
}

export async function createApplyConditionDescribe(coupon: Coupon) {
    let applyConditionDescribe = 'Áp dụng cho đơn hàng'
    if ('branchIds' in coupon) {
        const couponOnBranch = coupon as CouponOnBranch
        const branches = filterNull(await Promise.all(couponOnBranch.branchIds.map(BranchService.getBranch)))
        if (branches.length > 0) {
            applyConditionDescribe += ` thuộc chi nhánh ${branches.map(({ name }) => name).join(', ')}`
        }
    }

    if ('totalPriceFrom' in coupon) {
        const couponOnOrder = coupon as CouponOnOrder
        applyConditionDescribe += ` có giá từ ${couponOnOrder.totalPriceFrom} VNĐ`

        if (couponOnOrder.totalPriceTo) {
            applyConditionDescribe += ` đến ${couponOnOrder.totalPriceTo} VNĐ`
        }
    }

    if ('productPriceIds' in coupon) {
        const couponOnProduct = coupon as CouponOnProduct
        const productPrices = filterNull(await Promise.all(
            couponOnProduct.productPriceIds.map(productPriceId => {
                return ProductPriceService.getProductPrice(productPriceId)
            })))
        const products = filterNull(await Promise.all(
            productPrices.map(async ({ productId, productSizeId }) => {
                const product = await ProductService.getProduct(productId)
                const productSize = await ProductSizeService.getProductSize(productSizeId)
                if (product && productSize) {
                    return {
                        name: product.name,
                        size: productSize.name
                    }
                }

                return null
            })))
        if (products.length > 0) {
            applyConditionDescribe += ` có các sản phẩm ${products.map(({ name, size }) => name + ' - ' + size).join(', ')}`
        }
    }

    return applyConditionDescribe
}