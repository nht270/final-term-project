import { joiResolver } from '@hookform/resolvers/joi'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { ChangeEvent, MouseEvent, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'
import { Cancel } from '../../../compoments/Icon'
import Popup from '../../../compoments/Popup'
import QueryKeyPrefix from '../../../configures/queryKeyPrefix'
import useDebounce from '../../../hooks/useDebounce'
import useStore from '../../../hooks/useStore'
import * as AdminService from '../../../services/admin'
import * as BranchService from '../../../services/branch'
import * as CouponService from '../../../services/coupon'
import { Coupon, CouponOnBranch, CouponOnOrder, CouponOnProduct } from '../../../services/coupon'
import * as ProductService from '../../../services/product'
import * as ProductPriceService from '../../../services/productPrice'
import * as ProductSizeService from '../../../services/productSize'
import { getTomorrowString } from '../../../utils/misc'
import { updateCouponShema } from '../../../utils/validate'
import './EditCouponPanel.scss'

type FormValuesToUpdateCoupon = AdminService.InformationToUpdateCoupon

function EditCouponPanel() {
    const initFormValues: FormValuesToUpdateCoupon = useMemo(() => ({
        type: 'order',
        appliedScopes: [],
        beginAt: getTomorrowString(),
        finishAt: getTomorrowString(),
        decrease: 0,
        unit: 'money',
        branchIds: [],
        productPriceIds: [],
        totalPriceFrom: 0,
        totalPriceTo: 0
    }), [])

    const form = useForm({
        defaultValues: initFormValues,
        resolver: joiResolver(updateCouponShema)
    })

    const [appliedScopes, setAppliedScopes] = useState(['branch'])

    const [coupon, setCoupon] = useState<Coupon | null>(null)
    const [selectedBranches, setSelectedBranches] = useState<BranchService.Branch[]>([])
    const [selectedProducts, setSelectedProducts] = useState<{ name: string, productPriceId: string, productSizeName: string }[]>([])
    const [branchSearchText, setBranchSearchText] = useState('')
    const [productSearchText, setProductSearchText] = useState('')
    const [searchedProducts, setSearchedProducts] = useState<ProductService.SearchProductItem[]>([])
    const [, dispatch] = useStore()

    const couponCode = String(useParams()['couponCode']) || ''

    const couponQuery = useQuery(
        [QueryKeyPrefix.GET_COUPON_PREFIX, couponCode],
        () => CouponService.getCoupon(couponCode),
        { enabled: couponCode !== '' }
    )

    const searchBranchQuery = useQuery(
        ['search-branch'],
        () => BranchService.search(branchSearchText),
        { enabled: branchSearchText !== '' }
    )

    const searchProductQuery = useInfiniteQuery(
        ['search-product'],
        async ({ pageParam }) => {
            const nextPage = pageParam?.nextPage
            const getProductsResult = await ProductService.getProducts({ page: nextPage, include: { priceAndSize: true }, filter: { searchString: productSearchText } })
            const destructureBySizeOfProducts = getProductsResult.data.flatMap(({ name, priceSizeCombines }) => {
                if (Array.isArray(priceSizeCombines)) {
                    return priceSizeCombines.map(({ productPriceId, productSizeName }) => ({ name, productPriceId, productSizeName }))
                }
                return []
            })
            return { hasNextPage: getProductsResult.hasNextPage, data: destructureBySizeOfProducts }
        },
        { enabled: productSearchText !== '' }
    )

    useEffect(() => {
        if (searchProductQuery.data) {
            setSearchedProducts(searchProductQuery.data.pages.flatMap(page => page.data))
        }
    }, [searchProductQuery.data])

    const getOldProductPriceQuery = useQuery(
        ['get-old-product-prices'],
        async () => {
            if (coupon && coupon.appliedScopes.includes('product')) {
                const productPriceIds = (coupon as CouponOnProduct).productPriceIds
                const oldProductPrices =
                    await Promise.all(productPriceIds.map(productPriceId => ProductPriceService.getProductPrice(productPriceId)))

                const destructureBySizeOfProducts =
                    (await Promise.all(
                        oldProductPrices
                            .filter(productPrice => !!productPrice)
                            .map(async (productPrice) => {
                                const { productId, productSizeId, id: productPriceId } = productPrice as ProductPriceService.ProductPrice
                                const product = await ProductService.getProduct(productId)
                                const size = await ProductSizeService.getProductSize(productSizeId)
                                if (!product || !size) { return null }
                                return { name: product.name, productPriceId, productSizeName: size.name }
                            })
                    )).flatMap(destructureBySizeOfProduct => {
                        if (destructureBySizeOfProduct) {
                            return [destructureBySizeOfProduct]
                        } else {
                            return []
                        }
                    })
                return destructureBySizeOfProducts
            }
            return []
        }
        , { enabled: !!coupon && coupon.appliedScopes.includes('product') })

    const getOldBranchesQuery = useQuery(
        ['get-old-branches'],
        async () => {
            if (!coupon || !coupon.appliedScopes.includes('branch')) { return [] }
            const branchIds = (coupon as CouponOnBranch).branchIds
            const oldBranches = (await Promise.all(branchIds.map(BranchService.getBranch))).flatMap(branch => !!branch ? [branch] : [])
            return oldBranches
        },
        { enabled: !!coupon && coupon.appliedScopes.includes('branch') }
    )

    useEffect(() => {
        if (couponQuery.isFetched && couponQuery.data) {
            const couponFetched = couponQuery.data
            setCoupon(couponFetched)
            const appliedScopes = Array.isArray(couponFetched.appliedScopes)
                ? couponFetched.appliedScopes
                : couponFetched.appliedScopes.split('.')
            setAppliedScopes(appliedScopes)
            form.setValue('appliedScopes', appliedScopes)
            form.setValue('beginAt', (new Date(couponFetched.beginAt)).toISOString().split('T')[0])
            form.setValue('finishAt', (new Date(couponFetched.finishAt)).toISOString().split('T')[0])
            form.setValue('decrease', couponFetched.decrease)
            form.setValue('type', couponFetched.type)
            form.setValue('unit', couponFetched.unit)

            if (appliedScopes.includes('branch')) {
                form.setValue('branchIds', (couponFetched as CouponOnBranch).branchIds)
            }

            if (appliedScopes.includes('product')) {
                form.setValue('productPriceIds', (couponFetched as CouponOnProduct).productPriceIds)
            }

            if (appliedScopes.includes('order')) {
                form.setValue('totalPriceFrom', (couponFetched as CouponOnOrder).totalPriceFrom)
                form.setValue('totalPriceTo', (couponFetched as CouponOnOrder).totalPriceTo)
            }
        }
    }, [couponQuery.isFetched])

    useEffect(() => {
        if (getOldProductPriceQuery.isFetched && getOldProductPriceQuery.data) {
            setSelectedProducts(getOldProductPriceQuery.data)
        }
    }, [getOldProductPriceQuery.isFetched])

    useEffect(() => {
        if (getOldBranchesQuery.isFetched && getOldBranchesQuery.data) {
            setSelectedBranches(getOldBranchesQuery.data)
        }

    }, [getOldBranchesQuery.isFetched])

    useEffect(() => {
        form.setValue('appliedScopes', appliedScopes)
    }, [appliedScopes])

    function updateAppliedScopes(e: ChangeEvent) {
        if (!e.target) { return }
        const appliedScopeCheckbox = e.target as HTMLInputElement
        const appliedScope = appliedScopeCheckbox.value
        setAppliedScopes(prev => {
            const indexOfAppliedScope = prev.indexOf(appliedScope)
            if (appliedScopeCheckbox.checked) {
                return indexOfAppliedScope >= 0 ? prev : [...prev, appliedScope]
            }

            return [
                ...prev.slice(0, indexOfAppliedScope),
                ...prev.slice(indexOfAppliedScope + 1)
            ]
        })
    }

    function updateBranchSearchText(text: string) {
        setBranchSearchText(text)
        searchBranchQuery.remove()
    }

    function updateProductSearchText(text: string) {
        setProductSearchText(text)
        searchProductQuery.remove()
    }

    function selectProduct(e: MouseEvent) {
        if (!e.target) { return }
        const productItem = e.target as HTMLDivElement
        const id = productItem.id
        if (!id || !searchProductQuery.data) { return }
        const selectedProduct = searchedProducts.find(({ productPriceId }) => id === productPriceId)
        if (!selectedProduct) { return }
        setSelectedProducts(prevProducts => {
            const isExistsProduct = prevProducts.findIndex(({ productPriceId }) => productPriceId === id) >= 0
            if (isExistsProduct) { return prevProducts }
            const products = [...prevProducts, selectedProduct]
            form.setValue('productPriceIds', products.map(({ productPriceId }) => productPriceId))
            return products
        })
    }

    function unselectProduct(e: MouseEvent) {
        if (!e.currentTarget) { return }
        const removeProductButton = e.currentTarget as HTMLDivElement
        const productPriceIdWillRemove = String(removeProductButton.dataset.removeId || '')
        if (!productPriceIdWillRemove) { return }
        setSelectedProducts(prevProducts => {
            const indexOfProductWillRemove = prevProducts.findIndex(({ productPriceId }) => productPriceIdWillRemove === productPriceId)
            if (indexOfProductWillRemove < 0) { return prevProducts }
            const products = [
                ...prevProducts.slice(0, indexOfProductWillRemove),
                ...prevProducts.slice(indexOfProductWillRemove + 1)
            ]
            form.setValue('productPriceIds', products.map(({ productPriceId }) => productPriceId))
            return products
        })
    }

    async function updateCoupon(information: AdminService.InformationToUpdateCoupon) {
        dispatch({ type: 'loading', payload: true })
        const success = await AdminService.updateCoupon(couponCode, information)
        dispatch({ type: 'loading', payload: false })
        dispatch({ type: 'alert', payload: success ? 'Cập nhật thành công' : 'Cập nhật không thành công' })
    }

    function selectBranch(e: MouseEvent) {
        if (!e.target) { return }
        const branchItem = e.target as HTMLDivElement
        const branchId = branchItem.id
        if (!branchId || !searchBranchQuery.data) { return }
        const selectedBranch = searchBranchQuery.data.find(({ id }) => id === branchId)
        if (!selectedBranch) { return }
        setSelectedBranches(prevBranches => {
            const isExistsBranch = prevBranches.findIndex(({ id }) => id === branchId) >= 0
            if (isExistsBranch) { return prevBranches }
            const branches = [...prevBranches, selectedBranch]
            form.setValue('branchIds', branches.map(({ id }) => id))
            return branches
        })
    }

    function unselectBranch(e: MouseEvent) {
        if (!e.currentTarget) { return }
        const removeBranchButton = e.currentTarget as HTMLDivElement
        const branchIdWillRemove = String(removeBranchButton.dataset.removeId || '')
        if (!branchIdWillRemove) { return }
        setSelectedBranches(prevBranches => {
            const indexOfBranchWillRemove = prevBranches.findIndex(({ id }) => branchIdWillRemove === id)
            if (indexOfBranchWillRemove < 0) { return prevBranches }
            const branches = [
                ...prevBranches.slice(0, indexOfBranchWillRemove),
                ...prevBranches.slice(indexOfBranchWillRemove + 1)
            ]
            form.setValue('branchIds', branches.map(({ id }) => id))
            return branches
        })
    }

    const debouceUpdateBranchSearchText = useDebounce(updateBranchSearchText)
    const debouceUpdateProductSearchText = useDebounce(updateProductSearchText)

    return (
        <div className="add-coupon-wrapper">
            <br />
            <form onSubmit={form.handleSubmit(updateCoupon)}>
                <div className="grid" style={{ gap: '10px' }}>
                    <div className="l-6 m-6 s-12 xs-12">
                        <div className="field-wrapper">
                            <label htmlFor="coupon-code">Mã coupon</label>
                            <input
                                type="text"
                                id="coupon-code"
                                name="coupon-code"
                                defaultValue={couponCode}
                                disabled
                            />
                        </div>
                        <div className="field-wrapper">
                            <label htmlFor="coupon-type">Loại coupon</label>
                            <select {...form.register('type')}>
                                <option value="order">Cho đơn hàng</option>
                                <option value="product">Cho sản phẩm</option>
                            </select>
                        </div>
                        <div className="field-wrapper time-wrapper">
                            <label htmlFor="begin-date">Ngày bắt đầu</label>
                            <input
                                type="date"
                                {...form.register('beginAt')}
                            />
                            <label htmlFor="finish-date">Ngày kết thúc</label>
                            <input
                                type="date"
                                {...form.register('finishAt')}
                            />
                            {form.formState.errors.finishAt && <span className="invalid">{form.formState.errors.finishAt.message}</span>}

                        </div>
                        <div className="field-wrapper decrease-wrapper">
                            <label htmlFor="decrease">Giảm</label>
                            <input type="number" {...form.register('decrease')} />
                            <select {...form.register('unit')}>
                                <option value="money">VNĐ</option>
                                <option value="percent">%</option>
                            </select>
                            {form.formState.errors.decrease && <span className="invalid">{form.formState.errors.decrease.message}</span>}
                        </div>
                        <div className="field-wrapper">
                            <label>Phạm vi áp dụng</label>
                            <div>
                                <input type="checkbox"
                                    name="branch-scope"
                                    id="branch-scope"
                                    value="branch"
                                    onChange={updateAppliedScopes}
                                    checked={appliedScopes.includes('branch')} />
                                <label htmlFor="branch-scope">Chi nhánh</label>
                            </div>
                            <div>
                                <input type="checkbox"
                                    name="order-scope"
                                    id="order-scope"
                                    value="order"
                                    onChange={updateAppliedScopes}
                                    checked={appliedScopes.includes('order')} />
                                <label htmlFor="order-scope">Đơn hàng</label>
                            </div>
                            <div>
                                <input type="checkbox"
                                    name="product-scope"
                                    id="product-scope"
                                    value="product"
                                    onChange={updateAppliedScopes}
                                    checked={appliedScopes.includes('product')} />
                                <label htmlFor="product-scope">Sản phẩm</label>
                            </div>
                            {form.formState.errors.appliedScopes && <span className="invalid">{form.formState.errors.appliedScopes.message}</span>}
                        </div>
                    </div>
                    <div className="l-6 m-6 s-12 xs-12">
                        {
                            appliedScopes.includes('branch') &&
                            <div className="field-wrapper">
                                <label>Các chi nhánh được áp dụng</label>
                                <div className="search-wrapper">
                                    <input
                                        type="search"
                                        name="branch-search"
                                        id="branch-search"
                                        placeholder='Nhập tên chi nhánh cần thêm'
                                        onChange={(e) => {
                                            if (!e.target) { return }
                                            const text = (e.target as HTMLInputElement).value
                                            debouceUpdateBranchSearchText(text)
                                        }}
                                    />
                                    {
                                        searchBranchQuery.isFetched &&
                                        searchBranchQuery.data &&
                                        searchBranchQuery.data.length > 0 &&
                                        <div className="search-result">
                                            {
                                                searchBranchQuery.data.map(({ name, id, address }) => (
                                                    <div
                                                        className="search-result-item"
                                                        key={id}
                                                        id={id}
                                                        onClick={selectBranch}
                                                    >
                                                        {name} - {address}
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    }
                                    <ul className="choicese-list">
                                        {
                                            selectedBranches.map(({ name, id }) => (
                                                <li key={id} >
                                                    <span>{name}</span>
                                                    <button type="button" className="remove" data-remove-id={id} onClick={unselectBranch}><Cancel /></button>
                                                </li>
                                            ))
                                        }
                                    </ul>
                                </div>
                            </div>
                        }
                        {
                            appliedScopes.includes('order') &&
                            <div className="coupon-on-branch-condition">
                                <div className="field-wrapper">
                                    <label htmlFor="total-price-from">Giá từ</label>
                                    <input type="number" {...form.register('totalPriceFrom')} />
                                    {form.formState.errors.totalPriceFrom && <span className="invalid">{form.formState.errors.totalPriceFrom.message}</span>}
                                    <label htmlFor="totalprice-to">đến</label>
                                    <input type="number" {...form.register('totalPriceTo')} />
                                    {form.formState.errors.totalPriceTo && <span className="invalid">{form.formState.errors.totalPriceTo.message}</span>}
                                </div>
                            </div>
                        }
                        {
                            appliedScopes.includes('product') &&
                            <div className="field-wrapper">
                                <label>Các sản phẩm được áp dụng</label>
                                <div className="search-wrapper">
                                    <input
                                        type="search"
                                        name="product-search"
                                        id="product-search"
                                        placeholder='Nhập tên sản phẩm cần thêm'
                                        onChange={(e) => {
                                            if (!e.target) { return }
                                            const text = (e.target as HTMLInputElement).value
                                            debouceUpdateProductSearchText(text)
                                        }}
                                    />
                                    {
                                        searchProductQuery.isFetched &&
                                        searchedProducts.length > 0 &&
                                        <div className="search-result">
                                            {
                                                searchedProducts.map(({ name, productSizeName, productPriceId }) => (
                                                    <div
                                                        className="search-result-item"
                                                        key={productPriceId}
                                                        id={productPriceId}
                                                        onClick={selectProduct}
                                                    >
                                                        {name} - {productSizeName}
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    }
                                    <ul className="choicese-list">
                                        {
                                            selectedProducts.map(({ name, productPriceId, productSizeName }) => (
                                                <li key={productPriceId} >
                                                    <span>{name} - {productSizeName}</span>
                                                    <button type="button" className="remove" data-remove-id={productPriceId} onClick={unselectProduct}><Cancel /></button>
                                                </li>
                                            ))
                                        }
                                    </ul>
                                </div>
                            </div>
                        }
                    </div>
                </div>
                <Link to="../" className="back">Trở về</Link>
                <button type="submit" className="update" >Cập nhật</button>
            </form>
        </div>
    )
}

export default EditCouponPanel