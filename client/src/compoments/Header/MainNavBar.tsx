import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as CategoryService from '../../services/category'
import * as ProductService from '../../services/product'
import * as ProductPriceService from '../../services/productPrice'
import * as ProductSizeService from '../../services/productSize'
import * as UserService from '../../services/user'
import CartDetail from '../CartDetail'

import { useQuery } from '@tanstack/react-query'
import Tippy from '@tippyjs/react'
import QueryKeyPrefix from '../../configures/queryKeyPrefix'
import useStore from '../../hooks/useStore'
import { NumberFormatter } from '../../utils/format'
import * as LocalStorageUtil from '../../utils/localStorage'
import Dropdown from '../Dropdown'
import * as Icon from '../Icon'

function MainNavBar() {
    return (
        <>
            <MainNavBarDeskTop />
            <MainNavBarMobile />
        </>
    )
}

function MainNavBarDeskTop() {
    const [cartDetails, setCartDetails] = useState<UserService.ExtraCartDetail[]>([])
    const [globalState, dispatch] = useStore()
    const totalPrice = cartDetails.reduce((total, { price, quality }) => total + price * quality, 0)
    const cartDetailsQuery = useQuery(
        [QueryKeyPrefix.GET_CART],
        async () => {

            const cart: UserService.Cart = []
            if (globalState.isSignIn && globalState.role === 'user') {
                const ownCart = await UserService.getCart()
                cart.push(...ownCart)
            } else {
                cart.push(...LocalStorageUtil.getCartInLocal())
            }

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
        },
    )

    const [categories, setCategories] = useState<CategoryService.Category[]>([])
    const categoriesQuery = useQuery([QueryKeyPrefix.GET_CATEGORY], CategoryService.getCategories)

    useEffect(() => {
        if (categoriesQuery.isFetched && categoriesQuery.data) {
            setCategories(categoriesQuery.data)
        }
    }, [categoriesQuery.isFetched])

    useEffect(() => {
        if (cartDetailsQuery.data) {
            setCartDetails(cartDetailsQuery.data)
        }
    }, [cartDetailsQuery.data])

    async function onDeleteCartDetailHandler(productPriceId: string) {
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
        } else {
            dispatch({ type: 'alert', payload: 'Cập nhật giỏ hàng thất bại' })
        }
    }

    async function onChangeQualityCartDetailHandler(productPriceId: string, quality: number) {

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
            dispatch({ type: 'alert', payload: 'Cập nhật giỏ hàng thất bại' })
        }
    }

    return (
        <>
            <div className="main-navbar-desktop">
                <div className="grid wide">
                    <div className="col l-1 m-1 s-1">
                        <Link to="/">
                            <div className="brand-logo">
                                <span style={{ marginRight: '3px' }}>Ace</span> <Icon.Coffee />
                            </div>
                        </Link>
                    </div>
                    <div className="col l-11 m-11 s-11 menu-wrapper">
                        <div className="menu">
                            <Link className="menu-item" to='/'>Trang chủ</Link>
                            <a className="menu-item">
                                <Dropdown
                                    label={
                                        <div className='nav-dropdown'>Thực đơn</div>
                                    }

                                    content={
                                        <div className='nav-dropdown-menu'>
                                            {
                                                categories.map(({ name, id }) =>
                                                    <Link to={`category/${id}`} key={id}>
                                                        <div className="nav-dropdown-item">{name}</div>
                                                    </Link>
                                                )
                                            }
                                        </div>
                                    }
                                    showMenuWhenHover
                                />
                            </a>
                            <Link className="menu-item" to='news'>Tin tức</Link>
                            <Link className="menu-item" to='promotion'>Khuyến mãi</Link>
                            <Link className="menu-item" to='/find-order'>Kiểm tra đơn hàng</Link>
                            <a className="menu-item" href='#about'>Giới thiệu</a>
                        </div>
                        <div className="search" style={{ marginLeft: '15px' }}>
                            <label htmlFor="toggle-search-bar">
                                <Icon.Search />
                            </label>
                        </div>
                        <Tippy
                            trigger='click'
                            placement='bottom-end'
                            interactive
                            arrow
                            content={
                                <div style={{
                                    background: 'white',
                                    padding: '10px 15px',
                                    borderRadius: '8px',
                                    maxHeight: '400px',
                                    minHeight: '300px',
                                    width: '450px',
                                    boxShadow: '0px 0px 6px #eee',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    <h3 style={{ margin: '10px' }} >Giỏ hàng</h3>
                                    {
                                        cartDetails.length > 0
                                            ? (
                                                <>
                                                    <div className="cart-wrapper" style={{ maxHeight: '300px' }}>
                                                        {
                                                            cartDetails.map(cartDetail =>
                                                                <CartDetail
                                                                    {...cartDetail}
                                                                    onDeleteHandler={onDeleteCartDetailHandler}
                                                                    onChangeQualityHandler={onChangeQualityCartDetailHandler}
                                                                    key={cartDetail.productPriceId} />
                                                            )
                                                        }
                                                    </div>
                                                    <div className="more-info" style={{ marginTop: 'auto' }}>
                                                        <div className="total-price price">
                                                            Tổng cộng: {NumberFormatter.currency(totalPrice)}
                                                        </div>
                                                        <Link to="/cart">
                                                            <div className="view-detail">
                                                                <span>Xem chi tiết</span><Icon.LongArrowRight />
                                                            </div>
                                                        </Link>
                                                    </div>
                                                </>
                                            )
                                            : (
                                                <div className="no-cart-item">Không có sản phẩm nào trong giỏ hàng</div>
                                            )
                                    }
                                </div>
                            }>
                            <div className="cart">
                                <Icon.Cart />
                                <div className='cart-detail-count'>{cartDetails.length}</div>
                            </div>
                        </Tippy>
                    </div>
                </div>
            </div>
            <input type="checkbox" id="toggle-search-bar" />
            <div className="search-bar-desktop">
                <form action="/search" name="search-desktop">
                    <div className="grid wide inner-searchbar">
                        <Icon.Search />
                        <input type="text" name="q" placeholder='Nhập tên sản phẩm cần tìm' />
                        <label htmlFor="toggle-search-bar">
                            <Icon.Cancel />
                        </label>
                    </div>
                </form>
            </div>
        </>
    )
}

function MainNavBarMobile() {

    const [categories, setCategories] = useState<CategoryService.Category[]>([])
    const categoriesQuery = useQuery([QueryKeyPrefix.GET_CATEGORY], CategoryService.getCategories)

    useEffect(() => {
        if (categoriesQuery.isFetched && categoriesQuery.data) {
            setCategories(categoriesQuery.data)
        }
    }, [categoriesQuery.isFetched])

    return (
        <div className="main-navbar-mobile">

            <div className="nav-menu">
                <input type="checkbox" id="nav-menu" />
                <label className="menu-icon" htmlFor='nav-menu'>
                    <Icon.Line />
                    <Icon.Line />
                </label>
                <div className="nav-menu-list">
                    <div className="menu-item">
                        <form action="/search">
                            <div className="search-bar">
                                <Icon.Search />
                                <input type="text" name="q" placeholder='Nhập tên sản phẩm cần tìm' />
                            </div>
                        </form>
                    </div>
                    <div className="menu-item">
                        <Link to='/'>Trang chủ</Link>
                    </div>
                    <div className="menu-item">
                        <Dropdown
                            label={'Thực đơn'}
                            content={
                                categories.map(({ id, name }) => {
                                    return (
                                        <Link to={`/category/${id}`} key={id}>
                                            <div className="sub-menu-item">{name}</div>
                                        </Link>
                                    )
                                })
                            }
                            labelWrapperCss={{ width: '100vw' }}
                            appearanceMehtod='pushBelowElement'
                        />
                    </div>
                    <div className="menu-item">
                        <Link to='/news'>Tin tức</Link>
                    </div>
                    <div className="menu-item">
                        <Link to='/promotion'>Khuyến mãi</Link>
                    </div>
                    <div className="menu-item">
                        <Link to='/find-order'>Kiểm tra đơn hàng</Link>
                    </div>
                    <div className="menu-item">
                        <a href='#about'>Giới thiệu</a>
                    </div>
                </div>
            </div>
            <Link to='/'>
                <div className="brand-logo">
                    <span style={{ marginRight: '3px' }}>Ace</span> <Icon.Coffee />
                </div>
            </Link>
            <Link to="/cart">
                <div className="cart">
                    <Icon.Cart />
                </div>
            </Link>
        </div>
    )
}

export default MainNavBar