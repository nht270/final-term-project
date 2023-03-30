import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import * as UserService from '../../../services/user'
import * as BranchService from '../../../services/branch'
import * as ProductService from '../../../services/product'
import * as ProductPriceService from '../../../services/productPrice'
import * as ProductSizeService from '../../../services/productSize'
import * as OrderService from '../../../services/order'
import './OrderDetail.scss'
import { createCloudinaryThumb } from '../../../services/image'
import { AdvancedImage } from '@cloudinary/react'
import { MouseEvent } from 'react'
import useStore from '../../../hooks/useStore'
import { NumberFormatter } from '../../../utils/format'

function OrderDetail() {
    const orderId = useParams()['orderId']
    const [, dispatch] = useStore()
    const navigate = useNavigate()
    const getOrderQuery = useQuery(
        ['get-order', orderId],
        () => OrderService.getOrder(orderId || ''),
        { enabled: !!orderId }
    )

    const getBranchQuery = useQuery(
        ['get-branch'],
        () => BranchService.getBranch(getOrderQuery.data?.branchId || ''),
        { enabled: !!getOrderQuery.data }
    )

    const getProductsInOrderDetailsQuery = useQuery(
        ['get-products'],
        async () => {
            if (!getOrderQuery.data) { return [] }

            const productPrices = (await Promise.all(
                getOrderQuery.data.details.flatMap(async ({ productPriceId }) => {
                    const productPrice = await ProductPriceService.getProductPrice(productPriceId, { includeDeleted: true })
                    return productPrice ? [productPrice] : []
                })
            )).flat()

            const orderDetails = await Promise.all(productPrices.map(async (productPrice, index) => {
                const product = await ProductService.getProduct(productPrice.productId)
                const proudctSize = await ProductSizeService.getProductSize(productPrice.productSizeId, { includeDeleted: true })
                const quality = getOrderQuery.data ? getOrderQuery.data.details[index].quality : 0
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
        { enabled: !!getOrderQuery.data }
    )

    async function cancelOrder(e: MouseEvent) {
        e.preventDefault()
        if (!orderId) { return }

        const success = await UserService.cancelOrder(orderId)
        if (success) {
            navigate(-1)
        } else {
            dispatch({ type: 'alert', payload: 'Lỗi hủy đơn hàng #' + orderId })
        }
    }

    if (!getOrderQuery.isFetched ||
        !getOrderQuery.data ||
        !getBranchQuery.data ||
        !getProductsInOrderDetailsQuery.data) {
        return <div>Loading...</div>
    }

    return (
        <div>
            <h3>Đơn hàng #{getOrderQuery.data.id}</h3>
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
                                            <div>{NumberFormatter.decimal(price)} x {quality} = {NumberFormatter.decimal(quality * price)} VNĐ</div>
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
                            <span>{getOrderQuery.data.customerName}</span>
                        </div>
                        <div className="information-field">
                            <span>Số điện thoại</span>
                            <span>{getOrderQuery.data.phone}</span>
                        </div>
                        <div className="information-field">
                            <span>Email</span>
                            <span>{getOrderQuery.data.email}</span>
                        </div>
                        <div className="information-field">
                            <span>Cách thức đặt hàng</span>
                            <span>{getOrderQuery.data.receivedType === 'atShop' ? 'Tại cửa hàng' : 'Giao hàng'}</span>
                        </div>
                        <div className="information-field">
                            <span>Địa chỉ đặt hàng</span>
                            <span>{getOrderQuery.data.receivedAddress}</span>
                        </div>
                        <div className="information-field">
                            <span>Chi nhánh đặt hàng</span>
                            <span>{getBranchQuery.data.name}</span>
                        </div>
                        <div className="information-field">
                            <span>Mã coupon</span>
                            <span>{getOrderQuery.data.couponCode}</span>
                        </div>
                        <div className="information-field">
                            <span>Trạng thái</span>
                            <span>
                                {
                                    getOrderQuery.data.status === 'waitVerify' && 'Đang đợi duyệt'
                                }
                                {
                                    getOrderQuery.data.status === 'verified' && 'Đã duyệt'
                                }
                                {
                                    getOrderQuery.data.status === 'waitReceive' && 'Đang đợi nhận hàng'
                                }
                                {
                                    getOrderQuery.data.status === 'received' && 'Đã nhận hàng'
                                }
                                {
                                    getOrderQuery.data.status === 'cancelled' && 'Đã hủy'
                                }
                            </span>
                        </div>
                        <div className="information-field">
                            <span>Tổng tiền</span>
                            <span>{NumberFormatter.decimal(getOrderQuery.data.subtotalPrice)} VNĐ</span>
                        </div>
                        <div className="information-field">
                            <span>Phi vận chuyển</span>
                            <span>{NumberFormatter.decimal(getOrderQuery.data.deliveryCharge)} VNĐ</span>
                        </div>
                        <div className="information-field">
                            <span>Giảm giá</span>
                            <span>{
                                NumberFormatter.decimal(getOrderQuery.data.subtotalPrice - (getOrderQuery.data.totalPrice - getOrderQuery.data.deliveryCharge))
                            } VNĐ</span>
                        </div>
                        <div className="information-field">
                            <span>Thành tiền</span>
                            <span>{NumberFormatter.decimal(getOrderQuery.data.totalPrice)} VNĐ</span>
                        </div>
                        {
                            getOrderQuery.data.status === 'waitVerify' &&
                            <button className="cancel" onClick={cancelOrder}>Hủy đơn hàng</button>
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OrderDetail