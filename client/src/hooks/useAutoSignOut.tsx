import useStore from './useStore'
import * as LocalStorageUtil from '../utils/localStorage'
import { ACCESS_TOKEN_ERROR_CAUSE, REFRESH_TOKEN_ERROR_CAUSE, WEBSITE_ROLE_ERROR_CAUSE } from '../services/general'

function useAutoSignOut() {
    const [, dispatch] = useStore()
    function autoSignOut(error: Error) {
        if (error.cause === REFRESH_TOKEN_ERROR_CAUSE ||
            error.cause === ACCESS_TOKEN_ERROR_CAUSE ||
            error.cause === WEBSITE_ROLE_ERROR_CAUSE) {
            LocalStorageUtil.clearToken()
            LocalStorageUtil.restoreDefaultRole()
            dispatch({ type: 'signout' })
        }
    }
    return autoSignOut
}

export default useAutoSignOut