import { useQuery } from '@tanstack/react-query';
import { Navigate, Outlet } from 'react-router-dom';
import QueryKeyPrefix from '../../../configures/queryKeyPrefix';
import useStore from '../../../hooks/useStore';
import * as AdminService from '../../../services/admin'

function StaffAccountManagment() {
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
        <div>
            <h2>Tài khoản nhân viên</h2>
            <Outlet />
        </div>
    )
}

export default StaffAccountManagment