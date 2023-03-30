import { Link, useSearchParams } from 'react-router-dom'
import { Coffee } from '../../../compoments/Icon'
import { updatePassword } from '../../../services/staff'
import ChangePasswordForm from '../../common/ChangePasswordForm'
import './index.scss'

function StaffChangePassword() {
    const continueWithLink = useSearchParams()[0].get('continue') || '/staff'

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

export default StaffChangePassword