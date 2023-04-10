import { Navigate, NavLink, Outlet } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import QueryKeyPrefix from '../../../configures/queryKeyPrefix'
import useStore from '../../../hooks/useStore'
import * as AdminService from '../../../services/admin'
import './index.scss'

function PromotionManagement() {
    const [globalState] = useStore()

    const adminInformationQuery = useQuery(
        [QueryKeyPrefix.GET_ADMIN_INFORMATION_PREFIX],
        AdminService.getInformation,
        { enabled: globalState.isSignIn && globalState.role === 'admin' }
    )

    if (adminInformationQuery.data && adminInformationQuery.data.type !== 'website') {
        return <Navigate to='..' />
    }

    return (
        <div className="promotion-mamagment">
            <nav className="sub-nav">
                <ul>
                    <li><NavLink to="./promotion" className={({ isActive }) => isActive ? 'selected' : ''}>Tin khuyến mãi</NavLink> </li>
                    <li><NavLink to="./coupon" className={({ isActive }) => isActive ? 'selected' : ''}>Coupon</NavLink> </li>
                </ul>
            </nav>
            <Outlet />
        </div>
    )
}

export default PromotionManagement