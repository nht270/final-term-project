import { Router } from 'express'
import * as AdminController from '../controllers/admin.js'
import { validateStoreAdminPermision, validateWebsiteAdminPermision } from '../middlewares/authorization.js'
import { extractFormData } from '../middlewares/formDataExtract.js'
import { preventFirstLogin } from '../middlewares/requiredChangePassword.js'
import AdminValidate from '../validations/admin.js'

const router = Router()

router.get('/information', AdminController.getInformation)
router.put('/password/', AdminValidate.updatePassword, AdminController.updatePassword)

router.post('/category', preventFirstLogin, validateStoreAdminPermision, AdminValidate.addCategory, AdminController.addCategory)
router.put('/category/:categoryId', preventFirstLogin, validateStoreAdminPermision, AdminValidate.updateCategory, AdminController.updateCategory)
router.delete('/category/:categoryId', preventFirstLogin, validateStoreAdminPermision, AdminController.deleteCategory)

router.post('/product-size', preventFirstLogin, validateStoreAdminPermision, AdminValidate.addProductSize, AdminController.addProductSize)
router.put('/product-size/:productSizeId', preventFirstLogin, validateStoreAdminPermision, AdminValidate.updateProductSize, AdminController.updateProductSize)
router.delete('/product-size/:productSizeId', preventFirstLogin, validateStoreAdminPermision, AdminController.deleteProductSize)

router.post('/product', preventFirstLogin, validateStoreAdminPermision, extractFormData, AdminValidate.addProduct, AdminController.addProduct)
router.put('/product/:productId', preventFirstLogin, validateStoreAdminPermision, extractFormData, AdminValidate.updateProduct, AdminController.updateProduct)
router.delete('/product/:productId', preventFirstLogin, validateStoreAdminPermision, AdminController.deleteProduct)

router.post('/branch/', preventFirstLogin, validateStoreAdminPermision, AdminValidate.addBranch, AdminController.addBranch)
router.put('/branch/:branchId', preventFirstLogin, validateStoreAdminPermision, AdminValidate.updateBranch, AdminController.updateBranch)
router.delete('/branch/:branchId', preventFirstLogin, validateStoreAdminPermision, AdminController.deleteBranch)

router.get('/staff-account', preventFirstLogin, validateWebsiteAdminPermision, AdminController.getStaffAccounts)
router.post('/staff-account', preventFirstLogin, validateWebsiteAdminPermision, extractFormData, AdminValidate.addStaffAccount, AdminController.addStaffAccount)
router.patch('/staff-account/:staffAccountId/reset-password/', preventFirstLogin, validateWebsiteAdminPermision, AdminController.resetStaffAccountPassword)
router.patch('/staff-account/:staffAccountId/branch/', preventFirstLogin, validateWebsiteAdminPermision, AdminController.updateBranchForStaff)
router.delete('/staff-account/:staffAccountId', preventFirstLogin, validateWebsiteAdminPermision, AdminController.deleteStaffAccount)

router.post('/news', preventFirstLogin, validateWebsiteAdminPermision, extractFormData, AdminValidate.addNews, AdminController.addNews)
router.put('/news/:newsId', preventFirstLogin, validateWebsiteAdminPermision, extractFormData, AdminValidate.updateNews, AdminController.updateNews)
router.delete('/news/:newsId', preventFirstLogin, validateWebsiteAdminPermision, AdminController.deleteNews)

router.post('/coupon', preventFirstLogin, validateWebsiteAdminPermision, AdminValidate.addCoupon, AdminController.addCoupon)
router.put('/coupon/:couponCode', preventFirstLogin, validateWebsiteAdminPermision, AdminValidate.updateCoupon, AdminController.updateCoupon)
router.delete('/coupon/:couponCode', preventFirstLogin, validateWebsiteAdminPermision, AdminController.deleteCoupon)

router.post('/promotion', preventFirstLogin, validateWebsiteAdminPermision, extractFormData, AdminValidate.addPromotion, AdminController.addPromotion)
router.put('/promotion/:promotionId', preventFirstLogin, validateWebsiteAdminPermision, extractFormData, AdminValidate.updatePromotion, AdminController.updatePromotion)
router.delete('/promotion/:promotionId', preventFirstLogin, validateWebsiteAdminPermision, AdminController.deletePromotion)

router.post('/banner', preventFirstLogin, validateWebsiteAdminPermision, extractFormData, AdminValidate.addBanner, AdminController.addBanner)
router.put('/banner/:bannerId', preventFirstLogin, validateWebsiteAdminPermision, extractFormData, AdminController.updateBanner, AdminController.updateBanner)
router.delete('/banner/:bannerId', preventFirstLogin, validateWebsiteAdminPermision, AdminController.deleteBanner)

router.get('/user-account', preventFirstLogin, validateWebsiteAdminPermision, AdminController.getUserAccounts)
router.patch('/user-account/:userAccountId/lock', preventFirstLogin, validateWebsiteAdminPermision, AdminController.lockUserAccount)
router.patch('/user-account/:userAccountId/unlock', preventFirstLogin, validateWebsiteAdminPermision, AdminController.unlockUserAccount)

router.get('/rating', preventFirstLogin, validateWebsiteAdminPermision, AdminController.getAllRatings)
router.patch('/rating/:userAccountId/:productId/lock', preventFirstLogin, validateWebsiteAdminPermision, AdminController.lockRating)
router.patch('/rating/:userAccountId/:productId/unlock', preventFirstLogin, validateWebsiteAdminPermision, AdminController.unlockRating)

export default router