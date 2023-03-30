import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import MainLayout from './compoments/MainLayout'
import WebsiteWrapper from './compoments/WebsiteWrapper'
import AdminAccountManagement from './pages/admin/AccountManagement'
import BannerManagement from './pages/admin/BannerManagement'
import AddBannerPanel from './pages/admin/BannerManagement/AddBannerPanel'
import BannerViewer from './pages/admin/BannerManagement/BannerViewer'
import EditBannerPanel from './pages/admin/BannerManagement/EditBannerPanel'
import BranchManagement from './pages/admin/BranchManagement'
import AddBranchPanel from './pages/admin/BranchManagement/AddBranchPanel'
import BranchViewer from './pages/admin/BranchManagement/BranchViewer'
import EditBranchPanel from './pages/admin/BranchManagement/EditBranchPanel'
import AdminChangePassword from './pages/admin/ChangePassword'
import AdminDashboard from './pages/admin/Dashboard'
import AdminLayout from './pages/admin/Layout'
import NewsManagement from './pages/admin/NewsManagement'
import AddNewsPanel from './pages/admin/NewsManagement/AddNewsPanel'
import EditNewsPanel from './pages/admin/NewsManagement/EditNewsPanel'
import NewsViewer from './pages/admin/NewsManagement/NewsViewer'
import ProductManagement from './pages/admin/ProductManagement'
import AddProductPanel from './pages/admin/ProductManagement/AddProductPanel'
import CategorySector from './pages/admin/ProductManagement/CategorySector'
import EditProductPanel from './pages/admin/ProductManagement/EditProductPanel'
import ProductSector from './pages/admin/ProductManagement/ProductSector'
import ProductViewer from './pages/admin/ProductManagement/ProductViewer'
import SizeSector from './pages/admin/ProductManagement/SizeSector'
import PromotionManagement from './pages/admin/PromotionManagement'
import AddCouponPanel from './pages/admin/PromotionManagement/AddCouponPanel'
import AddPromotionPanel from './pages/admin/PromotionManagement/AddPromotionPanel'
import CouponViewer from './pages/admin/PromotionManagement/CouponViewer'
import EditCouponPanel from './pages/admin/PromotionManagement/EditCouponPanel'
import EditPromotionPanel from './pages/admin/PromotionManagement/EditPromotionPanel'
import PromotionViewer from './pages/admin/PromotionManagement/PromotionViewer'
import RatingManagement from './pages/admin/RatingManagement'
import RatingViewer from './pages/admin/RatingManagement/RatingViewer'
import AdminSignIn from './pages/admin/SignIn'
import StaffAccountManagement from './pages/admin/StaffAccountManagement'
import AddStaffAccountPanel from './pages/admin/StaffAccountManagement/AddStaffAccountPanel'
import StaffAccoutViewer from './pages/admin/StaffAccountManagement/StaffAccountViewer'
import UserAccountManagement from './pages/admin/UserAccountManagement'
import UserAccountViewer from './pages/admin/UserAccountManagement/UserAccountViewer'
import Category from './pages/common/Category'
import FindOrder from './pages/common/FindOrder'
import Home from './pages/common/Home'
import News from './pages/common/News'
import NewsDetail from './pages/common/NewsDetail'
import Order from './pages/common/Order'
import OrderDetail from './pages/common/OrderDetail'
import ProductDetail from './pages/common/ProductDetail'
import Promotion from './pages/common/Promotion'
import PromotionDetail from './pages/common/PromotionDetail'
import Search from './pages/common/Search'
import ShoppingCart from './pages/common/ShoppingCart'
import StaffAccount from './pages/staff/Account'
import StaffChangePassword from './pages/staff/ChangePassword'
import StaffLayout from './pages/staff/Layout'
import OrderDetailOfStaff from './pages/staff/OrderManagement/OrderDetail'
import OrderViewer from './pages/staff/OrderManagement/OrderViewer'
import StaffSignIn from './pages/staff/SignIn'
import AnalyzeAndStatis from './pages/staff/StatisOrder'
import UserAccount from './pages/user/Account'
import UserChangePassword from './pages/user/ChangePassword'
import ForgotPassword from './pages/user/ForgotPassword'
import UserLayout from './pages/user/Layout'
import Notification from './pages/user/Notification'
import OrderDetailOfUser from './pages/user/OrderHistory/OrderDetail'
import OrderHistoryViewer from './pages/user/OrderHistory/OrderHistoryViewer'
import UserResetPassword from './pages/user/ResetPassword'
import UserSignIn from './pages/user/SignIn'
import UserSignUp from './pages/user/SignUp'
import VerifyUser from './pages/user/Verify'
import MainProvider from './store/Provider'
import './App.scss'
import { useMemo } from 'react'
import NotFound from './pages/common/NotFound'

