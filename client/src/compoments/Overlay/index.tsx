import { CSSProperties, MouseEvent, MouseEventHandler, ReactNode, useRef, useState } from 'react';
import './index.scss'

interface OverlayProp {
    children: ReactNode,
    clickOutHandler?: MouseEventHandler,
    overlayStyle?: CSSProperties
}

function Overlay({ children, clickOutHandler, overlayStyle }: OverlayProp) {

    const overlayRef = useRef<HTMLDivElement>(null)

    function preventBubblingEventClickOutHandler(e: MouseEvent) {
        if (!!clickOutHandler && e.target === overlayRef.current) {
            clickOutHandler(e)
        }
    }

    return (
        <div
            className="overlay"
            onClick={preventBubblingEventClickOutHandler}
            style={overlayStyle}
            ref={overlayRef}
        >
            {children}
        </div>
    )
}

export default Overlay