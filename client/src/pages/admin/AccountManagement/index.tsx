import { useState } from 'react'
import { EditText } from '../../../compoments/Icon'
import * as AdminService from '../../../services/admin'
import ChangePasswordForm from '../../common/ChangePasswordForm'
import './index.scss'
function AdminAccountManagment() {
    const [triggerChangePasswordForm, setTriggerChangePasswordForm] = useState(false)

    return (
        <div className='account-managment'>
            <button
                className='change-password'
                onClick={() => setTriggerChangePasswordForm(prev => !prev)}>
                <EditText /> Cập nhật mật khẩu
            </button>
            {
                triggerChangePasswordForm &&
                <ChangePassword />
            }
        </div>
    )
}

function ChangePassword() {
    return (
        <ChangePasswordForm updatePasswordApi={AdminService.updatePassword} />
    )
}

export default AdminAccountManagment