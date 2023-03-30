import { AdminType } from '../store/reducer'
import { Banner } from './banner'
import { Branch } from './branch'
import { Coupon } from './coupon'
import { formDataRequestAndAutoRefreshToken, jsonRequestAndAutoRefreshToken, PaginatedResponseData, SERVER_ORIGIN } from './general'
import { News } from './news'
import { Product } from './product'
import { Promotion } from './promotion'
import { Rating } from './rating'
import { AdminSignInResult } from './signIn'
import { ExtraStaffAccount } from './staff'

export type InformationToCreateProduct = Omit<Product, 'id' | 'categoryName' | 'priceSizeCombines' | 'images' | 'createdAt' | 'coverImage'>
export type InformationToUpdateProduct = Omit<Product, 'id' | 'categoryName' | 'priceSizeCombines' | 'images' | 'createdAt' | 'coverImage'>
export type InformationToCreatePromotion = Omit<Promotion, 'id' | 'createdAt' | 'updatedAt' | 'coverImage'>
export type InformationToUpdatePromotion = Omit<Promotion, 'id' | 'createdAt' | 'updatedAt'>
export type InformationToCreateCoupon = Omit<Coupon, 'couponCode'> & {
    couponCode?: string
    branchIds?: string[],
    productPriceIds?: string[]
    totalPriceFrom?: number,
    totalPriceTo?: number
}

export type InformationToUpdateCoupon = Omit<Coupon, 'couponCode' | 'appliedScopes'> & {
    appliedScopes: string[],
    branchIds?: string[],
    productPriceIds?: string[],
    totalPriceFrom?: number,
    totalPriceTo?: number
}

export interface InformationToCreateProductPrice {
    productSizeId: string,
    price: number
}

export interface InformationToUpdateProductPrice extends InformationToCreateProductPrice {
    productPriceId?: string
}

export interface StaffAccount {
    id: string,
    branchId: string,
    branchName: string,
    name: string,
    phone: string,
    deliveringCount: boolean,
    avatar?: string
}

export interface UserAccount {
    id: string,
    name: string,
    avatar?: string,
    locked: boolean
}

export interface GetRatingOptions {
    page?: number
    sort?: RatingSortType
}

export interface RatingFilters {
    star?: number,
    status?: RatingStatus,
    searchString?: string,   // content or user name of rating
}

export type RatingStatus = 'lock' | 'unavailable'
export type RatingSortType = typeof RATING_SORT_TYPES[number]

export type InformationToCreateStaffAccount = Omit<ExtraStaffAccount, 'id' | 'branchName' | 'firstLogin' | 'deliveringCount' | 'avatar'>
export type InformationToCreateBanner = Omit<Banner, 'id' | 'image'>
export type InformationToUpdateBanner = Omit<Banner, 'id'>
export type InformationToCreateBranch = Omit<Branch, 'id'>
export type InformationToUpdateBranch = Omit<Branch, 'id'>
export type InformationToCreateNews = Omit<News, 'id' | 'createdAt' | 'updatedAt' | 'coverImage'>
export type InformationToUpdateNews = Omit<News, 'id' | 'createdAt' | 'updatedAt'>
export type AdminAccount = AdminSignInResult & {
    username: string,
    type: AdminType,
}

export const RATING_SORT_TYPES = ['newest', 'oldest'] as const

const ADMIN_INFORMATION_ENDPOINT = SERVER_ORIGIN + '/admin/information'
const ADMIN_PASSWORD_ENDPOINT = SERVER_ORIGIN + '/admin/password'
const CATEGORY_ENDPOINT = SERVER_ORIGIN + '/admin/category'
const PRODUCT_SIZE_ENDPOINT = SERVER_ORIGIN + '/admin/product-size'
const PRODUCT_ENDPOINT = SERVER_ORIGIN + '/admin/product'
const BRANCH_ENDPOINT = SERVER_ORIGIN + '/admin/branch'
const STAFF_ACCOUNT_ENDPOINT = SERVER_ORIGIN + '/admin/staff-account'
const NEWS_ENDPOINT = SERVER_ORIGIN + '/admin/news'
const COUPON_ENDPOINT = SERVER_ORIGIN + '/admin/coupon'
const PROMOTION_ENDPOINT = SERVER_ORIGIN + '/admin/promotion'
const BANNER_ENDPOINT = SERVER_ORIGIN + '/admin/banner'
const USER_ACCOUNT_ENDPOINT = SERVER_ORIGIN + '/admin/user-account'
const RATING_ENDPOINT = SERVER_ORIGIN + '/admin/rating'


