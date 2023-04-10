import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import PromotionCard from '../../../compoments/PromotionCard'
import useAutoFetchNextPage from '../../../hooks/useAutoFecthNextPage'
import * as PromotionService from '../../../services/promotion'
import './index.scss'

function Promotion() {
    const [promotions, setPromotions] = useState<PromotionService.Promotion[]>([])
    const getPromotionsQuery = useInfiniteQuery(
        ['get-promotions'],
        ({ pageParam }) => {
            const page = pageParam?.nextPage || 1
            return PromotionService.getPromotions(page)
        },
        {
            getNextPageParam: (lastPage, allPages) => {
                if (lastPage.hasNextPage) { return { nextPage: allPages.length + 1 } }
            }
        }
    )

    const { htmlDockRef, hasNextPageRef } = useAutoFetchNextPage<HTMLDivElement>(getPromotionsQuery.fetchNextPage, [promotions])

    useEffect(() => {
        if (getPromotionsQuery.data) {
            setPromotions(getPromotionsQuery.data.pages.flatMap(page => page.data))
            hasNextPageRef.current = getPromotionsQuery.hasNextPage
        }
    }, [getPromotionsQuery.data])

    return (
        <div>
            <div className="grid wide">
                <h2>Tin khuyến mãi</h2>
            </div>
            <div className="grid wide" style={{ gap: '30px', justifyContent: 'center' }}>
                {
                    promotions.map((promotion) => {
                        return (
                            <div key={promotion.id} className="col l-3 m-4 s-6 xs-12 align-center-wrapper">
                                <PromotionCard {...promotion} ref={htmlDockRef} />
                            </div>
                        )
                    })
                }
            </div>
        </div>
    )
}

export default Promotion