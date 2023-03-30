import { useQuery } from '@tanstack/react-query'
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import '../../../assets/scss/Dashboard.scss'
import defaultAvatar from '../../../assets/img/avatar.png'
import Dropdown from '../../../compoments/Dropdown'
import * as Icon from '../../../compoments/Icon'
import useStore from '../../../hooks/useStore'
import QueryKeyPrefix from '../../../configures/queryKeyPrefix'
import * as AdminService from '../../../services/admin'
import * as LocalStorageUtil from '../../../utils/localStorage'
import useAutoSignOut from '../../../hooks/useAutoSignOut'
import BrandLogo from '../../../compoments/BrandLogo'
import LoadingIcon from '../../../compoments/Icon/LoadingIcon'
import NoPermission from '../../common/NoPermission'

function AdminLayout() {
    const [globalState, dispatch] = useStore()
    const location = useLocation()
    const autoSignOut = useAutoSignOut()
    const adminInformationQuery = useQuery(
        [QueryKeyPrefix.GET_ADMIN_INFORMATION_PREFIX],
        AdminService.getInformation,
        {
            enabled: globalState.isSignIn && globalState.role === 'admin',
            useErrorBoundary: (error) => {
                autoSignOut(error as Error)
                return false
            }
        }
    )

    function signOutHandler() {
        LocalStorageUtil.clearToken()
        LocalStorageUtil.restoreDefaultRole()
        dispatch({ type: 'signout' })
    }

    if (!globalState.isSignIn) {
        return <Navigate to={`/admin/sign-in?continue=${encodeURIComponent(location.pathname)}`} />
    }

    if (globalState.role !== 'admin') {
        return <NoPermission />
    }

    if (adminInformationQuery.isError) {
        return <Navigate to={`..`} />
    }

    if (adminInformationQuery.data?.firstLogin) {
        return <Navigate to={`/admin/change-password?continue=${encodeURIComponent(location.pathname)}`} />
    }

    return (
        <div className="dashboard">
            <div className="dashboard__header">
                <Link to="/home">
                    <BrandLogo />
                </Link>
                <div className="account-menu">
                    {
                        adminInformationQuery.isFetched && adminInformationQuery.data
                            ? <Dropdown
                                label={
                                    <div className="account-menu__label">
                                        <>
                                            <img src={defaultAvatar} alt={adminInformationQuery.data.username} />
                                            <div>
                                                <span>{adminInformationQuery.data.username}</span>
                                                <div className="account-menu__role">Quản trị viên</div>
                                            </div>
                                        </>
                                    </div>
                                }
                                content={
                                    <div className="account-menu__content">
                                        <div className="menu-item" onClick={signOutHandler}>
                                            Đăng xuất<Icon.SignOut />
                                        </div>
                                    </div>
                                }
                                showMenuWhenHover
                            />
                            : <LoadingIcon />
                    }
                </div>
            </div>
            {
                adminInformationQuery.isFetched && adminInformationQuery.data &&
                (
                    adminInformationQuery.data.type === 'website' ?
                        <>
                            <WebsiteAdminNav />
                            <WebsiteAdminSideBar />
                        </>
                        :
                        <>
                            <StoreAdminNav />
                            <StoreAdminSideBar />
                        </>
                )
            }
            <div className="dashboard__content">
                <Outlet />
            </div>
        </div>
    )
}

function WebsiteAdminNav() {
    return (
        <nav>
            <ul>
                <li>
                    <NavLink to="/admin/staff-account-management" className={({ isActive }) => isActive ? 'selected' : ''}>
                        Tài khoản nhân viên
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/admin/user-account-management" className={({ isActive }) => isActive ? 'selected' : ''}>
                        Tài khoản người dùng
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/admin/promotion-management" className={({ isActive }) => isActive ? 'selected' : ''}>
                        Khuyến mãi
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/admin/news-management" className={({ isActive }) => isActive ? 'selected' : ''}>
                        Tin tức
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/admin/rating-management" className={({ isActive }) => isActive ? 'selected' : ''}>
                        Đánh giá
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/admin/banner-management" className={({ isActive }) => isActive ? 'selected' : ''}>
                        Banner
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/admin/account-management" className={({ isActive }) => isActive ? 'selected' : ''}>
                        Tài khoản
                    </NavLink>
                </li>
            </ul>
        </nav>
    )
}

function WebsiteAdminSideBar() {
    return (
        <div className="dashboard__side-bar">
            <div className="side-bar-item">
                <NavLink to="/admin/staff-account-management" className={({ isActive }) => isActive ? 'selected' : ''}>
                    <Icon.Profile /><span>Tài khoản nhân viên</span>
                </NavLink>
            </div>
            <div className="side-bar-item">
                <NavLink to="/admin/user-account-management" className={({ isActive }) => isActive ? 'selected' : ''}>
                    <Icon.Profile /><span>Tài khoản người dùng</span>
                </NavLink>
            </div>
            <div className="side-bar-item">
                <NavLink to="/admin/promotion-management" className={({ isActive }) => isActive ? 'selected' : ''}>
                    <Icon.TicketDiscount /><span>Khuyến mãi</span>
                </NavLink>
            </div>
            <div className="side-bar-item">
                <NavLink to="/admin/news-management" className={({ isActive }) => isActive ? 'selected' : ''}>
                    <Icon.Rss /> <span>Tin tức</span>
                </NavLink>
            </div>
            <div className="side-bar-item">
                <NavLink to="/admin/rating-management" className={({ isActive }) => isActive ? 'selected' : ''}>
                    <Icon.Star /><span>Đánh giá</span>
                </NavLink>
            </div>
            <div className="side-bar-item">
                <NavLink to="/admin/banner-management" className={({ isActive }) => isActive ? 'selected' : ''}>
                    <Icon.Image /> <span>Banner</span>
                </NavLink>
            </div>
            <div className="side-bar-item">
                <NavLink to="/admin/account-management" className={({ isActive }) => isActive ? 'selected' : ''}>
                    <Icon.User /> <span>Tài khoản</span>
                </NavLink>
            </div>
        </div>
    )
}

function StoreAdminNav() {
    return (
        <nav>
            <ul>
                <li>
                    <NavLink to="/admin/product-management" className={({ isActive }) => isActive ? 'selected' : ''}>
                        Sản phẩm
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/admin/branch-management" className={({ isActive }) => isActive ? 'selected' : ''}>
                        Thông tin cửa hàng
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/admin/account-management" className={({ isActive }) => isActive ? 'selected' : ''}>
                        Tài khoản
                    </NavLink>
                </li>
            </ul>
        </nav>
    )
}

function StoreAdminSideBar() {
    return (
        <div className="dashboard__side-bar">
            <div className="side-bar-item">
                <NavLink to="/admin/product-management" className={({ isActive }) => isActive ? 'selected' : ''}>
                    <Icon.Coffee /><span>Sản phẩm</span>
                </NavLink>
            </div>
            <div className="side-bar-item">
                <NavLink to="/admin/branch-management" className={({ isActive }) => isActive ? 'selected' : ''}>
                    <Icon.Shop /> <span>Thông tin cửa hàng</span>
                </NavLink>
            </div>
            <div className="side-bar-item">
                <NavLink to="/admin/account-management" className={({ isActive }) => isActive ? 'selected' : ''}>
                    <Icon.User /><span>Tài khoản</span>
                </NavLink>
            </div>
        </div>
    )
}

export default AdminLayout