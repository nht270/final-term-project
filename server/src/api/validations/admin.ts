import { NextFunction, Response } from 'express'
import Joi from 'joi'
import { AdminRequest } from '../middlewares/authorization.js'
import { FormDataRequest } from '../middlewares/formDataExtract.js'
import { APPLIED_SCOPES, COUPON_TYPE, COUPON_UNIT, LENGTH_OF_COUPON_CODE } from '../services/coupon.js'
import { InformationToCreateProductPrice, InformationToUpdateProductPrice } from '../services/productPrice.js'
import * as GeneralValidate from './general.js'

const addCategorySchema = Joi.object({
    name: Joi.string().required()
})

const updateCategorySchema = Joi.object({
    name: Joi.string().required()
})

const addProductSizeSchema = Joi.object({
    name: Joi.string().required()
})

const updateProductSizeSchema = Joi.object({
    name: Joi.string().required()
})

const addProductShema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    categoryId: Joi.string().required(),
    status: GeneralValidate.productStatusSchema.required(),
    priceInformationJsons: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string()).min(1)).required()
}).unknown()

const updateProductShema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    categoryId: Joi.string().required(),
    coverImage: Joi.string(),
    status: GeneralValidate.productStatusSchema.required(),
    images: Joi.alternatives().try(
        Joi.string(),
        Joi.array().items(Joi.string())
    ),
    priceInformationJsons: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string()).min(1)).required()
}).unknown()

const informationToCreateProductPriceSchema = Joi.object({
    productSizeId: Joi.string().required(),
    price: Joi.number().positive().required()
}).unknown()

const informationToUpdateProductPriceSchema = Joi.object({
    productSizeId: Joi.string().required(),
    price: Joi.number().positive().required(),
    productPriceId: Joi.string().allow('')
}).unknown()

const addBranchShema = Joi.object({
    name: Joi.string().required(),
    phone: GeneralValidate.phoneSchema.required(),
    address: Joi.string().required(),
    openedAt: GeneralValidate.timeSchema.required(),
    closedAt: GeneralValidate.timeSchema.required(),
    longitude: Joi.string().regex(GeneralValidate.COORDINATE_REGEX).required(),
    latitude: Joi.string().regex(GeneralValidate.COORDINATE_REGEX).required(),
}).unknown()

const updateBranchShema = Joi.object({
    name: Joi.string().required(),
    phone: GeneralValidate.phoneSchema.required(),
    address: Joi.string().required(),
    openedAt: GeneralValidate.timeSchema.required(),
    closedAt: GeneralValidate.timeSchema.required(),
    longitude: Joi.string().regex(GeneralValidate.COORDINATE_REGEX).required(),
    latitude: Joi.string().regex(GeneralValidate.COORDINATE_REGEX).required(),
}).unknown()

const addStaffAccountSchema = Joi.object({
    phone: GeneralValidate.phoneSchema.required(),
    name: GeneralValidate.vietnameseSchema.required(),
    branchId: Joi.string().required(),
    gender: GeneralValidate.genderSchema.required(),
    dateOfBirth: Joi.string().isoDate().required(),
    email: Joi.string().email()
}).unknown()

const updateBranchForStaff = Joi.object({
    branchId: Joi.string().required()
}).unknown()

const addNewsSchema = Joi.object({
    title: Joi.string().required(),
    content: Joi.string().required()
}).unknown()

const updateNewsSchema = Joi.object({
    title: Joi.string().required(),
    content: Joi.string().required(),
    coverImage: Joi.string()
}).unknown()

const addCouponSchema = Joi.object({
    couponCode: Joi.string().length(LENGTH_OF_COUPON_CODE),
    type: Joi.valid(...COUPON_TYPE).required(),
    beginAt: Joi.date().iso().required(),
    finishAt: Joi.date().iso().greater(Joi.ref('beginAt')).required(),
    decrease: Joi.number().positive().required(),
    unit: Joi.valid(...COUPON_UNIT).required(),
    appliedScopes: Joi.array().items(...APPLIED_SCOPES).unique().min(1).required(),
    branchIds: Joi.array().items(Joi.string()),
    productPriceIds: Joi.array().items(Joi.string()),
    totalPriceFrom: Joi.number().min(0),
    totalPriceTo: Joi.number().min(Joi.ref('totalPriceFrom'))
}).unknown()

