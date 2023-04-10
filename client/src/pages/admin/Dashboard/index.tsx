import { useQuery } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import useStore from '../../../hooks/useStore'
import * as AdminService from '../../../services/admin'
import './index.scss'

function AdminDashboard() {
    const [global] = useStore()
    const getAdminInformationQuery = useQuery(
        ['get-admin-information'],
        AdminService.getInformation,
        { enabled: global.isSignIn && global.role === 'admin' }
    )

    if (getAdminInformationQuery.isFetched && getAdminInformationQuery.data) {
        const adminType = getAdminInformationQuery.data.type

        if (adminType === 'store') {
            return <Navigate to="product-management" />
        }

        if (adminType === 'website') {
            return <Navigate to="staff-account-management" />
        }
    }

    return <h2>Not thing</h2>
}

export default AdminDashboard