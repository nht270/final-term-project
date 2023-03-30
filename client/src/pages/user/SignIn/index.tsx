import { useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PlainLayout from '../../../compoments/PlainLayout'
import Popup from '../../../compoments/Popup'
import useStore from '../../../hooks/useStore'
import SignInForm from './SignInForm'

interface SignInProps {
    form?: 'page' | 'popup'
}

function SignIn({ form = 'page' }: SignInProps) {

    const navigate = useNavigate()
    const [global] = useStore()
    const continueWhithLink = useSearchParams()[0].get('continue') || '/'

    useEffect(() => {
        if (global.isSignIn) {
            navigate(continueWhithLink, { replace: true })
        }
    }, [global.isSignIn])

    function closePopupHandler() {
        navigate(-1)
    }

    return (
        <>
            {
                form === 'page' ? (
                    <PlainLayout>
                        <div style={{ margin: '15% auto 0' }}>
                            <SignInForm />
                        </div>
                    </PlainLayout>
                ) : (
                    <Popup closeHandler={closePopupHandler}>
                        <div style={{ margin: '30px 0' }}>
                            <SignInForm />
                        </div>
                    </Popup>
                )
            }
        </>
    )
}

export default SignIn