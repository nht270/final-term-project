import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { MouseEvent, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AdminAccount, getInformation as getAdminInformation } from '../../services/admin'
import { getInformation as getStaffInformation } from '../../services/staff'
import * as UserService from '../../services/user'

import { AdvancedImage } from '@cloudinary/react'
import defaultAvatar from '../../assets/img/avatar.png'
import useAutoFetchNextPage from '../../hooks/useAutoFecthNextPage'
import useStore from '../../hooks/useStore'
import { createCloudinaryThumb } from '../../services/image'
import * as StaffService from '../../services/staff'
import Dropdown from '../Dropdown'
import { Bell, BellBing, Contact, Shop, User } from '../Icon'
import NotificationItem from '../NotificationItem'
import Tooltip from '../Tooltip'

function TopNavBar() {
    return (
        <>
            <TopNavBarDesktop />
            <TopNavBarMobile />
        </>
    )
}

function TopNavBarDesktop() {

    const [triggerNotificationPopup, setTriggerNotificationPopup] = useState(false)
    const [globalState, dispatch] = useStore()
    const location = useLocation()
    const [userInformation, setUserInformation] = useState<UserService.UserAccount>()
    const [adminInformation, setAdminInformation] = useState<AdminAccount>()
    const [staffInformation, setStaffInformation] = useState<StaffService.ExtraStaffAccount>()
    const [notifications, setNotifications] = useState<UserService.Notification[]>([])
    const userAccountInformationQuery = useQuery(
        ['get-user-information'],
        UserService.getInformation,
        { enabled: globalState.isSignIn && globalState.role === 'user' }
    )

    const adminAccountInformationQuery = useQuery(
        ['get-admin-information'],
        getAdminInformation,
        { enabled: globalState.isSignIn && globalState.role === 'admin' }
    )

    const staffAccountInformationQuery = useQuery(
        ['get-staff-information'],
        getStaffInformation,
        { enabled: globalState.isSignIn && globalState.role === 'staff' }
    )

    const getNotificationQuery = useInfiniteQuery(
        ['get-notification'],
        ({ pageParam }) => {
            return UserService.getNotifications(pageParam?.nextPage)
        },
        {
            enabled: globalState.isSignIn && globalState.role === 'user',
            getNextPageParam: (lastPage, allPages) => {
                if (lastPage.hasNextPage) { return { nextPage: allPages.length + 1 } }
            }
        }
    )

    const { hasNextPageRef: hasNextNotificatonRef, htmlDockRef: lastNotificationRef } = useAutoFetchNextPage<HTMLAnchorElement>(getNotificationQuery.fetchNextPage, [notifications, triggerNotificationPopup])

    useEffect(() => {
        if (getNotificationQuery.data) {
            const allNotifications = getNotificationQuery.data.pages.flatMap((page) => page.data)
            setNotifications(allNotifications)
            const hasNewNotification = allNotifications.some(({ seen }) => !seen)
            if (hasNewNotification) { dispatch({ type: 'newNotification', payload: hasNewNotification }) }
            hasNextNotificatonRef.current = getNotificationQuery.hasNextPage
        }
    }, [getNotificationQuery.data])

    function toggleNotificationPopupHandler(e: MouseEvent) {
        setTriggerNotificationPopup(prev => !prev)
        const haveNotSeenNotificationIds = notifications
            .filter(({ seen }) => !seen)
            .map(({ id }) => id)

        UserService.markNotificationIsSeen(haveNotSeenNotificationIds)
            .then(success => {
                if (success) { dispatch({ type: 'newNotification', payload: false }) }
            })
        getNotificationQuery.refetch()
    }

    function signOutHandler() {
        window.localStorage.removeItem('accessToken')
        window.localStorage.removeItem('refreshToken')
        window.localStorage.setItem('role', 'guest')
        dispatch({ type: 'signout' })
    }

    useEffect(() => {
        if (userAccountInformationQuery.isError ||
            adminAccountInformationQuery.isError) {
            dispatch({ type: 'signout' })
        }
        if (userAccountInformationQuery.isFetched &&
            userAccountInformationQuery.data) {
            setUserInformation(userAccountInformationQuery.data)
        }

        if (adminAccountInformationQuery.isFetched &&
            adminAccountInformationQuery.data) {
            setAdminInformation(adminAccountInformationQuery.data)
        }

        if (staffAccountInformationQuery.isFetched &&
            staffAccountInformationQuery.data) {
            setStaffInformation(staffAccountInformationQuery.data)
        }

    }, [
        userAccountInformationQuery.isError,
        adminAccountInformationQuery.isError,
        staffAccountInformationQuery.isError,
        userAccountInformationQuery.isFetched,
        adminAccountInformationQuery.isFetched,
        staffAccountInformationQuery.isFetched
    ])
    return (
        <div className='top-navbar-desktop'>
            <div className="left-side">
                <div className="nav-link">
                    <Shop />
                    <div className="nav-link-content">
                        <a href="#shop-list">
                            Cửa hàng
                        </a>
                    </div>
                </div>
                <div className="nav-link">
                    <Contact />
                    <div className="nav-link-content">
                        <a href="#">
                            Liên hệ
                        </a>
                    </div>
                </div>
            </div>
            <div className="right-side">
                {
                    (!userInformation && !adminInformation && !staffInformation) || !globalState.isSignIn ? (
                        <Dropdown
                            label={<User />}
                            content={
                                <div className='user-sign-menu'>
                                    <Link
                                        to={`/sign-in?continue=${location.pathname}`}
                                        state={{ backgroundLocation: location }}
                                    >
                                        <div className="user-menu-item">
                                            Đăng nhập
                                        </div>
                                    </Link>
                                    <Link
                                        to={`/sign-up?continue=${location.pathname}`}
                                        state={{ backgroundLocation: location }}
                                    >
                                        <div className="user-menu-item">
                                            Đăng ký
                                        </div>
                                    </Link>
                                </div>
                            }
                            showMenuWhenHover
                        />
                    ) : (
                        <>
                            {
                                userInformation && globalState.role === 'user' &&
                                <div className='notification-sector'>
                                    <div onClick={toggleNotificationPopupHandler}>
                                        {globalState.hasNewNotification ? <BellBing /> : <Bell />}
                                    </div>
                                    {
                                        triggerNotificationPopup &&
                                        <Tooltip
                                            tooltipCss={{
                                                position: 'absolute',
                                                top: '25px',
                                                right: '-20px',
                                            }}
                                            arrowCss={{
                                                marginLeft: '382px'
                                            }}
                                            wrapperCss={{
                                                width: '420px',
                                                height: '500px',
                                            }}
                                            clickOutToClose={true}
                                            customCloseHandler={toggleNotificationPopupHandler}
                                        >
                                            <div className="label">
                                                <h3 style={{
                                                    margin: '5px 0 10px 0'
                                                }}>Thông báo</h3>
                                            </div>
                                            {
                                                notifications.length > 0 ? (
                                                    <div className="notifications-wrapper">
                                                        {
                                                            notifications.map((notification, index) => {
                                                                return <NotificationItem {...notification} key={notification.id} ref={index === notifications.length - 1 ? lastNotificationRef : undefined} />
                                                            })
                                                        }
                                                    </div>
                                                ) : (
                                                    <div className="no-notfication">Không có thông báo nào!</div>
                                                )
                                            }
                                        </Tooltip>
                                    }
                                </div>
                            }

                            {
                                userInformation && globalState.role === 'user' &&
                                <UserMenu {...userInformation} signOutHandler={signOutHandler} />
                            }

                            {
                                adminInformation && globalState.role === 'admin' &&
                                <AdminMenu {...adminInformation} signOutHandler={signOutHandler} />
                            }

                            {
                                staffInformation && globalState.role === 'staff' &&
                                <StaffMenu {...staffInformation} signOutHandler={signOutHandler} />
                            }
                        </>
                    )
                }
            </div>
        </div>
    )
}