export async function getInformation() {
    const response = await jsonRequestAndAutoRefreshToken(ADMIN_INFORMATION_ENDPOINT, 'GET')
    if (response && response.ok) {
        const adminInformation: AdminAccount = await response.json()
        return adminInformation
    }

    return null
}

export async function updatePassword(oldPassword: string, newPassword: string) {
    const response = await jsonRequestAndAutoRefreshToken(ADMIN_PASSWORD_ENDPOINT, 'PUT', JSON.stringify({ newPassword, oldPassword }))
    return response.ok
}

export async function addCategory(name: string) {
    const response = await jsonRequestAndAutoRefreshToken(CATEGORY_ENDPOINT, 'POST', JSON.stringify({ name }))
    return response.ok
}

export async function updateCategory(categoryId: string, name: string) {
    const response = await jsonRequestAndAutoRefreshToken(CATEGORY_ENDPOINT + '/' + categoryId, 'PUT', JSON.stringify({ name }))
    return response.ok
}

export async function deleteCategory(categoryId: string) {
    const response = await jsonRequestAndAutoRefreshToken(CATEGORY_ENDPOINT + '/' + categoryId, 'DELETE')
    return response.ok
}

export async function addProductSize(name: string) {
    const response = await jsonRequestAndAutoRefreshToken(PRODUCT_SIZE_ENDPOINT, 'POST', JSON.stringify({ name }))
    return response.ok
}

export async function updateProductSize(productSizeId: string, name: string) {
    const response = await jsonRequestAndAutoRefreshToken(PRODUCT_SIZE_ENDPOINT + '/' + productSizeId, 'PUT', JSON.stringify({ name }))
    return response.ok
}

export async function deleteProductSize(productSizeId: string) {
    const response = await jsonRequestAndAutoRefreshToken(PRODUCT_SIZE_ENDPOINT + '/' + productSizeId, 'DELETE')
    return response.ok
}

export async function addProduct(productInformation: InformationToCreateProduct, priceInformations: InformationToCreateProductPrice[], coverImageFile: File, imageFiles: File[]) {
    const { name, categoryId, description, status } = productInformation
    const formData = new FormData()
    formData.append('name', name)
    formData.append('categoryId', categoryId)
    formData.append('description', description)
    formData.append('status', status)
    formData.append('coverImageFile', coverImageFile)

    for (let priceInformation of priceInformations) {
        formData.append('priceInformationJsons', JSON.stringify(priceInformation))
    }

    for (let imageFile of imageFiles) {
        formData.append('imageFiles', imageFile)
    }

    const response = await formDataRequestAndAutoRefreshToken(PRODUCT_ENDPOINT, 'POST', formData)
    return response.ok
}

export async function updateProduct(
    productId: string,
    productInfomation: InformationToUpdateProduct,
    priceInformations: InformationToUpdateProductPrice[],
    coverImage?: string,
    images: string[] = [],
    coverImageFile?: File,
    imageFiles: File[] = []
) {
    const { name, categoryId, description, status } = productInfomation
    const formData = new FormData()
    formData.append('name', name)
    formData.append('categoryId', categoryId)
    formData.append('description', description)
    formData.append('status', status)
    coverImage && formData.append('coverImage', coverImage)
    coverImageFile && formData.append('coverImageFile', coverImageFile)

    for (let priceInformation of priceInformations) {
        formData.append('priceInformationJsons', JSON.stringify(priceInformation))
    }

    for (let image of images) {
        formData.append('images', image)
    }

    for (let imageFile of imageFiles) {
        formData.append('imageFiles', imageFile)

    }

    const response = await formDataRequestAndAutoRefreshToken(PRODUCT_ENDPOINT + '/' + productId, 'PUT', formData)

    return response.ok
}

export async function deleteProduct(productId: string) {
    const response = await jsonRequestAndAutoRefreshToken(PRODUCT_ENDPOINT + '/' + productId, 'DELETE')
    return response.ok
}

export async function addBranch(information: InformationToCreateBranch) {
    const response = await jsonRequestAndAutoRefreshToken(BRANCH_ENDPOINT, 'POST', JSON.stringify(information))
    return response.ok
}

