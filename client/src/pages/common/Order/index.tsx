import { useQuery } from '@tanstack/react-query'
import { ChangeEvent, MouseEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as BranchService from '../../../services/branch'
import * as OrderService from '../../../services/order'
import * as UserService from '../../../services/user'
import * as ProductService from '../../../services/product'
import * as ProductPriceService from '../../../services/productPrice'
import * as ProductSizeService from '../../../services/productSize'
import * as MapService from '../../../services/map'
import * as CouponService from '../../../services/coupon'
import * as LocalStorageUtil from '../../../utils/localStorage'

import useStore from '../../../hooks/useStore'
import { AdvancedImage } from '@cloudinary/react'
import { createCloudinaryThumb } from '../../../services/image'
import { calculateDeliveryCharge } from '../../../utils/misc'
import Popup from '../../../compoments/Popup'
import { useForm } from 'react-hook-form'
import { joiResolver } from '@hookform/resolvers/joi'
import { customerOfOrderSchema } from '../../../utils/validate'
import QueryKeyPrefix from '../../../configures/queryKeyPrefix'
import { NumberFormatter } from '../../../utils/format'
import useDebounce from '../../../hooks/useDebounce'
import './index.scss'

interface OrderFormValuesNeedValidate {
    customerName: string,
    phone: string,
    email?: string
}

const initInformationOrder: OrderService.InformationToCreateOrder = {
    branchId: '',
    receivedType: 'atShop',
    receivedAddress: '',
    details: [],
    customerName: '',
    phone: ''
}

function Order() {

    const form = useForm<OrderFormValuesNeedValidate>({
        defaultValues: { customerName: '', email: '', phone: '' },
        resolver: joiResolver(customerOfOrderSchema)
    })
    const [receivedAddressCoordinate, setReceivedAddressCoordinate] = useState<MapService.GoongIoCoordinate>({ latitude: '', longitude: '' })
    const jsonOrderDetailsInLocalStorage = String(window.localStorage.getItem('orderDetails') || '')
    const orderDetailsInLocalStorage: OrderService.TemporaryOrderDetail[] = jsonOrderDetailsInLocalStorage !== '' ? JSON.parse(jsonOrderDetailsInLocalStorage) : []
    const [addressSearchText, setAddressSearchText] = useState('')
    const [deliveryDistance, setDeliveryDistance] = useState(0)
    const addressInputRef = useRef<HTMLInputElement>(null)
    const [globalState, dispatch] = useStore()
    const suggestionCoupponWrapperRef = useRef<HTMLDivElement>(null)
    const getBranchesQuery = useQuery(['get-branches'], BranchService.getBranches)
    const userInformationQuery = useQuery(
        [QueryKeyPrefix.GET_USER_INFORMATION_PREFIX],
        UserService.getInformation,
        { enabled: globalState.isSignIn && globalState.role === 'user' }
    )
    const [order, setOrder] = useState({ ...initInformationOrder, details: orderDetailsInLocalStorage })
    const [triggerRelationCoupon, setTriggerCouponRelation] = useState(false)
    const couponInputRef = useRef<HTMLInputElement>(null)
    const [createOrderAlert, setCreateOrderAlert] = useState('')
    const navigate = useNavigate()
    const getTemperaryOrderQuery = useQuery(
        ['get-products', orderDetailsInLocalStorage],
        async () => {
            const productPrices = (await Promise.all(
                orderDetailsInLocalStorage.flatMap(async ({ productPriceId }) => {
                    const productPrice = await ProductPriceService.getProductPrice(productPriceId)
                    return productPrice ? [productPrice] : []
                })
            )).flat()

            const orderDetails = await Promise.all(productPrices.map(async (productPrice, index) => {
                const product = await ProductService.getProduct(productPrice.productId)
                const proudctSize = await ProductSizeService.getProductSize(productPrice.productSizeId)
                return { ...product, price: productPrice.price, productPriceId: productPrice.id, quality: orderDetailsInLocalStorage[index].quality, productSizeName: proudctSize?.name || '' }
            }))

            return orderDetails.flatMap(detail => detail ? [detail] : [])
        }
    )

    const getRelationCoupon = useQuery(
        ['get-relation-coupon', order],
        () => CouponService.getRelationCouponOfOrder(order),
        { enabled: triggerRelationCoupon }
    )

    const addressSearchQuery = useQuery(['search-address', addressSearchText], () => {
        return MapService.searchAddressGoongIo(addressSearchText)
    }, { enabled: addressSearchText !== '' })

    const mountOfDecreaseMoneyQuery = useQuery(
        ['get-mount-of-decrease-money', order.couponCode],
        () => { return order.couponCode ? CouponService.getMountOfDecreaseMoney(order.couponCode, order) : 0 },
        { enabled: !!order.couponCode }
    )

    const deliveryCharge = useMemo(() => calculateDeliveryCharge(deliveryDistance), [deliveryDistance])
    const updateAddressSearchText = useDebounce(setAddressSearchText)

    useEffect(() => {
        if (getBranchesQuery.data) {
            const firstBranch = getBranchesQuery.data[0]
            setOrder(prevOrder => ({
                ...prevOrder,
                branchId: firstBranch.id,
                receivedAddress: firstBranch.address
            }))
            setReceivedAddressCoordinate({
                longitude: firstBranch.longitude,
                latitude: firstBranch.latitude
            })
            addressInputRef.current && (addressInputRef.current.value = firstBranch.address)
        }
    }, [getBranchesQuery.data])

    useEffect(() => {
        if (getBranchesQuery.data && order.receivedType !== 'atShop') {
            const selectedBranch = getBranchesQuery.data.find((branch) => branch.id === order.branchId)
            if (selectedBranch) {
                MapService.getLengthFromOriginToDestinationGoongIo(selectedBranch, receivedAddressCoordinate)
                    .then(distance => {
                        setDeliveryDistance(distance)
                    })
            }
        }
    }, [receivedAddressCoordinate, order.branchId])

    useEffect(() => {
        if (!userInformationQuery.isFetched || !userInformationQuery.data) { return }
        const { name, phone, email } = userInformationQuery.data

        setOrder(prev => ({ ...prev, customerName: name, phone: phone || '', email }))
        form.setValue('customerName', name)
        form.setValue('email', email)
        phone && form.setValue('phone', phone)
    }, [userInformationQuery.isFetched])

    const totalPrice = useMemo(() => {
        if (getTemperaryOrderQuery.data) {
            return getTemperaryOrderQuery.data.reduce((totalPrice, { quality, price }) => totalPrice + quality * price, 0)
        }
        return 0
    }, [getTemperaryOrderQuery.data])

    function updateReceivedType(e: ChangeEvent) {
        if (!e.target) { return }
        const receivedType = (e.target as HTMLSelectElement).value
        setOrder(prevOrder => ({ ...prevOrder, receivedType }))
        if (!addressInputRef.current) { return }

        if (receivedType === 'atShop') {
            if (getBranchesQuery.data) {
                const receivedAddress = getBranchesQuery.data[0].address
                addressInputRef.current.value = receivedAddress
                setOrder(prevOrder => ({ ...prevOrder, receivedAddress }))
            }
        } else {
            if (userInformationQuery.data) {
                const receivedAddress = userInformationQuery.data.address || ''
                const longitude = String(userInformationQuery.data.longitude)
                const latitude = String(userInformationQuery.data.latitude)
                addressInputRef.current.value = receivedAddress
                setOrder(prevOrder => ({ ...prevOrder, receivedAddress }))
                setReceivedAddressCoordinate({ longitude, latitude })
                chooseBranchHasShortestDeliveryDistance(longitude, latitude)
            }
        }
    }

    function updateBranch(e: ChangeEvent) {
        if (!e.target) { return }
        const branchId = (e.target as HTMLSelectElement).value
        setOrder(prevOrder => {
            let receivedAddress = order.receivedAddress
            if (prevOrder.receivedType === 'atShop' && getBranchesQuery.data) {
                const selectedBranch = getBranchesQuery.data.find((branch) => branch.id === branchId)
                receivedAddress = selectedBranch ? selectedBranch.address : receivedAddress
            }
            addressInputRef.current && (addressInputRef.current.value = receivedAddress)
            return { ...prevOrder, branchId, receivedAddress }
        })
    }

    async function chooseAddressItem(e: MouseEvent) {
        if (!e.target || !addressInputRef.current) { return }

        const locationItem = (e.target as HTMLDivElement)
        const address = locationItem.innerHTML
        const longitude = locationItem.dataset.longitude || ''
        const latitude = locationItem.dataset.latitude || ''
        setOrder(prevOrder => ({ ...prevOrder, receivedAddress: address }))
        setReceivedAddressCoordinate({ longitude, latitude })
        addressInputRef.current.value = address
        updateAddressSearchText('')
        chooseBranchHasShortestDeliveryDistance(longitude, latitude)
    }

    async function chooseBranchHasShortestDeliveryDistance(longitude: string, latitude: string) {
        if (getBranchesQuery.data) {
            const distanceFromBranchesToReceivedAddress = await Promise.all(getBranchesQuery.data.map(async (branch) => {
                const distanceFromBranchToReceivedAddress =
                    await MapService.getLengthFromOriginToDestinationGoongIo(
                        { longitude, latitude },
                        { longitude: branch.longitude, latitude: branch.latitude }
                    )
                return { branchId: branch.id, distanceFromBranchToReceivedAddress }
            }))
            if (distanceFromBranchesToReceivedAddress.length === 0) { return }

            const branchHasShortestDistanceToReceivedAddress =
                distanceFromBranchesToReceivedAddress.reduce((branchHasShortestDistance, branch) =>
                    branchHasShortestDistance.distanceFromBranchToReceivedAddress > branch.distanceFromBranchToReceivedAddress
                        ? branch : branchHasShortestDistance
                )
            setOrder(prev => ({ ...prev, branchId: branchHasShortestDistanceToReceivedAddress.branchId }))
        }
    }

    function selectCouponHandler(couponCode: string) {
        if (!couponCode) { return }
        setOrder(prevOrder => ({ ...prevOrder, couponCode }))
        getRelationCoupon.remove()
        couponInputRef.current && (couponInputRef.current.value = couponCode)
        setTriggerCouponRelation(false)
    }

    async function createOrder({ customerName, phone, email }: OrderFormValuesNeedValidate) {

        const orderId = globalState.role === 'user' && globalState.isSignIn
            ? await UserService.createOrder({ ...order, customerName, phone, email }, receivedAddressCoordinate)
            : await OrderService.createOrder({ ...order, customerName, phone, email }, receivedAddressCoordinate)
        if (orderId) {
            window.localStorage.removeItem('orderDetails')
            order.details.forEach(({ productPriceId }) => LocalStorageUtil.deleteCartDetailInLocal(productPriceId))
            setCreateOrderAlert(`Bạn đã đặt hàng thành công, mã đơn hàng #${orderId}`)
        } else {
            dispatch({ type: 'alert', payload: 'Đặt hàng không thành công' })
        }
    }

    if (order.details.length <= 0) {
        return (
            <div className="grid wide">
                <div className="l-12 m-12 s-12 xs-12">
                    Vui lòng chọn sản phẩm đặt hàng
                </div>
            </div>
        )
    }

    return (
        <form onSubmit={form.handleSubmit(createOrder)}>
            <div className='grid wide' style={{ gap: '2rem' }}>
                <div className="l-6 m-6 s-6 xs-12">
                    <div className="order-informations">
                        <h3>Thông tin đặt hàng</h3>
                        <div className="field-wrapper">
                            <label htmlFor="cutomer-name">Họ tên</label>
                            <input type="text" id="cutomer-name" {...form.register('customerName')} />
                            {form.formState.errors.customerName && <span className="invalid">{form.formState.errors.customerName.message}</span>}
                        </div>
                        <div className="field-wrapper">
                            <label htmlFor="phone">Số điện thoại</label>
                            <input type="tel" id="phone" {...form.register('phone')} />
                            {form.formState.errors.phone && <span className="invalid">{form.formState.errors.phone.message}</span>}
                        </div>
                        <div className="field-wrapper">
                            <label htmlFor="email">Email</label>
                            <input type="email" id="email" {...form.register('email')} />
                            {form.formState.errors.email && <span className="invalid">{form.formState.errors.email.message}</span>}
                        </div>
                        <div className="field-wrapper">
                            <label htmlFor="received-type">Cách thức đặt hàng</label>
                            <select id="received-type" value={order.receivedType} onChange={updateReceivedType}>
                                <option value="atShop">Tại cửa hàng</option>
                                <option value="delivery">Giao hàng</option>
                            </select>
                        </div>
                        <div className="field-wrapper" style={{ position: 'relative' }}>
                            <label htmlFor="received-address">Địa chỉ đặt hàng</label>
                            <input
                                type="text"
                                id="received-address"
                                ref={addressInputRef}
                                onChange={(e) => {
                                    if (!e.target) { return }
                                    updateAddressSearchText((e.target as HTMLInputElement).value)
                                }}
                                disabled={order.receivedType === 'atShop'}
                            />
                            {
                                addressSearchQuery.data &&
                                <div className="suggestion-address">
                                    {
                                        addressSearchQuery.data.map(location => {
                                            return (
                                                <div
                                                    key={`${location.longitude},${location.latitude}`}
                                                    className="location-item"
                                                    data-longitude={location.longitude}
                                                    data-latitude={location.latitude}
                                                    onClick={chooseAddressItem}
                                                >
                                                    {location.formattedAddress}
                                                </div>
                                            )
                                        })
                                    }

                                </div>
                            }
                        </div>
                        <div className="field-wrapper">
                            <label htmlFor="branch">Chi nhánh đặt hàng</label>
                            <select id="branch" value={order.branchId} onChange={updateBranch}>
                                {
                                    getBranchesQuery.data &&
                                    getBranchesQuery.data.map(({ name, id }) => <option key={id} value={id}>{name}</option>)
                                }
                            </select>
                        </div>
                        <div className="field-wrapper">
                            <label htmlFor="coupon-code">Sử dụng mã coupon</label>
                            <input
                                type="search"
                                id="coupon-code"
                                ref={couponInputRef}
                                onFocus={() => setTriggerCouponRelation(true)}
                                onBlur={(e) => {
                                    if (suggestionCoupponWrapperRef.current &&
                                        suggestionCoupponWrapperRef.current.contains(e.relatedTarget)) {
                                        return
                                    }
                                    setTriggerCouponRelation(false)
                                }}
                            />
                            {
                                triggerRelationCoupon &&
                                getRelationCoupon.data &&
                                <div className="suggestion-wrapper" ref={suggestionCoupponWrapperRef} tabIndex={0}>
                                    {
                                        getRelationCoupon.data.length > 0
                                            ? getRelationCoupon.data.map(coupon => {
                                                return <CouponTag key={coupon.couponCode} coupon={coupon} selectCouponHandler={selectCouponHandler} />
                                            })
                                            : <div>Không tìm thấy mã coupon cho đơn hàng</div>
                                    }
                                </div>
                            }
                        </div>
                    </div>
                </div>
                <div className="l-6 m-6 s-6 xs-12">
                    <div className="order-detail-wrapper">
                        <h3>Chi tiết đơn hàng</h3>

                        <ul className="order-detail-list">
                            {
                                getTemperaryOrderQuery.data &&
                                getTemperaryOrderQuery.data.map(({ coverImage, productPriceId, productSizeName, name, quality, price }) => {
                                    return (
                                        <li key={productPriceId}>
                                            <AdvancedImage cldImg={createCloudinaryThumb(coverImage || '', 75, 75)} />
                                            <div className="order-information">
                                                <div>{name} | {productSizeName}</div>
                                                <div>{NumberFormatter.decimal(price)} x {quality} = {NumberFormatter.decimal(quality * price)} VNĐ</div>
                                            </div>
                                        </li>
                                    )
                                })
                            }
                        </ul>
                        {
                            getTemperaryOrderQuery.data &&
                            <div>Tổng tiền: {NumberFormatter.decimal(totalPrice)} VNĐ</div>
                        }
                        {
                            order.receivedType !== 'atShop' &&
                            <div>Phi vận chuyển :  {NumberFormatter.decimal(deliveryCharge)}VNĐ</div>
                        }
                        <div>Giảm giá: {NumberFormatter.decimal(mountOfDecreaseMoneyQuery.data || 0)}VNĐ</div>
                        {
                            getTemperaryOrderQuery.data &&
                            <div>Thành tiền: {NumberFormatter.decimal(
                                totalPrice -
                                (mountOfDecreaseMoneyQuery.data || 0) +
                                (order.receivedType !== 'atShop' ? deliveryCharge : 0)
                            )} VNĐ</div>
                        }
                    </div>
                </div>
                <div className="buttons l-12 m-12 s-12 xs-12" style={{ justifyContent: 'flex-end' }}>
                    <button className="create-order" type="submit">Đặt hàng</button>
                </div>
                {
                    createOrderAlert &&
                    <Popup
                        closeHandler={() => {
                            setCreateOrderAlert('')
                            navigate('/home')
                        }}
                        popupStyle={{ padding: '0', borderRadius: '12px' }}
                    >
                        <div className="warning-wrapper">
                            <div className="content">
                                {createOrderAlert}
                            </div>
                            <hr />
                            <button
                                className="ok"
                                onClick={() => {
                                    setCreateOrderAlert('')
                                    navigate('/home')
                                }}
                            >
                                Ok
                            </button>
                        </div>
                    </Popup>
                }
            </div>
        </form>
    )
}


function CouponTag({ coupon, selectCouponHandler }: { coupon: CouponService.Coupon, selectCouponHandler: (couponCode: string) => void }) {
    const beginDate = (new Date(coupon.beginAt)).toLocaleString('vi-VN', { dateStyle: 'short' })
    const finishDate = (new Date(coupon.finishAt)).toLocaleString('vi-VN', { dateStyle: 'short' })
    const getApplyConditionDescribeQuery = useQuery(
        ['get-apply-condition-describe', coupon.couponCode],
        () => CouponService.createApplyConditionDescribe(coupon)
    )

    return (
        <div
            className="suggestion-item"
            key={coupon.couponCode}
            onClick={() => selectCouponHandler(coupon.couponCode)}
        >
            <div className="code">{coupon.couponCode}</div>
            <div className="describe">Giảm {coupon.decrease} {coupon.unit === 'money' ? 'VNĐ' : '%'}</div>
            <div>{getApplyConditionDescribeQuery.data || ''}</div>
            <div style={{ fontSize: 'small' }}>Hạn sử dụng: {beginDate}-{finishDate}</div>
        </div>
    )
}

export default Order