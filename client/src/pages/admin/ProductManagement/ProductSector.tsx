import { Outlet } from 'react-router-dom'
import './ProductSector.scss'

function ProductSector() {
    return (
        <div className="product-sector">
            <Outlet />
        </div>
    )
}

export default ProductSector