const updateCouponSchema = Joi.object({
    type: Joi.valid(...COUPON_TYPE).required(),
    beginAt: Joi.date().iso().required(),
    finishAt: Joi.date().iso().greater(Joi.ref('beginAt')).required(),
    decrease: Joi.number().positive().required(),
    unit: Joi.valid(...COUPON_UNIT).required(),
    appliedScopes: Joi.array().items(...APPLIED_SCOPES).unique().min(1).required(),
    branchIds: Joi.array().items(Joi.string()),
    productPriceIds: Joi.array().items(Joi.string()),
    totalPriceFrom: Joi.number().min(0),
    totalPriceTo: Joi.alternatives(Joi.number().min(Joi.ref('totalPriceFrom')), null)
}).unknown()

const addPromotionSchema = Joi.object({
    title: Joi.string().required(),
    content: Joi.string().required(),
    couponCode: Joi.string().required()
}).unknown()

const updatePromotionSchema = Joi.object({
    title: Joi.string().required(),
    content: Joi.string().required(),
    coverImage: Joi.string(),
    couponCode: Joi.string().required()
}).unknown()

const addBannerSchema = Joi.object({
    title: Joi.string().required(),
    linkTo: Joi.string().required()
}).unknown()

const updateBannerSchema = Joi.object({
    title: Joi.string().required(),
    linkTo: Joi.string().required(),
    image: Joi.string()
}).unknown()

export default class AdminValidate {

    static updatePassword(req: AdminRequest, res: Response, next: NextFunction) {
        const validationResult = GeneralValidate.updatePasswordSchema.validate(req.body)
        if (validationResult.error) {
            res.status(400).json(validationResult.error.message)
            return
        }

        next()
    }

    static addCategory(req: AdminRequest, res: Response, next: NextFunction) {
        const validationResult = addCategorySchema.validate(req.body)
        if (validationResult.error) {
            res.status(400).json(validationResult.error.message)
            return
        }

        next()
    }

    static updateCategory(req: AdminRequest, res: Response, next: NextFunction) {
        const validationResult = updateCategorySchema.validate(req.body)
        if (validationResult.error) {
            res.status(400).json(validationResult.error.message)
            return
        }

        next()
    }

    static addProductSize(req: AdminRequest, res: Response, next: NextFunction) {
        const validationResult = addProductSizeSchema.validate(req.body)
        if (validationResult.error) {
            res.status(400).json(validationResult.error.message)
            return
        }

        next()
    }

    static updateProductSize(req: AdminRequest, res: Response, next: NextFunction) {
        const validationResult = updateProductSizeSchema.validate(req.body)
        if (validationResult.error) {
            res.status(400).json(validationResult.error.message)
            return
        }

        next()
    }

    static addProduct(req: FormDataRequest<AdminRequest>, res: Response, next: NextFunction) {

        const validationResult = addProductShema.validate(req.fields)
        if (validationResult.error) {
            res.status(400).json(validationResult.error.message)
            return
        }

        if (!req.fields) {
            res.status(400).json('Unknown error')
            return
        }
        const priceInformationJsons = Array.isArray(req.fields.priceInformationJsons)
            ? req.fields.priceInformationJsons
            : [req.fields.priceInformationJsons]

        const priceInformations: InformationToUpdateProductPrice[] = []
        try {
            priceInformations.push(...priceInformationJsons.map(json => {
                return JSON.parse(json)
            }))
        } catch (error) {
            console.log(error)
            res.status(400).json('Not parse product price information jsons')
            return
        }

        const priceInformationsValidateResult =
            Joi.array().min(1).items(informationToCreateProductPriceSchema).validate(priceInformations)

        if (priceInformationsValidateResult.error) {
            res.status(400).json(priceInformationsValidateResult.error.message)
            return
        }

        if (!req.files) {
            res.status(400).json('Require image files for product')
            return
        }

        const coverImageFileValidateResult = GeneralValidate.imageFileSchema.validate(req.files.coverImageFile)

        if (coverImageFileValidateResult.error) {
            res.status(400).json(coverImageFileValidateResult.error.message)
            return
        }

        if (req.files.imageFiles) {
            const imageFiles = Array.isArray(req.files.imageFiles) ? req.files.imageFiles : [req.files.imageFiles]
            const imageFilesValidateResult = Joi.array().items(GeneralValidate.imageFileSchema).validate(imageFiles)

            if (imageFilesValidateResult.error) {
                res.status(400).json(imageFilesValidateResult.error.message)
                return
            }
        }

        next()
    }

