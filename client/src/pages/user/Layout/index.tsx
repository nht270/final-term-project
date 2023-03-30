import { AdvancedImage } from '@cloudinary/react'
import { useQuery } from '@tanstack/react-query'
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import defaultAvatar from '../../../assets/img/avatar.png'
import BrandLogo from '../../../compoments/BrandLogo'
import Dropdown from '../../../compoments/Dropdown'
import * as Icon from '../../../compoments/Icon'
import LoadingIcon from '../../../compoments/Icon/LoadingIcon'
import QueryKeyPrefix from '../../../configures/queryKeyPrefix'
import useAutoSignOut from '../../../hooks/useAutoSignOut'
import useStore from '../../../hooks/useStore'
import { createCloudinaryThumb } from '../../../services/image'
import * as UserService from '../../../services/user'
import * as LocalStorageUtil from '../../../utils/localStorage'
import '../../../assets/scss/Dashboard.scss'
import NoPermission from '../../common/NoPermission'

function UserLayout() {

    const [globalState, dispatch] = useStore()
    const location = useLocation()
    const autoSignOut = useAutoSignOut()
    const userInformationQuery = useQuery(
        [QueryKeyPrefix.GET_USER_INFORMATION_PREFIX],
        UserService.getInformation,
        {
            enabled: globalState.isSignIn && globalState.role === 'user',
            useErrorBoundary: (error) => {
                autoSignOut(error as Error)
                return false
            },
        }
    )

    function signOutHandler() {
        LocalStorageUtil.clearToken()
        LocalStorageUtil.restoreDefaultRole()
        dispatch({ type: 'signout' })
    }

    if (!globalState.isSignIn) {
        const signInUrl = `/sign-in?continue=${encodeURIComponent(location.pathname)}`
        return <Navigate to={signInUrl} />
    }

    if (globalState.role !== 'user') {
        return <NoPermission />
    }

    if (userInformationQuery.isError) {
        return <Navigate to='..' />
    }

    return (
        <div className="dashboard">
            <div className="dashboard__header">
                <Link to="/home">
                    <BrandLogo />
                </Link>
                <div className="account-menu">
                    {
                        userInformationQuery.isFetched && userInformationQuery.data
                            ? <Dropdown
                                label={
                                    <div className="account-menu__label">
                                        {
                                            userInformationQuery.data.avatar
                                                ? <AdvancedImage cldImg={createCloudinaryThumb(userInformationQuery.data.avatar)} />
                                                : <img src={defaultAvatar} alt={userInformationQuery.data.name} />
                                        }
                                        <div>
                                            <span>
                                                {userInformationQuery.data.name}
                                            </span>
                                            <div className="account-menu__role">
                                                Khách hàng
                                            </div>
                                        </div>

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
            <nav>
                <ul>
                    <li>
                        <NavLink to="/user/account" className={({ isActive }) => isActive ? 'selected' : ''}>
                            Tài khoản
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/user/order-history" className={({ isActive }) => isActive ? 'selected' : ''}>
                            Lịch sử đặt hàng
                        </NavLink>
                    </li>
                </ul>
            </nav>
            <div className="dashboard__side-bar">
                <div className="side-bar-item">
                    <NavLink to="/user/account" className={({ isActive }) => isActive ? 'selected' : ''}>
                        <Icon.User /> <span>Tài khoản</span>
                    </NavLink>
                </div>
                <div className="side-bar-item">
                    <NavLink to="/user/order-history" className={({ isActive }) => isActive ? 'selected' : ''}>
                        <Icon.Truck /> <span>Lịch sử đặt hàng</span>
                    </NavLink>
                </div>
            </div>
            <div className="dashboard__content">
                <Outlet />
            </div>
        </div>
    )
}

export default UserLayout