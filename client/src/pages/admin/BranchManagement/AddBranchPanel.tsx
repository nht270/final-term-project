import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import * as AdminService from '../../../services/admin'
import { joiResolver } from '@hookform/resolvers/joi'
import { useForm } from 'react-hook-form'
import AddressInput, { Address } from '../../../compoments/AddressInput'
import useStore from '../../../hooks/useStore'
import { addBranchSchema } from '../../../utils/validate'
import './AddBranchPanel.scss'

type FormValuesToAddBranch = AdminService.InformationToCreateBranch

function AddBranchPanel() {

    const DEFAULT_OPEN_TIME = useMemo(() => '07:00', [])
    const DEFAULT_CLOSE_TIME = useMemo(() => '20:00', [])
    const initFormValues: FormValuesToAddBranch = useMemo(() => ({ name: '', phone: '', address: '', longitude: '', latitude: '', openedAt: DEFAULT_OPEN_TIME, closedAt: DEFAULT_CLOSE_TIME }), [])
    const form = useForm({
        defaultValues: initFormValues,
        resolver: joiResolver(addBranchSchema)
    })
    const [addressText, setAddressText] = useState('')
    const [, dispatch] = useStore()
    function handleSelectAddress({ label, longitude, latitude }: Address) {
        form.setValue('address', label)
        form.setValue('longitude', longitude)
        form.setValue('latitude', latitude)
        setAddressText(label)
    }

    const addBranch = useMemo(() =>
        async (informaton: AdminService.InformationToCreateBranch) => {
            dispatch({ type: 'loading', payload: true })
            const result = await AdminService.addBranch(informaton)
            dispatch({ type: 'loading', payload: false })
            dispatch({ type: 'alert', payload: result ? 'Đã thêm chi nhánh' : 'Lỗi' })
        }, [])
    return (
        <div className="add-branch-panel" style={{ marginTop: '20px' }}>
            <form onSubmit={form.handleSubmit(addBranch)}>
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
                        <div className="branch-address-wrapper">
                            <label htmlFor="branch-address">Địa chỉ</label>
                            <AddressInput selectAddressHandler={handleSelectAddress} addressText={addressText} />
                            {form.formState.errors.address && <span className="invalid">{form.formState.errors.address.message}</span>}
                        </div>
                        <div className="branch-time-wrapper" style={{ marginTop: '5px' }}>
                            <label htmlFor="branch-open-time">Giờ mở cửa</label>
                            <input type="time" id="branch-open-time" {...form.register('openedAt')} />
                            <label htmlFor="branch-close-time">Giờ đóng cửa</label>
                            <input type="time" id="branch-close-time" {...form.register('closedAt')} />
                        </div>
                    </div>
                </div>
                <Link to="../" className="back">Trở về</Link>
                <button type="submit" className="add" >Thêm</button>
            </form>
        </div>
    )
}

export default AddBranchPanel