    static updateProduct(req: FormDataRequest<AdminRequest>, res: Response, next: NextFunction) {
        const validationResult = updateProductShema.validate(req.fields)
        if (validationResult.error) {
            res.status(400).json(validationResult.error.message)
            return
        }

        if (!req.fields) {
            res.status(400).json('Unknown error')
            return
        }
        const priceInformationJsons = Array.isArray(req.fields.priceInformationJsons)
            ? req.fields.priceInformationJsons
            : [req.fields.priceInformationJsons]

        const priceInformations: InformationToCreateProductPrice[] = []
        try {
            priceInformations.push(...priceInformationJsons.map(json => {
                return JSON.parse(json)
            }))
        } catch (error) {
            console.log(error)
            res.status(400).json('Not parse product price information jsons')
            return
        }

        const priceInformationsValidateResult =
            Joi.array().min(1).items(informationToUpdateProductPriceSchema).validate(priceInformations)

        if (priceInformationsValidateResult.error) {
            res.status(400).json(priceInformationsValidateResult.error.message)
            return
        }

        if (!req.fields.coverImage && (!req.files || !req.files.coverImageFile)) {
            res.status(400).json('Require cover image file for product')
            return
        }

        if (req.files) {

            if (req.files.coverImageFile) {
                const coverImageFileValidateResult = GeneralValidate.imageFileSchema.validate(req.files.coverImageFile)

                if (coverImageFileValidateResult.error) {
                    res.status(400).json(coverImageFileValidateResult.error.message)
                    return
                }
            }

            if (req.files.imageFiles) {
                const imageFiles =
                    Array.isArray(req.files.imageFiles)
                        ? req.files.imageFiles
                        : [req.files.imageFiles]

                const imageFilesValidateResult = Joi.array().items(GeneralValidate.imageFileSchema).validate(imageFiles)

                if (imageFilesValidateResult.error) {
                    res.status(400).json(imageFilesValidateResult.error.message)
                    return
                }
            }
        }

        next()
    }

    static addBranch(req: AdminRequest, res: Response, next: NextFunction) {
        const validationResult = addBranchShema.validate(req.body)
        if (validationResult.error) {
            res.status(400).json(validationResult.error.message)
            return
        }

        next()
    }

    static updateBranch(req: AdminRequest, res: Response, next: NextFunction) {
        const validationResult = updateBranchShema.validate(req.body)
        if (validationResult.error) {
            res.status(400).json(validationResult.error.message)
            return
        }

        next()
    }

    static addStaffAccount(req: FormDataRequest<AdminRequest>, res: Response, next: NextFunction) {

        const validationResult = addStaffAccountSchema.validate(req.fields)
        if (validationResult.error) {
            res.status(400).json(validationResult.error.message)
            return
        }


        if (req.files && req.files.avatarFile) {
            const imageFileValidateResult = GeneralValidate.imageFileSchema.validate(req.files.avatarFile)
            if (imageFileValidateResult.error) {
                res.status(400).json(imageFileValidateResult.error.message)
                return
            }
        }
        next()
    }

    static updateBranchForStaff(req: AdminRequest, res: Response, next: NextFunction) {
        const validationResult = updateBranchForStaff.validate(req.body)
        if (validationResult.error) {
            res.status(400).json(validationResult.error.message)
            return
        }

        next()
    }

    static addNews(req: FormDataRequest<AdminRequest>, res: Response, next: NextFunction) {

        const validationResult = addNewsSchema.validate(req.fields)
        if (validationResult.error) {
            res.status(400).json(validationResult.error.message)
            return
        }

        if (!req.files || !req.files.coverImageFile) {
            res.status(400).json('Require cover image file for banner')
            return
        }

        const imageFileValidateResult = GeneralValidate.imageFileSchema.validate(req.files.coverImageFile)
        if (imageFileValidateResult.error) {
            res.status(400).json(imageFileValidateResult.error.message)
            return
        }

        next()
    }

