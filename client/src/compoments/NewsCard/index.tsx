import { AdvancedImage } from '@cloudinary/react'
import { ForwardedRef, forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { createCloudinaryThumb } from '../../services/image'
import { News } from '../../services/news'
import { StringFormatter } from '../../utils/format'
import './index.scss'

function NewsCard({ id, coverImage, title, content }: News, ref: ForwardedRef<HTMLDivElement>) {
    return (
        <div className="news-card">
            <AdvancedImage cldImg={createCloudinaryThumb(coverImage)} alt={title} className="cover" />
            <div className="short-info">
                <div className="title" title={title}>{title}</div>
                <div className="description">
                    <p>{StringFormatter.textFromHTML(content)}</p>
                </div>
            </div>
            <Link className='view-more' to={'/news/' + id}>Xem thêm</Link>
        </div>
    )
}

export default forwardRef(NewsCard)