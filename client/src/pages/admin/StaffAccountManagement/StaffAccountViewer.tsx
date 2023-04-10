import { AdvancedImage } from '@cloudinary/react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import defaultAvatar from '../../../assets/img/avatar.png'
import * as Icon from '../../../compoments/Icon'
import LoadingIcon from '../../../compoments/Icon/LoadingIcon'
import Popup from '../../../compoments/Popup'
import useAutoFetchNextPage from '../../../hooks/useAutoFecthNextPage'
import useStore from '../../../hooks/useStore'
import * as AdminService from '../../../services/admin'
import * as BranchService from '../../../services/branch'
import { createCloudinaryThumb } from '../../../services/image'
import './StaffAccountViewer.scss'

function StaffAccoutViewer() {
    const [staffAccounts, setStaffAccounts] = useState<AdminService.StaffAccount[]>([])
    const staffAccountsQuery = useInfiniteQuery(
        ['get-staff-accounts-query'],
        ({ pageParam }) => AdminService.getStaffAccounts(pageParam?.nextPage),
        {
            getNextPageParam: (lastPage, allPages) => {
                if (lastPage.hasNextPage) { return { nextPage: allPages.length + 1 } }
            }
        }
    )
    const branchesQuery = useQuery(['get-branches-query'], BranchService.getBranches)
    const [, dispatch] = useStore()
    const [warningDeleteAccount, setWarningDeleteAccount] = useState('')
    const [staffAccountIdWillDelete, setStaffAccountIdWillDelete] = useState('')
    const [warningResetAccount, setWarningResetAccount] = useState('')
    const [staffAccountIdWillReset, setStaffAccountIdWillReset] = useState('')
    const { htmlDockRef, hasNextPageRef } = useAutoFetchNextPage<HTMLDivElement>(staffAccountsQuery.fetchNextPage, [staffAccounts])

    useEffect(() => {
        if (staffAccountsQuery.data) {
            setStaffAccounts(staffAccountsQuery.data.pages.flatMap(page => page.data))
            hasNextPageRef.current = staffAccountsQuery.hasNextPage
        }
    }, [staffAccountsQuery.data])

    const updateBranch = useMemo(() => async (staffAccountId: string, branchId: string) => {
        if (!staffAccountId || !branchId) { return }
        dispatch({ type: 'loading', payload: true })
        const success = await AdminService.updateBranchForStaff(staffAccountId, branchId)
        dispatch({ type: 'loading', payload: false })
        dispatch({ type: 'alert', payload: success ? 'Cập nhật thành công' : 'Cập nhật không thành công' })
        if (success) {
            staffAccountsQuery.remove()
            staffAccountsQuery.refetch()
        }
    }, [])


    const showDeleteWarningPopup = useMemo(() => (staffAccountId: string) => {
        if (!staffAccountId) { return }
        setStaffAccountIdWillDelete(staffAccountId)
        setWarningDeleteAccount(`Bạn muốn xóa tài khoản #${staffAccountId} ?`)
    }, [])

    const showResetWarningPopup = useMemo(() => (staffAccountId: string) => {
        if (!staffAccountId) { return }
        setStaffAccountIdWillReset(staffAccountId)
        setWarningResetAccount(`Bạn muốn đặt lại mật khẩu tài khoản #${staffAccountId}. Mật khẩu sau khi đặt lại là default0`)
    }, [])

    const deleteStaffAccount = useMemo(() => async (staffAccountId: string) => {

        dispatch({ type: 'loading', payload: true })
        const success = await AdminService.deleteStaffAccount(staffAccountId)
        dispatch({ type: 'loading', payload: false })
        if (success) {
            staffAccountsQuery.remove()
            staffAccountsQuery.refetch()
            dispatch({ type: 'alert', payload: 'Đã xóa tài khoản #' + staffAccountId })
        } else {
            dispatch({ type: 'alert', payload: 'Lỗi' })
        }
        setWarningDeleteAccount('')
        setStaffAccountIdWillDelete('')
    }, [])

    const resetStaffAccount = useMemo(() => async (staffAccountId: string) => {
        if (!staffAccountId) { return }
        dispatch({ type: 'loading', payload: true })
        const success = await AdminService.resetStaffAccountPassword(staffAccountId)
        dispatch({ type: 'loading', payload: false })
        if (success) {
            dispatch({ type: 'alert', payload: 'Đã đặt lại mật khẩu cho tài khoản #' + staffAccountId })
        } else {
            dispatch({ type: 'alert', payload: 'Lỗi' })
        }
        setWarningResetAccount('')
        setStaffAccountIdWillReset('')
    }, [])

    return (
        <>
            <Link to="./add" className="add-new"><Icon.Plus /> Thêm tài khoản nhân viên</Link>
            <br />
            {
                staffAccountsQuery.isFetched
                    ? (
                        staffAccounts.length > 0
                            ? <div className="data-table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Ảnh đại diện</th>
                                            <th>Id</th>
                                            <th>Tên</th>
                                            <th>Số điện thoại</th>
                                            <th>Chi nhánh</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            staffAccounts.map(account =>
                                                <tr key={account.id} className='non-highlight'>
                                                    <td>
                                                        {account.avatar ? (<AdvancedImage cldImg={createCloudinaryThumb(account.avatar)} className="image image--quare" />) : (<img src={defaultAvatar} className="image image--quare" />)}
                                                    </td>
                                                    <td>{account.id}</td>
                                                    <td>{account.name}</td>
                                                    <td>{account.phone}</td>
                                                    <td className='branch-column'>
                                                        {
                                                            branchesQuery.isFetched && branchesQuery.data
                                                                ? (
                                                                    <select
                                                                        name="branch"
                                                                        value={account.branchId}
                                                                        onChange={async (e) => {
                                                                            if (!e.target) { return }
                                                                            const branchId = (e.target as HTMLSelectElement).value
                                                                            updateBranch(account.id, branchId)
                                                                        }}
                                                                    >
                                                                        {branchesQuery.data.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
                                                                    </select>
                                                                ) : account.branchName
                                                        }
                                                    </td>
                                                    <td>
                                                        <button type="button" className="more" onClick={() => showResetWarningPopup(account.id)}><Icon.ResetPassword /></button>
                                                    </td>
                                                    <td>
                                                        <button type="button" className="more" onClick={() => showDeleteWarningPopup(account.id)}><Icon.Cancel /></button>
                                                    </td>
                                                </tr>
                                            )
                                        }
                                    </tbody>
                                </table>
                                <div className='hidden-dock' ref={htmlDockRef}></div>
                            </div>
                            : <span>Không có tài khoản nhân viên nào</span>
                    )
                    : <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '20px auto' }}><LoadingIcon /></div>
            }
            {
                warningDeleteAccount &&
                <Popup
                    popupStyle={{ padding: '0', borderRadius: '12px' }}
                    closeHandler={() => {
                        setStaffAccountIdWillDelete('')
                        setWarningDeleteAccount('')
                    }}
                >
                    <div className="warning-wrapper">
                        <div className="content">
                            {warningDeleteAccount}
                        </div>
                        <hr />
                        <button className="ok" onClick={() => deleteStaffAccount(staffAccountIdWillDelete)}>OK</button>
                    </div>
                </Popup>
            }
            {
                warningResetAccount &&
                <Popup
                    popupStyle={{ padding: '0', borderRadius: '12px' }}
                    closeHandler={() => {
                        setStaffAccountIdWillReset('')
                        setWarningResetAccount('')
                    }}
                >
                    <div className="warning-wrapper" style={{ maxWidth: '300px' }}>
                        <div className="content">
                            {warningResetAccount}
                        </div>
                        <hr />
                        <button className="ok" onClick={() => resetStaffAccount(staffAccountIdWillReset)}>OK</button>
                    </div>
                </Popup>
            }
        </>
    )
}

export default StaffAccoutViewer