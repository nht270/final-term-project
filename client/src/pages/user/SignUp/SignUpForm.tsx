import { joiResolver } from '@hookform/resolvers/joi'
import { useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import AddressInput, { Address } from '../../../compoments/AddressInput'
import { Check, Coffee, LongArrowLeft, LongArrowRight, Plus } from '../../../compoments/Icon'
import Popup from '../../../compoments/Popup'
import useCreateObjectURL from '../../../hooks/useCreateObjectURL'
import useImageFilePicker from '../../../hooks/useImageFilePicker'
import useStore from '../../../hooks/useStore'
import * as SignUpService from '../../../services/signUp'
import * as UserServices from '../../../services/user'
import { additionalInfoForUserSignUpSchema, basicInfoForUserSignUpSchema } from '../../../utils/validate'
import './index.scss'

type BasicSignUpInformation = {
    avatarFile?: File,
    name: string,
    email: string,
    password: string,
}

type StageFunctions = {
    submitHandler?: (values: Partial<SignUpService.InformationToSignUpUserAccount>) => void
}

type SignUpFormForBasicInformationProps = BasicSignUpInformation & StageFunctions & {
    formName?: string
}

type AdditionalSignUpInformation = {
    address?: string,
    phone?: string,
    gender: UserServices.Gender,
    dateOfBirth: Date | string,
    longitude?: string,
    latitude?: string
}

type SignUpFormForAdditionalInformationProps = AdditionalSignUpInformation & StageFunctions

function SignUpForm() {
    const initalUserInformationForSignUp: SignUpService.InformationToSignUpUserAccount = {
        name: '',
        phone: '',
        password: '',
        email: '',
        gender: 'male',
        dateOfBirth: (new Date()).toISOString().split('T')[0],
    }

    const [signUpInformation, setSignUpInformation] = useState(initalUserInformationForSignUp)
    const [messageForSignUpSuccess, setMessageForSignUpSuccess] = useState('')
    const [, dispatch] = useStore()
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const stages = [
        <SignUpFormForBasicInfo
            {...signUpInformation}
            submitHandler={handelNextStep}
            formName='basic'
        />,
        <SignUpFormForAdditionalInfo
            {...signUpInformation}
            submitHandler={finishHandler}
        />
    ]
    const stageNames = useMemo(() => ['basic', 'additional'], [])

    function handelNextStep(values: Partial<SignUpService.InformationToSignUpUserAccount>) {
        setSignUpInformation(prev => ({ ...prev, ...values }))
        setCurrentStepIndex(prevStep => ++prevStep)
    }

    function backStepHandler() {
        setSignUpInformation(prevInfo => ({ ...prevInfo, password: '' }))
        setCurrentStepIndex(prevStep => --prevStep)
    }

    async function finishHandler(values: Partial<SignUpService.InformationToSignUpUserAccount>) {
        setSignUpInformation(prev => ({ ...prev, ...values }))
        try {
            dispatch({ type: 'loading', payload: true })
            const signUpSuccess = await SignUpService.signUp({ ...signUpInformation, ...values })
            dispatch({ type: 'loading', payload: false })
            if (signUpSuccess) {
                setMessageForSignUpSuccess('Đăng ký thành công, cần xác thực email để bắt đầu sử dụng tài khoản')
            } else {
                dispatch({ type: 'alert', payload: 'Đăng ký không thành công' })
            }
        } catch (error) {
            dispatch({ type: 'loading', payload: false })
            dispatch({ type: 'alert', payload: 'Lỗi máy chủ' })
        }
    }

    return (
        <div className="sign-up-form">
            <div className="brand-logo">
                <Link to="/">
                    <div className="shop-logo" style={{ marginLeft: '-24px' }}>
                        <Plus /><Coffee />
                    </div>
                </Link>
            </div>
            <div className="multi-step-form">
                <div className="step-count">{`${currentStepIndex + 1}/${stages.length}`}</div>
                <div className="stage">
                    {
                        stages[currentStepIndex] || ''
                    }
                </div>
                <div className="buttons">

                    {
                        currentStepIndex !== 0 &&
                        <button type="button" className="btn back-btn" onClick={backStepHandler} ><LongArrowLeft /></button>
                    }

                    {
                        currentStepIndex === stages.length - 1 ? (
                            <button
                                type="submit"
                                className="btn finish-btn"
                                form={stageNames[currentStepIndex]}
                            >
                                <Check />Hoàn tất
                            </button>
                        ) : (
                            <div>

                                <button
                                    type="submit"
                                    form={stageNames[currentStepIndex]}
                                    className={
                                        currentStepIndex === 0
                                            ? 'btn next-btn center'
                                            : 'btn next-btn'
                                    }
                                >
                                    <LongArrowRight />
                                </button>
                            </div>
                        )
                    }
                </div>
            </div>
            {
                messageForSignUpSuccess !== '' &&
                <Popup closeHandler={() => setMessageForSignUpSuccess('')}>
                    <div>
                        {messageForSignUpSuccess}
                    </div>
                </Popup>
            }
        </div>
    )
}

function SignUpFormForBasicInfo({ avatarFile, name, email, submitHandler, formName }: SignUpFormForBasicInformationProps) {

    const { imageFiles, handlePickImageFile, error: imageFileError, clearError: clearImageFileError } =
        useImageFilePicker({ initValue: avatarFile ? [avatarFile] : [] })

    const initFormValues = { name, email, password: '', repeatPassword: '' }

    const { formState, register, handleSubmit, setError } = useForm({
        defaultValues: initFormValues,
        resolver: joiResolver(basicInfoForUserSignUpSchema),
    })

    const imageUrl = useCreateObjectURL(imageFiles[0])
    const formRef = useRef<HTMLFormElement>(null)

    async function submitForm(values: typeof initFormValues) {
        const isExistEmail = await SignUpService.checkExistsEmail(values.email)
        if (isExistEmail) {
            setError('email', { message: 'Email đã được sử dụng để đăng ký' })
        } else {
            submitHandler && submitHandler({ ...values, avatarFile: imageFiles[0] })
        }
    }

    return (
        <form action='#' name={formName} id={formName} onSubmit={handleSubmit(submitForm)} ref={formRef}>
            <div className="avatar">
                <input
                    type="file"
                    name="avatar"
                    id='avatar' accept='image/*'
                    onChange={handlePickImageFile}
                />
                <label htmlFor="avatar">
                    {imageUrl ? <img src={imageUrl} /> : 'Ảnh đại diện'}
                </label>
            </div>
            <input
                type="text"
                placeholder='Họ và tên'
                autoFocus
                {...register('name')}
            />
            {formState.errors.name && <span className="invalid">{formState.errors.name.message}</span>}
            <input
                type="email"
                placeholder='Email'
                {...register('email')}
            />
            {formState.errors.email && <span className="invalid">{formState.errors.email.message}</span>}
            <input
                type="password"
                placeholder='Mật khẩu'
                {...register('password')}
            />
            {formState.errors.password && <span className="invalid">{formState.errors.password.message}</span>}
            <input
                type="password"
                placeholder='Nhập lại mật khẩu'
                {...register('repeatPassword')}
            />
            {formState.errors.repeatPassword && <span className="invalid">{formState.errors.repeatPassword.message}</span>}
            <input type="submit" hidden />
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

function SignUpFormForAdditionalInfo({ address, phone, gender, dateOfBirth, longitude, latitude, submitHandler }: SignUpFormForAdditionalInformationProps) {
    const initFormValues = { address, phone, gender, dateOfBirth, longitude, latitude }
    const { formState, setValue, register, handleSubmit } = useForm({
        defaultValues: initFormValues,
        resolver: joiResolver(additionalInfoForUserSignUpSchema)
    })

    const [addressText, setAddessText] = useState('')

    function handleSelectAddress({ label, longitude, latitude }: Address) {
        setValue('address', label)
        setValue('longitude', longitude)
        setValue('latitude', latitude)
        setAddessText(label)
    }

    return (
        <form onSubmit={handleSubmit(values => {
            submitHandler && submitHandler(values)
        })}>
            <div className="address-wrapper">
                <AddressInput selectAddressHandler={handleSelectAddress} placeholder='Địa chỉ' maxWidth={400} addressText={addressText} />
            </div>
            <input
                type="tel"
                placeholder='Số điện thoại'
                {...register('phone')}
            />
            {formState.errors.phone && <span className="invalid">{formState.errors.phone.message}</span>}
            <div className="gender">
                Giới tính &nbsp;&nbsp;
                <select
                    {...register('gender')}
                >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                </select>
            </div>
            <div className="date-of-birth">
                Ngày sinh &nbsp;&nbsp;
                <input
                    type="date"
                    {...register('dateOfBirth', { valueAsDate: true })}
                />
            </div>
            <input type="submit" hidden />
        </form>
    )
}

export default SignUpForm