export async function updateBranch(branchId: string, information: InformationToUpdateBranch) {
    const response = await jsonRequestAndAutoRefreshToken(BRANCH_ENDPOINT + '/' + branchId, 'PUT', JSON.stringify(information))
    return response.ok
}

export async function deleteBranch(branchId: string) {
    const response = await jsonRequestAndAutoRefreshToken(BRANCH_ENDPOINT + '/' + branchId, 'DELETE')
    return response.ok
}

export async function getStaffAccounts(page = 1): Promise<PaginatedResponseData<StaffAccount[]>> {
    const getStaffAccountsUrl = new URL(STAFF_ACCOUNT_ENDPOINT)
    getStaffAccountsUrl.searchParams.append('page', String(page))

    const response = await jsonRequestAndAutoRefreshToken(getStaffAccountsUrl, 'GET')
    if (response.ok) {
        const data = await response.json()
        return data
    }
    return { hasNextPage: false, data: [] }
}

export async function addStaffAccount(information: InformationToCreateStaffAccount, avatarFile?: File) {

    const formData = new FormData()
    const { name, phone, email, gender, dateOfBirth, branchId } = information
    formData.append('name', name)
    formData.append('gender', gender)
    formData.append('branchId', branchId)
    formData.append('dateOfBirth', new Date(dateOfBirth).toISOString())
    phone && formData.append('phone', phone)
    email && formData.append('email', email)
    avatarFile && formData.append('avatarFile', avatarFile)

    const response = await formDataRequestAndAutoRefreshToken(STAFF_ACCOUNT_ENDPOINT, 'POST', formData)

    return response.ok
}

export async function deleteStaffAccount(staffAccountId: string) {
    const response = await jsonRequestAndAutoRefreshToken(STAFF_ACCOUNT_ENDPOINT + '/' + staffAccountId, 'DELETE')
    return response.ok
}

export async function updateBranchForStaff(staffAccountId: string, branchId: string) {
    const response = await jsonRequestAndAutoRefreshToken(`${STAFF_ACCOUNT_ENDPOINT}/${staffAccountId}/branch`, 'PATCH', JSON.stringify({ branchId }))
    return response.ok
}

export async function resetStaffAccountPassword(staffAccountId: string) {
    const response = await jsonRequestAndAutoRefreshToken(`${STAFF_ACCOUNT_ENDPOINT}/${staffAccountId}/reset-password`, 'PATCH')
    return response.ok
}

export async function addNews(information: InformationToCreateNews, coverImageFile: File) {
    const formData = new FormData()
    const { title, content } = information
    formData.append('title', title)
    formData.append('content', content)
    formData.append('coverImageFile', coverImageFile)
    const response = await formDataRequestAndAutoRefreshToken(NEWS_ENDPOINT, 'POST', formData)
    return response.ok
}

export async function updateNews(newsId: string, information: InformationToUpdateNews, coverImageFile?: File) {
    const formData = new FormData()
    const { title, content, coverImage } = information
    formData.append('title', title)
    formData.append('content', content)
    formData.append('coverImage', coverImage)
    coverImageFile && formData.append('coverImageFile', coverImageFile)
    const response = await formDataRequestAndAutoRefreshToken(NEWS_ENDPOINT + '/' + newsId, 'PUT', formData)
    return response.ok
}

export async function deleteNews(newsId: string) {
    const response = await jsonRequestAndAutoRefreshToken(NEWS_ENDPOINT + '/' + newsId, 'DELETE')
    return response.ok
}


export async function addCoupon(information: InformationToCreateCoupon) {
    const response = await jsonRequestAndAutoRefreshToken(COUPON_ENDPOINT, 'POST', JSON.stringify(information))
    return response.ok
}

export async function updateCoupon(couponCode: string, information: InformationToUpdateCoupon) {
    const response = await jsonRequestAndAutoRefreshToken(COUPON_ENDPOINT + '/' + couponCode, 'PUT', JSON.stringify(information))
    return response.ok
}

export async function deleteCoupon(couponCode: string) {
    const response = await jsonRequestAndAutoRefreshToken(COUPON_ENDPOINT + '/' + couponCode, 'DELETE')
    return response.ok
}

export async function addPromotion(information: InformationToCreatePromotion, coverImageFile: File) {
    const formData = new FormData()
    const { title, content, couponCode } = information
    formData.append('title', title)
    formData.append('content', content)
    formData.append('couponCode', couponCode)
    formData.append('coverImageFile', coverImageFile)
    const response = await formDataRequestAndAutoRefreshToken(PROMOTION_ENDPOINT, 'POST', formData)
    return response.ok
}

