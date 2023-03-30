export interface LimitOptions {
    amount: number,
    offset?: number
}

export const EXPIRE_TIME_OF_ACCESS_TOKEN = '1h'
export const EXPIRE_TIME_OF_REFRESH_TOKEN = '24h'
export const EXPIRE_TIME_OF_RESET_PASSWORD_TOKEN = '30m'
export const ITEM_COUNT_PER_PAGE = 5
export const MAX_DISTANCE_ALLOWED_ORDER = 20000
export const MAX_DELIVERING_ORDER = 2