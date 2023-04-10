import { joiResolver } from '@hookform/resolvers/joi'
import { useQuery } from '@tanstack/react-query'
import { Editor } from '@tinymce/tinymce-react'
import { MouseEvent, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Popup from '../../../compoments/Popup'
import QueryKeyPrefix from '../../../configures/queryKeyPrefix'
import useCreateObjectURL from '../../../hooks/useCreateObjectURL'
import useImageFilePicker from '../../../hooks/useImageFilePicker'
import useStore from '../../../hooks/useStore'
import * as AdminService from '../../../services/admin'
import * as ImageService from '../../../services/image'
import * as NewsService from '../../../services/news'
import { updateNewsSchema } from '../../../utils/validate'
import './EditNewsPanel.scss'

type FormValuesToUpdateNews = AdminService.InformationToUpdateNews

function EditNewsPanel() {
    const initFormValues: FormValuesToUpdateNews = useMemo(() => ({ content: '', title: '', coverImage: '' }), [])
    const form = useForm({
        defaultValues: initFormValues,
        resolver: joiResolver(updateNewsSchema)
    })

    const [imageUrl, setImageUrl] = useState('')
    const { imageFiles, error: imageFileError, clearError: clearImageFileError, handlePickImageFile } = useImageFilePicker({})
    const imageLocalUrl = useCreateObjectURL(imageFiles[0])
    const navigate = useNavigate()
    const [, dispatch] = useStore()
    const [warning, setWarning] = useState('')
    const newsId = useParams()['newsId'] || ''
    const newsQuery = useQuery([QueryKeyPrefix.GET_NEWS_PREFIX, newsId], () => NewsService.getNews(newsId))

    useEffect(() => {
        if (newsQuery.isFetched && newsQuery.data) {
            const newsFetched = newsQuery.data
            form.setValue('title', newsFetched.title)
            form.setValue('content', newsFetched.content)
            form.setValue('coverImage', newsFetched.coverImage)
            setImageUrl(ImageService.createCloudinaryImageLink(newsFetched.coverImage))
        }
    }, [newsQuery.isFetched])

    useEffect(() => {
        if (imageLocalUrl) {
            setImageUrl(imageLocalUrl)
        }
    }, [imageLocalUrl])

    async function deleteNews(e: MouseEvent) {
        e.preventDefault()
        if (!newsQuery.data || !newsQuery.data.id) { return }
        dispatch({ type: 'loading', payload: true })
        const result = await AdminService.deleteNews(newsQuery.data.id)
        dispatch({ type: 'loading', payload: false })
        if (result) {
            navigate('../')
        } else {
            dispatch({ type: 'alert', payload: 'Xóa thất bại' })
        }
    }

    async function updateNews(information: AdminService.InformationToUpdateNews) {
        dispatch({ type: 'loading', payload: true })
        const result = await AdminService.updateNews(newsId, information, imageFiles[0])
        dispatch({ type: 'loading', payload: false })
        dispatch({ type: 'alert', payload: result ? 'Cập nhật thành công' : 'Cập nhật thất bại' })
    }

    const toggleWarningPopup = useMemo(() => {
        if (newsQuery.data) {
            return () => {
                setWarning(prevWarning => {
                    return !prevWarning ? `Bạn có muốn xóa tin tức #${newsQuery.data?.id || 'unknow'} không?` : ''
                })
            }
        }
    }, [newsQuery.isFetched])

    return (
        <div className="edit-news-panel">
            <form onSubmit={form.handleSubmit(updateNews)}>
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
                                                ? <div className="describe-text">Trống</div>
                                                : <img src={imageUrl} />
                                        }
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="news-title-wrapper">
                            <label htmlFor="news-title">Tiêu đề</label>
                            <input type="text" id="news-title" {...form.register('title')} />
                            {form.formState.errors.title && <span className="invalid">{form.formState.errors.title.message}</span>}
                        </div>
                        <div className="ck-editor-wrapper">
                            <label>Nội dung</label>
                            {
                                newsQuery.isFetched &&
                                newsQuery.data &&
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
                                    initialValue={newsQuery.data.content}
                                    onEditorChange={(text, editor) => {
                                        form.setValue('content', text)
                                    }}
                                />
                            }
                            {form.formState.errors.content && <span className="invalid">{form.formState.errors.content.message}</span>}
                        </div>
                    </div>
                </div>
                <Link to="../" className="back">Trở về</Link>
                <button type="submit" className="update">Cập nhật</button>
                <a className="delete" onClick={toggleWarningPopup}>Xóa</a>
            </form>
            {
                warning &&
                <Popup
                    closeHandler={toggleWarningPopup}
                    popupStyle={{ padding: '0', borderRadius: '12px' }}
                >
                    <div className="warning-wrapper">
                        <div className="content">
                            {warning}
                        </div>
                        <hr />
                        <button
                            className="ok"
                            onClick={deleteNews}
                        >
                            Ok
                        </button>
                    </div>
                </Popup>
            }
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

export default EditNewsPanel