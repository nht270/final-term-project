import { AdvancedImage } from '@cloudinary/react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { ChangeEvent, MouseEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import '../../../assets/scss/DataTable.scss'
import Dropdown from '../../../compoments/Dropdown'
import * as Icon from '../../../compoments/Icon'
import LoadingIcon from '../../../compoments/Icon/LoadingIcon'
import Popup from '../../../compoments/Popup'
import useAutoFetchNextPage from '../../../hooks/useAutoFecthNextPage'
import useStore from '../../../hooks/useStore'
import * as AdminService from '../../../services/admin'
import { createCloudinaryThumb } from '../../../services/image'
import * as ProductService from '../../../services/product'
import './ProductViewer.scss'

function ProductViewer() {

    const [, dispatch] = useStore()
    const [products, setProducts] = useState<ProductService.Product[]>([])
    const [productFilter, setProductFilter] = useState<ProductService.GetProductFilter>({})
    const [productOrderTypeSelected, setProductOrderTypeSelected] = useState<ProductService.SortType>('newest')
    const productsQuery = useInfiniteQuery(
        ['get-products-query', productFilter, productOrderTypeSelected],
        ({ pageParam, queryKey }) => {
            return ProductService.getProducts({ page: pageParam?.nextPage, filter: productFilter, sort: productOrderTypeSelected })
        },
        {
            getNextPageParam: (lastPage, allPages) => {
                if (lastPage.hasNextPage) { return { nextPage: allPages.length + 1 } }
            }
        }
    )

    const [wouldDeleteProductId, setWoudDeleteProductId] = useState('')
    const [warningDeleteProduct, setWarningDeleteProduct] = useState('')

    const { htmlDockRef, hasNextPageRef } = useAutoFetchNextPage<HTMLDivElement>(productsQuery.fetchNextPage, [products])
    const allStatusButtonRef = useRef<HTMLButtonElement>(null)
    const showStatusButtonRef = useRef<HTMLButtonElement>(null)
    const hideStatusButtonRef = useRef<HTMLButtonElement>(null)
    const searchBoxRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (productsQuery.data) {
            setProducts(productsQuery.data.pages.flatMap(page => page.data))
            hasNextPageRef.current = productsQuery.hasNextPage
        }
    }, [productsQuery.data])

    function changeStatusFilter(e: MouseEvent) {
        if (!e.target) { return }
        const status = (e.target as HTMLButtonElement).dataset.status as 'show' | 'hide' | 'all'
        allStatusButtonRef.current && allStatusButtonRef.current.classList.remove('selected')
        showStatusButtonRef.current && showStatusButtonRef.current.classList.remove('selected')
        hideStatusButtonRef.current && hideStatusButtonRef.current.classList.remove('selected')
        if (status === 'all') {
            allStatusButtonRef.current && allStatusButtonRef.current.classList.add('selected')
        }

        if (status === 'show') {
            showStatusButtonRef.current && showStatusButtonRef.current.classList.add('selected')
        }

        if (status === 'hide') {
            hideStatusButtonRef.current && hideStatusButtonRef.current.classList.add('selected')
        }
        setProductFilter(prevFilter => ({ ...prevFilter, status }))
        productsQuery.refetch()
    }

    function toggleOrderType(e: ChangeEvent) {
        if (!e.target) { return }

        const radioButton = e.target as HTMLInputElement

        if (!radioButton.checked) { return }
        const orderType = radioButton.value
        setProductOrderTypeSelected(orderType as ProductService.SortType)
        productsQuery.refetch()
    }

    const showWarningDeleteProduct = useMemo(() => (productId: string) => {
        setWarningDeleteProduct(`Bạn có muốn xóa sản phẩm #${productId} không?`)
    }, [])

    const deleteProduct = useMemo(() => async (productId: string) => {
        if (productId) {
            dispatch({ type: 'loading', payload: true })
            const result = await AdminService.deleteProduct(productId)
            dispatch({ type: 'loading', payload: false })
            dispatch({ type: 'alert', payload: result ? 'Xóa thành công' : 'Lỗi khi xóa' })
            result && productsQuery.refetch()
        }

        setWarningDeleteProduct('')
        setWoudDeleteProductId('')
    }, [])

    return (
        <>
            <br />
            <Link to="./add" className="add-new"><Icon.Plus /> Thêm sản phẩm</Link>
            <form id="search" onSubmit={(e) => {
                e.preventDefault()
                const searchString = searchBoxRef.current ? searchBoxRef.current.value : ''
                setProductFilter(prevFilter => ({ ...prevFilter, searchString }))
                productsQuery.remove()
            }}>
            </form>
            <div className="product-viewer">
                <div className="grid viewer-panel">
                    <div className="right-side xs-12 s-12 m-12 l-6">
                        <div className="status-bar">
                            <button
                                type="button"
                                className="selected xs-4 s-3 m-3 l-2"
                                data-status="all"
                                onClick={changeStatusFilter}
                                ref={allStatusButtonRef}
                            >
                                Tất cả
                            </button>
                            <button
                                type="button"
                                className="xs-8 s-3 m-3 l-4"
                                data-status="show"
                                onClick={changeStatusFilter}
                                ref={showStatusButtonRef}
                            >
                                Đang kinh doanh</button>
                            <button
                                type="button"
                                className="xs-8 s-3 m-3 l-4"
                                data-status="hide"
                                onClick={changeStatusFilter}
                                ref={hideStatusButtonRef}
                            >
                                Ngừng kinh doanh</button>
                        </div>

                    </div>
                    <div className="left-side xs-12 s-12 m-12 l-6">
                        <div className="grid" style={{ gap: '10px' }}>
                            <div className="search-bar xs-12 s-5 m-5 l-5">
                                <input type="search" form="search" ref={searchBoxRef} />
                                <button style={{ marginLeft: '5px' }} type="submit" form="search" className="search-btn"><Icon.Search /></button>
                            </div>
                            <div className="date-filter xs-0 s-5 m-6 l-6">
                                <input
                                    type="date"
                                    name="date-from"
                                    onChange={(e) => {
                                        if (!e.target) { return }
                                        const fromDate = new Date((e.target as HTMLInputElement).valueAsNumber)
                                        if (fromDate && !isNaN(fromDate.getTime())) {
                                            setProductFilter(prevFilter => ({ ...prevFilter, fromDate }))
                                            productsQuery.remove()
                                        }
                                    }} />
                                <input
                                    style={{ marginLeft: '5px' }}
                                    type="date"
                                    name="date-to"
                                    onChange={(e) => {
                                        if (!e.target) { return }
                                        const toDate = new Date((e.target as HTMLInputElement).valueAsNumber)
                                        if (toDate && !isNaN(toDate.getTime())) {
                                            setProductFilter(prevFilter => ({ ...prevFilter, toDate }))
                                            productsQuery.remove()
                                        }
                                    }}
                                />
                            </div>
                            <div className="sort-select-box xs-12 s-1 m-1 l-1">
                                <Dropdown
                                    label={
                                        <button type="button" className="label">
                                            <Icon.Sort />
                                        </button>
                                    }
                                    content={
                                        <div className="sort-panel" style={{ margin: '5px 0' }}>
                                            <div className="option">
                                                <input type="radio" name="order-type" value="newest" id="newest" onChange={toggleOrderType} checked={productOrderTypeSelected === 'newest'} />
                                                <label htmlFor="newest">Mới nhất</label>
                                            </div>
                                            <div className="option">
                                                <input type="radio" name="order-type" value="oldest" id="oldest" onChange={toggleOrderType} checked={productOrderTypeSelected === 'oldest'} />
                                                <label htmlFor="oldest">Cũ nhất</label>
                                            </div>
                                            <div className="option">
                                                <input type="radio" name="order-type" value="highPopular" id="highPopular" onChange={toggleOrderType} checked={productOrderTypeSelected === 'highPopular'} />
                                                <label htmlFor="highPopular">Phổ biến</label>
                                            </div>
                                            <div className="option">
                                                <input type="radio" name="order-type" value="highRating" id="highRating" onChange={toggleOrderType} checked={productOrderTypeSelected === 'highRating'} />
                                                <label htmlFor="highRating">Đánh giá cao</label>
                                            </div>
                                        </div>
                                    }
                                    noneArrowIcon
                                    placement='bottom-end'
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <br />
                {
                    products.length > 0
                        ? <div className="data-table-wrapper">
                            <table className='data-table'>
                                <thead>
                                    <tr>
                                        <th>Hình ảnh</th>
                                        <th>Id</th>
                                        <th>Tên</th>
                                        <th>Miêu tả</th>
                                        <th>Trạng thái</th>
                                        <th>Loại</th>
                                        <th>Ngày thêm</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        products.map(product =>
                                            <tr key={product.id}>
                                                <td><AdvancedImage cldImg={createCloudinaryThumb(product.coverImage)} alt={product.name} className='image image--quare' /></td>
                                                <td>{product.id}</td>
                                                <td>
                                                    <div className="shorten">
                                                        {product.name}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className='shorten'>
                                                        {product.description}
                                                    </div>
                                                </td>
                                                <td>{product.status === 'show' ? 'Đang kinh doanh' : 'Ngừng kinh doanh'}</td>
                                                <td>{product.categoryName}</td>
                                                <td>{(new Date(product.createdAt)).toLocaleString('vn', { dateStyle: 'short' })}</td>
                                                <td>
                                                    <Dropdown
                                                        label={
                                                            <button className='more' style={{ height: '24px', width: '24px' }}>
                                                                <Icon.HorizontalMore />
                                                            </button>
                                                        }
                                                        content={
                                                            <div className='more-menu'>
                                                                <Link to={'edit/' + product.id}>Chỉnh sửa</Link>
                                                                <a onClick={() => {
                                                                    setWoudDeleteProductId(product.id)
                                                                    showWarningDeleteProduct(product.id)
                                                                }}
                                                                >
                                                                    Xóa
                                                                </a>
                                                            </div>
                                                        }
                                                        noneArrowIcon
                                                        placement='bottom-end'
                                                    />
                                                </td>
                                            </tr>
                                        )
                                    }
                                </tbody>
                            </table>
                            {productsQuery.isFetching ? <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '20px auto' }}><LoadingIcon /></div> : null}
                            <div className='hidden-dock' ref={htmlDockRef}></div>
                        </div>
                        : productsQuery.isFetched
                            ? <span>Không có sản phẩm nào</span>
                            : <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '20px auto' }}><LoadingIcon /></div>
                }
            </div>
            {
                warningDeleteProduct &&
                <Popup
                    closeHandler={() => {
                        setWarningDeleteProduct('')
                        setWoudDeleteProductId('')
                    }}
                >
                    <div className="warning-wrapper">
                        <div className="content">
                            {warningDeleteProduct}
                        </div>
                        <div className="buttons">
                            <button
                                className="confirm"
                                onClick={() => deleteProduct(wouldDeleteProductId)}
                            >
                                Có
                            </button>
                            <button
                                className="cancel"
                                onClick={() => {
                                    setWarningDeleteProduct('')
                                    setWoudDeleteProductId('')
                                }}
                            >
                                Không
                            </button>
                        </div>
                    </div>
                </Popup>
            }
        </>
    )
}

export default ProductViewer