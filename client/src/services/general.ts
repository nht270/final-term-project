import * as LocalStoargeUtil from '../utils/localStorage'

export interface PaginatedResponseData<TData> {
    hasNextPage: boolean,
    data: TData
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export const SERVER_ORIGIN = 'http://localhost:8080'
export const REFRESH_TOKEN_ERROR_CAUSE = 'Refresh token invalid'
export const ACCESS_TOKEN_ERROR_CAUSE = 'Access token invalid'
export const WEBSITE_ROLE_ERROR_CAUSE = 'Access token invalid'

const REFRESH_TOKEN_URL = SERVER_ORIGIN + '/refresh'
let requestRefreshingToken: Promise<boolean> | null = null

export class RefreshTokenError extends Error {
    cause = REFRESH_TOKEN_ERROR_CAUSE
}

export class WebsiteRoleError extends Error {
    cause = WEBSITE_ROLE_ERROR_CAUSE
}
export class AccessTokenError extends Error {
    cause = ACCESS_TOKEN_ERROR_CAUSE
}

export async function requestAndAutoRefreshToken(requestCallback: () => Promise<Response>) {

    const respone = await requestCallback()
    const isExpiredToken = respone.status === 401

    if (isExpiredToken) {
        requestRefreshingToken = requestRefreshingToken || refreshAccessToken()
        const refreshedToken = await requestRefreshingToken
        requestRefreshingToken = null
        if (!refreshedToken) { throw new RefreshTokenError('Refresh token expired') }

        return requestCallback()
    }

    return respone
}

function createJsonRequestHeaders(withAccessToken: boolean = false) {
    const headers: HeadersInit = { 'Content-Type': 'application/json' }

    if (withAccessToken) {
        return createHeadersBindToken(headers)
    }

    return headers
}

function createHeadersBindToken(headers: HeadersInit = {}): HeadersInit {
    const accessToken = LocalStoargeUtil.getAccessToken()
    if (!accessToken) { throw new AccessTokenError('Lost access token', {}) }

    return { ...headers, 'authorization': `Bearer ${accessToken}` }
}

export async function jsonRequest(link: string | URL, method: HttpMethod, body: string = '', withAccessToken = false) {
    const headers = createJsonRequestHeaders(withAccessToken)
    let fetchOptions: RequestInit = { headers, method }

    if (body) { fetchOptions = { ...fetchOptions, body } }

    const response = await fetch(link, fetchOptions)

    return response
}

export async function formDataRequest(link: string | URL, method: HttpMethod, formData: FormData, withAccessToken = false) {
    const headers: HeadersInit = withAccessToken ? createHeadersBindToken() : {}
    const fetchOptions = { method, headers, body: formData }
    const respone = await fetch(link, fetchOptions)

    return respone
}

export async function jsonRequestAndAutoRefreshToken(link: string | URL, method: HttpMethod, body: string = '') {
    const response = requestAndAutoRefreshToken(() => jsonRequest(link, method, body, true))

    return response
}

export async function formDataRequestAndAutoRefreshToken(link: string | URL, method: HttpMethod, formData: FormData) {
    const respone = await requestAndAutoRefreshToken(() => formDataRequest(link, method, formData, true))
    return respone
}

export async function refreshAccessToken() {
    const refreshToken = LocalStoargeUtil.getRefreshToken()
    const role = LocalStoargeUtil.getRole()

    if (!refreshToken) { throw new RefreshTokenError('Lost refresh token') }
    if (!role || role === 'guest') { throw new WebsiteRoleError('Role invalid') }

    const response = await jsonRequest(REFRESH_TOKEN_URL + '/' + role, 'POST', JSON.stringify({ refreshToken }))

    if (!response.ok) {
        return false
    }

    const { accessToken }: { accessToken: string } = await response.json()
    LocalStoargeUtil.replaceAccessToken(accessToken)
    return true
}