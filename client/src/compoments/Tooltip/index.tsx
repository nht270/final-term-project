import { CSSProperties, useEffect, useRef, useState } from 'react'
import './index.scss'

interface TooltipProp {
    children: React.ReactNode
    tooltipCss?: CSSProperties
    wrapperCss?: CSSProperties
    arrowCss?: CSSProperties,
    clickOutToClose?: boolean,
    customCloseHandler?: Function
}

function Tooltip({
    children,
    tooltipCss = {},
    wrapperCss = {},
    arrowCss = {},
    clickOutToClose = false,
    customCloseHandler
}: TooltipProp) {

    const [trigger, setTrigger] = useState(true)
    const tooltipRef = useRef<HTMLDivElement>(null)

    // prevent first click to show tooltip fire bubble event
    let firstClick = true

    function clickOutHandler(e: MouseEvent) {

        if (!e.bubbles || !firstClick) {
            if (tooltipRef.current && e.target) {
                const tooltip = tooltipRef.current
                const target = e.target as HTMLElement
                if (!tooltip.contains(target)) {
                    document.removeEventListener('click', clickOutHandler)
                    setTrigger(false)
                    customCloseHandler && customCloseHandler()
                }
            }
        }

        firstClick = false
    }

    useEffect(() => {
        if (clickOutToClose && trigger) {
            document.addEventListener('click', clickOutHandler)
        }
    }, [])

    return (
        <>
            {
                trigger &&
                <div className="tooltip" style={tooltipCss} ref={tooltipRef}>
                    <div className="arrow" style={arrowCss}></div>
                    <div className="content" style={wrapperCss}>
                        {children}
                    </div>
                </div>
            }
        </>
    )
}

export default Tooltip