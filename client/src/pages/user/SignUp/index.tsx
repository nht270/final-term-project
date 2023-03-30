import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PlainLayout from '../../../compoments/PlainLayout'
import Popup from '../../../compoments/Popup'
import useStore from '../../../hooks/useStore'
import SignUpForm from './SignUpForm'

interface SignUpProps {
    form?: 'page' | 'popup'
}

function SignUp({ form = 'page' }: SignUpProps) {

    const navigate = useNavigate()
    const continueWhithLink = useSearchParams()[0].get('continue') || '/'
    const [global] = useStore()

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
                form === 'page'
                    ? (
                        <PlainLayout>
                            <div style={{ marginTop: '10%' }}>
                                <SignUpForm />
                            </div>
                        </PlainLayout>
                    )
                    : (
                        <Popup closeHandler={closePopupHandler}>
                            <div style={{ marginTop: '10%' }}>
                                <SignUpForm />
                            </div>
                        </Popup>
                    )
            }
        </>
    )
}

export default SignUp