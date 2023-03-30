import { Link, useSearchParams } from 'react-router-dom'
import { Coffee } from '../../../compoments/Icon'
import { updatePassword } from '../../../services/user'
import ChangePasswordForm from '../../common/ChangePasswordForm'
import './index.scss'

function UserChangePassword() {
    const continueWithLink = useSearchParams()[0].get('continue') || '/user'
    return (
        <div className="center-wrapper">
            <div className="brand-logo">
                <Link to="/">
                    Ace <Coffee />
                </Link>
            </div>
            <ChangePasswordForm updatePasswordApi={updatePassword} redirectLink={continueWithLink}
            />
        </div>
    )
}

export default UserChangePassword