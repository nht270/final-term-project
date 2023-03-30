import { joiResolver } from '@hookform/resolvers/joi'
import Joi from 'joi'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { Coffee } from '../../../compoments/Icon'
import PlainLayout from '../../../compoments/PlainLayout'
import useStore from '../../../hooks/useStore'
import * as SignInService from '../../../services/signIn'
import { emailSchema } from '../../../utils/validate'
import './index.scss'

function ForgotPassword() {
    const initFormValues = { email: '' }
    const { formState: { errors }, register, handleSubmit } = useForm({
        defaultValues: initFormValues,
        resolver: joiResolver(Joi.object({ email: emailSchema.required() }))
    })

    const [, dispatch] = useStore()
    async function forgotPassword({ email }: typeof initFormValues) {
        dispatch({ type: 'loading', payload: true })
        await SignInService.forgotPassword(email)
        dispatch({ type: 'loading', payload: false })
        dispatch({ type: 'alert', payload: 'Liên kết đặt lại mật khẩu sẽ được gửi vào email: ' + email + ' nếu email này đã đăng ký tài khoản' })
    }

    return (
        <PlainLayout>
            <div className="center-wrapper">
                <div className="brand-logo">
                    <Link to="/">
                        Ace <Coffee />
                    </Link>
                </div>
                <form action="forgot-password" onSubmit={handleSubmit(forgotPassword)}>
                    <span>Nhập email đã quên mật khẩu</span>
                    <input type="email" placeholder="Email" autoFocus {...register('email')} />
                    {errors.email && <span className='invalid'>{errors.email.message}</span>}
                    <input type="submit" value="Gửi tới email" />
                </form>
            </div>
        </PlainLayout>
    )
}

export default ForgotPassword