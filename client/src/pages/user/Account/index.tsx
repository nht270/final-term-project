import { joiResolver } from '@hookform/resolvers/joi'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate } from 'react-router-dom'
import AddressInput, { Address } from '../../../compoments/AddressInput'
import * as Icon from '../../../compoments/Icon'
import Popup from '../../../compoments/Popup'
import QueryKeyPrefix from '../../../configures/queryKeyPrefix'
import useAutoSignOut from '../../../hooks/useAutoSignOut'
import useCreateObjectURL from '../../../hooks/useCreateObjectURL'
import useImageFilePicker from '../../../hooks/useImageFilePicker'
import useStore from '../../../hooks/useStore'
import { createCloudinaryThumbLink } from '../../../services/image'
import * as UserServices from '../../../services/user'
import * as LocalStorageUtil from '../../../utils/localStorage'
import { updateUserAccountSchema } from '../../../utils/validate'
import './index.scss'


type FormValuesOfUserAccount = UserServices.InformationToUpdateUserAccount

function UserAccount() {
    return (
        <>
            <UserInformationSector />
            <Link to='/user/change-password'>Đổi mật khẩu</Link>
            <DeleteAccountSector />
        </>
    )
}

function UserInformationSector() {
    const initUserAccountFormValues: FormValuesOfUserAccount =
        useMemo(() => ({
            name: '',
            email: '',
            gender: 'male',
            dateOfBirth: '',
            address: '',
            longitude: '',
            latitude: '',
            phone: '',
        }), [])

    const form = useForm({
        defaultValues: initUserAccountFormValues,
        resolver: joiResolver(updateUserAccountSchema)
    })

    const [globalState, dispatch] = useStore()
    const [userAccount, setUserAccount] = useState<UserServices.UserAccount | null>(null)
    const [avatarLink, setAvatarLink] = useState('')
    const [addressText, setAddressText] = useState('')
    const autoSignOut = useAutoSignOut()
    const { clearError: clearImageFileError, clearImageFiles, error: imageFileError, imageFiles, handlePickImageFile } = useImageFilePicker({})
    const avatarLocalLink = useCreateObjectURL(imageFiles[0])
    const userAccountQuery = useQuery(
        [QueryKeyPrefix.GET_USER_INFORMATION_PREFIX],
        UserServices.getInformation,
        {
            enabled: globalState.isSignIn && globalState.role === 'user',
            useErrorBoundary: (error) => {
                autoSignOut(error as Error)
                return false
            },
        }
    )

    useEffect(() => {
        if (userAccountQuery.isFetched && userAccountQuery.data) {
            const fetchedUserAccount = userAccountQuery.data
            setUserAccount(fetchedUserAccount)
            if (fetchedUserAccount.avatar) {
                setAvatarLink(createCloudinaryThumbLink(fetchedUserAccount.avatar))
            }
            form.setValue('name', fetchedUserAccount.name)
            form.setValue('gender', fetchedUserAccount.gender)
            form.setValue('dateOfBirth', (new Date(fetchedUserAccount.dateOfBirth)).toISOString().split('T')[0])
            form.setValue('address', fetchedUserAccount.address)
            form.setValue('longitude', fetchedUserAccount.longitude)
            form.setValue('latitude', fetchedUserAccount.latitude)
            form.setValue('email', fetchedUserAccount.email)
            form.setValue('phone', fetchedUserAccount.phone)
            fetchedUserAccount.address && setAddressText(fetchedUserAccount.address)
        }
    }, [userAccountQuery.isFetched])

    useEffect(() => {
        if (avatarLocalLink) {
            setAvatarLink(avatarLocalLink)
        }
    }, [avatarLocalLink])

    async function updateUserAccount(information: FormValuesOfUserAccount) {
        dispatch({ type: 'loading', payload: true })
        const success = await UserServices.updateInformation(information, imageFiles[0])
        dispatch({ type: 'loading', payload: false })
        if (!success) {
            dispatch({ type: 'alert', payload: 'Cập nhật thông tin không thành công' })
        } else {
            userAccountQuery.refetch()
            clearImageFiles()
        }
    }


    const handleSelectAddress = useMemo(() => (address: Address) => {
        form.setValue('address', address.label)
        form.setValue('longitude', address.longitude)
        form.setValue('latitude', address.latitude)
        setAddressText(address.label)
    }, [])

    if (userAccountQuery.isError) {
        return <Navigate to='..' />
    }

    if (userAccountQuery.isLoading) {
        return (<></>)
    }

    if (userAccountQuery.isError) {
        dispatch({ type: 'alert', payload: 'Lỗi tải thông tin người dùng' })
        return (<></>)
    }

    return (
        <>
            <h3>Thông tin cá nhân</h3>
            {
                userAccount && (
                    <form name="user-information" onSubmit={form.handleSubmit(updateUserAccount)}>
                        <div className="avatar">
                            <input type="file" name="avatar" id='avatar' accept='image/*' onChange={handlePickImageFile} />
                            <label htmlFor="avatar">
                                {
                                    avatarLink ? (
                                        <div className="avatar-picker">
                                            <img src={avatarLink} alt={userAccount.name} />
                                            <div className="change-pic-icon">
                                                <Icon.Camera />
                                            </div>
                                        </div>
                                    ) : 'Hình đại diện'
                                }
                            </label>
                        </div>
                        <div className="field-wrapper">

                            <div className="field">
                                <label htmlFor="name">Họ và tên</label>
                                <input type="text" id="name" {...form.register('name')} />
                                {form.formState.errors.name && <span className="invalid">{form.formState.errors.name.message}</span>}
                            </div>
                            <div className="field">
                                <label htmlFor="gender">Giới tính</label>
                                <select id="gender" {...form.register('gender')}>
                                    <option value="male">Nam</option>
                                    <option value="female">Nữ</option>
                                    <option value="other">Khác</option>
                                </select>
                            </div>
                            <div className="field">
                                <label htmlFor="email">Email</label>
                                <input id="email" type="email" {...form.register('email')} />
                                {form.formState.errors.email && <span className="invalid">{form.formState.errors.email.message}</span>}
                            </div>
                            <div className="field">
                                <label htmlFor="date-of-birth">Ngày sinh</label>
                                <input id="date-of-birth" type="date" {...form.register('dateOfBirth')} />
                            </div>
                            <div className="field">
                                <label htmlFor="address">Địa chỉ</label>
                                <AddressInput addressText={addressText} selectAddressHandler={handleSelectAddress} />
                            </div>
                            <div className="field">
                                <label htmlFor="phone">Số điện thoại</label>
                                <input id="phone" type="tel" {...form.register('phone')} />
                                {form.formState.errors.phone && <span className="invalid">{form.formState.errors.phone.message}</span>}
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="update-btn"
                            style={{ margin: '20px 0' }}
                        >Cập nhật
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
                )
            }
        </>
    )
}

