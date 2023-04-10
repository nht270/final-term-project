import { AdvancedImage } from '@cloudinary/react'
import { ForwardedRef, forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { createCloudinaryThumb } from '../../services/image'
import { Promotion } from '../../services/promotion'
import { StringFormatter } from '../../utils/format'
import './index.scss'

function PromotionCard({ id, coverImage, title, content }: Promotion, ref: ForwardedRef<HTMLDivElement>) {
    return (
        <div className="promotion-card">
            <AdvancedImage cldImg={createCloudinaryThumb(coverImage)} alt={title} className="cover" />
            <div className="short-info">
                <div className="title" title={title}>{title}</div>
                <div className="description">
                    <p>{StringFormatter.textFromHTML(content)}</p>
                </div>
            </div>
            <Link className='view-more' to={'/promotion/' + id}>Xem thêm</Link>
        </div>
    )
}

export default forwardRef(PromotionCard)