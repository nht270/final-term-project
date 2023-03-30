import { Link, useSearchParams } from 'react-router-dom'
import { Coffee } from '../../../compoments/Icon'
import { updatePassword } from '../../../services/admin'
import ChangePasswordForm from '../../common/ChangePasswordForm'
import './index.scss'

function AdminChangePassword() {
    const continueWithLink = useSearchParams()[0].get('continue') || '/admin'

    return (
        <div className="center-wrapper">
            <div className="brand-logo">
                <Link to="/">
                    Ace <Coffee />
                </Link>
            </div>
            <ChangePasswordForm updatePasswordApi={updatePassword} redirectLink={continueWithLink} />
        </div>
    )
}

export default AdminChangePassword