import { useQuery } from '@tanstack/react-query'
import { ChangeEvent, FormEvent, MouseEvent, useEffect, useRef, useState } from 'react'
import Dropdown from '../../../compoments/Dropdown'
import { Check, Pen, Plus, Trash } from '../../../compoments/Icon'
import * as CategorySevice from '../../../services/category'
import * as AdminService from '../../../services/admin'
import './CategorySector.scss'
import useStore from '../../../hooks/useStore'
import Popup from '../../../compoments/Popup'

function CategorySector() {

    const getCategoriesQuery = useQuery(['get-categories'], CategorySevice.getCategories)
    const [editableCategoryIds, setEditableCategoryIds] = useState<string[]>([])
    const [categories, setCategories] = useState<CategorySevice.Category[]>([])
    const addCategoryInputRef = useRef<HTMLInputElement>(null)
    const [deleteCategoryWarning, setDeleteCategoryWarning] = useState({ state: false, message: '', categoryId: '' })
    const [global, dispatch] = useStore()

    useEffect(() => {
        if (getCategoriesQuery.isFetched &&
            getCategoriesQuery.data) {
            setCategories(getCategoriesQuery.data)
        }
    }, [getCategoriesQuery.isFetched, getCategoriesQuery.dataUpdatedAt])

    function enableEditCategoryHandler(e: MouseEvent) {
        if (!e.currentTarget) { return }

        const editButton = e.currentTarget as HTMLButtonElement
        const categoryId = editButton.dataset.categoryId || ''
        setEditableCategoryIds(prev => {
            return prev.includes(categoryId) ? prev : [...prev, categoryId]
        })
    }

    function changeNameHandler(e: ChangeEvent) {
        if (e.target) {
            const categoryNameInput = e.target as HTMLInputElement
            const newCategoryName = categoryNameInput.value
            const categoryId = categoryNameInput.dataset.categoryId
            if (!categoryId) { return }
            setCategories(prevCategories => {
                const oldCategory = prevCategories.find(({ id }) => id === categoryId)
                if (!oldCategory) { return prevCategories }

                const indexOldCategory = prevCategories.indexOf(oldCategory)
                return [
                    ...prevCategories.slice(0, indexOldCategory),
                    { id: categoryId, name: newCategoryName },
                    ...prevCategories.slice(indexOldCategory + 1)
                ]
            })
        }
    }

    async function addCategoryHandler(e: FormEvent) {
        e.preventDefault()
        const addCategoryInput = addCategoryInputRef.current
        if (addCategoryInput && addCategoryInput.value) {
            const categoryName = addCategoryInput.value
            dispatch({ type: 'loading', payload: true })
            const result = await AdminService.addCategory(categoryName)
            dispatch({ type: 'loading', payload: false })
            if (result) {
                addCategoryInput.value = ''
                getCategoriesQuery.refetch()
            } else {
                dispatch({ type: 'alert', payload: 'Lỗi thêm loại sản phẩm' })
            }
        }
    }
    async function updateCategoryHandler(e: MouseEvent) {
        if (!e.currentTarget) { return }

        const confirmButton = e.currentTarget as HTMLButtonElement
        const categoryId = confirmButton.dataset.categoryId || ''
        const category = categories.find(({ id }) => id === categoryId)
        if (category) {
            dispatch({ type: 'loading', payload: true })

            const result = await AdminService.updateCategory(category.id, category.name)
            dispatch({ type: 'loading', payload: false })
            if (result) {
                setEditableCategoryIds(prev => {
                    const indexOfCategory = prev.indexOf(categoryId)
                    if (indexOfCategory >= 0) {
                        const newEditableCategoryIds = [...prev]
                        newEditableCategoryIds.splice(indexOfCategory, 1)
                        return newEditableCategoryIds
                    }
                    return prev
                })
            } else {
                dispatch({ type: 'alert', payload: 'Lỗi cập nhật loại sản phẩm' })
            }
        }
    }

    function warningDeleteCategoryHandler(e: MouseEvent) {
        if (!e.currentTarget) { return }
        const deleteButton = e.currentTarget as HTMLButtonElement
        const categoryId = deleteButton.dataset.categoryId || ''
        if (!categoryId) { return }

        setDeleteCategoryWarning(prevWarning => ({
            state: true,
            message: `Bạn có muốn xóa loại sản phẩm có mã #${categoryId} này không?`,
            categoryId
        }))
    }

    function closeDeleteCategoryWarningHandler() {
        setDeleteCategoryWarning({ state: false, message: '', categoryId: '' })
    }

    async function deleteCategoryHandler(e: MouseEvent) {
        if (!e.target) { return }

        const deleteButton = e.target as HTMLButtonElement
        const categoryId = deleteButton.dataset.categoryId || ''

        if (!categoryId) { return }
        dispatch({ type: 'loading', payload: true })
        const result = await AdminService.deleteCategory(categoryId)
        dispatch({ type: 'loading', payload: false })
        if (result) {
            getCategoriesQuery.refetch()
            closeDeleteCategoryWarningHandler()
        } else {
            dispatch({ type: 'alert', payload: 'Lỗi xóa loại sản phẩm' })
        }
    }

    return (
        <div className="category-sector">
            <br />
            <Dropdown
                label={
                    <a type="button" className="add-new"><Plus /> Thêm loại sản phẩm</a>
                }
                content={
                    <div className="add-category-panel" style={{ marginTop: '5px' }}>
                        <form name="add-category" onSubmit={addCategoryHandler}>
                            <input type="text" name="name" placeholder="Tên loại sản phẩm" ref={addCategoryInputRef} />
                            <input type="submit" value="Thêm" style={{ marginLeft: '5px' }} />
                        </form>
                    </div>
                }
                noneArrowIcon
                appearanceMehtod='pushBelowElement'
            />
            {
                categories.length > 0 ? (
                    <>
                        <div className="category-viewer" style={{ marginTop: '10px' }}>
                            <div className="grid">
                                <div className="xs-4 s-4 m-4 l-4">Id</div>
                                <div className='xs-6 s-6 m-6 l-6'>Tên</div>
                            </div>
                            <ul>
                                {
                                    categories.map(({ id, name }) => {

                                        const editable = editableCategoryIds.includes(id)
                                        return (
                                            <li className="grid" key={id}>
                                                <div className="xs-4 s-4 m-4 l-4">{id}</div>
                                                <input type="text" className="xs-6 s-6 m-6 l-6" value={name} disabled={!editable} data-category-id={id} onChange={changeNameHandler} />
                                                <button className="xs-1 s-1 m-1 l-1" onClick={editable ? updateCategoryHandler : enableEditCategoryHandler} data-category-id={id}>
                                                    {editable ? <Check /> : <Pen />}
                                                </button>
                                                <button className="xs-1 s-1 m-1 l-1" onClick={warningDeleteCategoryHandler} data-category-id={id}><Trash /></button>
                                            </li>
                                        )
                                    }
                                    )
                                }
                            </ul>
                        </div>
                    </>
                ) : (
                    <div className="no-category">Không có loại sản phẩm nào</div>
                )
            }

            {
                deleteCategoryWarning.state &&
                <Popup
                    closeHandler={closeDeleteCategoryWarningHandler}
                >
                    <div className="warning-wrapper">
                        <div className="content">
                            {deleteCategoryWarning.message}
                        </div>
                        <div className="buttons">
                            <button
                                className="confirm"
                                onClick={deleteCategoryHandler}
                                data-category-id={deleteCategoryWarning.categoryId}
                            >
                                Có
                            </button>
                            <button
                                className="cancel"
                                onClick={closeDeleteCategoryWarningHandler}
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

export default CategorySector