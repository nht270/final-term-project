import { useNavigate } from 'react-router-dom'
import { LongArrowLeft } from '../Icon'
import './index.scss'

interface PlainLayoutProps {
    children: React.ReactNode
}

function PlainLayout({ children }: PlainLayoutProps) {

    const navigate = useNavigate()
    function clickBackHandler() {
        navigate(-1)
    }

    return (
        <>
            <div className="plain-header">
                <div className="back-btn" onClick={clickBackHandler}>
                    <LongArrowLeft />
                    <span>Trở về</span>
                </div>
            </div>
            {children}
        </>
    )
}

export default PlainLayout