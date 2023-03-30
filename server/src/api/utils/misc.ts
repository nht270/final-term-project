import { createHash } from 'crypto'
import { LimitOptions } from '../config.js'

const PRICE_PER_KM = 3000
const PRICE_FOR_FIRST_KMS = 15000
const FIRST_KMS = 3

export function calculateDeliveryCharge(distanceByMeter: number) {
    const kmCount = distanceByMeter / 1000
    let deliveryCharge = PRICE_FOR_FIRST_KMS
    let restKmCount = kmCount - FIRST_KMS
    if (restKmCount < 0) {
        restKmCount = 0
    }
    deliveryCharge += PRICE_PER_KM * restKmCount
    return deliveryCharge
}

export function createLimitSql(limit?: LimitOptions) {
    let limitSql = ''
    if (limit) {
        limitSql += `limit ${limit.amount}${limit.offset ? ` offset ${limit.offset}` : ``}`
    }
    return limitSql
}

export function detachWordsInSentence(text: string) {
    const words = text.split(' ')
    const subSentences = []
    for (let i = words.length; i > 0; i--) {
        for (let j = 0; j <= words.length - i; j++) {
            const subSentence = words.filter((word, index) => index >= j && index < j + i).join(' ')
            subSentences.push(subSentence)
        }
    }

    return subSentences
}

export function hashText(text: string) {
    const hash = createHash('sha256')
    hash.update(text)
    return hash.digest('base64')
}