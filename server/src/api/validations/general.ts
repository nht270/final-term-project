import Joi from 'joi'

export const KB = 1024
export const MB = 1024 * KB
export const MIN_IMAGE_SIZE = 20 * KB
export const MAX_IMAGE_SIZE = 1 * MB
export const IMAGE_MIMETYPE_REGEX = /^image(\/.*)*$/
export const PHONE_REGEX = /^0\d{9,10}$/
export const GENDER_REGEX = /^male|female|other$/
export const PRODUCT_STATUS_REGEX = /^hide|show$/
export const VIETNAMESE_REGEX = /^(\p{Script_Extensions=Latin}+?[ ']\p{Script_Extensions=Latin}*)+$/u
export const COORDINATE_REGEX = /^\d+(.\d+)?$/
export const PASSWORD_REGEX = /^([a-zA-Z]+\d+|\d+[a-zA-Z]+)+[a-zA-Z0-9]*$/
export const TIME_REGEX = /^(2[0-3]|[0-1][0-9]):(60|[0-5][0-9])(:(60|[0-5][0-9]))?$/

export const phoneSchema = Joi.string().regex(PHONE_REGEX)
export const vietnameseSchema = Joi.string().regex(VIETNAMESE_REGEX)
export const passwordSchema = Joi.string().regex(PASSWORD_REGEX)
export const genderSchema = Joi.string().regex(GENDER_REGEX)
export const timeSchema = Joi.string().regex(TIME_REGEX)
export const productStatusSchema = Joi.string().regex(PRODUCT_STATUS_REGEX)

export const temporaryOrderDetailSchema = Joi.object({
    productPriceId: Joi.string().required(),
    quality: Joi.number().integer().positive().required(),
}).unknown()

export const TemporaryOrderSchema = Joi.object({
    branchId: Joi.string().required(),
    details: Joi.array().items(temporaryOrderDetailSchema).min(1).required()
}).unknown()

export const imageFileSchema = Joi.object({
    mimetype: Joi.string().required().pattern(IMAGE_MIMETYPE_REGEX),
    size: Joi.number().min(MIN_IMAGE_SIZE).max(MAX_IMAGE_SIZE).required()
}).unknown()

export const coordinateChema = Joi.object({
    longitude: Joi.string().regex(COORDINATE_REGEX).required(),
    latitude: Joi.string().regex(COORDINATE_REGEX).required(),
}).unknown()

export const informationToCreateOrderSchema = Joi.object({
    customerName: vietnameseSchema.required(),
    phone: phoneSchema.required(),
    email: Joi.string().email().allow(''),
    branchId: Joi.string().required(),
    couponCode: Joi.string(),
    receivedType: Joi.string(),
    receivedAddress: Joi.string().required(),
    details: Joi.array().items(temporaryOrderDetailSchema).min(1).required()
}).unknown()

export const createOrderSchema = Joi.object({
    order: informationToCreateOrderSchema.required(),
    receivedAddressCoordinate: coordinateChema.required()
}).unknown()

export const updatePasswordSchema = Joi.object({
    oldPassword: passwordSchema.required(),
    newPassword: passwordSchema.required().not(Joi.ref('oldPassword'))
}).unknown()