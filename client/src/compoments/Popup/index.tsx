import { CSSProperties, ReactNode, useState } from 'react'
import { Close } from '../Icon'
import Overlay from '../Overlay'
import './index.scss'

interface PopupProp {
    closeHandler?: () => void,
    children: ReactNode,
    popupStyle?: CSSProperties
}

function Popup({ closeHandler: customCloseHandler, children, popupStyle }: PopupProp) {

    const [trigger, setTrigger] = useState(true)
    const closePopupHandler = customCloseHandler || (() => setTrigger(false))
    const overlayStyle: CSSProperties = { background: 'rgba(0, 0, 0, 0.53)' }

    return (
        <>
            {
                trigger &&
                <Overlay clickOutHandler={closePopupHandler} overlayStyle={overlayStyle}>
                    <div className="popup" style={popupStyle}>
                        {children}
                        <div className="close-btn" onClick={closePopupHandler}>
                            <Close />
                        </div>
                    </div>
                </Overlay>
            }
        </>
    )
}

export default Popup