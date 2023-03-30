import { FormEvent, useEffect, useRef } from 'react'
import { Outlet, useNavigate, useParams } from 'react-router-dom'
import './index.scss'

function FindOrder() {
    const orderIdInputRef = useRef<HTMLInputElement>(null)
    const navigate = useNavigate()
    const orderId = useParams()['orderId']

    useEffect(() => {
        if (orderIdInputRef.current && orderId) {
            orderIdInputRef.current.value = orderId
        }
    }, [])

    function findOrderHandler(e: FormEvent) {
        e.preventDefault()

        if (orderIdInputRef.current) {
            navigate(orderIdInputRef.current.value)
        }
    }

    return (
        <div className="grid wide">
            <div className="l-12 m-12 s-12 xs-12">
                <h2>Tra cứu đơn hàng</h2>
                <form className="find-order-form" onSubmit={findOrderHandler}>
                    <input type="text" placeholder='Nhập mã đơn hàng' ref={orderIdInputRef} />
                    <input type="submit" value="Tra cứu" />
                </form>
                <div className="find-order-result">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}

export default FindOrder