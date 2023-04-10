import { useCallback, useState } from 'react'
import { Close } from '../Icon'
import './index.scss'

interface AlertProps {
    children: React.ReactNode,
    customCloseHandler?: () => void,
    closeAfter?: number | boolean
}

const DEFAULT_CLOSE_TIME = 2000

function Alert({ children, closeAfter = false, customCloseHandler }: AlertProps) {

    const [trigger, setTrigger] = useState(true)
    function closeHanler() {
        setTrigger(false)
        customCloseHandler && customCloseHandler()
    }

    useCallback(() => {
        if (closeAfter) {
            setTimeout(() => {
                closeHanler()
            }, Number.isSafeInteger(closeAfter)
                ? closeAfter as number
                : DEFAULT_CLOSE_TIME
            )
        }

    }, [])()

    if (trigger) {
        return (
            <div className="alert-wrapper">
                <div className="content">
                    {children}
                </div>
                <button
                    type="button"
                    className="close-button"
                    onClick={closeHanler}
                >
                    <Close />
                </button>
            </div>
        )
    } else {
        return null
    }
}

export default Alert