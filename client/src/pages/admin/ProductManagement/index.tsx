import { useQuery } from '@tanstack/react-query'
import { Navigate, NavLink, Outlet } from 'react-router-dom'
import QueryKeyPrefix from '../../../configures/queryKeyPrefix'
import useStore from '../../../hooks/useStore'
import * as AdminService from '../../../services/admin'
import './index.scss'

function ProductManagment() {

    const [globalState] = useStore()

    const adminInformationQuery = useQuery(
        [QueryKeyPrefix.GET_ADMIN_INFORMATION_PREFIX],
        AdminService.getInformation,
        { enabled: globalState.isSignIn && globalState.role === 'admin' }
    )

    if (adminInformationQuery.data && adminInformationQuery.data.type !== 'store') {
        return <Navigate to='..' />
    }

    return (
        <div className="product-mamagment">
            <nav className="sub-nav">
                <ul>
                    <li><NavLink to="./product" className={({ isActive }) => isActive ? 'selected' : ''}>Sản phẩm</NavLink> </li>
                    <li><NavLink to="./category" className={({ isActive }) => isActive ? 'selected' : ''}>Loại sản phẩm</NavLink> </li>
                    <li><NavLink to="./size" className={({ isActive }) => isActive ? 'selected' : ''}>Kích cỡ</NavLink> </li>
                </ul>
            </nav>
            <Outlet />
        </div>
    )
}

export default ProductManagment