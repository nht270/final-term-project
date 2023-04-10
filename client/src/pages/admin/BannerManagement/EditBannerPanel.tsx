import { joiResolver } from '@hookform/resolvers/joi'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Popup from '../../../compoments/Popup'
import QueryKeyPrefix from '../../../configures/queryKeyPrefix'
import useCreateObjectURL from '../../../hooks/useCreateObjectURL'
import useImageFilePicker from '../../../hooks/useImageFilePicker'
import useStore from '../../../hooks/useStore'
import * as AdminService from '../../../services/admin'
import * as BannerService from '../../../services/banner'
import { createCloudinaryImageLink } from '../../../services/image'
import * as NewsService from '../../../services/news'
import * as ProductService from '../../../services/product'
import * as PromotionService from '../../../services/promotion'
import { updateBannerSchema } from '../../../utils/validate'
import './EditBannerPanel.scss'

type FormValuesToUpdateBanner = AdminService.InformationToUpdateBanner
const TIME_WAIT_INPUT = 400

function EditBannerPanel() {

    const initFormValues: FormValuesToUpdateBanner = useMemo(() => ({ title: '', linkTo: '', image: '' }), [])
    const form = useForm({
        defaultValues: initFormValues,
        resolver: joiResolver(updateBannerSchema)
    })

    const bannerId = String(useParams()['bannerId'] || '')
    const [linkInBanner, setLinkInBanner] = useState(initFormValues.linkTo)
    const [imageUrl, setImageUrl] = useState('')
    const { imageFiles, handlePickImageFile, error: imageFileError, clearError: clearImageFileError } = useImageFilePicker({})
    const imageLocalUrl = useCreateObjectURL(imageFiles[0])
    const navigate = useNavigate()
    const [linkType, setLinkType] = useState('product')
    const searchInputRef = useRef<HTMLInputElement>(null)
    const [searchText, setSearchText] = useState('')
    const [, dispatch] = useStore()
    const [searchedProducts, setSearchedProducts] = useState<ProductService.Product[]>([])
    const [searchedNewsList, setSearchedNewsList] = useState<NewsService.News[]>([])
    const [searchedPromotions, setSearchedPromotions] = useState<PromotionService.Promotion[]>([])
    const updateSearchText = useMemo(() => debounce(setSearchText, TIME_WAIT_INPUT), [])

    const bannerQuery = useQuery(
        [QueryKeyPrefix.GET_BANNER_PREFIX, bannerId],
        () => BannerService.getBanner(bannerId),
        { enabled: bannerId !== '' }
    )

    useEffect(() => {
        if (bannerQuery.data) {
            form.setValue('title', bannerQuery.data.title)
            form.setValue('linkTo', bannerQuery.data.linkTo)
            form.setValue('image', bannerQuery.data.image)
            setLinkInBanner(bannerQuery.data.linkTo)
            setImageUrl(createCloudinaryImageLink(bannerQuery.data.image))
        }
    }, [bannerQuery.data])

    useEffect(() => {
        if (imageLocalUrl) {
            setImageUrl(imageLocalUrl)
        }
    }, [imageFiles, imageLocalUrl])

    const productsQuery = useInfiniteQuery(
        ['search-products', searchText],
        ({ pageParam, queryKey }) => {
            const nextPage = pageParam?.nextPage
            const [, searchString] = queryKey

            return ProductService.getProducts({ page: nextPage, filter: { searchString } })
        },
        { enabled: linkType === 'product' && searchText !== '' }
    )

    const newsListQuery = useInfiniteQuery(
        ['search-news-list', searchText],
        ({ pageParam, queryKey }) => {
            const nextPage = pageParam?.nextPage
            const [, searchString] = queryKey

            return NewsService.searchNewsByTitle(searchString, nextPage)
        },
        { enabled: linkType === 'news' && searchText !== '' }
    )

    const promotionsQuery = useInfiniteQuery(
        ['search-promotions', searchText],
        ({ pageParam, queryKey }) => {
            const nextPage = pageParam?.nextPage
            const [, searchString] = queryKey
            return PromotionService.searchPromotionByTitle(searchString, nextPage)
        },
        { enabled: linkType === 'promotion' && searchText !== '' }
    )

    useEffect(() => {
        if (productsQuery.data) {
            setSearchedProducts(productsQuery.data.pages.flatMap(page => page.data))
        }
    }, [productsQuery.data])

    useEffect(() => {
        if (newsListQuery.data) {
            setSearchedNewsList(newsListQuery.data.pages.flatMap(page => page.data))
        }
    }, [newsListQuery.data])

    useEffect(() => {
        if (promotionsQuery.data) {
            setSearchedPromotions(promotionsQuery.data.pages.flatMap(page => page.data))
        }
    }, [promotionsQuery.data])

    function updateLinkType(e: ChangeEvent) {
        if (!e.target) { return }
        const linkType = (e.target as HTMLSelectElement).value
        setLinkType(linkType)
    }

    function searchInputChangeHandler(e: ChangeEvent) {
        if (!e.target) { return }
        const searchText = (e.target as HTMLInputElement).value
        updateSearchText(searchText)
    }

    function createBannerLink(idOfLink: string, linkType: string) {
        const currentUrl = new URL(window.location.href)
        const currentClientOrigin = currentUrl.origin
        switch (linkType) {
            case 'product':
                return currentClientOrigin + '/product/' + idOfLink
            case 'news':
                return currentClientOrigin + '/news/' + idOfLink
            case 'promotion':
                return currentClientOrigin + '/promotion/' + idOfLink
            default:
                return ''
        }
    }

    function selectSearchItemHandler(idOfLink: string) {
        if (!idOfLink || !linkType) { return }
        const link = createBannerLink(idOfLink, linkType)
        setLinkInBanner(link)
        form.setValue('linkTo', link)
        searchInputRef.current && (searchInputRef.current.value = '')
        setSearchText('')
    }

    async function updateBanner(information: AdminService.InformationToUpdateBanner) {
        dispatch({ type: 'loading', payload: true })
        const success = await AdminService.updateBanner(bannerId, information, imageFiles[0])
        dispatch({ type: 'loading', payload: false })
        dispatch({ type: 'alert', payload: success ? 'Đã cập nhật banner' : 'Lỗi' })
    }

    if (!bannerId || (bannerQuery.isFetched && !bannerQuery.data)) {
        navigate(-1)
        return null
    }

    return (
        <div className="edit-banner-panel">
            <form onSubmit={form.handleSubmit(updateBanner)} >
                <div className="grid" style={{ gap: '10px' }}>
                    <div className="l-6 m-6 s-12 xs-12">
                        <div className="field-wrapper">
                            <label htmlFor="banner-title">Tiêu đề</label>
                            <input type="text" id="banner-title" {...form.register('title')} />
                            {form.formState.errors.title && <span className="invalid">{form.formState.errors.title.message}</span>}
                        </div>
                        <div className="field-wrapper">
                            <label>Ảnh</label>
                            <div className="images-picker-wrapper" style={{ margin: '5px 0' }}>
                                <div className="cover-image-picker">
                                    <input type="file" id="cover-image" className="image-file-input" accept='image/*' onChange={handlePickImageFile} />
                                    <label htmlFor="cover-image" className="image-file-label">
                                        {imageUrl === ''
                                            ? <div className="describe-text">Trống</div>
                                            : <img src={imageUrl} />
                                        }
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="l-6 m-6 s-12 xs-12">
                        <div className="field-wrapper">
                            <label>Liên kết đến</label>
                            <select value={linkType} onChange={updateLinkType}>
                                <option value="product">Sản phẩm</option>
                                <option value="news">Tin tức</option>
                                <option value="promotion">Tin kuyến mãi</option>
                            </select>
                        </div>
                        <div className="field-wrapper">
                            <label>Tìm kiếm</label>
                            <input
                                type="search"
                                placeholder={
                                    linkType === 'product' ? 'Tên sản phẩm' :
                                        linkType === 'news' ? 'Tiêu đề tin tức' :
                                            linkType === 'promotion' ? 'Tiêu đề tin khuyến mãi' : ''
                                }
                                onChange={searchInputChangeHandler}
                                ref={searchInputRef}
                            />
                            {
                                productsQuery.data && linkType === 'product' &&
                                <div className="search-result">
                                    {
                                        searchedProducts.length > 0
                                            ? (
                                                searchedProducts.map(({ name, id }) => (
                                                    <div
                                                        className="search-result-item"
                                                        key={id}
                                                        onClick={() => selectSearchItemHandler(id)}
                                                    >
                                                        {name}
                                                    </div>
                                                ))
                                            ) : (<div>Không tìm thấy sản phẩm nào!!</div>)
                                    }
                                </div>
                            }
                            {
                                newsListQuery.data && linkType === 'news' &&
                                <div className="search-result">
                                    {
                                        searchedNewsList.length > 0
                                            ? (
                                                searchedNewsList.map(({ title, id }) => (
                                                    <div
                                                        className="search-result-item"
                                                        key={id}
                                                        onClick={() => selectSearchItemHandler(id)}
                                                    >
                                                        {title}
                                                    </div>
                                                ))
                                            ) : (<div>Không tìm thấy tin tức nào!!</div>)
                                    }
                                </div>
                            }
                            {
                                promotionsQuery.data && linkType === 'promotion' &&
                                <div className="search-result">
                                    {
                                        searchedPromotions.length > 0
                                            ? (
                                                searchedPromotions.map(({ title, id }) => (
                                                    <div
                                                        className="search-result-item"
                                                        key={id}
                                                        onClick={() => selectSearchItemHandler(id)}
                                                    >
                                                        {title}
                                                    </div>
                                                ))
                                            ) : (<div>Không tìm thấy tin kuyến mãi nào!!</div>)
                                    }
                                </div>
                            }
                        </div>
                        <div className="field-wrapper">
                            {linkInBanner && <><span>Liên kết:</span> <a href={linkInBanner} target='_blank'>{linkInBanner}</a></>}
                        </div>
                    </div>
                </div>
                <Link to="../" className="back">Trở về</Link>
                <button type="submit" className="update">Cập nhật</button>
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

export default EditBannerPanel