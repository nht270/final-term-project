import { useInfiniteQuery } from '@tanstack/react-query'
import { ChangeEvent, MouseEvent, useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import '../../../assets/scss/DataTable.scss'
import Dropdown from '../../../compoments/Dropdown'
import * as Icon from '../../../compoments/Icon'
import QueryKeyPrefix from '../../../configures/queryKeyPrefix'
import useAutoFetchNextPage from '../../../hooks/useAutoFecthNextPage'
import useAutoSignOut from '../../../hooks/useAutoSignOut'
import useStore from '../../../hooks/useStore'
import { Order } from '../../../services/order'
import * as UserService from '../../../services/user'
import { NumberFormatter } from '../../../utils/format'
import './OrderHistoryViewer.scss'

function OrderHistoryViewer() {
    const [, dispatch] = useStore()
    const [orders, setOrders] = useState<Order[]>([])
    const [getOrderOptions, setGetOrderOptions] = useState<UserService.GetOrderOptions>({ page: 1, sort: 'newest' })
    const [orderFilters, setOrderFilters] = useState<UserService.OrderFilters>({})
    const autoSignOut = useAutoSignOut()
    const ordersQuery = useInfiniteQuery(
        [QueryKeyPrefix.GET_ORDERS_PREFIX, orderFilters, getOrderOptions],
        ({ pageParam }) => {
            const page = Number(pageParam?.nextPage ? pageParam.nextPage : getOrderOptions.page)
            return UserService.getOrders({ ...getOrderOptions, page }, orderFilters)
        },
        {
            getNextPageParam: (lastPage, allPages) => {
                if (lastPage.hasNextPage) { return { nextPage: allPages.length + 1 } }
            },
            useErrorBoundary: (error) => {
                autoSignOut(error as Error)
                return false
            }
        }
    )

    const { htmlDockRef, hasNextPageRef } = useAutoFetchNextPage<HTMLDivElement>(ordersQuery.fetchNextPage, [orders])

    useEffect(() => {
        if (ordersQuery.data) {
            const fetchedOrderHistorys = ordersQuery.data.pages.flatMap(page => page.data)
            setOrders(fetchedOrderHistorys)
            hasNextPageRef.current = ordersQuery.hasNextPage
        }
    }, [ordersQuery.data])

    const cancelOrder = useMemo(() => async (orderId: string) => {
        if (!orderId) { return }

        const success = await UserService.cancelOrder(orderId)
        if (success) {
            dispatch({ type: 'alert', payload: 'Đã hủy đơn hàng #' + orderId })
            ordersQuery.refetch()
        } else {
            dispatch({ type: 'alert', payload: 'Lỗi' })
        }
    }, [])

    if (ordersQuery.isError) {
        return <Navigate to='..' />
    }

    function changeFilterStatus(e: MouseEvent) {
        if (!e.target) { return }
        const status = (e.target as HTMLButtonElement).value

        if (status === 'all') {
            setOrderFilters(prev => ({ ...prev, status: undefined }))
            return
        }

        setOrderFilters(prev => ({ ...prev, status }))
    }

    function changeSortOption(e: ChangeEvent) {
        if (!e.target) { return }
        const selectedValue = (e.target as HTMLSelectElement).value as UserService.OrderSortType
        setGetOrderOptions(prev => ({ ...prev, sort: selectedValue }))
    }

    return (
        <>
            <h3>Lịch sử đặt hàng</h3>
            <div className="order-viewer">
                <div className="tool-bar">
                    <div className="status-bar">
                        <button className={!orderFilters.status ? 'status-button selected' : "status-button"} value="all" onClick={changeFilterStatus}>
                            Tất cả
                        </button>
                        <button className={orderFilters.status === 'waitVerify' ? 'status-button selected' : "status-button"} value="waitVerify" onClick={changeFilterStatus}>
                            Đang đợi duyệt
                        </button>
                        <button className={orderFilters.status === 'verified' ? 'status-button selected' : "status-button"} value="verified" onClick={changeFilterStatus}>
                            Đã duyệt
                        </button>
                        <button className={orderFilters.status === 'waitReceived' ? 'status-button selected' : "status-button"} value="waitReceived" onClick={changeFilterStatus}>
                            Đang vận chuyển
                        </button>
                        <button className={orderFilters.status === 'received' ? 'status-button selected' : "status-button"} value="received" onClick={changeFilterStatus}>
                            Đã nhận
                        </button>
                        <button className={orderFilters.status === 'cancelled' ? 'status-button selected' : "status-button"} value="cancelled" onClick={changeFilterStatus}>
                            Đã hủy
                        </button>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                        <span>Sắp xếp theo:&nbsp;</span>
                        <select onChange={changeSortOption}>
                            <option value="newest">Mới nhất</option>
                            <option value="oldest">Cũ nhất</option>
                        </select>
                    </div>
                </div>
                {
                    ordersQuery.isFetched && orders.length > 0
                        ? <div className="data-table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Mã đơn hàng</th>
                                        <th>Hình thức nhận hàng</th>
                                        <th>Địa chỉ nhận hàng</th>
                                        <th>Mã coupon</th>
                                        <th>Trạng thái</th>
                                        <th>Phí vận chuyển</th>
                                        <th>Tổng tiền</th>
                                        <th>Thành tiền</th>
                                        <th>Ngày đặt hàng</th>
                                        <th style={{ textAlign: 'center' }}>x</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        orders.map(order =>
                                            <tr key={order.id}>
                                                <td >{order.id}</td>
                                                <td>{order.receivedType === 'atShop' ? 'Tại cửa hàng' : 'Giao hàng'}</td>
                                                <td style={{ width: '250px' }}>{order.receivedAddress}</td>
                                                <td>{order.couponCode}</td>
                                                <td>
                                                    {
                                                        order.status === 'waitVerify' && 'Đang đợi duyệt'
                                                    }
                                                    {
                                                        order.status === 'verified' && 'Đã duyệt'
                                                    }
                                                    {
                                                        order.status === 'waitReceive' && 'Đang đợi nhận hàng'
                                                    }
                                                    {
                                                        order.status === 'received' && 'Đã nhận hàng'
                                                    }
                                                    {
                                                        order.status === 'cancelled' && 'Đã hủy'
                                                    }
                                                </td>
                                                <td>{NumberFormatter.currency(order.deliveryCharge)}</td>
                                                <td>{NumberFormatter.currency(order.subtotalPrice)}</td>
                                                <td>{NumberFormatter.currency(order.totalPrice)}</td>
                                                <td>{(new Date(order.createdAt)).toLocaleString('vi-VN', { dateStyle: 'short' })}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <Dropdown
                                                        label={
                                                            <button className='more' style={{ height: '24px', width: '24px' }}>
                                                                <Icon.HorizontalMore />
                                                            </button>
                                                        }
                                                        noneArrowIcon
                                                        placement='bottom-end'
                                                        content={
                                                            <div className='more-menu'>
                                                                <Link to={order.id}><Icon.Info /> <span>Chi tiết</span></Link>
                                                                {order.status === 'waitVerify' ? <a onClick={() => cancelOrder(order.id)}><Icon.Cancel /> <span>Hủy đơn hàng</span></a> : null}
                                                            </div>
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        )
                                    }
                                </tbody>
                            </table>
                            <div className="hidden-dock" ref={htmlDockRef}></div>
                        </div>
                        : <span>Không có đơn hàng nào</span>
                }
            </div>

        </>
    )
}

export default OrderHistoryViewer