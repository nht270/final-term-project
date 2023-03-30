import { useState, MouseEvent, useRef, useEffect, ChangeEvent, FormEvent } from 'react'
import Dropdown from '../../../compoments/Dropdown'
import { Check, Pen, Plus, Trash } from '../../../compoments/Icon'
import * as ProductSizeService from '../../../services/productSize'
import * as AdminService from '../../../services/admin'
import './SizeSector.scss'
import { useQuery } from '@tanstack/react-query'
import useStore from '../../../hooks/useStore'
import Popup from '../../../compoments/Popup'

function SizeSector() {

    const getProductSizesQuery = useQuery(['get-product-sizes'], ProductSizeService.getProductSizes)
    const [editableProductSizeIds, setEditableProductSizeIds] = useState<string[]>([])
    const [productSizes, setProductSizes] = useState<ProductSizeService.ProductSize[]>([])
    const addProductSizeInputRef = useRef<HTMLInputElement>(null)
    const [deleteProductSizeWarning, setDeleteProductSizeWarning] = useState({ state: false, message: '', productSizeId: '' })
    const [, dispatch] = useStore()

    useEffect(() => {
        if (getProductSizesQuery.isFetched &&
            getProductSizesQuery.data) {
            setProductSizes(getProductSizesQuery.data)
        }
    }, [getProductSizesQuery.isFetched, getProductSizesQuery.dataUpdatedAt])

    function enableEditProductSizeHandler(e: MouseEvent) {
        if (!e.currentTarget) { return }

        const editButton = e.currentTarget as HTMLButtonElement
        const productSizeId = editButton.dataset.productSizeId || ''
        setEditableProductSizeIds(prev => {
            return prev.includes(productSizeId) ? prev : [...prev, productSizeId]
        })
    }

    function changeNameHandler(e: ChangeEvent) {
        if (e.target) {
            const productSizeNameInput = e.target as HTMLInputElement
            const newProductSizeName = productSizeNameInput.value
            const productSizeId = productSizeNameInput.dataset.productSizeId
            if (!productSizeId) { return }
            setProductSizes(prevProductSizes => {
                const oldProductSize = prevProductSizes.find(({ id }) => id === productSizeId)
                if (!oldProductSize) { return prevProductSizes }

                const indexOldProductSize = prevProductSizes.indexOf(oldProductSize)
                return [
                    ...prevProductSizes.slice(0, indexOldProductSize),
                    { id: productSizeId, name: newProductSizeName },
                    ...prevProductSizes.slice(indexOldProductSize + 1)
                ]
            })
        }
    }

    async function addProductSizeHandler(e: FormEvent) {
        e.preventDefault()
        const addProductSizeInput = addProductSizeInputRef.current
        if (addProductSizeInput && addProductSizeInput.value) {
            const productSizeName = addProductSizeInput.value
            dispatch({ type: 'loading', payload: true })
            const result = await AdminService.addProductSize(productSizeName)
            dispatch({ type: 'loading', payload: false })
            if (result) {
                addProductSizeInput.value = ''
                getProductSizesQuery.refetch()
            } else {
                dispatch({ type: 'alert', payload: 'Lỗi thêm kích cỡ sản phẩm' })
            }
        }
    }
    async function updateProductSizeHandler(e: MouseEvent) {
        if (!e.currentTarget) { return }

        const confirmButton = e.currentTarget as HTMLButtonElement
        const productSizeId = confirmButton.dataset.productSizeId || ''
        const productSize = productSizes.find(({ id }) => id === productSizeId)
        if (productSize) {
            dispatch({ type: 'loading', payload: true })

            const result = await AdminService.updateProductSize(productSize.id, productSize.name)
            dispatch({ type: 'loading', payload: false })
            if (result) {
                setEditableProductSizeIds(prev => {
                    const indexOfProductSize = prev.indexOf(productSizeId)
                    if (indexOfProductSize >= 0) {
                        const newEditableProductSizeIds = [...prev]
                        newEditableProductSizeIds.splice(indexOfProductSize, 1)
                        return newEditableProductSizeIds
                    }
                    return prev
                })
            } else {
                dispatch({ type: 'alert', payload: 'Lỗi cập nhật kích cỡ sản phẩm' })
            }
        }
    }

    function warningDeleteProductSizeHandler(e: MouseEvent) {
        if (!e.currentTarget) { return }
        const deleteButton = e.currentTarget as HTMLButtonElement
        const productSizeId = deleteButton.dataset.productSizeId || ''
        if (!productSizeId) { return }

        setDeleteProductSizeWarning(prevWarning => ({
            state: true,
            message: `Bạn có muốn xóa kích cỡ sản phẩm có mã #${productSizeId} này không?`,
            productSizeId: productSizeId
        }))
    }

    function closeDeleteProductSizeWarningHandler() {
        setDeleteProductSizeWarning({ state: false, message: '', productSizeId: '' })
    }

    async function deleteProductSizeHandler(e: MouseEvent) {
        if (!e.target) { return }

        const deleteButton = e.target as HTMLButtonElement
        const productSizeId = deleteButton.dataset.productSizeId || ''

        if (!productSizeId) { return }
        dispatch({ type: 'loading', payload: true })
        const result = await AdminService.deleteProductSize(productSizeId)
        dispatch({ type: 'loading', payload: false })
        if (result) {
            getProductSizesQuery.refetch()
            closeDeleteProductSizeWarningHandler()
        } else {
            dispatch({ type: 'alert', payload: 'Lỗi xóa kích cỡ sản phẩm' })
        }
    }

    return (
        <div className="size-sector">
            <br />
            <Dropdown
                label={
                    <a type="button" className="add-new"><Plus /> Thêm kích cỡ sản phẩm</a>
                }
                content={
                    <div className="add-product-size-panel" style={{ marginTop: '5px' }}>
                        <form name="add-product-size" onSubmit={addProductSizeHandler}>
                            <input type="text" name="name" placeholder="Tên kích cỡ sản phẩm" ref={addProductSizeInputRef} />
                            <input type="submit" value="Thêm" style={{ marginLeft: '5px' }} />
                        </form>
                    </div>
                }
                noneArrowIcon
                appearanceMehtod='pushBelowElement'
            />
            {
                productSizes.length > 0 ? (
                    <>
                        <div className="size-viewer" style={{ marginTop: '10px' }}>
                            <div className="grid">
                                <div className="xs-4 s-4 m-4 l-4">Id</div>
                                <div className='xs-6 s-6 m-6 l-6'>Tên</div>
                            </div>
                            <ul>
                                {
                                    productSizes.map(({ id, name }) => {

                                        const editable = editableProductSizeIds.includes(id)
                                        return (
                                            <li className="grid" key={id}>
                                                <div className="xs-4 s-4 m-4 l-4">{id}</div>
                                                <input type="text" className="xs-6 s-6 m-6 l-6" value={name} disabled={!editable} data-product-size-id={id} onChange={changeNameHandler} />
                                                <button className="xs-1 s-1 m-1 l-1" onClick={editable ? updateProductSizeHandler : enableEditProductSizeHandler} data-product-size-id={id}>
                                                    {editable ? <Check /> : <Pen />}
                                                </button>
                                                <button className="xs-1 s-1 m-1 l-1" onClick={warningDeleteProductSizeHandler} data-product-size-id={id}><Trash /></button>
                                            </li>
                                        )
                                    }
                                    )
                                }
                            </ul>
                        </div>
                    </>
                ) : (
                    <div className="no-product-size">Không có kích cỡ sản phẩm nào</div>
                )
            }

            {
                deleteProductSizeWarning.state &&
                <Popup
                    closeHandler={closeDeleteProductSizeWarningHandler}
                >
                    <div className="warning-wrapper">
                        <div className="content">
                            {deleteProductSizeWarning.message}
                        </div>
                        <div className="buttons">
                            <button
                                className="confirm"
                                onClick={deleteProductSizeHandler}
                                data-product-size-id={deleteProductSizeWarning.productSizeId}
                            >
                                Có
                            </button>
                            <button
                                className="cancel"
                                onClick={closeDeleteProductSizeWarningHandler}
                            >
                                Không
                            </button>
                        </div>
                    </div>
                </Popup>
            }
        </div>
    )
}

export default SizeSector