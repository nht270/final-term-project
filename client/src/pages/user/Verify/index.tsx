import useStore from '../../../hooks/useStore'
import * as SignInService from '../../../services/signIn'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useEffect } from 'react'

function VerifyUser() {
    const [, dispatch] = useStore()
    const token = useParams()['token'] || ''
    const verifyUserQuery = useQuery(['verify', token], () => {
        return SignInService.verifyUser(token)
    })
    useEffect(() => {
        if (verifyUserQuery.isFetching) {
            dispatch({ type: 'loading', payload: true })
        }

        if (verifyUserQuery.isError || verifyUserQuery.isFetched) {
            dispatch({ type: 'loading', payload: false })
        }

    }, [])

    useEffect(() => {
        if (typeof verifyUserQuery.data === 'boolean' && verifyUserQuery.data) {
            dispatch({ type: 'loading', payload: false })
        }
    }, [verifyUserQuery.data])

    return (
        <div>
            {
                verifyUserQuery.isFetched &&
                verifyUserQuery.data !== undefined &&
                `Xác thực ${verifyUserQuery.data ? 'thành công' : 'không thành công'}`
            }
        </div>
    )
}

export default VerifyUser