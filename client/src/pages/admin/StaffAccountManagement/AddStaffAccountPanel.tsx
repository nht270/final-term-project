import { joiResolver } from '@hookform/resolvers/joi'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import Popup from '../../../compoments/Popup'
import QueryKeyPrefix from '../../../configures/queryKeyPrefix'
import useCreateObjectURL from '../../../hooks/useCreateObjectURL'
import useImageFilePicker from '../../../hooks/useImageFilePicker'
import useStore from '../../../hooks/useStore'
import * as AdminService from '../../../services/admin'
import * as BranchService from '../../../services/branch'
import { getToDayString } from '../../../utils/misc'
import { addStaffAccountSchema } from '../../../utils/validate'
import './AddStaffAccountPanel.scss'

type FormValuesToAddStaffAccount = AdminService.InformationToCreateStaffAccount

function AddStaffAccountPanel() {
    const initFormValues: FormValuesToAddStaffAccount = useMemo(() => (
        { name: '', branchId: '', dateOfBirth: getToDayString(), gender: 'male', phone: '', email: '' }), []
    )

    const form = useForm({
        defaultValues: initFormValues,
        resolver: joiResolver(addStaffAccountSchema)
    })

    const { imageFiles, error: imageFileError, clearError: clearImageFileError, handlePickImageFile } = useImageFilePicker({})
    const imageUrl = useCreateObjectURL(imageFiles[0])
    const branchesQuery = useQuery([QueryKeyPrefix.GET_BRANCH_PREFIX], BranchService.getBranches)
    const [, dispatch] = useStore()

    useEffect(() => {
        if (branchesQuery.data && branchesQuery.data.length > 0) {
            const firstBranch = branchesQuery.data[0]
            form.setValue('branchId', firstBranch.id)
        }
    }, [branchesQuery.isFetched])
    const addStaffAccount = useMemo(() =>
        async (information: AdminService.InformationToCreateStaffAccount) => {
            dispatch({ type: 'loading', payload: true })
            const success = await AdminService.addStaffAccount(information, imageFiles[0])
            dispatch({ type: 'loading', payload: false })
            dispatch({ type: 'alert', payload: success ? 'Đã thêm tài khoản' : 'Thêm không thành công' })
        }, [imageFiles])

    return (
        <div className="add-staff-account-panel" style={{ marginTop: '20px' }}>
            <form onSubmit={form.handleSubmit(addStaffAccount)}>
                <div className="grid" style={{ gap: '10px' }}>
                    <div className="l-6 m-6 s-12 xs-12">
                        <div className="staff-name-wrapper">
                            <label htmlFor="staff-account-name">Tên nhân viên</label>
                            <input type="text" {...form.register('name')} />
                            {form.formState.errors.name && <span className="invalid">{form.formState.errors.name.message}</span>}

                        </div>
                        <div className="staff-phone-wrapper">
                            <label htmlFor="staff-account-phone">Số điện thoại</label>
                            <input type="tel"{...form.register('phone')} />
                            {form.formState.errors.phone && <span className="invalid">{form.formState.errors.phone.message}</span>}
                        </div>
                        <div className="staff-branch-wrapper">
                            <label htmlFor="branch">Chi nhánh</label>
                            <select {...form.register('branchId')}>
                                {
                                    branchesQuery.isFetched &&
                                    branchesQuery.data &&
                                    branchesQuery.data.map(({ id, name }) => <option key={id} value={id}>{name}</option>)
                                }
                            </select>
                        </div>
                        <div className="staff-gender-wrapper">
                            <label htmlFor="gender">Giới tính</label>
                            <select {...form.register('gender')}>
                                <option value="male">Nam</option>
                                <option value="female">Nữ</option>
                                <option value="other">Khác</option>
                            </select>
                        </div>
                    </div>
                    <div className="l-6 m-6 s-12 xs-12">
                        <div className="staff-dob-wrapper">
                            <label htmlFor="dob">Ngày sinh</label>
                            <input type="date"{...form.register('dateOfBirth')} />
                        </div>
                        <div className="staff-email-wrapper">
                            <label htmlFor="email">Email</label>
                            <input id="email" type="email" {...form.register('email')} />
                            {form.formState.errors.email && <span className="invalid">{form.formState.errors.email.message}</span>}
                        </div>
                        <div className="staff-img-wrapper">
                            <label>Ảnh đại diện</label>
                            <div className="images-picker-wrapper grid" style={{ margin: '5px 0' }}>
                                <div className="avatar-picker">
                                    <input type="file" id="avatar" className="image-file-input" accept='image/*' onChange={handlePickImageFile} />
                                    <label htmlFor="avatar" className="image-file-label">
                                        {imageUrl === ''
                                            ? (<div className="describe-text">Trống</div>)
                                            : <img src={imageUrl} />
                                        }
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="staff-sizes-wrapper">
                        </div>
                        <div className="staff-status-wrapper">
                        </div>
                    </div>
                </div>
                <Link to="../" className="back">Trở về</Link>
                <button type="submit" className="add">Thêm</button>
            </form>
            {
                imageFileError &&
                <Popup closeHandler={clearImageFileError}>
                    <div style={{ margin: '10px' }}>
                        {imageFileError.message}
                    </div>
                </Popup>
            }
        </div>
    )
}

export default AddStaffAccountPanel