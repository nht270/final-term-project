import { AdvancedImage } from '@cloudinary/react'
import { ChangeEvent, FocusEvent, MouseEvent, useState } from 'react'
import { createCloudinaryThumb } from '../../services/image'
import * as UserService from '../../services/user'
import { Minus, Plus, Trash } from '../Icon'
import { NumberFormatter } from '../../utils/format'
import './index.scss'

type CartDetailProps = UserService.ExtraCartDetail & {
    onDeleteHandler?: (productPriceId: string) => void,
    onChangeQualityHandler?: (productPriceId: string, quality: number) => void
}

const ITEM_QUALITY_LIMIT = 10

function CartDetail({ productPriceId, productName, price, quality, productSizeName, productCoverImage, onChangeQualityHandler, onDeleteHandler }: CartDetailProps) {
    const [editableQuality, setEditableQuality] = useState(String(quality))
    function increaseQualityHandler(e: MouseEvent) {

        setEditableQuality(prevEditableQuality => {
            let newQuality = Number(prevEditableQuality) + 1
            if (newQuality > ITEM_QUALITY_LIMIT) {
                newQuality = ITEM_QUALITY_LIMIT
            }
            onChangeQualityHandler && onChangeQualityHandler(productPriceId, newQuality)
            return String(newQuality)
        })
    }

    function decreaseQualityHandler(e: MouseEvent) {
        setEditableQuality(prevEditableQuality => {
            let newQuality = Number(prevEditableQuality) - 1
            if (newQuality < 1) { newQuality = 1 }
            onChangeQualityHandler && onChangeQualityHandler(productPriceId, newQuality)
            return String(newQuality)
        })
    }

    function editQualityHandler(e: ChangeEvent) {
        if (!!e.target) {
            const qualityInput = e.target as HTMLInputElement
            setEditableQuality(qualityInput.value)
        }
    }

    function updateQualityHandler(e: FocusEvent) {
        if (e.target) {
            const qualityInput = e.target as HTMLInputElement
            let newQuality = Number(qualityInput.value)
            if (newQuality < 1) { newQuality = 1 }
            if (newQuality > ITEM_QUALITY_LIMIT) { newQuality = ITEM_QUALITY_LIMIT }

            onChangeQualityHandler && onChangeQualityHandler(productPriceId, newQuality)
            setEditableQuality(String(newQuality))
        }
    }

    function deleteHandler(e: MouseEvent) {
        e.stopPropagation()
        onDeleteHandler && onDeleteHandler(productPriceId)
    }
    return (
        <div className="cart-item">
            <AdvancedImage cldImg={createCloudinaryThumb(productCoverImage)} alt={productName} />
            <div className="item-info">
                <div className="name-total-price-combo">
                    <div className="item-name" title={productName}>{productName}</div>
                    <div className="total-price price">{NumberFormatter.currency(quality * price)}</div>
                </div>
                <div className="price-size-combo">
                    <div className="item-price price">{NumberFormatter.currency(price)}</div>|
                    <div className="item-size">{productSizeName}</div>
                </div>
                <div className="controls">
                    <div className="quality-controller">
                        <button className="decrease-control" onClick={decreaseQualityHandler}>
                            <Minus />
                        </button>
                        <input
                            type="number"
                            name="quality"
                            value={editableQuality}
                            onChange={editQualityHandler}
                            onBlur={updateQualityHandler}
                        />
                        <button className="increase-control" onClick={increaseQualityHandler}>
                            <Plus />
                        </button>
                    </div>
                    <button type="button" className="delete-item" onClick={deleteHandler}>
                        <Trash /><span>Xóa</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default CartDetail