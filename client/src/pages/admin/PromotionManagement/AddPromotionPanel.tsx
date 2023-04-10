import { joiResolver } from '@hookform/resolvers/joi'
import { useQuery } from '@tanstack/react-query'
import { Editor } from '@tinymce/tinymce-react'
import { MouseEvent, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { Cancel } from '../../../compoments/Icon'
import Popup from '../../../compoments/Popup'
import useCreateObjectURL from '../../../hooks/useCreateObjectURL'
import useDebounce from '../../../hooks/useDebounce'
import useImageFilePicker from '../../../hooks/useImageFilePicker'
import useStore from '../../../hooks/useStore'
import * as AdminService from '../../../services/admin'
import * as CouponService from '../../../services/coupon'
import * as ImageService from '../../../services/image'
import { addPromotionSchema } from '../../../utils/validate'
import './AddPromotionPanel.scss'

type FormValuesToAddPromotion = AdminService.InformationToCreatePromotion

function AddPromotionPanel() {

    const initFormValues: FormValuesToAddPromotion = useMemo(() => ({ title: '', content: '', couponCode: '' }), [])
    const form = useForm({
        defaultValues: initFormValues,
        resolver: joiResolver(addPromotionSchema)
    })

    const { imageFiles, error: imageFileError, clearError: clearImageFileError, handlePickImageFile } = useImageFilePicker({})
    const [invalidImageFileMessage, setInvalidImageFileMessage] = useState('')
    const imageUrl = useCreateObjectURL(imageFiles[0])
    const [couponCode, setCouponCode] = useState('')
    const [couponSearchText, setCouponSearchText] = useState('')
    const [, dispatch] = useStore()
    const searchCouponQuery = useQuery(
        ['search-coupon'],
        () => CouponService.search(couponSearchText),
        { enabled: couponSearchText !== '' }
    )

    async function addPromotion(information: AdminService.InformationToCreatePromotion) {
        if (imageFiles.length <= 0) {
            setInvalidImageFileMessage('Ảnh bìa tin khuyến mãi không thể để trống')
            return
        }
        dispatch({ type: 'loading', payload: true })
        const success = await AdminService.addPromotion(information, imageFiles[0])
        dispatch({ type: 'loading', payload: false })
        dispatch({ type: 'alert', payload: success ? 'Đã thêm tin khuyến mãi' : 'Lỗi' })
    }

    function updateCouponSearchText(text: string) {
        setCouponSearchText(text)
        searchCouponQuery.remove()
    }

    function selectCoupon(e: MouseEvent) {
        if (!e.target) { return }
        const selectedCoupon = String((e.target as HTMLDivElement).id) || ''
        if (!searchCouponQuery) { return }
        setCouponCode(selectedCoupon)
        form.setValue('couponCode', selectedCoupon)
    }

    function unselectCoupon(e: MouseEvent) {
        if (!e.target) { return }
        setCouponCode('')
        form.setValue('couponCode', '')
    }

    const debounceUpdateCouponSearchText = useDebounce(updateCouponSearchText)
    return (
        <div className="add-promotion-panel">
            <br />
            <form onSubmit={form.handleSubmit(addPromotion)}>
                <div className="grid" style={{ gap: '10px' }}>
                    <div className="l-12 m-12 s-12 xs-12">

                        <div className="promotion-img-wrapper">
                            <label>Ảnh bìa</label>
                            <div className="images-picker-wrapper" style={{ margin: '5px 0' }}>
                                <div className="cover-image-picker">
                                    <input type="file" id="cover-image" className="image-file-input" accept='image/*' onChange={handlePickImageFile} />
                                    <label htmlFor="cover-image" className="image-file-label">
                                        {imageUrl === ''
                                            ? (<div className="describe-text">Trống</div>)
                                            : <img src={imageUrl} />
                                        }
                                    </label>
                                </div>
                            </div>
                            {invalidImageFileMessage && <span className="invalid">{invalidImageFileMessage}</span>}
                        </div>
                        <div className="promotion-title-wrapper">
                            <label htmlFor="promotion-title">Tiêu đề</label>
                            <input type="text" {...form.register('title')} />
                            {form.formState.errors.title && <span className="invalid">{form.formState.errors.title.message}</span>}
                        </div>
                        <div className="ck-editor-wrapper">
                            <label>Nội dung</label>
                            <Editor
                                init={{
                                    image_title: true,
                                    file_picker_types: 'image',
                                    plugins: ['image'],
                                    images_upload_handler: async (blobInfo, progress) => {
                                        const link = await ImageService.upload(blobInfo.blob() as File)
                                        return link
                                    }
                                }}
                                onEditorChange={(text, editor) => {
                                    form.setValue('content', text)
                                }}
                            />
                            {form.formState.errors.content && <span className="invalid">{form.formState.errors.content.message}</span>}
                        </div>
                        <div className="field-wrapper">
                            <label>Mã coupon</label>
                            <div className="search-wrapper">
                                <input
                                    type="search"
                                    name="branch-search"
                                    id="branch-search"
                                    placeholder='Nhập mã coupon cần thêm'
                                    onChange={(e) => {
                                        if (!e.target) { return }
                                        const text = (e.target as HTMLInputElement).value
                                        debounceUpdateCouponSearchText(text)
                                    }}
                                />
                                {
                                    searchCouponQuery.isFetched &&
                                    searchCouponQuery.data &&
                                    searchCouponQuery.data.length > 0 &&
                                    <div className="search-result">
                                        {
                                            searchCouponQuery.data.map(({ couponCode }) => (
                                                <div
                                                    className="search-result-item"
                                                    key={couponCode}
                                                    id={couponCode}
                                                    onClick={selectCoupon}
                                                >
                                                    {couponCode}
                                                </div>
                                            ))
                                        }
                                    </div>
                                }
                                {
                                    couponCode &&
                                    <div className='selected-coupon-wrapper'>
                                        <span style={{ marginRight: '10px' }}>Mã coupon đã chọn</span>
                                        <div className="selected-coupon">
                                            <span>{couponCode}</span>
                                            <button type="button" className="remove" onClick={unselectCoupon}><Cancel /></button>
                                        </div>
                                    </div>
                                }
                                {form.formState.errors.couponCode && <span className="invalid">{form.formState.errors.couponCode.message}</span>}
                            </div>
                        </div>
                    </div>

                </div>
                <Link to="../" className="back">Trở về</Link>
                <button type="submit" className="add" >Thêm</button>
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

export default AddPromotionPanel