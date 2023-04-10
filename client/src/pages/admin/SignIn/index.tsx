import { joiResolver } from '@hookform/resolvers/joi'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Coffee, LongArrowRight } from '../../../compoments/Icon'
import PlainLayout from '../../../compoments/PlainLayout'
import useStore from '../../../hooks/useStore'
import * as SignInService from '../../../services/signIn'
import * as LocalStorageUtil from '../../../utils/localStorage'
import { adminSignInSchema } from '../../../utils/validate'
import './index.scss'

function AdminSignIn() {

    const initSignInFromValues = { username: '', password: '' }
    const { formState: { errors }, register, handleSubmit } = useForm({
        defaultValues: initSignInFromValues,
        resolver: joiResolver(adminSignInSchema)
    })
    const continueWhithLink = useSearchParams()[0].get('continue') || '/admin'
    const navigate = useNavigate()
    const [global, dispatch] = useStore()
    useEffect(() => {
        if (global.isSignIn) {
            navigate(continueWhithLink, { replace: true })
        }
    }, [global.isSignIn])

    async function signIn({ username, password }: typeof initSignInFromValues) {
        const signInResult = await SignInService.signInForAdmin(username, password)
        if (signInResult) {
            LocalStorageUtil.setToken(signInResult.accessToken, signInResult.refreshToken)
            LocalStorageUtil.changeRole('admin')
            dispatch({ type: 'signin', payload: 'admin' })
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
                    <input {...register('username')} type="text" name="username" placeholder="Tên đăng nhập" autoFocus />
                    {errors.username && <span className='invalid' >{errors.username.message}</span>}

                    <input {...register('password')} type="password" name="password" placeholder="Mật khẩu" />
                    {errors.password && <span className='invalid' >{errors.password.message}</span>}
                    <input type="submit" value='Đăng nhập' />
                </form>
            </div>
        </PlainLayout>
    )
}

export default AdminSignIn