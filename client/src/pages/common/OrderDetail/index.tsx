import { AdvancedImage } from '@cloudinary/react'
import { useQuery } from '@tanstack/react-query'
import { MouseEvent, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import Popup from '../../../compoments/Popup'
import * as BranchService from '../../../services/branch'
import { createCloudinaryThumb } from '../../../services/image'
import * as OrderService from '../../../services/order'
import * as ProductService from '../../../services/product'
import * as ProductPriceService from '../../../services/productPrice'
import * as ProductSizeService from '../../../services/productSize'
import { NumberFormatter } from '../../../utils/format'
import './index.scss'

function OrderDetail() {
    const orderId = useParams()['orderId']
    const [warningMessage, setWarningMessage] = useState('')
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
                const priceAtPurchase = orderQuery.data ? orderQuery.data.details[index].priceAtPurchase : 0
                return {
                    ...product,
                    priceAtPurchase,
                    productPriceId: productPrice.id,
                    quality,
                    productSizeName: proudctSize?.name || ''
                }
            }))

            return orderDetails.flatMap(detail => detail ? [detail] : [])
        },
        { enabled: !!orderQuery.data }
    )

    async function cancelOrder(e: MouseEvent) {
        e.preventDefault()
        if (!orderId) { return }
        const success = await OrderService.cancelOrder(orderId)
        if (success) {
            setWarningMessage('Hủy đơn hàng thành công')
            orderQuery.refetch()
        } else {
            setWarningMessage('Hủy đơn hàng không thành công')
        }
    }

    if (!orderQuery.isFetched) {
        return <div>Loading...</div>
    }

    if (!orderQuery.data ||
        !getBranchQuery.data ||
        !getProductsInOrderDetailsQuery.data) {
        return <div>Không tìm thấy đơn hàng</div>
    }

    return (
        <div>
            <h3>Đơn hàng #{orderQuery.data.id}</h3>
            <div className="grid">
                <div className="l-6 m-6 s-12 xs-12">
                    <h4>Sản phẩm đã đặt</h4>
                    <ul className="order-products">
                        {
                            getProductsInOrderDetailsQuery.data.map(({ productPriceId, coverImage, name, priceAtPurchase, quality, productSizeName }) => {
                                return (
                                    <li key={productPriceId}>
                                        <AdvancedImage cldImg={createCloudinaryThumb(coverImage || '', 75, 75)} />
                                        <div className="order-information">
                                            <div>{name} | {productSizeName}</div>
                                            <div>{priceAtPurchase} x {quality} = {quality * priceAtPurchase} VNĐ</div>
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
                        {
                            orderQuery.data.status === 'waitVerify' &&
                            <button className="cancel" onClick={cancelOrder}>Hủy đơn hàng</button>
                        }
                    </div>
                </div>
            </div>
            {
                warningMessage &&
                <Popup closeHandler={() => setWarningMessage('')}>
                    {
                        warningMessage
                    }
                </Popup>
            }
        </div>
    )
}

export default OrderDetail