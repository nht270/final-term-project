import Joi, { ErrorReport } from 'joi'
import { APPLIED_SCOPES, COUPON_TYPE, COUPON_UNIT } from '../services/coupon'
import { KB, MB, NumberFormatter } from './format'

export type InvalidDescribe = Record<string, string>

export interface ValidateResult {
    valid: boolean,
    description: string
}

interface ImageResolution {
    height: number,
    width: number
}

const LENGTH_OF_COUPON_CODE = 8
const MIN_LENGTH_FOR_VALID_PASSWORD = 8
const MAX_LENGTH_FOR_VALID_PASSWORD = 16
const PASSWORD_REGEX = /^([a-zA-Z]+\d+|\d+[a-zA-Z]+)+[a-zA-Z0-9]*$/
const VIETNAMESE_REGEX = /^(\p{Script_Extensions=Latin}+?[ ']\p{Script_Extensions=Latin}*)+$/u
const PRODUCT_STATUS_REGEX = /^hide|show$/
const IMAGE_MIMETYPE_REGEX = /^image(\/.*)*$/
const COORDINATE_REGEX = /^\d+(.\d+)?$/
const PHONE_REGEX = /^0\d{9,10}$/
const GENDER_REGEX = /^male|female|other$/
const MIN_IMAGE_SIZE = 20 * KB
const MAX_IMAGE_SIZE = 1 * MB
const MIN_IMGAE_RESOLUTION = 100
const MAX_IMGAE_RESOLUTION = 5000
const TIME_REGEX = /^(2[0-3]|[0-1][0-9]):(60|[0-5][0-9])(:(60|[0-5][0-9]))?$/

// basic shema

export const genderSchema = Joi.string().regex(GENDER_REGEX)

export const phoneSchema = Joi.string()
    .regex(PHONE_REGEX)
    .messages({
        'string.pattern.base': 'Số điện thoại phải bắt đầu bằng 0 và gồm các kí tự 0-9',
        'string.empty': 'Số điện thoại không được để trống'
    })

export const vietnameseSchema = Joi.string().regex(VIETNAMESE_REGEX)

export const passwordSchema = Joi.string()
    .min(MIN_LENGTH_FOR_VALID_PASSWORD)
    .max(MAX_LENGTH_FOR_VALID_PASSWORD)
    .pattern(PASSWORD_REGEX)
    .required()
    .messages({
        'string.empty': 'Mật khẩu không được để trống',
        'string.pattern.base': 'Mật khẩu phải gồm các ký tự a - z, A - Z , 0 - 9',
        'string.min': `Mật khẩu phải có ít nhất ${MIN_LENGTH_FOR_VALID_PASSWORD} kí tự`,
        'string.max': `Mật khẩu chứ tối đa ${MAX_LENGTH_FOR_VALID_PASSWORD} kí tự`
    })

export const emailSchema = Joi.string()
    .email({ tlds: { allow: false } })
    .messages({
        'string.email': 'Email không hợp lệ',
        'string.empty': 'Email không được để trống'
    })

export const imageResolutionSchema = Joi
    .number()
    .min(MIN_IMGAE_RESOLUTION)
    .max(MAX_IMGAE_RESOLUTION)
    .messages({
        'number.min': `Kích cỡ ảnh tối thiểu ${MIN_IMGAE_RESOLUTION}px`,
        'number.max': `Kích cỡ ảnh tối đa ${MAX_IMGAE_RESOLUTION}px`,
        'number.empty': 'Image resolution not found'
    })

export const imageMimetypeSchema = Joi.string()
    .pattern(IMAGE_MIMETYPE_REGEX)
    .messages({
        'string.empty': 'File mimetype not found',
        'string.pattern.base': 'Định dạng hình ảnh không hợp lệ'
    })

export const imageSizeSchema = Joi.number()
    .min(MIN_IMAGE_SIZE)
    .max(MAX_IMAGE_SIZE)
    .messages({
        'number.min': `Dung lượng tệp tối thiểu ${NumberFormatter.capacity(MIN_IMAGE_SIZE)}`,
        'number.max': `Dung lượng tệp tối đa ${NumberFormatter.capacity(MAX_IMAGE_SIZE)}`,
        'number.empty': `File size not found`
    })

export const timeSchema = Joi.string().regex(TIME_REGEX)

export const productStatusSchema = Joi.string().regex(PRODUCT_STATUS_REGEX)

// mixed schema
export const imageFileShema = Joi.object({
    type: imageMimetypeSchema.required(),
    size: imageSizeSchema.required(),
    heigh: imageResolutionSchema.required(),
    width: imageResolutionSchema.required()
}).unknown()

export const userSignInSchema = Joi.object({
    email: Joi.string().required().messages({
        'string.empty': 'Email không được để trống'
    }),
    password: passwordSchema
}).unknown()

export const basicInfoForUserSignUpSchema = Joi.object({
    name: vietnameseSchema.required().messages({
        'string.empty': 'Họ tên không dược để trống',
        'string.pattern.base': 'Họ tên không hợp lệ'
    }),
    email: emailSchema.required().messages({
        'string.empty': 'Email không được để trống'
    }),
    password: passwordSchema.required().messages({
        'string.empty': 'Mật khẩu không được để trống'
    }),
    repeatPassword: passwordSchema.equal(Joi.ref('password')).required().messages({
        'string.empty': 'Mật khẩu nhập lại không được để trống',
        'any.only': 'Mật khẩu nhập lại không khớp'
    })
}).unknown()

export const additionalInfoForUserSignUpSchema = Joi.object({
    address: Joi.string(),
    phone: phoneSchema.allow(''),
    gender: genderSchema.required(),
    dateOfBirth: Joi.date().required(),
    longitude: Joi.string().regex(COORDINATE_REGEX).when('address', { is: Joi.exist(), then: Joi.required() }),
    latitude: Joi.string().regex(COORDINATE_REGEX).when('address', { is: Joi.exist(), then: Joi.required() }),
}).unknown()

export const staffSignInSchema = Joi.object({
    phone: phoneSchema.required(),
    password: passwordSchema
}).unknown()

export const adminSignInSchema = Joi.object({
    username: Joi.string().required().messages({
        'string.empty': 'Tên đăng nhập không được để trống'
    }),
    password: passwordSchema
}).unknown()

export const changePasswordSchema = Joi.object({
    oldPassword: passwordSchema,
    newPassword: passwordSchema.not(Joi.ref('oldPassword')).messages({
        'any.invalid': 'Mật khẩu mới phải khác mật khẩu cũ',
    }),
    repeatNewPassword: passwordSchema.equal(Joi.ref('newPassword')).messages({
        'any.only': 'Mật khẩu nhập lại phải khớp với mật khẩu mới'
    })
}).unknown()

export const updateStaffAccountSchema = Joi.object({
    phone: phoneSchema.required(),
    name: vietnameseSchema.required().messages({
        'string.empty': 'Họ tên không dược để trống',
        'string.pattern.base': 'Họ tên không hợp lệ'
    }),
    gender: genderSchema.required(),
    dateOfBirth: Joi.string().isoDate().required(),
    email: emailSchema
}).unknown()

export const updateUserAccountSchema = Joi.object({
    name: vietnameseSchema.required().messages({
        'string.empty': 'Họ tên không dược để trống',
        'string.pattern.base': 'Họ tên không hợp lệ'
    }),
    email: emailSchema.required(),
    gender: genderSchema.required(),
    dateOfBirth: Joi.string().isoDate().required(),
    phone: phoneSchema,
    address: Joi.string(),
    longitude: Joi.string().regex(COORDINATE_REGEX).when('address', { is: Joi.exist(), then: Joi.required() }),
    latitude: Joi.string().regex(COORDINATE_REGEX).when('address', { is: Joi.exist(), then: Joi.required() })
}).unknown()

export const resetPasswordSchema = Joi.object({
    newPassword: passwordSchema,
    repeatNewPassword: passwordSchema.equal(Joi.ref('newPassword')).messages({
        'any.only': 'Mật khẩu nhập lại phải khớp với mật khẩu mới'
    })
})

export const addBranchSchema = Joi.object({
    name: Joi.string().required().messages({
        'string.empty': 'Tên chi nhánh không được để trống'
    }),
    phone: phoneSchema.required(),
    address: Joi.string().required().messages({
        'string.empty': 'Địa chỉ không được để trống'
    }),
    longitude: Joi.string().regex(COORDINATE_REGEX).required(),
    latitude: Joi.string().regex(COORDINATE_REGEX).required(),
    openedAt: timeSchema.required(),
    closedAt: timeSchema.required()
}).unknown()

export const updateBranchChema = addBranchSchema

export const addBannerSchema = Joi.object({
    title: Joi.string().required().messages({
        'string.empty': 'Tiêu đề không được để trống'
    }),
    linkTo: Joi.string().required().messages({
        'string.empty': 'Liên kết trong banner không được để trống'
    })
}).unknown()

export const updateBannerSchema = addBannerSchema

export const addNewsSchema = Joi.object({
    title: Joi.string().required().messages({
        'string.empty': 'Tiêu đề không được để trống'
    }),
    content: Joi.string().required().messages({
        'string.empty': 'Nội dung không được để trống'
    }),
}).unknown()

export const updateNewsSchema = addNewsSchema

export const addCouponSchema = Joi.object({
    couponCode: Joi.string().length(LENGTH_OF_COUPON_CODE).required().messages({
        'string.empty': 'Mã coupon không được để trống',
        'string.length': 'Mã coupon phải có 8 ký tự'
    }),
    type: Joi.valid(...COUPON_TYPE).required(),
    beginAt: Joi.date().iso().required(),
    finishAt: Joi.date().iso().greater(Joi.ref('beginAt')).required().messages({
        'date.greater': 'Ngày kết thúc phải lớn hơn ngày bắt đầu'
    }),
    decrease: Joi.number().positive().required().messages({
        'number.positive': 'Mức giảm phải là số lớn hơn 0',
        'number.base': 'Mức giảm phải là số'
    }),
    unit: Joi.valid(...COUPON_UNIT).required(),
    appliedScopes: Joi.array().items(...APPLIED_SCOPES).unique().min(1).required().messages({
        'array.min': 'Phải chọn ít nhất 1 mục phạm vị áp dụng'
    }),
    branchIds: Joi.array().items(Joi.string()),
    productPriceIds: Joi.array().items(Joi.string()),
    totalPriceFrom: Joi.number().min(0).messages({
        'number.base': 'Mức giá không được để trống'
    }),
    totalPriceTo: Joi.number().min(Joi.ref('totalPriceFrom')).messages({
        'number.min': 'Khoản giá áp dụng không hợp lệ',
        'number.base': 'Mức giá không được để trống'
    })
}).unknown()

export const updateCouponShema = Joi.object({
    type: Joi.valid(...COUPON_TYPE).required(),
    beginAt: Joi.date().iso().required(),
    finishAt: Joi.date().iso().greater(Joi.ref('beginAt')).required().messages({
        'date.greater': 'Ngày kết thúc phải lớn hơn ngày bắt đầu'
    }),
    decrease: Joi.number().positive().required().messages({
        'number.positive': 'Mức giảm phải là số lớn hơn 0',
        'number.base': 'Mức giảm phải là số'
    }),
    unit: Joi.valid(...COUPON_UNIT).required(),
    appliedScopes: Joi.array().items(...APPLIED_SCOPES).unique().min(1).required().messages({
        'array.min': 'Phải chọn ít nhất 1 mục phạm vị áp dụng'
    }),
    branchIds: Joi.array().items(Joi.string()),
    productPriceIds: Joi.array().items(Joi.string()),
    totalPriceFrom: Joi.number().min(0).messages({
        'number.base': 'Mức giá không được để trống'
    }),
    totalPriceTo: Joi.number().min(Joi.ref('totalPriceFrom')).messages({
        'number.min': 'Khoản giá áp dụng không hợp lệ',
        'number.base': 'Mức giá không được để trống'
    })
}).unknown()

export const addPromotionSchema = Joi.object({
    title: Joi.string().required().messages({
        'string.empty': 'Tiêu đề không được để trống'
    }),
    content: Joi.string().required().messages({
        'string.empty': 'Nội dung không được để trống'
    }),
    couponCode: Joi.string().required().messages({
        'string.empty': 'Mã coupon không được để trống'
    })
}).unknown()

export const updatePromotionSchema = addPromotionSchema

export const addStaffAccountSchema = Joi.object({
    name: vietnameseSchema.required().messages({
        'string.empty': 'Họ tên không dược để trống',
        'string.pattern.base': 'Họ tên không hợp lệ'
    }),
    branchId: Joi.string().required(),
    dateOfBirth: Joi.date().iso().required(),
    gender: genderSchema.required(),
    phone: phoneSchema.required(),
    email: emailSchema.allow('')
}).unknown()

export const informationToCreateProductPriceSchema = Joi.object({
    productSizeId: Joi.string().required(),
    price: Joi.number().positive().required()
}).unknown()

export const addProductShema = Joi.object({
    name: Joi.string().required().messages({
        'string.empty': 'Tên sản phẩm không được để trống'
    }),
    description: Joi.string().required().messages({
        'string.empty': 'Miêu tả sản phẩm không được để trống'
    }),
    categoryId: Joi.string().required(),
    status: productStatusSchema.required(),
    priceInformations: Joi.array().min(1).items(informationToCreateProductPriceSchema.required()).messages({
        'array.includesRequiredUnknowns': 'Sản phẩm phải có giá'
    })
}).unknown()

export const informationToUpdateProductPriceSchema = Joi.object({
    productSizeId: Joi.string().required(),
    price: Joi.number().positive().required(),
    productPriceId: Joi.string().allow('')
}).unknown()


export const updateProductShema = Joi.object({

    name: Joi.string().required().messages({
        'string.empty': 'Tên sản phẩm không được để trống'
    }),
    description: Joi.string().required().messages({
        'string.empty': 'Miêu tả sản phẩm không được để trống'
    }),
    categoryId: Joi.string().required(),
    status: productStatusSchema.required(),
    priceInformations: Joi.array().min(1).items(informationToUpdateProductPriceSchema.required()).messages({
        'array.includesRequiredUnknowns': 'Sản phẩm phải có giá'
    }),
}).unknown()

export const customerOfOrderSchema = Joi.object({
    customerName: vietnameseSchema.required().messages({
        'string.empty': 'Họ tên không dược để trống',
        'string.pattern.base': 'Họ tên không hợp lệ'
    }),
    phone: phoneSchema.required(),
    email: emailSchema.allow('')
}).unknown()