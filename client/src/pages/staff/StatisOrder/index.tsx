import { MouseEvent, useEffect, useRef, useState } from 'react'
import * as StaffSevice from '../../../services/staff'
import { NumberFormatter } from '../../../utils/format'
import './index.scss'

function AnalyzeAndStatis() {
    const fromDateInputRef = useRef<HTMLInputElement>(null)
    const toDateInputRef = useRef<HTMLInputElement>(null)
    const timeTypeSelectBoxRef = useRef<HTMLSelectElement>(null)
    const [statisResult, setStatisResult] = useState<StaffSevice.StatisOrderItem[]>([])

    useEffect(() => {
        const currentDate = new Date()
        const yesterdayDate = new Date()
        yesterdayDate.setDate(yesterdayDate.getDate() - 1)

        if (fromDateInputRef.current) {
            fromDateInputRef.current.valueAsDate = yesterdayDate
        }

        if (toDateInputRef.current) {
            toDateInputRef.current.valueAsDate = currentDate
        }

    }, [fromDateInputRef.current, toDateInputRef.current])

    async function statisOrders(e: MouseEvent) {
        e.preventDefault()
        if (!fromDateInputRef.current || !toDateInputRef.current || !timeTypeSelectBoxRef.current) { return }
        const fromDate = fromDateInputRef.current.valueAsDate
        const toDate = toDateInputRef.current.valueAsDate
        const timeType = timeTypeSelectBoxRef.current.value as StaffSevice.TimeType
        if (!fromDate || !toDate) { return }

        const statisResult = await StaffSevice.statisOrders(fromDate, toDate, timeType)
        setStatisResult(statisResult)
    }
    return (
        <div>
            <h3>Thống kê doanh thu</h3>
            <div className="statis-bar">
                <div className="field-wrapper">
                    <label htmlFor="from-date">Từ</label>
                    <input type="date" id='from-date' ref={fromDateInputRef} />
                </div>
                <div className="field-wrapper">
                    <label htmlFor="to-date">đến</label>
                    <input type="date" id="to-date" ref={toDateInputRef} />
                </div>
                <div className="field-wrapper">
                    <label htmlFor="time-type">thống kê theo</label>
                    <select id="time-type" ref={timeTypeSelectBoxRef}>
                        <option value="day">Ngày</option>
                        <option value="month">Tháng</option>
                        <option value="year">Năm</option>
                    </select>
                </div>
                <input type="submit" value="Thống kê" onClick={statisOrders} />
            </div>
            <div className="statis-result">
                {
                    statisResult.length > 0
                        ? (
                            <table>
                                <tr>
                                    <th>Thời gian</th>
                                    <th>Tổng đơn hàng</th>
                                    <th>Số đơn hàng đã giao</th>
                                    <th>Số đơn hàng đã hủy</th>
                                    <th>Tổng thành tiền</th>
                                    <th>Tổng thành tiền đơn hàng đã giao</th>
                                    <th>Tổng thành tiền đơn hàng đã hủy</th>
                                </tr>
                                {
                                    statisResult.map(statisOrderItem =>
                                        <tr key={statisOrderItem.date}>
                                            <td>{statisOrderItem.date}</td>
                                            <td>{statisOrderItem.totalCount}</td>
                                            <td>{statisOrderItem.receivedCount}</td>
                                            <td>{statisOrderItem.cancelledCount}</td>
                                            <td>{NumberFormatter.currency(statisOrderItem.totalPrice)}</td>
                                            <td>{NumberFormatter.currency(statisOrderItem.receivedTotalPrice)}</td>
                                            <td>{NumberFormatter.currency(statisOrderItem.cancelledTotalPrice)}</td>
                                        </tr>
                                    )
                                }
                            </table>
                        ) :
                        <span>Chưa có dữ liệu thống kê</span>
                }
            </div>
        </div>
    )
}

export default AnalyzeAndStatis