    static updateNews(req: FormDataRequest<AdminRequest>, res: Response, next: NextFunction) {

        const validationResult = updateNewsSchema.validate(req.fields)
        if (validationResult.error) {
            res.status(400).json(validationResult.error.message)
            return
        }

        if (!req?.fields?.coverImage && (!req.files || !req.files.coverImageFile)) {
            res.status(400).json('Require cover image file for news')
            return
        }

        if (req.files && req.files.coverImageFile) {
            const imageFileValidateResult = GeneralValidate.imageFileSchema.validate(req.files.coverImageFile)
            if (imageFileValidateResult.error) {
                res.status(400).json(imageFileValidateResult.error.message)
                return
            }
        }

        next()
    }

    static addCoupon(req: AdminRequest, res: Response, next: NextFunction) {
        const validationResult = addCouponSchema.validate(req.body)
        if (validationResult.error) {
            res.status(400).json(validationResult.error.message)
            return
        }

        next()
    }

    static updateCoupon(req: AdminRequest, res: Response, next: NextFunction) {
        const validationResult = updateCouponSchema.validate(req.body)
        if (validationResult.error) {
            res.status(400).json(validationResult.error.message)
            return
        }

        next()
    }

    static addPromotion(req: FormDataRequest<AdminRequest>, res: Response, next: NextFunction) {
        const validationResult = addPromotionSchema.validate(req.fields)
        if (validationResult.error) {
            res.status(400).json(validationResult.error.message)
            return
        }

        if (!req.files || !req.files.coverImageFile) {
            res.status(400).json('Require cover image file for promotion')
            return
        }

        const imageFileValidateResult = GeneralValidate.imageFileSchema.validate(req.files.coverImageFile)
        if (imageFileValidateResult.error) {
            res.status(400).json(imageFileValidateResult.error.message)
            return
        }

        next()
    }

    static updatePromotion(req: FormDataRequest<AdminRequest>, res: Response, next: NextFunction) {

        const validationResult = updatePromotionSchema.validate(req.fields)
        if (validationResult.error) {
            res.status(400).json(validationResult.error.message)
            return
        }

        if (!req?.fields?.coverImage && (!req.files || !req.files.coverImageFile)) {
            res.status(400).json('Require cover image file for promotion')
            return
        }

        if (req.files && req.files.coverImageFile) {
            const imageFileValidateResult = GeneralValidate.imageFileSchema.validate(req.files.coverImageFile)
            if (imageFileValidateResult.error) {
                res.status(400).json(imageFileValidateResult.error.message)
                return
            }
        }

        next()
    }

    static addBanner(req: FormDataRequest<AdminRequest>, res: Response, next: NextFunction) {
        const validationResult = addBannerSchema.validate(req.fields)
        if (validationResult.error) {
            res.status(400).json(validationResult.error.message)
            return
        }

        if (!req.files || !req.files.imageFile) {
            res.status(400).json('Require image file for banner')
            return
        }

        const imageFileValidateResult = GeneralValidate.imageFileSchema.validate(req.files.imageFile)
        if (imageFileValidateResult.error) {
            res.status(400).json(imageFileValidateResult.error.message)
            return
        }

        next()
    }

    static updateBanner(req: FormDataRequest<AdminRequest>, res: Response, next: NextFunction) {

        const validationResult = updateBannerSchema.validate(req.fields)
        if (validationResult.error) {
            res.status(400).json(validationResult.error.message)
            return
        }

        if (!req?.fields?.image && (!req.files || !req.files.imageFile)) {
            res.status(400).json('Require image file for promotion')
            return
        }

        if (req.files && req.files.imageFile) {
            const imageFileValidateResult = GeneralValidate.imageFileSchema.validate(req.files.coverImageFile)
            if (imageFileValidateResult.error) {
                res.status(400).json(imageFileValidateResult.error.message)
                return
            }
        }

        next()
    }
}