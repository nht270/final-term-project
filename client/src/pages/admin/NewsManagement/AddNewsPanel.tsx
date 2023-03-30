import { joiResolver } from '@hookform/resolvers/joi'
import { Editor } from '@tinymce/tinymce-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import Popup from '../../../compoments/Popup'
import useCreateObjectURL from '../../../hooks/useCreateObjectURL'
import useImageFilePicker from '../../../hooks/useImageFilePicker'
import useStore from '../../../hooks/useStore'
import * as AdminService from '../../../services/admin'
import * as ImageService from '../../../services/image'
import { addNewsSchema } from '../../../utils/validate'
import './AddNewsPanel.scss'

type FormValuesToAddNews = AdminService.InformationToCreateNews

function AddNewsPanel() {
    const initFormValues: FormValuesToAddNews = useMemo(() => ({ title: '', content: '' }), [])
    const form = useForm({
        defaultValues: initFormValues,
        resolver: joiResolver(addNewsSchema)
    })
    const { imageFiles, error: imageFileError, clearError: clearImageFileError, handlePickImageFile } = useImageFilePicker({})
    const imageUrl = useCreateObjectURL(imageFiles[0])
    const [invalidImageFileMessage, setInvalidImageFileMessage] = useState('')
    const [, dispatch] = useStore()
    async function addNews(information: AdminService.InformationToCreateNews) {
        if (imageFiles.length <= 0) {
            setInvalidImageFileMessage('Ảnh bìa tin tức không thể để trống')
            return
        }

        dispatch({ type: 'loading', payload: true })
        const success = await AdminService.addNews(information, imageFiles[0])
        dispatch({ type: 'loading', payload: false })
        dispatch({ type: 'alert', payload: success ? 'Đã thêm tin tức' : 'Lỗi' })
    }

    return (
        <div className="add-news-panel">
            <form onSubmit={form.handleSubmit(addNews)}>
                <div className="grid" style={{ gap: '10px' }}>
                    <div className="l-12 m-12 s-12 xs-12">
                        <div className="news-img-wrapper">
                            <label>Ảnh bìa</label>
                            <div className="images-picker-wrapper" style={{ margin: '5px 0' }}>
                                <div className="cover-image-picker">
                                    <input type="file" id="cover-image" className="image-file-input" accept='image/*' onChange={handlePickImageFile} />
                                    <label htmlFor="cover-image" className="image-file-label">
                                        {
                                            imageUrl === ''
                                                ? (<div className="describe-text">Trống</div>)
                                                : <img src={imageUrl} />
                                        }
                                    </label>
                                </div>
                                {invalidImageFileMessage && <span className='invalid'>{invalidImageFileMessage}</span>}
                            </div>
                        </div>
                        <div className="news-title-wrapper">
                            <label htmlFor="news-title">Tiêu đề</label>
                            <input type="text" id="news-title" {...form.register('title')} />
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
                                    form.formState.errors.content && form.clearErrors('content')
                                }}
                            />
                            {form.formState.errors.content && <span className="invalid">{form.formState.errors.content.message}</span>}
                        </div>
                    </div>
                </div>
                <Link to="../" className="back">Trở về</Link>
                <button className="add">Thêm</button>
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

export default AddNewsPanel