import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import * as StaffService from '../../../services/staff'
import * as BranchService from '../../../services/branch'
import * as ProductService from '../../../services/product'
import * as ProductPriceService from '../../../services/productPrice'
import * as ProductSizeService from '../../../services/productSize'
import './OrderDetail.scss'
import { createCloudinaryThumb } from '../../../services/image'
import { AdvancedImage } from '@cloudinary/react'
import { FormEvent, MouseEvent, useRef, useState } from 'react'
import Popup from '../../../compoments/Popup'
import * as OrderService from '../../../services/order'
import { NumberFormatter } from '../../../utils/format'

function OrderDetail() {
    const orderId = useParams()['orderId']
    const [triggerCancelReasonPopup, setTriggerCancelReasonPopup] = useState(false)
    const [cancelReason, setCancelReason] = useState('')
    const otherCancelReasonInputRef = useRef<HTMLInputElement>(null)
    const orderQuery = useQuery(
        ['get-order', orderId],
        () => OrderService.getOrder(orderId || ''),
        { enabled: !!orderId }
    )

    const getBranchQuery = useQuery(
        ['get-branch'],
        () => BranchService.getBranch(orderQuery.data?.branchId || ''),
        { enabled: !!orderQuery.data }
    )

    const getProductsInOrderDetailsQuery = useQuery(
        ['get-products'],
        async () => {
            if (!orderQuery.data) { return [] }

            const productPrices = (await Promise.all(
                orderQuery.data.details.flatMap(async ({ productPriceId }) => {
                    const productPrice = await ProductPriceService.getProductPrice(productPriceId, { includeDeleted: true })
                    return productPrice ? [productPrice] : []
                })
            )).flat()

            const orderDetails = await Promise.all(productPrices.map(async (productPrice, index) => {
                const product = await ProductService.getProduct(productPrice.productId)
                const proudctSize = await ProductSizeService.getProductSize(productPrice.productSizeId, { includeDeleted: true })
                const quality = orderQuery.data ? orderQuery.data.details[index].quality : 0
                return {
                    ...product,
                    price: productPrice.price,
                    productPriceId: productPrice.id,
                    quality,
                    productSizeName: proudctSize?.name || ''
                }
            }))

            return orderDetails.flatMap(detail => detail ? [detail] : [])
        },
        { enabled: !!orderQuery.data }
    )

    const canVerifyQuery = useQuery(
        ['can-verify', orderId],
        () => orderId ? StaffService.canVerifyOrder(orderId) : false,
        { enabled: !!orderQuery.data && orderQuery.data.status === 'waitVerify' }
    )

    const canDeliveryQuery = useQuery(
        ['can-delivery', orderId],
        () => orderId ? StaffService.canDeliveryOrder(orderId) : false,
        { enabled: !!orderQuery.data && orderQuery.data.status === 'verified' }
    )

    const canVerifyReceivedQuery = useQuery(
        ['can-verify-received', orderId],
        () => orderId ? StaffService.canVerifyReceivedOrder(orderId) : false,
        { enabled: !!orderQuery.data && orderQuery.data.status === 'waitReceive' }
    )

    const canCancelQuery = useQuery(
        ['can-cancel', orderId],
        () => orderId ? StaffService.canCancelOrder(orderId) : false,
        { enabled: !!orderQuery.data && ['waitVerify', 'waitReceive'].includes(orderQuery.data.status) }
    )

    async function verifyOrder(e: MouseEvent) {
        e.preventDefault()
        if (!orderId) { return }
        const success = await StaffService.verifyOrder(orderId)
        if (success) {
            orderQuery.refetch()
        }
    }

    async function deliveryOrder(e: MouseEvent) {
        e.preventDefault()
        if (!orderId) { return }
        const success = await StaffService.deliveryOrder(orderId)
        if (success) {
            orderQuery.refetch()
        }
    }

    async function verifyReceived(e: MouseEvent) {
        e.preventDefault()
        if (!orderId) { return }
        const success = await StaffService.verifyReceivedOrder(orderId)
        if (success) {
            orderQuery.refetch()
        }
    }

    async function cancelOrder(e: FormEvent) {
        e.preventDefault()
        if (!orderId || !cancelReason) { return }

        const success = await StaffService.cancelOrder(orderId, cancelReason)
        if (success) {
            orderQuery.refetch()
        }
        setTriggerCancelReasonPopup(false)
    }

    if (!orderQuery.isFetched ||
        !orderQuery.data ||
        !getBranchQuery.data ||
        !getProductsInOrderDetailsQuery.data) {
        return <div>Loading...</div>
    }

    return (
        <div>
            <h3>Đơn hàng #{orderQuery.data.id}</h3>
            <div className="grid">
                <div className="l-6 m-6 s-12 xs-12">
                    <h4>Sản phẩm đã đặt</h4>
                    <ul className="order-products">
                        {
                            getProductsInOrderDetailsQuery.data.map(({ productPriceId, coverImage, name, price, quality, productSizeName }) => {
                                return (
                                    <li key={productPriceId}>
                                        <AdvancedImage cldImg={createCloudinaryThumb(coverImage || '', 75, 75)} />
                                        <div className="order-information">
                                            <div>{name} | {productSizeName}</div>
                                            <div>{price} x {quality} = {quality * price} VNĐ</div>
                                        </div>
                                    </li>
                                )
                            })
                        }
                    </ul>
                </div>
                <div className="l-6 m-6 s-12 xs-12">
                    <h4>Thông tin đơn hàng</h4>
                    <div className="order-information">
                        <div className="information-field">
                            <span>Họ và tên</span>
                            <span>{orderQuery.data.customerName}</span>
                        </div>
                        <div className="information-field">
                            <span>Số điện thoại</span>
                            <span>{orderQuery.data.phone}</span>
                        </div>
                        <div className="information-field">
                            <span>Email</span>
                            <span>{orderQuery.data.email}</span>
                        </div>
                        <div className="information-field">
                            <span>Cách thức đặt hàng</span>
                            <span>{orderQuery.data.receivedType === 'atShop' ? 'Tại cửa hàng' : 'Giao hàng'}</span>
                        </div>
                        <div className="information-field">
                            <span>Địa chỉ đặt hàng</span>
                            <span>{orderQuery.data.receivedAddress}</span>
                        </div>
                        <div className="information-field">
                            <span>Chi nhánh đặt hàng</span>
                            <span>{getBranchQuery.data.name}</span>
                        </div>
                        <div className="information-field">
                            <span>Mã coupon</span>
                            <span>{orderQuery.data.couponCode}</span>
                        </div>
                        <div className="information-field">
                            <span>Trạng thái</span>
                            <span>
                                {
                                    orderQuery.data.status === 'waitVerify' && 'Đang đợi duyệt'
                                }
                                {
                                    orderQuery.data.status === 'verified' && 'Đã duyệt'
                                }
                                {
                                    orderQuery.data.status === 'waitReceive' && 'Đang đợi nhận hàng'
                                }
                                {
                                    orderQuery.data.status === 'received' && 'Đã nhận hàng'
                                }
                                {
                                    orderQuery.data.status === 'cancelled' && `Đã hủy ${orderQuery.data.note ? `(${orderQuery.data.note})` : ''}`
                                }
                            </span>
                        </div>
                        <div className="information-field">
                            <span>Tổng tiền</span>
                            <span>{NumberFormatter.currency(orderQuery.data.subtotalPrice)}</span>
                        </div>
                        <div className="information-field">
                            <span>Phi vận chuyển</span>
                            <span>{NumberFormatter.currency(orderQuery.data.deliveryCharge)}</span>
                        </div>
                        <div className="information-field">
                            <span>Giảm giá</span>
                            <span>{NumberFormatter.currency(
                                orderQuery.data.subtotalPrice - (orderQuery.data.totalPrice - orderQuery.data.deliveryCharge)
                            )}</span>
                        </div>
                        <div className="information-field">
                            <span>Thành tiền</span>
                            <span>{NumberFormatter.currency(orderQuery.data.totalPrice)}</span>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between'
                            }}
                        >
                            {
                                orderQuery.data.status === 'waitVerify' &&
                                <>
                                    <button
                                        className="verify"
                                        onClick={verifyOrder}
                                        disabled={!canVerifyQuery.data}
                                    >
                                        Duyệt đơn hàng
                                    </button>
                                    <button
                                        onClick={() => setTriggerCancelReasonPopup(true)}
                                        disabled={!canCancelQuery.data}
                                    >
                                        Hủy đơn hàng
                                    </button>
                                </>
                            }
                            {
                                orderQuery.data.status === 'verified' &&
                                <>
                                    <button
                                        className="delivery"
                                        onClick={deliveryOrder}
                                        disabled={!canDeliveryQuery.data}
                                    >
                                        Giao hàng
                                    </button>
                                </>
                            }
                            {
                                orderQuery.data.status === 'waitReceive' &&
                                <>
                                    <button
                                        className="verifyReceived"
                                        onClick={verifyReceived}
                                        disabled={!canVerifyReceivedQuery.data}
                                    >
                                        Xác nhận đã nhận hàng
                                    </button>
                                    <button
                                        onClick={() => setTriggerCancelReasonPopup(true)}
                                        disabled={!canCancelQuery.data}
                                    >
                                        Hủy đơn hàng
                                    </button>
                                </>
                            }
                        </div>
                    </div>
                </div>
            </div>
            {
                triggerCancelReasonPopup &&
                <Popup
                    closeHandler={() => setTriggerCancelReasonPopup(false)}
                >
                    <form id="cancel-order-form" onSubmit={cancelOrder}>
                        <h3>Lý do hủy</h3>
                        <div className="reason-field">
                            <input
                                type="radio"
                                name="cancel-reason"
                                id="customer-not-receive"
                                onChange={(e) => {
                                    if (!e.target) { return }
                                    if ((e.target as HTMLInputElement).checked) {
                                        setCancelReason('Khách hàng không nhận hàng')
                                        otherCancelReasonInputRef.current && (otherCancelReasonInputRef.current.disabled = true)
                                    }
                                }}
                            />
                            <label htmlFor="customer-not-receive">Khách hàng không nhận hàng</label>
                        </div>
                        <div className="reason-field">
                            <input
                                type="radio"
                                name="cancel-reason"
                                id="cant-contact"
                                onChange={(e) => {
                                    if (!e.target) { return }
                                    if ((e.target as HTMLInputElement).checked) {
                                        setCancelReason('Không liên hệ được với khách hàng')
                                        otherCancelReasonInputRef.current && (otherCancelReasonInputRef.current.disabled = true)
                                    }
                                }}
                            />
                            <label htmlFor="cant-contact">Không liên hệ được với khách hàng</label>
                        </div>
                        <div className="reason-field">
                            <input
                                type="radio"
                                name="cancel-reason"
                                id="other-reason"
                                onChange={(e) => {
                                    if (!e.target || !otherCancelReasonInputRef.current) { return }
                                    if ((e.target as HTMLInputElement).checked) {
                                        setCancelReason(otherCancelReasonInputRef.current.value)
                                        otherCancelReasonInputRef.current.disabled = false
                                        otherCancelReasonInputRef.current.focus()
                                    }
                                }}
                            />
                            <label htmlFor="other-reason">Khác</label>
                        </div>
                        <input
                            type="text"
                            name="order-reason"
                            id="cancel-reason"
                            ref={otherCancelReasonInputRef}
                            disabled
                            placeholder='Lý do khác'
                            onChange={(e) => {
                                if (!e.target) { return }
                                const cancelReason = (e.target as HTMLInputElement).value
                                setCancelReason(cancelReason)
                            }}
                        />
                        <input type="submit" value="Hủy đơn hàng" />
                    </form>
                </Popup>
            }
        </div>
    )
}

export default OrderDetail