function TopNavBarMobile() {

    const [globalState, dispatch] = useStore()
    const location = useLocation()
    const [userInformation, setUserInformation] = useState<UserService.UserAccount>()
    const [adminInformation, setAdminInformation] = useState<AdminAccount>()
    const [staffInformation, setStaffInformation] = useState<StaffService.ExtraStaffAccount>()

    const userAccountInformationQuery = useQuery(
        ['get-user-information'],
        UserService.getInformation,
        { enabled: globalState.isSignIn && globalState.role === 'user' }
    )
    const adminAccountInformationQuery = useQuery(
        ['get-admin-information'],
        getAdminInformation,
        { enabled: globalState.isSignIn && globalState.role === 'admin' }
    )

    const staffAccountInformationQuery = useQuery(
        ['get-staff-information'],
        getStaffInformation,
        { enabled: globalState.isSignIn && globalState.role === 'staff' }
    )

    useEffect(() => {
        if (userAccountInformationQuery.isError ||
            adminAccountInformationQuery.isError) {
            dispatch({ type: 'signout' })
        }
        if (userAccountInformationQuery.isFetched &&
            userAccountInformationQuery.data) {
            setUserInformation(userAccountInformationQuery.data)
        }

        if (adminAccountInformationQuery.isFetched &&
            adminAccountInformationQuery.data) {
            setAdminInformation(adminAccountInformationQuery.data)
        }

        if (staffAccountInformationQuery.isFetched &&
            staffAccountInformationQuery.data) {
            setStaffInformation(staffAccountInformationQuery.data)
        }
    }, [
        userAccountInformationQuery.isError,
        adminAccountInformationQuery.isError,
        staffAccountInformationQuery.isError,
        userAccountInformationQuery.isFetched,
        adminAccountInformationQuery.isFetched,
        staffAccountInformationQuery.isFetched
    ])

    return (
        <div className="top-navbar-mobile">
            <div className="left-side">
                <div className="nav-link">
                    <Shop />
                    <div className="nav-link-content">
                        <a href="#shop-list">
                            Cửa hàng
                        </a>
                    </div>
                </div>
                <div className="nav-link">
                    <Contact />
                    <div className="nav-link-content">
                        <a href="#">
                            Liên hệ
                        </a>
                    </div>
                </div>
            </div>
            <div className="right-side">
                {
                    ((!userInformation && !adminInformation && !staffInformation) || !globalState.isSignIn) ? (
                        <div className="user-sign">
                            <Link to={`/sign-in?continue=${location.pathname}`}>
                                <User />
                            </Link>
                        </div>
                    ) : (<>
                        <div className='notification-sector'>
                            <Link to="/notifications">{globalState.hasNewNotification ? <BellBing /> : <Bell />}</Link>
                        </div>
                        {
                            userInformation && globalState.role === 'user' &&
                            <Link to="/user/account">
                                {
                                    userInformation.avatar ? (
                                        <AdvancedImage cldImg={createCloudinaryThumb(userInformation.avatar)} />
                                    ) : (
                                        <img src={defaultAvatar} alt="avatar" />
                                    )
                                }
                            </Link>
                        }
                        {
                            adminInformation && globalState.role === 'admin' &&
                            <Link to="/admin">
                                <img src={defaultAvatar} alt="avatar" />
                            </Link>
                        }
                        {
                            staffInformation && globalState.role === 'staff' &&
                            <Link to="/staff">
                                {
                                    staffInformation.avatar ? (
                                        <AdvancedImage cldImg={createCloudinaryThumb(staffInformation.avatar)} />
                                    ) : (
                                        <img src={defaultAvatar} alt="avatar" />
                                    )
                                }
                            </Link>
                        }
                    </>)
                }
            </div>
        </div>
    )
}

