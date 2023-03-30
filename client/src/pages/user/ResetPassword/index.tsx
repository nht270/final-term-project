import { joiResolver } from '@hookform/resolvers/joi'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Coffee } from '../../../compoments/Icon'
import PlainLayout from '../../../compoments/PlainLayout'
import * as SignInService from '../../../services/signIn'
import { resetPasswordSchema } from '../../../utils/validate'
import './index.scss'

interface ResetPasswordFormValues {
    newPassword: string,
    repeatNewPassword: string
}

function UserResetPassword() {
    const token = useParams()['token'] || ''
    const initFormValues: ResetPasswordFormValues = { newPassword: '', repeatNewPassword: '' }
    const { formState: { errors }, register, handleSubmit } = useForm({
        defaultValues: initFormValues,
        resolver: joiResolver(resetPasswordSchema)
    })

    const [isUpdatePasswordFailure, setIsUpdatePasswordFailure] = useState(false)
    const navigate = useNavigate()

    async function resetPassword({ newPassword }: ResetPasswordFormValues) {
        try {
            const success = await SignInService.resetPassword(token, newPassword)
            if (success) {
                navigate('/', { replace: true })
            } else {
                setIsUpdatePasswordFailure(true)
            }
        } catch (error) {
            setIsUpdatePasswordFailure(true)
        }
    }

    if (!token) {
        return (
            <>Liên kết không hợp lệ</>
        )
    }

    return (
        <PlainLayout>
            <div className="center-wrapper">
                <div className="brand-logo">
                    <Link to="/">
                        Ace <Coffee />
                    </Link>
                </div>
                <form action="reset-password" onSubmit={handleSubmit(resetPassword)} >
                    {isUpdatePasswordFailure && <span className="invalid">Đặt lại mật khẩu không thành công</span>}
                    <input type="password" placeholder="Mật khẩu mới" {...register('newPassword')} autoFocus />
                    {errors.newPassword && <span className="invalid">{errors.newPassword.message}</span>}
                    <input type="password" placeholder="Nhập lại mật khẩu mới" {...register('repeatNewPassword')} />
                    {errors.repeatNewPassword && <span className="invalid">{errors.repeatNewPassword.message}</span>}
                    <input type="submit" value="Đặt lại" />
                </form>
            </div>
        </PlainLayout>
    )
}

export default UserResetPassword