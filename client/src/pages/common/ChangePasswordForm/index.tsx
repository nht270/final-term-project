import { joiResolver } from '@hookform/resolvers/joi'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import useStore from '../../../hooks/useStore'
import * as LocalStorageUtil from '../../../utils/localStorage'
import { changePasswordSchema } from '../../../utils/validate'
import './index.scss'

interface ChangePasswordProps {
    updatePasswordApi: (oldPassword: string, newPassword: string) => Promise<boolean>,
    redirectLink?: string
}

function ChangePassword({ updatePasswordApi, redirectLink }: ChangePasswordProps) {

    const initChangePasswordFormValues = { oldPassword: '', newPassword: '', repeatNewPassword: '' }
    const { formState: { errors }, getValues, register, handleSubmit } = useForm({
        defaultValues: initChangePasswordFormValues,
        resolver: joiResolver(changePasswordSchema)
    })
    const [isUpdatePasswordFailure, setIsUpdatePasswordFailure] = useState(false)
    const navigate = useNavigate()
    const [, dispatch] = useStore()

    async function updatePassword({ oldPassword, newPassword }: typeof initChangePasswordFormValues) {
        try {
            const success = await updatePasswordApi(oldPassword, newPassword)
            if (success) {
                LocalStorageUtil.clearToken()
                LocalStorageUtil.restoreDefaultRole()
                dispatch({ type: 'signout' })
                navigate(redirectLink || '/', { replace: true })
            } else {
                setIsUpdatePasswordFailure(true)
            }
        } catch (error) {
            setIsUpdatePasswordFailure(true)
        }
    }

    return (
        <form name="change-password-form" onSubmit={handleSubmit(updatePassword)} >
            {isUpdatePasswordFailure && <span className="invalid">Cập nhật không thành công</span>}
            <input {...register('oldPassword')} type="password" placeholder="Mật khẩu cũ" />
            {errors.oldPassword && <span className="invalid">{errors.oldPassword.message}</span>}
            <input {...register('newPassword')} type="password" placeholder="Mật khẩu mới" />
            {errors.newPassword && <span className="invalid">{errors.newPassword.message}</span>}
            <input {...register('repeatNewPassword')} type="password" placeholder="Nhập lại mật khẩu mới" />
            {errors.repeatNewPassword && <span className="invalid">{errors.repeatNewPassword.message}</span>}
            <input type="submit" value="Cập nhật" />
        </form>
    )
}

export default ChangePassword