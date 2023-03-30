import { AdvancedImage } from '@cloudinary/react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import defaultAvatar from '../../../assets/img/avatar.png'
import * as Icon from '../../../compoments/Icon'
import LoadingIcon from '../../../compoments/Icon/LoadingIcon'
import useAutoFetchNextPage from '../../../hooks/useAutoFecthNextPage'
import useStore from '../../../hooks/useStore'
import * as AdminService from '../../../services/admin'
import { createCloudinaryThumb } from '../../../services/image'
import './UserAccountViewer.scss'

function UserAccountViewer() {

    const [userAccounts, setUserAccounts] = useState<AdminService.UserAccount[]>([])
    const userAccountsQuery = useInfiniteQuery(
        ['get-user-account-list'],
        ({ pageParam }) => AdminService.getUserAccounts(pageParam?.nextPage),
        {
            getNextPageParam: (lastPage, allPages) => {
                if (lastPage.hasNextPage) { return { nextPage: allPages.length + 1 } }
            }
        }
    )
    const { htmlDockRef, hasNextPageRef } = useAutoFetchNextPage<HTMLDivElement>(userAccountsQuery.fetchNextPage, [userAccounts])

    const [, dispatch] = useStore()

    useEffect(() => {
        if (userAccountsQuery.data) {
            setUserAccounts(userAccountsQuery.data.pages.flatMap(page => page.data))
            hasNextPageRef.current = userAccountsQuery.hasNextPage
        }
    }, [userAccountsQuery.data])

    async function lockUserAccount(userAccountId: string) {
        const success = await AdminService.lockUserAccount(userAccountId)
        if (success) {
            userAccountsQuery.refetch()
            dispatch({ type: 'alert', payload: 'Đã chặn tài khoản #' + userAccountId })
        } else {
            dispatch({ type: 'alert', payload: 'Lỗi' })
        }
    }

    async function unlockUserAccount(userAccountId: string) {
        const success = await AdminService.unlockUserAccount(userAccountId)
        if (success) {
            userAccountsQuery.refetch()
            dispatch({ type: 'alert', payload: 'Đã bỏ chặn tài khoản #' + userAccountId })
        } else {
            dispatch({ type: 'alert', payload: 'Lỗi' })
        }
    }

    if (userAccountsQuery.isFetched) {
        if (userAccounts.length > 0) {
            return (
                <div className="data-table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Ảnh đại diện</th>
                                <th>Id</th>
                                <th>Họ và tên</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                userAccounts.map(account =>
                                    <tr>
                                        <td>
                                            {account.avatar ? (<AdvancedImage cldImg={createCloudinaryThumb(account.avatar)} className="image image--quare" />) : (<img src={defaultAvatar} className="image image--quare" />)}
                                        </td>
                                        <td>{account.id}</td>
                                        <td>{account.name}</td>
                                        <td>
                                            {
                                                account.locked
                                                    ? <button className="more" onClick={() => unlockUserAccount(account.id)}><Icon.Unlock /></button>
                                                    : <button className="more" onClick={() => lockUserAccount(account.id)}><Icon.Lock /></button>
                                            }
                                        </td>
                                        <td></td>
                                    </tr>
                                )
                            }
                        </tbody>
                    </table>
                    <div className="hidden-dock" ref={htmlDockRef}></div>
                </div>
            )
        } else {
            return <span>Không có tài khoản khách hàng nào</span>
        }
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '20px auto' }}><LoadingIcon /></div>
    )
}

export default UserAccountViewer