import { useQuery } from '@tanstack/react-query'
import { MouseEvent, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import Popup from '../../../compoments/Popup'
import useStore from '../../../hooks/useStore'
import * as AdminService from '../../../services/admin'
import * as BranchService from '../../../services/branch'

import { joiResolver } from '@hookform/resolvers/joi'
import { useForm } from 'react-hook-form'
import AddressInput, { Address } from '../../../compoments/AddressInput'
import QueryKeyPrefix from '../../../configures/queryKeyPrefix'
import { updateBranchChema } from '../../../utils/validate'
import './EditBranchPanel.scss'

type FormValuesToUpdateBranch = AdminService.InformationToUpdateBranch

function EditBranchPanel() {

    const DEFAULT_OPEN_TIME = useMemo(() => '07:00', [])
    const DEFAULT_CLOSE_TIME = useMemo(() => '20:00', [])
    const initFormValues: FormValuesToUpdateBranch = useMemo(() => ({ name: '', phone: '', address: '', longitude: '', latitude: '', openedAt: DEFAULT_OPEN_TIME, closedAt: DEFAULT_CLOSE_TIME }), [])
    const form = useForm({
        defaultValues: initFormValues,
        resolver: joiResolver(updateBranchChema)
    })

    const { branchId } = useParams()
    const [addressText, setAddressText] = useState('')
    const branchQuery = useQuery(
        [QueryKeyPrefix.GET_BRANCH_PREFIX, branchId],
        () => { return branchId ? BranchService.getBranch(branchId) : null },
        { enabled: !!branchId }
    )

    const [, dispatch] = useStore()
    useEffect(() => {
        if (!branchQuery.isFetched || !branchQuery.data) { return }
        const fetchedBranch = branchQuery.data
        form.setValue('name', fetchedBranch.name)
        form.setValue('phone', fetchedBranch.phone)
        form.setValue('address', fetchedBranch.address)
        form.setValue('longitude', fetchedBranch.longitude)
        form.setValue('latitude', fetchedBranch.latitude)
        form.setValue('openedAt', fetchedBranch.openedAt)
        form.setValue('closedAt', fetchedBranch.closedAt)
        setAddressText(fetchedBranch.address)
    }, [branchQuery.isFetched])

    const handleUpdateBranch = useMemo(() =>
        async (information: AdminService.InformationToUpdateBranch) => {
            if (!branchId) { return }
            dispatch({ type: 'loading', payload: true })
            const result = await AdminService.updateBranch(branchId, information)
            dispatch({ type: 'loading', payload: false })
            if (result) {
                dispatch({ type: 'alert', payload: 'Cập nhật thành công' })
            } else {
                dispatch({ type: 'alert', payload: 'Cập nhật không thành công' })
            }
        }, [branchId])

    const handleSelectAddress = useMemo(() =>
        ({ label, longitude, latitude }: Address) => {
            form.setValue('address', label)
            form.setValue('longitude', longitude)
            form.setValue('latitude', latitude)
            setAddressText(label)
        }, [])

    if (!branchId || (branchQuery.isFetched && !branchQuery.data)) {
        return <Navigate to="../" />
    }

    return (
        <div className="edit-branch-panel" style={{ marginTop: '20px' }}>
            <form onSubmit={form.handleSubmit(handleUpdateBranch)}>
                <div className="grid" style={{ gap: '10px' }}>
                    <div className="l-6 m-6 s-12 xs-12">
                        <div className="branch-name-wrapper">
                            <label htmlFor="branch-name">Tên chi nhánh</label>
                            <input type="text" id="branch-name" {...form.register('name')} />
                            {form.formState.errors.name && <span className="invalid">{form.formState.errors.name.message}</span>}
                        </div>
                        <div className="branch-phone-wrapper">
                            <label htmlFor="branch-phone">Số điện thoại</label>
                            <input type="text" id="branch-phone" {...form.register('phone')} />
                            {form.formState.errors.phone && <span className="invalid">{form.formState.errors.phone.message}</span>}
                        </div>
                    </div>
                    <div className="l-6 m-6 s-12 xs-12">
                        {
                            branchQuery.data &&
                            <div className="branch-address-wrapper">
                                <label htmlFor="branch-address">Địa chỉ</label>
                                <AddressInput defaultValue={branchQuery.data.address} selectAddressHandler={handleSelectAddress} addressText={addressText} />
                                {form.formState.errors.address && <span className="invalid">{form.formState.errors.address.message}</span>}
                            </div>
                        }
                        <div className="branch-time-wrapper" style={{ marginTop: '5px' }}>
                            <label htmlFor="branch-open-time">Giờ mở cửa</label>
                            <input type="time" id="branch-open-time" {...form.register('openedAt')} />
                            <label htmlFor="branch-close-time">Giờ đóng cửa</label>
                            <input type="time" id="branch-close-time" {...form.register('closedAt')} />
                        </div>
                    </div>
                </div>
                <Link to="../" className="back">Trở về</Link>
                <button type="submit" className="update">Cập nhật</button>
            </form>
        </div>
    )
}

export default EditBranchPanel