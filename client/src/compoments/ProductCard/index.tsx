import { AdvancedImage } from '@cloudinary/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { MouseEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import QueryKeyPrefix from '../../configures/queryKeyPrefix'
import { createCloudinaryImage } from '../../services/image'
import { PriceSizeCombine, Product } from '../../services/product'
import * as RatingService from '../../services/rating'
import * as UserService from '../../services/user'
import { NumberFormatter } from '../../utils/format'
import * as LocalStorageUtil from '../../utils/localStorage'
import * as Icon from '../Icon'
import './index.scss'

function ProductCard({ id, name, coverImage, priceSizeCombines = [] }: Product) {

    const [selectedPriceSizeCombine, setSelectedPriceSizeCombine] = useState<PriceSizeCombine>(priceSizeCombines[0])
    const queryClient = useQueryClient({})
    const getAverageStarQuery = useQuery(['get-average-star', id], () => RatingService.getAverageStar(id))
    function changeSizeHandler(e: MouseEvent) {
        if (!e.target) { return }

        const productSizeId = (e.target as HTMLButtonElement).id

        if (!!productSizeId) {
            const currentPriceSizeCombine = priceSizeCombines
                .find(priceSizeCombine => priceSizeCombine.productSizeId === productSizeId)

            if (currentPriceSizeCombine) {
                setSelectedPriceSizeCombine(currentPriceSizeCombine)
            }
        }
    }

    async function addToCartHandler(e: MouseEvent) {
        e.preventDefault()
        const role = LocalStorageUtil.getRole()
        if (role === 'user') {
            await UserService.addToCart(selectedPriceSizeCombine.productPriceId)
        }

        LocalStorageUtil.addToCartInLocal(selectedPriceSizeCombine.productPriceId)
        queryClient.resetQueries([QueryKeyPrefix.GET_CART], { exact: true })
    }

    return (
        <div className="product-card">
            <AdvancedImage cldImg={createCloudinaryImage(coverImage)} alt={name} />
            <div className="top-overlay">
                <div className="product-action">
                    <a className='add-to-cart' onClick={addToCartHandler}>
                        <Icon.Add />
                        <span>Thêm vào giỏ hàng</span>
                    </a>
                    <Link to={'/product/' + id} className='view-detail'>
                        <Icon.Info />
                        <span>Xem chi tiết</span>
                    </Link>
                </div>

            </div>
            <div className="bottom-overlay">
                <div className="product-info">
                    <div className="name" title={name}>{name}</div>
                    <div className="size-wrapper">
                        {
                            priceSizeCombines.map(({ productPriceId, productSizeName, productSizeId }) => {
                                const classNameForSize = productSizeId === selectedPriceSizeCombine.productSizeId ? 'size selected' : 'size'
                                return (
                                    <button type="button" className={classNameForSize} key={productPriceId} id={productSizeId} onClick={changeSizeHandler}>{productSizeName}</button>
                                )
                            })}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div className="price">{NumberFormatter.currency(selectedPriceSizeCombine.price)}</div>
                        {
                            getAverageStarQuery.data &&
                            <div className="star">{getAverageStarQuery.data} <Icon.BoldStar /></div>
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProductCard