import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Coffee, LongArrowRight } from '../../../compoments/Icon'
import useStore from '../../../hooks/useStore'
import { signInForUser } from '../../../services/signIn'
import * as LocalStorageUtil from '../../../utils/localStorage'
import { userSignInSchema } from '../../../utils/validate'

import { joiResolver } from '@hookform/resolvers/joi'
import { useForm } from 'react-hook-form'
import './index.scss'

function SignInForm() {
    const [, dispatch] = useStore()
    const [describeSignInFailure, setDescribeSignInFailure] = useState('')
    const initSignInFormValues = useMemo(() => ({
        email: '',
        password: ''
    }), [])
    const { formState, register, handleSubmit } = useForm({
        defaultValues: initSignInFormValues,
        resolver: joiResolver(userSignInSchema)
    })

    async function signIn(email: string, password: string) {
        dispatch({ type: 'loading', payload: true })
        try {
            const signInResult = await signInForUser(email, password)

            if (signInResult) {
                LocalStorageUtil.setToken(signInResult.accessToken, signInResult.refreshToken)
                LocalStorageUtil.changeRole('user')
                dispatch({ type: 'signin', payload: 'user' })
            } else {
                setDescribeSignInFailure('Đăng nhập không thành công, email hoặc mật khẩu không đúng')
            }
        } catch (error) {
            if (window.navigator.onLine) {
                dispatch({ type: 'alert', payload: 'Lỗi hệ thống' })
            } else {
                dispatch({ type: 'alert', payload: 'Lỗi mạng, hãy kiểm tra lại kết nối internet và thử lại' })
            }
        }

        dispatch({ type: 'loading', payload: false })
    }

    return (
        <div className="sign-in-form">
            <div className="brand-logo">
                <Link to="/">
                    <LongArrowRight /><Coffee />
                </Link>
            </div>
            <form onSubmit={handleSubmit(({ email, password }) => {
                signIn(email, password)
            })}>
                {describeSignInFailure && <span className="invalid">{describeSignInFailure}</span>}
                <input
                    type="email"
                    placeholder='Email'
                    autoFocus
                    {...register('email')}
                />
                {formState.errors.email && <span className="invalid">{formState.errors.email.message}</span>}
                <input
                    type="password"
                    placeholder='Mật khẩu'
                    {...register('password')}
                />
                {formState.errors.password && <span className="invalid">{formState.errors.password.message}</span>}
                <div style={{
                    width: 'min(500px, 80vw)',
                    textAlign: 'left',
                    margin: '0 auto',
                    display: 'flex',
                    justifyContent: 'center'
                }}>
                    <Link to="./forgot" style={{
                        minWidth: '300px',
                        textDecoration: 'none',
                        color: '#b0b435'
                    }}>Quên mật khẩu</Link>
                </div>
                <input type="submit" value='Đăng nhập' />
            </form>
            <div className="more-action">
                <div>
                    Bạn chưa có tài khoản? <Link to='/sign-up'>Đăng ký</Link>
                </div>
            </div>
        </div>
    )
}

export default SignInForm