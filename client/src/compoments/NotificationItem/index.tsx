import { ForwardedRef, forwardRef } from 'react'
import { Notification } from '../../services/user'
import { DateFormatter, StringFormatter, WEEK } from '../../utils/format'
import './index.scss'

function NotificationItem({ id, content, createdAt, linkTo, seen }: Notification, ref: ForwardedRef<HTMLAnchorElement>) {

    const createdDate = new Date(createdAt)
    const currentDate = new Date()
    let createdDateString = ''

    if (Math.abs(currentDate.getTime() - createdDate.getTime()) > 4 * WEEK) {
        createdDateString = createdDate.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
    } else {
        createdDateString =
            StringFormatter.toUpperFirstLetter(DateFormatter.getRelativeTime(createdDate))
    }

    return (
        <a href={linkTo} className="notification-link" ref={ref}>
            <div className={seen ? 'notification-item' : 'notification-item not-seen'} key={id}>
                <div className="notification-content">
                    {content}
                </div>
                <div className="notification-time">
                    {createdDateString}
                </div>
                {!seen && <div className="notification-not-seen"></div>}
            </div>
        </a>
    )
}

export default forwardRef(NotificationItem)