import { Link } from 'react-router-dom'
import './index.scss'

function NotFound() {
    return (
        <div className="not-found">
            <div className='not-found__code'>404</div>
            <span className='not-found__desc'>Page not found</span>
            <Link to={'/home'} >Go home</Link>
        </div>
    )
}

export default NotFound