function UserMenu({ avatar, name, signOutHandler }: { avatar?: string, name: string, signOutHandler: (e: MouseEvent) => void }) {
    return (
        <Dropdown
            label={
                <div className="account-wrapper">
                    {
                        avatar
                            ? (<AdvancedImage cldImg={createCloudinaryThumb(avatar)} />)
                            : (<img src={defaultAvatar} alt="avatar" />)
                    }
                    <div className="user-name">{name}</div>
                </div>
            }
            content={
                <div className='account-menu' style={{ width: '150px' }}>

                    <Link to="/user/account">
                        <div className="user-menu-item">Tài khoản</div>
                    </Link>
                    <Link to="/user/order-history">
                        <div className="user-menu-item">Lịch sử đặt hàng</div>
                    </Link>
                    <div className="user-menu-item" onClick={signOutHandler}>Đăng xuất</div>
                </div>
            }
            noneArrowIcon
        />
    )
}

function AdminMenu({ username, signOutHandler }: { username: string, signOutHandler: (e: MouseEvent) => void }) {
    return (
        <Dropdown
            label={
                <div className="account-wrapper">
                    <img src={defaultAvatar} alt="avatar" />
                    <div className="user-name">{username}</div>
                </div>
            }
            content={
                <div className='account-menu' style={{ width: '150px' }}>
                    <Link to="/admin">
                        <div className="user-menu-item">Dashboard</div>
                    </Link>
                    <div className="user-menu-item" onClick={signOutHandler}>Đăng xuất</div>
                </div>
            }
            noneArrowIcon
        />
    )
}

function StaffMenu({ avatar, name, signOutHandler }: { avatar?: string, name: string, signOutHandler: (e: MouseEvent) => void }) {
    return (
        <Dropdown
            label={
                <div className="account-wrapper">
                    {
                        avatar
                            ? (<AdvancedImage cldImg={createCloudinaryThumb(avatar)} />)
                            : (<img src={defaultAvatar} alt="avatar" />)
                    }
                    <div className="user-name">{name}</div>
                </div>
            }
            content={
                <div className='account-menu' style={{ width: '150px' }}>
                    <Link to="/staff">
                        <div className="user-menu-item">Dashboard</div>
                    </Link>
                    <div className="user-menu-item" onClick={signOutHandler}>Đăng xuất</div>
                </div>
            }
            noneArrowIcon
        />
    )
}

export default TopNavBar