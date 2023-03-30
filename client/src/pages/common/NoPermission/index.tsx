import './index.scss'
import * as Icon from '../../../compoments/Icon'
import { Link } from 'react-router-dom'

function NoPermission() {
    return (
        <div className="no-permission">
            <div className="no-permission__code">4 <Icon.Slash /> 3</div>
            <div className="no-permission__desc">No permission</div>
            <Link to='/home'>Go home</Link>
        </div>
    )
}

export default NoPermission