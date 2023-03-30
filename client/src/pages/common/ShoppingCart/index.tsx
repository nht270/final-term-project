import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChangeEvent, MouseEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CartDetail from '../../../compoments/CartDetail'
import { LongArrowLeft, LongArrowRight } from '../../../compoments/Icon'
import Popup from '../../../compoments/Popup'
import * as UserService from '../../../services/user'
import * as ProductPriceService from '../../../services/productPrice'
import * as ProductSizeService from '../../../services/productSize'
import * as ProductService from '../../../services/product'
import * as LocalStorageUtil from '../../../utils/localStorage'
import useStore from '../../../hooks/useStore'
import './index.scss'
import { NumberFormatter } from '../../../utils/format'
import QueryKeyPrefix from '../../../configures/queryKeyPrefix'

function ShoppingCart() {
    const [cartDetails, setCartDetails] = useState<UserService.ExtraCartDetail[]>([])
    const [selectedProductPriceIds, setSelectedProductPriceIds] = useState<string[]>([])
    const [isSelectAll, setIsSelectAll] = useState(false)
    const [warningMessage, setWarningMessage] = useState('')
    const [globalState, dispatch] = useStore()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const getCartDetailsQuery = useQuery(
        ['get-cart-detail'],
        async () => {
            const cart = globalState.isSignIn && globalState.role === 'user'
                ? await UserService.getCart()
                : LocalStorageUtil.getCartInLocal()

            const cartDetails = await Promise.all(cart.map(async ({ productPriceId, quality }) => {
                const productPrice = await ProductPriceService.getProductPrice(productPriceId)
                if (!productPrice) { return null }

                const { productId, productSizeId } = productPrice
                const product = await ProductService.getProduct(productId)
                const productSize = await ProductSizeService.getProductSize(productSizeId)
                if (!product || !productSize) { return null }
                return {
                    productPriceId,
                    quality,
                    price: productPrice.price,
                    productName: product.name,
                    productSizeId: productSize.id,
                    productSizeName: productSize.name,
                    productCoverImage: product.coverImage
                }
            }))

            return cartDetails.flatMap(cartDetail => cartDetail ? [cartDetail] : [])
        }
    )

    const totalPrice = useMemo(() => {
        const totalPrice = selectedProductPriceIds
            .map(productPriceId => {
                const selectedCartDetail = cartDetails
                    .find(cartDetail => cartDetail.productPriceId === productPriceId)
                return !!selectedCartDetail ? selectedCartDetail.price * selectedCartDetail.quality : 0
            })
            .reduce((totalPrice, priceOfSelectCartdetails) => {
                return totalPrice + priceOfSelectCartdetails
            }, 0)

        return totalPrice
    }, [selectedProductPriceIds.length, cartDetails])

    useEffect(() => {
        if (getCartDetailsQuery.data) {
            setCartDetails(getCartDetailsQuery.data)
        }
    }, [getCartDetailsQuery.data])

    function chooseItemHandler(productPriceId: string) {
        setSelectedProductPriceIds(prevIds => prevIds.includes(productPriceId) ? prevIds : [...prevIds, productPriceId])
    }

    function unchooseItemHandler(productPriceId: string) {

        setSelectedProductPriceIds(prevIds => {
            const indexOfPriceId = prevIds.indexOf(productPriceId)
            return indexOfPriceId < 0 ? prevIds : [...prevIds.slice(0, indexOfPriceId), ...prevIds.slice(indexOfPriceId + 1)]
        })
    }

    function toggleCheckboxOfCartItem(e: ChangeEvent) {
        e.stopPropagation()
        if (e.target) {
            const checkbox = e.target as HTMLInputElement
            const itemId = checkbox.id

            if (checkbox.checked) {
                chooseItemHandler(itemId)
            } else {
                unchooseItemHandler(itemId)
            }
        }
    }

    async function onDeleteHandler(productPriceId: string) {
        if (!productPriceId) { return }

        let success = true

        if (globalState.role === 'user' && globalState.isSignIn) {
            success = await UserService.deleteCartDetail(productPriceId)

        } else {
            LocalStorageUtil.deleteCartDetailInLocal(productPriceId)
        }

        if (success) {
            setCartDetails((prevCartDetails) => {
                const indexOfCartDetailBeDeleted = prevCartDetails.findIndex((cartDetail) => cartDetail.productPriceId === productPriceId)
                if (indexOfCartDetailBeDeleted >= 0) {
                    return [
                        ...prevCartDetails.slice(0, indexOfCartDetailBeDeleted),
                        ...prevCartDetails.slice(indexOfCartDetailBeDeleted + 1)
                    ]
                }

                return prevCartDetails
            })
            queryClient.resetQueries([QueryKeyPrefix.GET_CART], { exact: true })
        } else {
            dispatch({ type: 'alert', payload: 'Cập nhật giỏ hàng thất bại' })
        }
    }

    async function onChangeQualityHandler(productPriceId: string, quality: number) {
        if (!productPriceId) { return }
        let success = true

        if (globalState.role === 'user' && globalState.isSignIn) {
            success = await UserService.updateCartDetail(productPriceId, quality)
        } else {
            LocalStorageUtil.updateCartDetailInLocal(productPriceId, quality)
        }

        if (success) {
            setCartDetails(prevCartDetails => {
                const cartDetailBeChangedQuality = prevCartDetails.find((cartDetail) => cartDetail.productPriceId === productPriceId)
                if (cartDetailBeChangedQuality) {
                    const indexOfCartDetailBeChangedQuality = prevCartDetails.indexOf(cartDetailBeChangedQuality)
                    if (indexOfCartDetailBeChangedQuality >= 0) {
                        const newCartDetail = { ...cartDetailBeChangedQuality, quality }
                        return [
                            ...prevCartDetails.slice(0, indexOfCartDetailBeChangedQuality),
                            newCartDetail,
                            ...prevCartDetails.slice(indexOfCartDetailBeChangedQuality + 1)
                        ]
                    }
                }
                return prevCartDetails
            })
        } else {
            if (!success) { setWarningMessage('Lỗi cập nhật') }
        }
    }

    function toogleChoiceAllItemHandler(e: MouseEvent) {
        e.stopPropagation()

        if (isSelectAll) {
            setSelectedProductPriceIds([])
        } else {
            setSelectedProductPriceIds(cartDetails.map(({ productPriceId }) => productPriceId))
        }

        setIsSelectAll(prev => !prev)
    }

    async function saveAndGotoOrderPage(e: MouseEvent) {
        e.preventDefault()
        if (globalState.isSignIn && globalState.role === 'user') {
            const isLocked = await UserService.checkLock()
            if (isLocked) {
                setWarningMessage('Tài khoản đã bị khóa tính năng đặt hàng')
                return
            }
        }
        const orderDetails = cartDetails
            .filter(({ productPriceId }) => selectedProductPriceIds.includes(productPriceId))
            .map(({ productPriceId, quality }) => ({ productPriceId, quality }))
        window.localStorage.setItem('orderDetails', JSON.stringify(orderDetails))
        if (orderDetails.length <= 0) {
            setWarningMessage('Vui lòng chọn sản phẩm để đặt hàng')
        } else {
            navigate('/order')
        }
    }

    return (
        <>
            <div className="grid wide">
                <div className="col l-12 m-12 s-12 xs-12">
                    <div className="shopping-cart">
                        <h2>Giỏ hàng</h2>
                        {
                            cartDetails.length > 0 ? (
                                <>
                                    <div className="cart-wrapper">
                                        <button className="choice-all" onClick={toogleChoiceAllItemHandler}>
                                            {isSelectAll ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                        </button>
                                        {
                                            cartDetails.map((cartDetail) => {
                                                return (
                                                    <div className="item-row" key={cartDetail.productPriceId}>
                                                        <div className="choice-item" style={{ marginRight: '10px' }}>
                                                            <label htmlFor={String(cartDetail.productPriceId)}>
                                                                <input
                                                                    type="checkbox"
                                                                    id={String(cartDetail.productPriceId)}
                                                                    checked={selectedProductPriceIds.includes(cartDetail.productPriceId)}
                                                                    onChange={toggleCheckboxOfCartItem}
                                                                />
                                                            </label>
                                                        </div>
                                                        <CartDetail
                                                            {...cartDetail}
                                                            onChangeQualityHandler={onChangeQualityHandler}
                                                            onDeleteHandler={onDeleteHandler}
                                                        />
                                                    </div>)
                                            })
                                        }
                                    </div>
                                    <div className="total-price price">
                                        Tổng cộng: {NumberFormatter.currency(totalPrice)}
                                    </div>
                                </>
                            ) : (
                                <div className="no-cart-item">Không có sản phẩm nào trong giỏ hàng</div>
                            )
                        }
                        <div className="buttons" style={{ marginTop: '10px' }}>
                            <Link to="/">
                                <div className="go-back">
                                    <LongArrowLeft /> <span>Trang chủ</span>
                                </div>
                            </Link>
                            {
                                cartDetails.length > 0 &&
                                <a onClick={saveAndGotoOrderPage}>
                                    <div className="view-detail">
                                        <span>Đặt hàng</span><LongArrowRight />
                                    </div>
                                </a>
                            }
                        </div>
                    </div>
                </div>
            </div>
            {
                warningMessage &&
                <Popup closeHandler={() => setWarningMessage('')}>
                    <div style={{ margin: '10px 15px' }}>
                        {warningMessage}
                    </div>
                </Popup>
            }
        </>
    )
}

export default ShoppingCart