import { joiResolver } from '@hookform/resolvers/joi'
import { useQuery } from '@tanstack/react-query'
import { ChangeEvent, MouseEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { Cancel, Plus } from '../../../compoments/Icon'
import useStore from '../../../hooks/useStore'
import * as AdminService from '../../../services/admin'
import * as CategoryService from '../../../services/category'
import * as ProductSizeService from '../../../services/productSize'
import { filterNull } from '../../../utils/filter'
import { addProductShema } from '../../../utils/validate'
import './AddProductPanel.scss'

type FormValuesToAddProduct = AdminService.InformationToCreateProduct & {
    priceInformations: AdminService.InformationToCreateProductPrice[]
}

function AddProductPanel() {
    const initFormValues: FormValuesToAddProduct = useMemo(() =>
        ({ name: '', categoryId: '', description: '', status: 'hide', priceInformations: [] }), []
    )

    const form = useForm({
        defaultValues: initFormValues,
        resolver: joiResolver(addProductShema)
    })
    const sizeAndPriceFieldArray = useFieldArray({ control: form.control, name: 'priceInformations' })
    const categoriesQuery = useQuery(['get-categories'], CategoryService.getCategories)
    const getProductSizesQuery = useQuery(['get-product-sizes'], ProductSizeService.getProductSizes)
    const [imagesFiles, setImageFiles] = useState<(File | null)[]>([])
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
        if (categoriesQuery.isFetched && categoriesQuery.data) {
            const firstCategory = categoriesQuery.data[0]
            form.setValue('categoryId', firstCategory.id)
        }
    }, [categoriesQuery.isFetched])

    function imagePickerHandler(e: ChangeEvent) {
        if (!e.target) { return }

        const fileInput = e.target as HTMLInputElement

        if (fileInput.files === null || fileInput.files.length <= 0) { return }
        const imageFile = fileInput.files[0]
        const fileInputIndex = Number(fileInput.dataset.index) || 0

        setImageFiles(prevFiles => {
            const oldFile = prevFiles[fileInputIndex]
            if (oldFile !== imageFile) {
                const newFiles = [
                    ...prevFiles.slice(0, fileInputIndex),
                    imageFile,
                    ...prevFiles.slice(fileInputIndex + 1)
                ]

                return newFiles
            } else {
                return prevFiles
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
        setImageFiles(prevFiles => ([...prevFiles, null]))
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

        setImageFiles(prevFiles => {
            const newFiles = [
                ...prevFiles.slice(0, imagePickerIndex),
                ...prevFiles.slice(imagePickerIndex + 1)
            ]

            return newFiles
        })
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

    function handleChangeStatus(e: ChangeEvent) {
        if (!e.target) { return }
        const showCheckbox = (e.target as HTMLInputElement)
        form.setValue('status', showCheckbox.checked ? 'show' : 'hide')
    }

    async function addProduct(information: FormValuesToAddProduct) {
        const filteredImageFiles = filterNull(imagesFiles)
        if (filteredImageFiles.length <= 0) {
            setInvalidImageFileMessage('Sản phẩm phải có ít nhất 1 ảnh')
            return
        }
        const coverImageFile = filteredImageFiles[0]
        const anotherImageFiles = filteredImageFiles.slice(1)
        const { priceInformations, ...productInformation } = information
        dispatch({ type: 'loading', payload: true })
        const success = await AdminService.addProduct(productInformation, priceInformations, coverImageFile, anotherImageFiles)
        dispatch({ type: 'loading', payload: false })
        dispatch({ type: 'alert', payload: success ? 'Đã thêm sản phẩm mới' : 'Lỗi' })
    }

    return (
        <div className="add-product-panel" style={{ marginTop: '20px' }}>
            <form onSubmit={form.handleSubmit(addProduct)}>
                <div className="grid" style={{ gap: '10px' }}>
                    <div className="l-6 m-6 s-12 xs-12">
                        <div className="prod-name-wrapper">
                            <label htmlFor="product-name">Tên sản phẩm</label>
                            <input type="text" id="product-name" {...form.register('name')} />
                            {form.formState.errors.name && <span className="invalid">{form.formState.errors.name.message}</span>}
                        </div>
                        <div className="prod-cat-wrapper">
                            <label htmlFor="category">Loại sản phẩm</label>
                            <select id="category" {...form.register('categoryId')}>
                                {
                                    categoriesQuery.isFetched &&
                                    categoriesQuery.data &&
                                    categoriesQuery.data.map(({ id, name }) => <option key={id} value={id}>{name}</option>)
                                }
                            </select>
                        </div>
                        <div className="pro-desc-wrapper">
                            <label htmlFor="description">Miêu tả</label>
                            <textarea cols={30} rows={10} id="description" {...form.register('description')}>
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
                                getProductSizesQuery.isFetched &&
                                getProductSizesQuery.data &&
                                getProductSizesQuery.data.map(({ id, name }) => {
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
                                <input type="checkbox" value="show" onChange={handleChangeStatus} />
                                <label htmlFor="show" className="normalize">Đang kinh doanh</label>
                            </div>
                        </div>
                    </div>
                </div>
                <Link to="../" className="back">Trở về</Link>
                <button type="submit" className="add">Thêm</button>
            </form>
        </div>
    )
}

export default AddProductPanel