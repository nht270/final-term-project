import { AdvancedImage } from '@cloudinary/react'
import { useQuery } from '@tanstack/react-query'
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import defaultAvatar from '../../../assets/img/avatar.png'
import '../../../assets/scss/Dashboard.scss'
import Dropdown from '../../../compoments/Dropdown'
import * as Icon from '../../../compoments/Icon'
import LoadingIcon from '../../../compoments/Icon/LoadingIcon'
import QueryKeyPrefix from '../../../configures/queryKeyPrefix'
import useAutoSignOut from '../../../hooks/useAutoSignOut'
import useStore from '../../../hooks/useStore'
import { createCloudinaryThumb } from '../../../services/image'
import * as StaffService from '../../../services/staff'
import * as LocalStorageUtil from '../../../utils/localStorage'
import NoPermission from '../../common/NoPermission'

function StaffLayout() {
    const [globalState, dispatch] = useStore()
    const location = useLocation()
    const autoSignOut = useAutoSignOut()
    const staffInformationQuery = useQuery(
        [QueryKeyPrefix.GET_STAFF_INFORMATION_PREFIX],
        StaffService.getInformation,
        {
            enabled: globalState.isSignIn && globalState.role === 'staff',
            useErrorBoundary: (error) => {
                autoSignOut(error as Error)
                return false
            }
        }
    )

    if (!globalState.isSignIn) {
        return <Navigate to={`/staff/sign-in?continue=${encodeURIComponent(location.pathname)}`} />
    }

    if (globalState.role !== 'staff') {
        return <NoPermission />
    }

    if (staffInformationQuery.isError) {
        return <Navigate to='..' />
    }

    if (staffInformationQuery.data && staffInformationQuery.data.firstLogin) {
        return <Navigate to="change-password" />
    }

    function signOutHandler() {
        LocalStorageUtil.clearToken()
        LocalStorageUtil.restoreDefaultRole()
        dispatch({ type: 'signout' })
    }

    return (
        <div className="dashboard">
            <div className="dashboard__header">
                <Link to="/home">
                    <div className="brand-logo">
                        <span style={{ marginRight: '3px' }}>Ace</span> <Icon.Coffee />
                    </div>
                </Link>
                <div className="account-menu">
                    {
                        staffInformationQuery.isFetched && staffInformationQuery.data
                            ? <Dropdown
                                label={
                                    <div className="account-menu__label">
                                        <>
                                            {
                                                staffInformationQuery.data.avatar
                                                    ? <AdvancedImage cldImg={createCloudinaryThumb(staffInformationQuery.data.avatar)} />
                                                    : <img src={defaultAvatar} alt={staffInformationQuery.data.name} />
                                            }
                                            <div>
                                                <span>
                                                    {staffInformationQuery.data.name}
                                                </span>
                                                <div className="account-menu__role">Nhân viên</div>
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
            <nav>
                <ul>
                    <li>
                        <NavLink to="/staff/order-management" className={({ isActive }) => isActive ? 'selected' : ''}>
                            Quản lý đơn đặt hàng
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/staff/analyze-and-statis" className={({ isActive }) => isActive ? 'selected' : ''}>
                            Phân tích & thống kê
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/staff/account-management" className={({ isActive }) => isActive ? 'selected' : ''}>
                            Tài khoản
                        </NavLink>
                    </li>
                </ul>
            </nav>
            <div className="dashboard__side-bar">
                <div className="side-bar-item">
                    <NavLink to="/staff/order-management" className={({ isActive }) => isActive ? 'selected' : ''}>
                        <Icon.TaskSquare /><span>Quản lý đơn đặt hàng</span>
                    </NavLink>
                </div>
                <div className="side-bar-item">
                    <NavLink to="/staff/analyze-and-statis" className={({ isActive }) => isActive ? 'selected' : ''}>
                        <Icon.StatusUp /><span>Phân tích & thống kê</span>
                    </NavLink>
                </div>
                <div className="side-bar-item">
                    <NavLink to="/staff/account-management" className={({ isActive }) => isActive ? 'selected' : ''}>
                        <Icon.User /> <span>Tài khoản</span>
                    </NavLink>
                </div>
            </div>
            <div className="dashboard__content">
                <Outlet />
            </div>
        </div>
    )
}

export default StaffLayout