export async function updatePromotion(promotionId: string, information: InformationToUpdatePromotion, coverImageFile?: File) {
    const formData = new FormData()
    const { title, content, coverImage, couponCode } = information
    formData.append('title', title)
    formData.append('content', content)
    formData.append('couponCode', couponCode)
    formData.append('coverImage', coverImage)
    coverImageFile && formData.append('coverImageFile', coverImageFile)
    const response = await formDataRequestAndAutoRefreshToken(PROMOTION_ENDPOINT + '/' + promotionId, 'PUT', formData)
    return response.ok
}

export async function deletePromotion(promotionId: string) {
    const response = await jsonRequestAndAutoRefreshToken(PROMOTION_ENDPOINT + '/' + promotionId, 'DELETE')
    return response.ok
}

export async function addBanner(information: InformationToCreateBanner, imageFile: File) {
    const { title, linkTo } = information
    const formData = new FormData()
    formData.append('title', title)
    formData.append('linkTo', linkTo)
    formData.append('imageFile', imageFile)
    const response = await formDataRequestAndAutoRefreshToken(BANNER_ENDPOINT, 'POST', formData)
    return response.ok
}

export async function updateBanner(bannerId: string, information: InformationToUpdateBanner, imageFile?: File) {
    const { title, linkTo, image } = information
    const formData = new FormData()
    formData.append('title', title)
    formData.append('linkTo', linkTo)
    formData.append('image', image)
    imageFile && formData.append('imageFile', imageFile)
    const response = await formDataRequestAndAutoRefreshToken(BANNER_ENDPOINT + '/' + bannerId, 'PUT', formData)
    return response.ok
}

export async function deleteBanner(bannerId: string) {
    const response = await jsonRequestAndAutoRefreshToken(BANNER_ENDPOINT + '/' + bannerId, 'DELETE')
    return response.ok
}

export async function getUserAccounts(page = 1): Promise<PaginatedResponseData<UserAccount[]>> {
    const getUserAccountsUrl = new URL(USER_ACCOUNT_ENDPOINT)
    getUserAccountsUrl.searchParams.append('page', String(page))

    const response = await jsonRequestAndAutoRefreshToken(getUserAccountsUrl, 'GET')
    if (response.ok) {
        const data = await response.json()
        return data
    }

    return { hasNextPage: false, data: [] }
}

export async function lockUserAccount(userAccountId: string) {
    const response = await jsonRequestAndAutoRefreshToken(USER_ACCOUNT_ENDPOINT + '/' + userAccountId + '/lock', 'PATCH')
    return response.ok
}

export async function unlockUserAccount(userAccountId: string) {
    const response = await jsonRequestAndAutoRefreshToken(USER_ACCOUNT_ENDPOINT + '/' + userAccountId + '/unlock', 'PATCH')
    return response.ok
}

export async function getRatings(options?: GetRatingOptions, filters?: RatingFilters): Promise<PaginatedResponseData<Rating[]>> {

    const getRatingsUrl = new URL(RATING_ENDPOINT)

    getRatingsUrl.searchParams.set('page', String(options?.page && options.page > 0 ? options.page : 1))

    if (options) {
        options.sort && RATING_SORT_TYPES.includes(options.sort) && getRatingsUrl.searchParams.set('sort', options.sort)
    }

    if (filters) {
        filters.star && Number.isSafeInteger(filters.star) && getRatingsUrl.searchParams.set('star', String(filters.star))
        filters.status && getRatingsUrl.searchParams.set('status', filters.status)
        filters.searchString && getRatingsUrl.searchParams.set('q', filters.searchString)
    }

    const response = await jsonRequestAndAutoRefreshToken(getRatingsUrl, 'GET')
    if (response.ok) {
        return await response.json()
    }

    return { hasNextPage: false, data: [] }
}

export async function lockRating(userAccountId: string, productId: string) {
    const response = await jsonRequestAndAutoRefreshToken(`${RATING_ENDPOINT}/${userAccountId}/${productId}/lock`, 'PATCH')
    return response.ok
}

export async function unlockRating(userAccountId: string, productId: string) {
    const response = await jsonRequestAndAutoRefreshToken(`${RATING_ENDPOINT}/${userAccountId}/${productId}/unlock`, 'PATCH')
    return response.ok
}