function App() {

    const location = useLocation()
    const state = location.state
    const queryClient = useMemo(() => new QueryClient(), [])

    return (
        <MainProvider>
            <QueryClientProvider client={queryClient}>
                <WebsiteWrapper>
                    <Routes location={state?.backgroundLocation || location}>
                        <Route path='/' element={<MainLayout />}>
                            <Route index element={<Home />} />
                            <Route path='home' element={<Home />} />
                            <Route path='cart' element={<ShoppingCart />} />
                            <Route path='category/:categoryId' element={<Category />} />
                            <Route path='search' element={<Search />} />
                            <Route path='product/:productId' element={<ProductDetail />} />
                            <Route path='verify/:token' element={<VerifyUser />} />
                            <Route path='order' element={<Order />} />
                            <Route path='news'  >
                                <Route index element={<News />} />
                                <Route path=':newsId' element={<NewsDetail />} />
                            </Route>
                            <Route path='promotion'>
                                <Route index element={<Promotion />} />
                                <Route path=':promotionId' element={<PromotionDetail />} />
                            </Route>
                            <Route path='find-order' element={<FindOrder />}>
                                <Route path=':orderId' element={<OrderDetail />} />
                            </Route>
                        </Route>
                        <Route path='/sign-in' element={<UserSignIn />} />
                        <Route path='/sign-in/forgot' element={<ForgotPassword />} />
                        <Route path='/sign-in/reset/:token' element={<UserResetPassword />} />
                        <Route path='/sign-up' element={<UserSignUp />} />
                        <Route path='/notifications' element={<Notification />} />
                        <Route path='/admin' element={<AdminLayout />}>
                            <Route index element={<AdminDashboard />} />
                            <Route path='product-management' element={<ProductManagement />} >
                                <Route index element={<Navigate to='product' />} />
                                <Route path='product' element={<ProductSector />}>
                                    <Route index element={<ProductViewer />} />
                                    <Route path='add' element={<AddProductPanel />} />
                                    <Route path='edit/:productId' element={<EditProductPanel />} />
                                </Route>
                                <Route path='category' element={<CategorySector />} />
                                <Route path='size' element={<SizeSector />} />
                            </Route>
                            <Route path='branch-management' element={<BranchManagement />} >
                                <Route index element={<BranchViewer />} />
                                <Route path='add' element={<AddBranchPanel />} />
                                <Route path='edit/:branchId' element={<EditBranchPanel />} />
                            </Route>
                            <Route path='account-management' element={<AdminAccountManagement />} />
                            <Route path='staff-account-management' element={<StaffAccountManagement />}>
                                <Route index element={<StaffAccoutViewer />} />
                                <Route path='add' element={<AddStaffAccountPanel />} />
                            </Route>
                            <Route path='news-management' element={<NewsManagement />}>
                                <Route index element={<NewsViewer />} />
                                <Route path='add' element={<AddNewsPanel />} />
                                <Route path='edit/:newsId' element={<EditNewsPanel />} />
                            </Route>
                            <Route path='promotion-management' element={<PromotionManagement />}>
                                <Route index element={<Navigate to='promotion' />} />
                                <Route path='promotion'>
                                    <Route index element={<PromotionViewer />} />
                                    <Route path='add' element={<AddPromotionPanel />} />
                                    <Route path='edit/:promotionId' element={<EditPromotionPanel />} />
                                </Route>
                                <Route path='coupon' >
                                    <Route index element={<CouponViewer />} />
                                    <Route path='add' element={<AddCouponPanel />} />
                                    <Route path='edit/:couponCode' element={<EditCouponPanel />} />
                                </Route>
                            </Route>
                            <Route path='banner-management' element={<BannerManagement />}>
                                <Route index element={<BannerViewer />} />
                                <Route path='add' element={<AddBannerPanel />} />
                                <Route path='edit/:bannerId' element={<EditBannerPanel />} />
                            </Route>
                            <Route path='user-account-management' element={<UserAccountManagement />}>
                                <Route index element={<UserAccountViewer />} />
                            </Route>
                            <Route path='rating-management' element={<RatingManagement />}>
                                <Route index element={<RatingViewer />} />
                            </Route>
                        </Route>
                        <Route path='/admin/sign-in' element={<AdminSignIn />} />
                        <Route path='/admin/change-password' element={<AdminChangePassword />} />
                        <Route path='/staff' element={<StaffLayout />} >
                            <Route index element={<Navigate to='order-management' />} />
                            <Route path='account-management' element={<StaffAccount />} />
                            <Route path='order-management' element={<OrderViewer />} />
                            <Route path='order-management/:orderId' element={<OrderDetailOfStaff />} />
                            <Route path='analyze-and-statis' element={<AnalyzeAndStatis />} />
                        </Route>
                        <Route path='/staff/sign-in' element={<StaffSignIn />} />
                        <Route path='/staff/change-password' element={<StaffChangePassword />} />
                        <Route path='/user' element={<UserLayout />}>
                            <Route index element={<Navigate to='account' />} />
                            <Route path='account' element={<UserAccount />} />
                            <Route path='order-history'>
                                <Route index element={<OrderHistoryViewer />} />
                                <Route path=':orderId' element={<OrderDetailOfUser />} />
                            </Route>
                        </Route>
                        <Route path='/user/change-password' element={<UserChangePassword />} />
                        <Route path='*' element={<NotFound />} />
                    </Routes>
                    {
                        state?.backgroundLocation &&
                        <Routes>
                            <Route path="/sign-in" element={<UserSignIn form='popup' />} />
                            <Route path="/sign-up" element={<UserSignUp form='popup' />} />
                        </Routes>
                    }
                </WebsiteWrapper>
            </QueryClientProvider>
        </MainProvider>
    )
}

export default App