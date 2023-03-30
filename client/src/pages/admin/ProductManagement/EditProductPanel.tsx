import { joiResolver } from '@hookform/resolvers/joi'
import { useQuery } from '@tanstack/react-query'
import { ChangeEvent, MouseEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Cancel, Plus } from '../../../compoments/Icon'
import QueryKeyPrefix from '../../../configures/queryKeyPrefix'
import useStore from '../../../hooks/useStore'
import * as AdminService from '../../../services/admin'
import * as CategoryService from '../../../services/category'
import { createCloudinaryThumbLink } from '../../../services/image'
import * as ProductService from '../../../services/product'
import * as ProductSizeService from '../../../services/productSize'
import { filterNull } from '../../../utils/filter'
import { updateProductShema } from '../../../utils/validate'
import './EditProductPanel.scss'

type FormValuesToUpdateProduct = AdminService.InformationToUpdateProduct & {
    priceInformations: AdminService.InformationToCreateProductPrice[]
}

function EditProductPanel() {

    const initFormValues: FormValuesToUpdateProduct = useMemo(() =>
        ({ name: '', categoryId: '', description: '', status: 'hide', priceInformations: [] }), []
    )

    const form = useForm({
        defaultValues: initFormValues,
        resolver: joiResolver(updateProductShema)
    })
    const sizeAndPriceFieldArray = useFieldArray({ control: form.control, name: 'priceInformations' })

    const navigate = useNavigate()
    const productId = useParams()['productId']
    const categoriesQuery = useQuery(['get-categories'], CategoryService.getCategories)
    const productSizesQuery = useQuery(['get-product-sizes'], ProductSizeService.getProductSizes)
    const productQuery = useQuery(
        [QueryKeyPrefix.GET_PRODUCT, productId],
        () => ProductService.getProduct(productId || '', { images: true, priceAndSize: true }),
        { enabled: !!productId }
    )
    const [imageStores, setImageStores] = useState<(File | null | string)[]>([])
    const [imageLinks, setImageLinks] = useState<string[]>([''])
    const imageLinksRef = useRef(imageLinks)
    const [invalidImageFileMessage, setInvalidImageFileMessage] = useState('')
    const [, dispatch] = useStore()

    useEffect(() => {
        imageLinksRef.current = imageLinks
    }, [imageLinks])

    useEffect(() => {
        return () => {
            const existsImageLinks = imageLinksRef.current
            for (let imageLink of existsImageLinks) {
                if (imageLink) URL.revokeObjectURL(imageLink)
            }
        }
    }, [])

    useEffect(() => {
        if (productQuery.isFetched && productQuery.data) {
            const fetchedProduct = productQuery.data
            const fetchedImages = fetchedProduct.coverImage ? [fetchedProduct.coverImage] : []
            if (fetchedProduct.images) {
                fetchedImages.push(...fetchedProduct.images)
            }

            setImageLinks(() => {
                return fetchedImages.map((imageId) => createCloudinaryThumbLink(imageId, 250, 250))
            })

            setImageStores(() => fetchedImages)
            form.setValue('name', fetchedProduct.name)
            form.setValue('categoryId', fetchedProduct.categoryId)
            form.setValue('description', fetchedProduct.description)
            form.setValue('status', fetchedProduct.status)
            fetchedProduct.priceSizeCombines && form.setValue('priceInformations', fetchedProduct.priceSizeCombines)

        }
    }, [productQuery.isFetched])

    function imagePickerHandler(e: ChangeEvent) {
        if (!e.target) { return }

        const fileInput = e.target as HTMLInputElement

        if (fileInput.files === null || fileInput.files.length <= 0) { return }
        const imageFile = fileInput.files[0]
        const fileInputIndex = Number(fileInput.dataset.index) || 0

        setImageStores(prevStores => {
            const oldFile = prevStores[fileInputIndex]
            if (oldFile !== imageFile) {
                const newFiles = [
                    ...prevStores.slice(0, fileInputIndex),
                    imageFile,
                    ...prevStores.slice(fileInputIndex + 1)
                ]

                return newFiles
            } else {
                return prevStores
            }
        })

        setImageLinks(prevLinks => {
            const oldLink = prevLinks[fileInputIndex]
            if (oldLink) {
                URL.revokeObjectURL(oldLink)
            }

            const newLink = URL.createObjectURL(imageFile)
            const newLinks = [
                ...prevLinks.slice(0, fileInputIndex),
                newLink,
                ...prevLinks.slice(fileInputIndex + 1)
            ]

            return newLinks
        })
    }

    function addImagePickerHandler() {
        setImageLinks(prevLinks => ([...prevLinks, '']))
        setImageStores(prevFiles => ([...prevFiles, null]))
    }

    function removeImagePickerHandler(e: MouseEvent) {
        if (!e.currentTarget) { return }
        const removeButton = e.currentTarget as HTMLButtonElement
        const imagePickerIndex = Number(removeButton.dataset.index) || 0

        setImageLinks(prevLinks => {
            const oldLink = prevLinks[imagePickerIndex]
            if (oldLink) {
                URL.revokeObjectURL(oldLink)
            }

            const newLinks = [
                ...prevLinks.slice(0, imagePickerIndex),
                ...prevLinks.slice(imagePickerIndex + 1)
            ]
            return newLinks
        })

        setImageStores(prevStores => {
            const newFiles = [
                ...prevStores.slice(0, imagePickerIndex),
                ...prevStores.slice(imagePickerIndex + 1)
            ]

            return newFiles
        })
    }

    function handleChangeStatus(e: ChangeEvent) {
        if (!e.target) { return }
        const showCheckbox = (e.target as HTMLInputElement)
        form.setValue('status', showCheckbox.checked ? 'show' : 'hide')
    }

    async function updateProduct(information: FormValuesToUpdateProduct) {

        const filteredImages = filterNull(imageStores)
        if (!productId) { return }
        if (filteredImages.length <= 0) {
            setInvalidImageFileMessage('Sản phẩm phải có ít nhất 1 ảnh')
            return
        }
        const coverImageFile = typeof filteredImages[0] !== 'string' ? filteredImages[0] : undefined
        const imageFiles = filteredImages.slice(1).flatMap(filteredImage => typeof filteredImage !== 'string' ? [filteredImage] : [])
        const coverImage = typeof filteredImages[0] === 'string' ? filteredImages[0] : ''
        const images = filteredImages.slice(1).flatMap(filteredImage => typeof filteredImage === 'string' ? [filteredImage] : [])
        const { priceInformations, ...productInformation } = information

        dispatch({ type: 'loading', payload: true })
        const result = await AdminService.updateProduct(productId, productInformation, priceInformations, coverImage, images, coverImageFile, imageFiles)
        dispatch({ type: 'loading', payload: false })
        if (result) {
            dispatch({ type: 'alert', payload: 'Cập nhật thành công' })
        } else {
            dispatch({ type: 'alert', payload: 'Cập nhật không thành công' })
        }
    }

    async function deleteProduct(e: MouseEvent) {
        e.preventDefault()
        if (!productId) { return }
        dispatch({ type: 'loading', payload: true })
        const result = await AdminService.deleteProduct(productId)
        dispatch({ type: 'loading', payload: false })
        if (result) {
            navigate('../')
        } else {
            dispatch({ type: 'alert', payload: 'Xóa thất bại' })
        }
    }

    function handleToggleProductSize(e: ChangeEvent) {
        if (!e.target) { return }
        const sizeCheckbox = e.target as HTMLInputElement
        const productSizeId = sizeCheckbox.value
        if (sizeCheckbox.checked) {
            registerSizeAndPriceField(productSizeId)
        } else {
            unregisterSizeAndPriceField(productSizeId)
        }
    }

    function registerSizeAndPriceField(productSizeId: string) {
        const isExistsId = sizeAndPriceFieldArray.fields.findIndex(field => field.productSizeId === productSizeId) >= 0
        if (isExistsId) { return }
        sizeAndPriceFieldArray.append({ productSizeId, price: 0 })
    }

    function unregisterSizeAndPriceField(productSizeId: string) {
        const indexOfRegisteredField = sizeAndPriceFieldArray.fields.findIndex(field => field.productSizeId === productSizeId)
        if (indexOfRegisteredField < 0) { return }
        sizeAndPriceFieldArray.remove(indexOfRegisteredField)
    }

    if (!productId || (productQuery.isFetched && !productQuery.data)) {
        navigate('../')
    }

    return (
        <div className="edit-product-panel" style={{ marginTop: '20px' }}>
            <form onSubmit={form.handleSubmit(updateProduct)}>
                <div className="grid" style={{ gap: '10px' }}>
                    <div className="l-6 m-6 s-12 xs-12">
                        <div className="prod-name-wrapper">
                            <label htmlFor="product-name">Tên sản phẩm</label>
                            <input type="text" id="product-name" {...form.register('name')} />
                            {form.formState.errors.name && <span className="invalid">{form.formState.errors.name.message}</span>}
                        </div>
                        <div className="prod-cat-wrapper">
                            <label htmlFor="category">Loại sản phẩm</label>
                            <select id="category"{...form.register('categoryId')}>
                                {
                                    categoriesQuery.isFetched &&
                                    categoriesQuery.data &&
                                    categoriesQuery.data.map(({ id, name }) => <option key={id} value={id}>{name}</option>)
                                }
                            </select>
                        </div>
                        <div className="pro-desc-wrapper">
                            <label htmlFor="description">Miêu tả</label>
                            <textarea cols={30} rows={10} id="description"{...form.register('description')}>
                            </textarea>
                            {form.formState.errors.description && <span className="invalid">{form.formState.errors.description.message}</span>}
                        </div>
                    </div>
                    <div className="l-6 m-6 s-12 xs-12">
                        <div className="prod-img-wrapper">
                            <label>Hình ảnh</label>
                            <div className="images-picker-wrapper grid" style={{ margin: '5px 0' }}>
                                {
                                    imageLinks.map((imageLink, index) => {
                                        const isCover = index === 0
                                        const classNameForImagePicker = isCover ? 'img-picker cover l-4 m-6 s-6 xs-12' : 'img-picker l-2 m-3 s-3 xs-6'
                                        const fileInputId = 'img-file-' + index
                                        return (
                                            <div className={classNameForImagePicker} key={index}>
                                                <input
                                                    type="file"
                                                    className="image-file-input"
                                                    id={fileInputId}
                                                    accept='image/*'
                                                    onChange={imagePickerHandler}
                                                    data-index={index}
                                                />
                                                <label htmlFor={fileInputId} className="image-file-label">
                                                    {imageLink === ''
                                                        ? (<div className="describe-text">Trống</div>)
                                                        : <img src={imageLink} />
                                                    }
                                                </label>
                                                {(!isCover || imageLink) &&
                                                    <button
                                                        type="button"
                                                        className="remove"
                                                        onClick={removeImagePickerHandler}
                                                        data-index={index}
                                                    >
                                                        <Cancel />
                                                    </button>}
                                            </div>
                                        )
                                    })
                                }
                                <div
                                    className="img-picker l-2 m-3 s-3 xs-6"
                                    onClick={addImagePickerHandler}
                                >
                                    <div><Plus /></div>
                                </div>
                            </div>
                            {invalidImageFileMessage && <span className="invalid">{invalidImageFileMessage}</span>}
                        </div>
                        <div className="prod-sizes-wrapper">
                            <label>Size</label>
                            {
                                productSizesQuery.isFetched &&
                                productSizesQuery.data &&
                                productSizesQuery.data.map(({ id, name }) => {
                                    const indexOfFieldRegistered = sizeAndPriceFieldArray.fields.findIndex(({ productSizeId }) => productSizeId === id)

                                    return (
                                        <div className="size-choose" style={{ marginTop: '5px' }} key={id}>
                                            <div className="size">
                                                {
                                                    indexOfFieldRegistered >= 0
                                                        ? <input type="checkbox" id={`size_${id}`} value={id} {
                                                            ...form.register(`priceInformations.${indexOfFieldRegistered}.productSizeId`, {
                                                                onChange: handleToggleProductSize
                                                            })
                                                        } />
                                                        : <input type="checkbox" id={`size_${id}`} value={id} onChange={handleToggleProductSize} />
                                                }
                                                <label htmlFor={`size_${id}`}>{name}</label>
                                            </div>
                                            {
                                                indexOfFieldRegistered >= 0 &&
                                                <div>
                                                    <input type="number" defaultValue={0}
                                                        {...form.register(`priceInformations.${indexOfFieldRegistered}.price`)} />
                                                    <span> VND</span>
                                                </div>
                                            }
                                        </div>
                                    )
                                })
                            }
                            {form.formState.errors.priceInformations && <span className="invalid">{form.formState.errors.priceInformations.message}</span>}
                        </div>
                        <div className="prod-status-wrapper">
                            <label>Trạng thái</label>
                            <div style={{ marginTop: '10px' }}>
                                {
                                    productQuery.isFetched &&
                                    productQuery.data &&
                                    <>
                                        <input type="checkbox" name="show" id="show" defaultChecked={productQuery.data.status === 'show'} onChange={handleChangeStatus} />
                                        <label htmlFor="show">Đang kinh doanh</label>
                                    </>
                                }
                            </div>
                        </div>
                    </div>
                </div>
                <Link to="../" className="back">Trở về</Link>
                <button className="update" type="submit">Cập nhật</button>
            </form>
        </div>
    )
}

export default EditProductPanel