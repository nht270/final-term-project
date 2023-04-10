import { joiResolver } from '@hookform/resolvers/joi'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate } from 'react-router-dom'
import { Camera } from '../../../compoments/Icon'
import Popup from '../../../compoments/Popup'
import QueryKeyPrefix from '../../../configures/queryKeyPrefix'
import useAutoSignOut from '../../../hooks/useAutoSignOut'
import useCreateObjectURL from '../../../hooks/useCreateObjectURL'
import useImageFilePicker from '../../../hooks/useImageFilePicker'
import useStore from '../../../hooks/useStore'
import { createCloudinaryThumbLink } from '../../../services/image'
import * as StaffServices from '../../../services/staff'
import { updateStaffAccountSchema } from '../../../utils/validate'
import './index.scss'

type FormValuesOfStaffAccount = StaffServices.InformationToUpdateStaffAccount

function StaffAccount() {

    const initStaffAccountFormValues: FormValuesOfStaffAccount = useMemo(() => ({ phone: '', name: '', gender: 'male', dateOfBirth: '', email: '' }), [])
    const form = useForm({
        defaultValues: initStaffAccountFormValues,
        resolver: joiResolver(updateStaffAccountSchema)
    })

    const [globalState, dispatch] = useStore()
    const [staffAccount, setStaffAccount] = useState<StaffServices.ExtraStaffAccount | null>(null)
    const [avatarLink, setAvatarLink] = useState('')
    const autoSignOut = useAutoSignOut()

    const staffAccountQuery = useQuery(
        [QueryKeyPrefix.GET_STAFF_INFORMATION_PREFIX],
        StaffServices.getInformation,
        {
            enabled: globalState.isSignIn && globalState.role === 'staff',
            useErrorBoundary: (error) => {
                autoSignOut(error as Error)
                return false
            },
        }
    )

    useEffect(() => {
        if (staffAccountQuery.isFetched && staffAccountQuery.data) {
            const staffAccountFetched = staffAccountQuery.data
            setStaffAccount(staffAccountFetched)
            if (staffAccountFetched.avatar) {
                setAvatarLink(createCloudinaryThumbLink(staffAccountFetched.avatar))
            }
            form.setValue('name', staffAccountFetched.name)
            form.setValue('phone', staffAccountFetched.phone)
            form.setValue('gender', staffAccountFetched.gender)
            form.setValue('dateOfBirth', (new Date(staffAccountFetched.dateOfBirth)).toISOString().split('T')[0])
            form.setValue('email', staffAccountFetched.email)
        }
    }, [staffAccountQuery.isFetched])

    const { error: imageFileError, clearError: clearImageFileError, clearImageFiles, handlePickImageFile, imageFiles } = useImageFilePicker({})
    const avatarLocalLink = useCreateObjectURL(imageFiles[0])
    useEffect(() => {
        if (avatarLocalLink) {
            setAvatarLink(avatarLocalLink)
        }
    }, [avatarLocalLink])

    if (staffAccountQuery.isError) {
        return <Navigate to='..' />
    }

    async function updateStaffAccount(information: FormValuesOfStaffAccount) {
        dispatch({ type: 'loading', payload: true })
        const success = await StaffServices.updateInformation(information, imageFiles[0])
        dispatch({ type: 'loading', payload: false })
        if (!success) {
            dispatch({ type: 'alert', payload: 'Cập nhật thông tin không thành công' })
        } else {
            staffAccountQuery.refetch()
            clearImageFiles()
        }
    }

    if (staffAccountQuery.isLoading) {
        return (<></>)
    }

    if (staffAccountQuery.isError) {
        dispatch({ type: 'alert', payload: 'Lỗi tải thông tin người dùng' })
        return (<></>)
    }

    return (
        <>
            <h3>Thông tin cá nhân</h3>

            <form name="staff-information" onSubmit={form.handleSubmit(updateStaffAccount)}>
                <div className="avatar">
                    <input type="file" name="avatar" id='avatar' accept='image/*' onChange={handlePickImageFile} />
                    <label htmlFor="avatar">
                        {
                            avatarLink ? (
                                <div className="avatar-picker">
                                    <img src={avatarLink} alt={form.getValues('name')} />
                                    <div className="change-pic-icon">
                                        <Camera />
                                    </div>
                                </div>
                            ) : 'Hình đại diện'
                        }
                    </label>
                </div>
                <div className="field-wrapper">

                    <div className="field">
                        <label htmlFor="name">Họ và tên</label>
                        <input {...form.register('name')} type="text" id="name" />
                        {form.formState.errors.name && <span className="invalid">{form.formState.errors.name.message}</span>}
                    </div>
                    <div className="field">
                        <label htmlFor="gender">Giới tính</label>
                        <select {...form.register('gender')} id="gender">
                            <option value="male">Nam</option>
                            <option value="female">Nữ</option>
                            <option value="other">Khác</option>
                        </select>
                    </div>
                    <div className="field">
                        <label htmlFor="phone">Số điện thoại</label>
                        <input {...form.register('phone')} id="phone" type="tel" />
                        {form.formState.errors.phone && <span className="invalid">{form.formState.errors.phone.message}</span>}
                    </div>
                    <div className="field">
                        <label htmlFor="date-of-birth">Ngày sinh</label>
                        <input {...form.register('dateOfBirth')} id="date-of-birth" type="date" />
                    </div>
                    <div className="field">
                        <label htmlFor="address">Chi nhánh</label>
                        <div>{staffAccount?.branchName}</div>
                    </div>
                    <div className="field">
                        <label htmlFor="email">Email</label>
                        <input {...form.register('email')} id="email" type="email" />
                        {form.formState.errors.email && <span className="invalid">{form.formState.errors.email.message}</span>}
                    </div>
                </div>
                <button
                    type="submit"
                    className="update-btn"
                    style={{ margin: '20px 0' }}
                >
                    Cập nhật
                </button>
                {
                    imageFileError &&
                    <Popup closeHandler={clearImageFileError}>
                        <div style={{ margin: '10px' }}>
                            {imageFileError.message}
                        </div>
                    </Popup>
                }
            </form>
            <Link to='/staff/change-password' className="update-password">Đổi mật khẩu</Link>
        </>
    )
}

export default StaffAccount