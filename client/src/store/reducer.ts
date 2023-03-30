const refreshToken = window.localStorage.getItem('refreshToken') || ''
const role = (window.localStorage.getItem('role') || 'guest') as WebsiteRole

export type GlobalState = {
    isSignIn: boolean,
    role: WebsiteRole,
    alertOfWebsite: string,
    isFullScreenLoading: boolean,
    hasNewNotification: boolean,
}

export const initState: GlobalState = {
    isSignIn: !!(refreshToken && role !== 'guest'),
    role,
    alertOfWebsite: '',
    isFullScreenLoading: false,
    hasNewNotification: false
}

export type ACTION =
    SIGIN_ACTION |
    SIGNOUT_ACTION |
    ALERT_ACTION |
    FULL_SCREEN_LOADING_ACTION |
    NEW_NOTIFICATION_ACTION

export type WebsiteRole = 'user' | 'staff' | 'admin' | 'guest'
export type AdminType = 'website' | 'store'

type SIGIN_ACTION = {
    type: 'signin',
    payload: WebsiteRole
}

type SIGNOUT_ACTION = {
    type: 'signout'
}

type ALERT_ACTION = {
    type: 'alert',
    payload: string
}

type FULL_SCREEN_LOADING_ACTION = {
    type: 'loading',
    payload: boolean
}

type NEW_NOTIFICATION_ACTION = {
    type: 'newNotification',
    payload: boolean
}

export default function reducer(state: typeof initState, action: ACTION): GlobalState {
    switch (action.type) {
        case 'signin':
            return { ...state, isSignIn: true, role: action.payload }
        case 'signout':
            return { ...state, isSignIn: false, role: 'guest' }
        case 'alert':
            return { ...state, alertOfWebsite: action.payload }
        case 'loading':
            return { ...state, isFullScreenLoading: action.payload }
        case 'newNotification':
            return { ...state, hasNewNotification: action.payload }
        default:
            return state
    }
}