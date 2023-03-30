import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChangeEvent, FocusEvent, MouseEvent, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import * as Icon from '../../../compoments/Icon'
import * as UserService from '../../../services/user'
import * as ProductService from '../../../services/product'
import * as LocalStorageUtil from '../../../utils/localStorage'
import * as RatingService from '../../../services/rating'
import './index.scss'
import ProductImagePreview from './ProductImagePreview'
import RatingSector from './RatingSector'
import { NumberFormatter } from '../../../utils/format'
import QueryKeyPrefix from '../../../configures/queryKeyPrefix'

function ProductDetail() {

    const LIMIT_OF_PRODUCT_QUALITY = 10
    const { productId = '' } = useParams()
    const productQuery = useQuery(
        [QueryKeyPrefix.GET_PRODUCT, productId],
        () => ProductService.getProduct(productId, { images: true, priceAndSize: true }),
        { enabled: productId !== '' }
    )
    const getAverageStarQuery = useQuery(['get-average-star', productId], () => RatingService.getAverageStar(productId))
    const [product, setProduct] = useState<ProductService.Product>()
    const [selectedProductSizeId, setSelectedProductSizeId] = useState('')
    const [productQuality, setProductQuality] = useState(1)
    const [editableNumber, setEditableNumber] = useState('1')
    const queryClient = useQueryClient()

    async function addToCartHandler(e: MouseEvent) {
        e.preventDefault()
        if (!product || !product.priceSizeCombines || product.status === 'hide') { return }
        const selectedPriceSizeCombine = product.priceSizeCombines.find(({ productSizeId }) => productSizeId === selectedProductSizeId)
        if (!selectedPriceSizeCombine) { return }
        const role = LocalStorageUtil.getRole()
        if (role === 'user') {
            await UserService.addToCart(selectedPriceSizeCombine.productPriceId, productQuality)
        }

        LocalStorageUtil.addToCartInLocal(selectedPriceSizeCombine.productPriceId, productQuality)
        queryClient.resetQueries([QueryKeyPrefix.GET_CART], { exact: true })
    }

    useEffect(() => {
        if (productQuery.isFetched && productQuery.data) {
            const fetchedProduct = productQuery.data
            setProduct(fetchedProduct)
            if (fetchedProduct.priceSizeCombines &&
                fetchedProduct.priceSizeCombines.length > 0) {
                setSelectedProductSizeId(fetchedProduct.priceSizeCombines[0].productSizeId)
            }
        }
    }, [productQuery.isFetched])

    function changeSize(e: MouseEvent) {
        if (!e.target) { return }
        const productSizeId = (e.target as HTMLButtonElement).id
        setSelectedProductSizeId(productSizeId)
    }

    function increaseProductQuality() {
        setProductQuality(prevQuality => {
            if (productQuality < LIMIT_OF_PRODUCT_QUALITY) {
                setEditableNumber(String(prevQuality + 1))
                return prevQuality + 1
            } else {
                setEditableNumber(String(prevQuality))
                return prevQuality
            }
        })
    }

    function decreaseProductQuality() {
        setProductQuality(prevQuality => {
            if (productQuality > 1) {
                setEditableNumber(String(prevQuality - 1))
                return prevQuality - 1
            } else {
                setEditableNumber(String(prevQuality))
                return prevQuality
            }
        })
    }

    function changeProductQuality(newQuality: number) {
        setProductQuality(prevQuality => {
            if (newQuality > 0) {
                if (newQuality > LIMIT_OF_PRODUCT_QUALITY) {
                    setEditableNumber(String(LIMIT_OF_PRODUCT_QUALITY))
                    return LIMIT_OF_PRODUCT_QUALITY
                } else {
                    setEditableNumber(String(newQuality))
                    return newQuality
                }
            } else {
                setEditableNumber(String(1))
                return 1
            }
        })
    }

    function editProductQuality(e: ChangeEvent) {
        if (e.target) {
            const qualityInput = e.target as HTMLInputElement
            const newValue = qualityInput.value
            setEditableNumber(newValue)
        }
    }

    function updateProductQuality(e: FocusEvent) {
        if (e.target) {
            const qualityInput = e.target as HTMLInputElement
            const newQuality = Number(qualityInput.value)
            if (!Number.isNaN(newQuality)) {
                changeProductQuality(newQuality)

            } else {
                setEditableNumber(String(productQuality))
            }
        }
    }

    if (product) {
        return (
            <div className="grid wide" style={{ justifyContent: 'center' }}>
                <div className="col l-12 m-12 s-12 xs-11">
                    <h2 className='title'>
                        <Link to="/">
                            <div className="breadcrumb">Trang chủ</div>
                        </Link>
                        <div className="slug">/</div>
                        <Link to={`/category/${product.categoryId}`}>
                            <div className="breadcrumb">{product.categoryName}</div>
                        </Link>
                        <div className="slug">/</div>
                        <div className="breadcrumb main">{product.name}</div>
                    </h2>
                </div>
                <div className="col l-6 m-6 s-12 xs-12">
                    <ProductImagePreview images={[product.coverImage, ...(product.images || [])]} />
                </div>
                <div className="col l-6 m-6 s-12 xs-11 product-detail-info">
                    <div className="product-name">{product.name}</div>
                    {
                        getAverageStarQuery.data &&
                        <div className="star">
                            {getAverageStarQuery.data} <Icon.BoldStar />
                        </div>
                    }
                    {
                        product.priceSizeCombines &&
                        <>
                            <div className="product-price price">{NumberFormatter.currency(product.priceSizeCombines.find(({ productSizeId }) => productSizeId === selectedProductSizeId)?.price || 0)}</div>
                            <div className="product-size-wrapper">
                                {
                                    product.priceSizeCombines.map(({ productSizeName, productSizeId }) => {
                                        return (
                                            <button
                                                type="button"
                                                className={
                                                    productSizeId === selectedProductSizeId
                                                        ? 'product-size selected'
                                                        : 'product-size'
                                                }
                                                key={productSizeId}
                                                id={productSizeId}
                                                onClick={changeSize}
                                            >
                                                {productSizeName}
                                            </button>
                                        )
                                    })
                                }
                            </div>
                        </>
                    }
                    <div className="product-description">
                        Miêu tả: {product.description}
                    </div>
                    {
                        product.status !== 'hide' ?
                            (<>
                                <div className="product-quality">
                                    <button
                                        className="decrease-control"
                                        onClick={decreaseProductQuality}
                                    >
                                        <Icon.Minus />
                                    </button>
                                    <input
                                        type="number"
                                        name="quality"
                                        value={editableNumber}
                                        onChange={editProductQuality}
                                        onBlur={updateProductQuality}
                                    />
                                    <button
                                        className="increase-control"
                                        onClick={increaseProductQuality}
                                    >
                                        <Icon.Plus />
                                    </button>
                                </div>
                                <button type="button" className="addToCart" onClick={addToCartHandler}>
                                    <Icon.Plus />
                                    <span>Thêm vào giỏ hàng</span>
                                </button>
                            </>) : (
                                <div style={{ fontSize: 'large', color: '#ffc107' }}>Sản phẩm ngừng kinh doanh</div>
                            )
                    }
                </div>
                <div className="col l-12 m-12 s-12 xs-11 product-rating">
                    <RatingSector productId={productId} />
                </div>
            </div>
        )
    } else {
        return <div className="no-product">Khong co san pham nay</div>
    }
}

export default ProductDetail