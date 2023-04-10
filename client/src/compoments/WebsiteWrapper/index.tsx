import { useEffect, useMemo } from 'react'
import useStore from '../../hooks/useStore'
import * as SocketService from '../../services/socketIO'
import * as LocalStorageUtil from '../../utils/localStorage'
import Alert from '../Alert'
import LogoLoadingIcon from '../Icon/LogoLoadingIcon'
import './index.scss'

function WebsiteWrapper({ children }: { children: React.ReactNode }) {
    const [global, dispatch] = useStore()
    const socket = useMemo(SocketService.getSoket, [])

    useEffect(() => {
        if (global.isSignIn && global.role === 'user') {
            SocketService.refetchToken(socket)
            socket.connect()
        } else {
            socket.connected && socket.disconnect()
        }
    }, [global.isSignIn])

    useEffect(() => {
        socket.on('newNotification', () => {
            dispatch({ type: 'newNotification', payload: true })
        })

        window.addEventListener('online', () => {
            dispatch({ type: 'alert', payload: 'Kết nối được khôi phục' })
        })

        window.addEventListener('offline', () => {
            dispatch({ type: 'alert', payload: 'Mất kết nối' })
        })

        window.addEventListener('storage', (e) => {
            if (e.key === 'refreshToken') {
                if (e.newValue) {
                    const newRole = LocalStorageUtil.getRole()
                    const refreshToken = LocalStorageUtil.getRefreshToken()
                    if (newRole && refreshToken) {
                        dispatch({ type: 'signin', payload: newRole })
                    }
                } else {
                    dispatch({ type: 'signout' })
                }
            }

            if (e.key === 'role') {
                if (!e.newValue || e.newValue === 'guest') {
                    dispatch({ type: 'signout' })
                }
            }
        })
    }, [])

    return (
        <>
            {children}
            {
                global.alertOfWebsite && (
                    <Alert
                        closeAfter={true}
                        customCloseHandler={() => {
                            dispatch && dispatch({ type: 'alert', payload: '' })
                        }}
                    >
                        {global.alertOfWebsite}
                    </Alert>
                )
            }
            {
                global.isFullScreenLoading && (
                    <div className="load-background">
                        <LogoLoadingIcon />
                    </div>
                )
            }
        </>
    )
}

export default WebsiteWrapper