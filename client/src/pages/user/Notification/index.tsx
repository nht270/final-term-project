import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import NotificationItem from '../../../compoments/NotificationItem'
import PlainLayout from '../../../compoments/PlainLayout'
import useAutoFetchNextPage from '../../../hooks/useAutoFecthNextPage'
import useStore from '../../../hooks/useStore'
import * as UserService from '../../../services/user'
import { markNotificationIsSeen } from '../../../services/user'
import './index.scss'

function Notification() {
    const [globalState, dispatch] = useStore()
    const [notifications, setNotifications] = useState<UserService.Notification[]>([])
    const getNotificationQuery = useInfiniteQuery(
        ['get-notification'],
        ({ pageParam }) => UserService.getNotifications(pageParam?.nextPage),
        {
            enabled: globalState.isSignIn && globalState.role === 'user',
            getNextPageParam: (lastPage, allPages) => {
                if (lastPage.hasNextPage) { return { nextPage: allPages.length + 1 } }
            }
        }
    )

    const { htmlDockRef, hasNextPageRef } = useAutoFetchNextPage<HTMLAnchorElement>(getNotificationQuery.fetchNextPage, [notifications])

    useEffect(() => {
        if (getNotificationQuery.data) {
            const allNotifications = getNotificationQuery.data.pages.flatMap(page => page.data)
            setNotifications(allNotifications)
            const haveNotSeenNotificationIds = allNotifications.filter(({ seen }) => !seen).map(({ id }) => id)
            markNotificationIsSeen(haveNotSeenNotificationIds)
                .then(success => {
                    if (success) { dispatch({ type: 'newNotification', payload: false }) }
                })

            hasNextPageRef.current = getNotificationQuery.hasNextPage
        }

    }, [getNotificationQuery.data])

    return (
        <PlainLayout>
            <div style={{
                margin: '0 auto',
                width: '100%',
                maxWidth: '500px',
                padding: '10px',
                boxSizing: 'border-box',
            }}>
                <h2 style={{ margin: '0' }}>Thông báo</h2>
                {
                    notifications.length > 0 ? (
                        <div className="notifications-wrapper">
                            {
                                notifications.map((notification, index) =>
                                    <NotificationItem key={notification.id} {...notification} ref={index === notifications.length - 1 ? htmlDockRef : undefined} />
                                )
                            }
                        </div>
                    ) : (
                        <div className="no-notification">Không có thông báo nào!</div>
                    )
                }
            </div>
        </PlainLayout>

    )
}

export default Notification