function DeleteAccountSector() {

    const [triggerPopupDeleteAccount, setTriggerPopupDeleteAccount] = useState(false)
    const [, dispatch] = useStore()

    function togglePopupDeleteAccoount() {
        setTriggerPopupDeleteAccount(prevTigger => !prevTigger)
    }

    async function deleteAccountHandler() {
        const success = await UserServices.deleteAccount()
        if (success) {
            LocalStorageUtil.clearToken()
            LocalStorageUtil.restoreDefaultRole()
            dispatch({ type: 'signout' })
        }
    }

    return (
        <>
            <button
                type="button"
                className="delete-account-btn"
                style={{ marginTop: '20px', marginBottom: '100px' }}
                onClick={togglePopupDeleteAccoount}
            >
                <Icon.Trash /> Xóa tài khoản
            </button>
            {
                triggerPopupDeleteAccount &&
                <Popup
                    popupStyle={{ padding: '0', borderRadius: '12px' }}
                    closeHandler={togglePopupDeleteAccoount}
                >
                    <div className="warning-wrapper" style={{ maxWidth: '300px', minWidth: '200px' }}>
                        <div className="content">Xóa tài khoản</div>
                        <hr />
                        <button className="ok" onClick={deleteAccountHandler}>OK</button>
                    </div>
                </Popup>
            }
        </>
    )
}

export default UserAccount