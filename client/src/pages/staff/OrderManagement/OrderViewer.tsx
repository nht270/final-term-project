import { useInfiniteQuery } from '@tanstack/react-query'
import { ChangeEvent, MouseEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Dropdown from '../../../compoments/Dropdown'
import * as Icon from '../../../compoments/Icon'
import QueryKeyPrefix from '../../../configures/queryKeyPrefix'
import useAutoFetchNextPage from '../../../hooks/useAutoFecthNextPage'
import useAutoSignOut from '../../../hooks/useAutoSignOut'
import useDebounce from '../../../hooks/useDebounce'
import { Order } from '../../../services/order'
import * as StaffService from '../../../services/staff'
import { NumberFormatter } from '../../../utils/format'
import './OrderViewer.scss'

function OrderViewer() {
    const [orders, setOrders] = useState<Order[]>([])
    const [getOrderOptions, setGetOrderOptions] = useState<StaffService.GetOrderOptions>({ page: 1, sort: 'newest' })
    const [orderFilters, setOrderFilters] = useState<StaffService.OrderFilters>({})
    const autoSignOut = useAutoSignOut()
    const ordersQuery = useInfiniteQuery(
        [QueryKeyPrefix.GET_ORDERS_PREFIX, getOrderOptions, orderFilters],
        ({ pageParam }) => {
            const page = Number(pageParam?.nextPage ? pageParam.nextPage : 1)
            return StaffService.getOrders({ ...getOrderOptions, page }, orderFilters)
        },
        {
            getNextPageParam: (lastPage, allPages) => {
                if (lastPage.hasNextPage) { return { nextPage: allPages.length + 1 } }
            },
            useErrorBoundary: (error) => {
                autoSignOut(error as Error)
                return false
            },
        }
    )

    const { htmlDockRef, hasNextPageRef } = useAutoFetchNextPage<HTMLDivElement>(ordersQuery.fetchNextPage, [orders])

    useEffect(() => {
        if (ordersQuery.isFetched && ordersQuery.data) {
            setOrders(ordersQuery.data.pages.flatMap(page => page.data))
            hasNextPageRef.current = ordersQuery.hasNextPage
        }
    }, [ordersQuery.data, ordersQuery.isFetchingNextPage])

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
        const radioButton = (e.target as HTMLInputElement)
        if (radioButton.checked) {
            const sortType = radioButton.value as StaffService.OrderSortType
            setGetOrderOptions(prev => ({ ...prev, sort: sortType }))
        }
    }

    const updateSearchFilter = useDebounce((text: string) => setOrderFilters(prev => ({ ...prev, searchString: text })))

    function changeSearchFilter(e: ChangeEvent) {
        if (!e.target) { return }
        const searchString = (e.target as HTMLInputElement).value
        updateSearchFilter(searchString)
    }

    function changeFilterFromDate(e: ChangeEvent) {
        if (!e.target) { return }

        const fromDate = (e.target as HTMLInputElement).valueAsDate
        if (!fromDate || isNaN(fromDate.getTime())) { return }
        setOrderFilters(prev => ({ ...prev, createdFrom: fromDate }))
    }

    function changeFilterToDate(e: ChangeEvent) {
        if (!e.target) { return }

        const toDate = (e.target as HTMLInputElement).valueAsDate
        if (!toDate || isNaN(toDate.getTime())) { return }
        setOrderFilters(prev => ({ ...prev, createdTo: toDate }))
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
                        <button className={orderFilters.status === 'waitReceive' ? 'status-button selected' : "status-button"} value="waitReceive" onClick={changeFilterStatus}>
                            Đang vận chuyển
                        </button>
                        <button className={orderFilters.status === 'received' ? 'status-button selected' : "status-button"} value="received" onClick={changeFilterStatus}>
                            Đã nhận
                        </button>
                        <button className={orderFilters.status === 'cancelled' ? 'status-button selected' : "status-button"} value="cancelled" onClick={changeFilterStatus}>
                            Đã hủy
                        </button>
                    </div>
                    <div className="search-bar">
                        <input type="search" form="search" placeholder="Nhập tên khách hàng, số điện thoại để tìm kiếm" onChange={changeSearchFilter} />
                        <button style={{ marginLeft: '5px' }} className="search-icon"><Icon.Search /></button>
                    </div>
                    <div className="date-range">
                        Đơn hàng từ
                        <input type="date" name="from-date" onChange={changeFilterFromDate} />
                        <span>-</span>
                        <input type="date" name="to-date" onChange={changeFilterToDate} />
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                        <Dropdown
                            label={
                                <Icon.Sort />
                            }
                            content={
                                <div className="sort-panel">
                                    <div className="option">
                                        <input type="radio" name="order-type" value="newest" id="newest" checked={getOrderOptions.sort === 'newest'} onChange={changeSortOption} />
                                        <label htmlFor="newest">Mới nhất</label>
                                    </div>
                                    <div className="option">
                                        <input type="radio" name="order-type" value="oldest" id="oldest" checked={getOrderOptions.sort === 'oldest'} onChange={changeSortOption} />
                                        <label htmlFor="oldest">Cũ nhất</label>
                                    </div>
                                </div>
                            }
                            noneArrowIcon
                            placement='bottom-end'
                        />
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
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        orders.map(order =>
                                            <tr key={order.id}>
                                                <td >
                                                    <Link to={order.id}>{order.id}</Link>
                                                </td>
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

export default OrderViewer