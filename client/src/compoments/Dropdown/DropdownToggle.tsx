import React, { ForwardedRef, ReactNode } from 'react'
import * as Icon from '../Icon'

export type DropdownToggleProps = {
    children: ReactNode,
    labelWrapperCss?: React.CSSProperties
    noneArrowIcon?: boolean
    isDown: boolean,
    handleClick?: () => void
}

function DropdownToggle({ children, labelWrapperCss, noneArrowIcon = false, isDown, handleClick }: DropdownToggleProps, ref: ForwardedRef<HTMLDivElement>) {
    return (
        <div
            className="dropdown__toggle"
            style={labelWrapperCss}
            ref={ref}
            onClick={handleClick}
        >
            <div className="dropdown__label">{children}</div>
            {
                !noneArrowIcon
                    ? <div className="dropdown__icon"> {isDown ? <Icon.ShortArrowUp /> : <Icon.ShortArrowDown />}</div>
                    : null
            }
        </div>
    )
}

export default React.forwardRef(DropdownToggle)