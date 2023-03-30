import { CartDetail } from '../services/user'
import { WebsiteRole } from '../store/reducer'

const DEFAULT_PRODUCT_QUALITY = 1

export function getAccessToken() {
    return window.localStorage.getItem('accessToken')
}

export function getRefreshToken() {
    return window.localStorage.getItem('refreshToken')
}

export function setToken(accessToken: string, refreshToken: string) {
    window.localStorage.setItem('accessToken', accessToken)
    window.localStorage.setItem('refreshToken', refreshToken)
}

export function replaceAccessToken(accessToken: string) {
    window.localStorage.setItem('accessToken', accessToken)
}

export function clearToken() {
    window.localStorage.removeItem('accessToken')
    window.localStorage.removeItem('refreshToken')
}

export function getRole(): WebsiteRole | null {
    return window.localStorage.getItem('role') as WebsiteRole || null
}

export function changeRole(role: WebsiteRole) {
    window.localStorage.setItem('role', role)
}

export function restoreDefaultRole() {
    window.localStorage.setItem('role', 'guest')
}

export function addToCartInLocal(productPriceId: string, quality: number = DEFAULT_PRODUCT_QUALITY) {
    const cart = getCartInLocal()
    const indexOfProductPriceInCart = cart.findIndex(cartDetail => cartDetail.productPriceId === productPriceId)
    let cartDetail = { productPriceId, quality }

    if (indexOfProductPriceInCart < 0) {
        cart.push(cartDetail)
    } else {
        const previousProductQuality = cart[indexOfProductPriceInCart].quality
        cart.splice(indexOfProductPriceInCart, 1, { productPriceId, quality: quality + previousProductQuality })
    }

    saveCartInLocal(cart)
}

export function deleteCartDetailInLocal(productPriceId: string | string[]) {
    const cart = getCartInLocal()
    const idsWoldDelete = Array.isArray(productPriceId) ? productPriceId : [productPriceId]
    const newCart = cart.filter(cartDetail => !idsWoldDelete.includes(cartDetail.productPriceId))
    saveCartInLocal(newCart)
}

export function updateCartDetailInLocal(productPriceId: string, quality: number) {
    const cart = getCartInLocal()
    const indexOfCartDetailWouldUpdate = cart
        .findIndex(existsCartDetail => existsCartDetail.productPriceId === productPriceId)
    if (indexOfCartDetailWouldUpdate < 0) { return }
    cart.splice(indexOfCartDetailWouldUpdate, 1, { productPriceId, quality })
    saveCartInLocal(cart)
}

export function getCartInLocal() {
    const cartJson = window.localStorage.getItem('cart') || '[]'
    const cart: Pick<CartDetail, 'productPriceId' | 'quality'>[] = JSON.parse(cartJson)

    if (Array.isArray(cart)) {
        return cart
    }

    return []
}

export function saveCartInLocal(cart: Pick<CartDetail, 'productPriceId' | 'quality'>[]) {
    window.localStorage.setItem('cart', JSON.stringify(cart))
}