import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Dropdown from '../../../compoments/Dropdown'
import * as Icon from '../../../compoments/Icon'
import LoadingIcon from '../../../compoments/Icon/LoadingIcon'
import useAutoFetchNextPage from '../../../hooks/useAutoFecthNextPage'
import * as AdminService from '../../../services/admin'
import * as CouponService from '../../../services/coupon'

import Popup from '../../../compoments/Popup'
import useStore from '../../../hooks/useStore'
import { NumberFormatter } from '../../../utils/format'
import './CouponViewer.scss'

function CouponViewer() {

    const [coupons, setCoupons] = useState<CouponService.Coupon[]>([])
    const [, dispatch] = useStore()
    const [wouldDeleteCouponCode, setWoudDeleteCouponCode] = useState('')
    const [warningDeleteCoupon, setWarningDeleteCoupon] = useState('')

    const couponsQuery = useInfiniteQuery(
        ['get-coupons'],
        ({ pageParam }) => {
            return CouponService.getCoupons(pageParam?.nextPage)
        },
        {
            getNextPageParam: (lastPage, allPages) => {
                if (lastPage.hasNextPage) { return { nextPage: allPages.length + 1 } }
            }
        }
    )
    const { htmlDockRef, hasNextPageRef } = useAutoFetchNextPage<HTMLDivElement>(couponsQuery.fetchNextPage, [coupons])

    const showWarningDeleteCoupon = useMemo(() => (couponCode: string) => {
        setWarningDeleteCoupon(`Bạn có muốn xóa sản phẩm #${couponCode} không?`)
    }, [])

    const deleteCoupon = useMemo(() => async (couponCode: string) => {
        if (couponCode) {
            dispatch({ type: 'loading', payload: true })
            const result = await AdminService.deleteCoupon(couponCode)
            dispatch({ type: 'loading', payload: false })
            dispatch({ type: 'alert', payload: result ? 'Xóa thành công' : 'Lỗi khi xóa' })
            result && couponsQuery.refetch()
        }

        setWarningDeleteCoupon('')
        setWoudDeleteCouponCode('')
    }, [])

    useEffect(() => {
        if (couponsQuery.data) {
            setCoupons(couponsQuery.data.pages.flatMap(page => page.data))
            hasNextPageRef.current = couponsQuery.hasNextPage
        }
    }, [couponsQuery.data])

    return (
        <div>
            <br />
            <Link to="./add" className="add-new"><Icon.Plus /> Thêm coupon</Link>
            <br />
            {
                couponsQuery.isFetched
                    ? (
                        coupons.length > 0
                            ? <div className="data-table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th >Mã coupon</th>
                                            <th>Ngày bắt đầu</th>
                                            <th>Ngày kết thúc</th>
                                            <th>Loại</th>
                                            <th>Giảm giá</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            coupons.map(coupon =>
                                                <tr key={coupon.couponCode}>
                                                    <td>{coupon.couponCode}</td>
                                                    <td>{(new Date(coupon.beginAt)).toLocaleString('vn', { dateStyle: 'short' })}</td>
                                                    <td>{(new Date(coupon.finishAt)).toLocaleString('vn', { dateStyle: 'short' })}</td>
                                                    <td>{coupon.type === 'order' ? 'Đơn hàng' : 'Sản phẩm'}</td>
                                                    <td>{NumberFormatter.decimal(coupon.decrease)}{coupon.unit === 'percent' ? '%' : 'VNĐ'}</td>
                                                    <td>
                                                        <Dropdown
                                                            label={
                                                                <button className='more' style={{ height: '24px', width: '24px' }}>
                                                                    <Icon.HorizontalMore />
                                                                </button>
                                                            }
                                                            content={
                                                                <div className='more-menu'>
                                                                    <Link to={'edit/' + coupon.couponCode}>Chỉnh sửa</Link>
                                                                    <a
                                                                        onClick={() => {
                                                                            setWoudDeleteCouponCode(coupon.couponCode)
                                                                            showWarningDeleteCoupon(coupon.couponCode)
                                                                        }}
                                                                    >
                                                                        Xóa
                                                                    </a>
                                                                </div>
                                                            }
                                                            noneArrowIcon
                                                            placement='bottom-end'
                                                        />
                                                    </td>
                                                </tr>
                                            )
                                        }
                                    </tbody>
                                </table>
                                <div className="hidden-dock" ref={htmlDockRef}></div>
                            </div>
                            : <span>Không có sản phẩm nào</span>
                    )
                    : <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '20px auto' }}><LoadingIcon /></div>
            }
            {
                warningDeleteCoupon &&
                <Popup
                    closeHandler={() => {
                        setWarningDeleteCoupon('')
                        setWoudDeleteCouponCode('')
                    }}
                >
                    <div className="warning-wrapper">
                        <div className="content">
                            {warningDeleteCoupon}
                        </div>
                        <div className="buttons">
                            <button
                                className="confirm"
                                onClick={() => deleteCoupon(wouldDeleteCouponCode)}
                            >
                                Có
                            </button>
                            <button
                                className="cancel"
                                onClick={() => {
                                    setWarningDeleteCoupon('')
                                    setWoudDeleteCouponCode('')
                                }}
                            >
                                Không
                            </button>
                        </div>
                    </div>
                </Popup>
            }
        </div>
    )
}

export default CouponViewer