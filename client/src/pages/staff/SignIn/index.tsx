import { useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Coffee, LongArrowRight } from '../../../compoments/Icon'
import PlainLayout from '../../../compoments/PlainLayout'
import * as SignInService from '../../../services/signIn'
import useStore from '../../../hooks/useStore'
import * as LocalStorageUtil from '../../../utils/localStorage'
import './index.scss'
import { useForm } from 'react-hook-form'
import { joiResolver } from '@hookform/resolvers/joi'
import { staffSignInSchema } from '../../../utils/validate'

function StaffSignIn() {

    const initSignInFormValues = useMemo(() => ({ phone: '', password: '' }), [])
    const continueWhithLink = useSearchParams()[0].get('continue') || '/staff'
    const navigate = useNavigate()
    const [globalState, dispatch] = useStore()
    useEffect(() => {
        if (globalState.isSignIn) {
            navigate(continueWhithLink, { replace: true })
        }
    }, [globalState.isSignIn])

    const { formState: { errors }, register, handleSubmit } = useForm({
        defaultValues: initSignInFormValues,
        resolver: joiResolver(staffSignInSchema)
    })

    async function signIn({ phone, password }: typeof initSignInFormValues) {
        const signInResult = await SignInService.signInForStaff(phone, password)
        if (signInResult) {
            LocalStorageUtil.setToken(signInResult.accessToken, signInResult.refreshToken)
            LocalStorageUtil.changeRole('staff')
            dispatch({ type: 'signin', payload: 'staff' })
        } else {
            dispatch({ type: 'alert', payload: 'Đăng nhập không thành công' })
        }
    }

    return (
        <PlainLayout>
            <div className="sign-in-form" style={{ marginTop: 'min(25%, 200px)' }}>
                <div className="brand-logo">
                    <Link to="/">
                        <LongArrowRight /><Coffee />
                    </Link>
                </div>
                <form action='#' onSubmit={handleSubmit(signIn)}>
                    <input {...register('phone')} type="tel" placeholder="Số điện thoại" autoFocus />
                    {errors.phone && <span className='invalid' >{errors.phone.message}</span>}
                    <input {...register('password')} type="password" placeholder="Mật khẩu" />
                    {errors.password && <span className='invalid' >{errors.password.message}</span>}
                    <input type="submit" value='Đăng nhập' />
                </form>
            </div>
        </PlainLayout>
    )
}

export default StaffSignIn