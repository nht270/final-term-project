import { AdvancedImage } from '@cloudinary/react'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { createCloudinaryImage } from '../../../services/image'
import * as PromotionService from '../../../services/promotion'
import * as CouponService from '../../../services/coupon'
import './index.scss'

function PromotionDetail() {
    const promotionId = useParams()['promotionId']
    const [promotion, setPromotion] = useState<PromotionService.Promotion>()
    const promotionContentRef = useRef<HTMLDivElement>(null)
    const promotionQuery = useQuery(
        ['get-promotion', promotionId],
        () => promotionId ? PromotionService.getPromotion(promotionId) : null,
        { enabled: !!promotionId }
    )

    const [discountLabel, setDiscountLabel] = useState('')
    const [applyConditionDescribe, setApplyConditionDescribe] = useState('')

    const couponQuery = useQuery(
        ['get-coupon', promotion],
        () => {
            if (!promotion) { return null }
            return CouponService.getCoupon(promotion.couponCode)
        },
        { enabled: !!promotion }
    )

    useEffect(() => {
        if (promotionQuery.data) {
            setPromotion(promotionQuery.data)
        }
    }, [promotionQuery.data])

    useEffect(() => {
        if (promotion && promotionContentRef.current) {
            promotionContentRef.current.innerHTML = promotion.content
        }
    }, [promotionContentRef.current, promotion])

    useEffect(() => {
        if (couponQuery.data) {
            setDiscountLabel(CouponService.createDiscountLabel(couponQuery.data))
            CouponService.createApplyConditionDescribe(couponQuery.data)
                .then(applyConditionDescribe => {
                    setApplyConditionDescribe(applyConditionDescribe)
                })
        }
    }, [couponQuery.data])


    if (!promotionId || !promotion) {
        return (
            <>
                Not found promotion
            </>
        )
    }

    if (promotion) {
        return (
            <div className="promotion">
                <AdvancedImage cldImg={createCloudinaryImage(promotion.coverImage)} className="promotion-cover" />
                <div className='grid wide'>
                    <div className="l-12 m-12 s-12 xs-12">
                        <h2>{promotion.title}</h2>
                        <div className="content" ref={promotionContentRef}>
                        </div>
                        {
                            discountLabel && applyConditionDescribe &&
                            <div className="coupon-info">
                                <span>{discountLabel}</span>
                                <div>
                                    Điều kiện áp dụng: {applyConditionDescribe}
                                </div>
                            </div>
                        }
                    </div>
                </div>
            </div>
        )
    } else {
        return null
    }
}

export default PromotionDetail