import { useInfiniteQuery } from '@tanstack/react-query'
import { ChangeEvent, MouseEvent, useEffect, useMemo, useState } from 'react'
import Dropdown from '../../../compoments/Dropdown'
import * as Icon from '../../../compoments/Icon'
import LoadingIcon from '../../../compoments/Icon/LoadingIcon'
import StarRange from '../../../compoments/StarRange'
import useAutoFetchNextPage from '../../../hooks/useAutoFecthNextPage'
import useDebounce from '../../../hooks/useDebounce'
import useStore from '../../../hooks/useStore'
import * as AdminService from '../../../services/admin'
import * as RatingService from '../../../services/rating'
import './RatingViewer.scss'

function RatingViewer() {

    const [ratings, setRatings] = useState<RatingService.Rating[]>([])
    const [getRatingOptions, setGetRatingOptions] = useState<AdminService.GetRatingOptions>({ page: 1, sort: 'newest' })
    const [ratingFilters, setRatingFilters] = useState<AdminService.RatingFilters>({})

    const ratingsQuery = useInfiniteQuery(
        ['get-rating-list', getRatingOptions, ratingFilters],
        ({ pageParam }) => {
            return AdminService.getRatings({ ...getRatingOptions, page: pageParam?.nextPage || 1 }, ratingFilters)
        },
        {
            getNextPageParam: (lastPage, allPages) => {
                if (lastPage.hasNextPage) { return allPages.length + 1 }
            }
        }
    )

    const { htmlDockRef, hasNextPageRef } = useAutoFetchNextPage<HTMLDivElement>(ratingsQuery.fetchNextPage, [ratings])
    const [, dispatch] = useStore()

    useEffect(() => {
        if (ratingsQuery.data) {
            setRatings(ratingsQuery.data.pages.flatMap(page => page.data))
            hasNextPageRef.current = ratingsQuery.hasNextPage
        }
    }, [ratingsQuery.data])

    const setSearchString = useMemo(() => (text: string) => {
        setRatingFilters(prev => ({ ...prev, searchString: text }))
        ratingsQuery.refetch()
    }, [])

    const changeSearchString = useDebounce(setSearchString)

    function changeSearchStringHandler(e: ChangeEvent) {
        if (!e.target) { return }

        const searchString = (e.target as HTMLInputElement).value
        changeSearchString(searchString)
    }

    async function lockRatingHandler(userAccountId: string, productId: string) {
        const success = await AdminService.lockRating(userAccountId, productId)
        if (success) {
            ratingsQuery.refetch()
            dispatch({ type: 'alert', payload: 'Chặn thành công' })
        } else {
            dispatch({ type: 'alert', payload: 'Chặn không thành công' })
        }
    }

    async function unlockRatingHandler(userAccountId: string, productId: string) {
        const success = await AdminService.unlockRating(userAccountId, productId)
        if (success) {
            ratingsQuery.refetch()
            dispatch({ type: 'alert', payload: 'Bỏ chặn thành công' })
        } else {
            dispatch({ type: 'alert', payload: 'Bỏ chặn không thành công' })
        }
    }

    function changeFilterStatus(e: MouseEvent) {
        if (!e.target) { return }
        const status = (e.target as HTMLButtonElement).value
        if (status === 'all') {
            setRatingFilters(prev => ({ ...prev, status: undefined }))
        }

        if (status === 'blocked') {
            setRatingFilters(prev => ({ ...prev, status: 'lock' }))
        }
        ratingsQuery.refetch()
    }

    function changeSortType(e: ChangeEvent) {
        if (!e.target) { return }
        const sortType = (e.target as HTMLSelectElement).value as RatingService.SortType
        setGetRatingOptions(prev => ({ ...prev, sort: sortType }))
    }

    function changeFilterStar(e: ChangeEvent) {
        if (!e.target) { return }
        const star = Number((e.target as HTMLSelectElement).value) || undefined
        setRatingFilters(prev => ({ ...prev, star }))
    }

    return (
        <>
            <div className="rating-viewer">
                <div className="tool-bar">
                    <div className='status-bar'>
                        <button type="button" className={ratingFilters.status ? "status-button" : "status-button selected"} value={'all'} onClick={changeFilterStatus}>
                            Tất cả
                        </button>
                        <button type="button" className={ratingFilters.status === 'lock' ? "status-button selected" : "status-button"} value={'blocked'} onClick={changeFilterStatus}>
                            Đã chặn
                        </button>
                    </div>
                    <input type="search" style={{ flexGrow: '1', maxWidth: 'max(30%, 300px)', marginLeft: 'auto', justifySelf: 'flex-end' }} name="search" placeholder='Nhập nội dung, tên khách hàng đã đánh giá' onChange={changeSearchStringHandler} />
                    <Dropdown
                        label={
                            <button type="button" className="sort-label">
                                <Icon.Star />
                            </button>
                        }
                        content={
                            <div className="sort-panel" style={{ margin: '5px 0' }}>
                                <div className="option">
                                    <input type="radio" name="star-count" value="1" id="1-star" onChange={changeFilterStar} checked={!!ratingFilters.star && ratingFilters.star === 1} />
                                    <label htmlFor="1-star">1 sao</label>
                                </div>
                                <div className="option">
                                    <input type="radio" name="star-count" value="2" id="2-star" onChange={changeFilterStar} checked={!!ratingFilters.star && ratingFilters.star === 2} />
                                    <label htmlFor="2-star">2 sao</label>
                                </div>
                                <div className="option">
                                    <input type="radio" name="star-count" value="3" id="3-star" onChange={changeFilterStar} checked={!!ratingFilters.star && ratingFilters.star === 3} />
                                    <label htmlFor="3-star">3 sao</label>
                                </div>
                                <div className="option">
                                    <input type="radio" name="star-count" value="4" id="4-star" onChange={changeFilterStar} checked={!!ratingFilters.star && ratingFilters.star === 4} />
                                    <label htmlFor="4-star">4 sao</label>
                                </div>
                                <div className="option">
                                    <input type="radio" name="star-count" value="5" id="5-star" onChange={changeFilterStar} checked={!!ratingFilters.star && ratingFilters.star === 5} />
                                    <label htmlFor="5-star">5 sao</label>
                                </div>
                                <div className="option">
                                    <input type="radio" name="star-count" value="all" id="all-star" onChange={changeFilterStar} checked={!ratingFilters.star} />
                                    <label htmlFor="all-star">Tất cả</label>
                                </div>
                            </div>
                        }
                        noneArrowIcon
                        placement='bottom-end'
                    />
                    <select name="sort" onChange={changeSortType}>
                        <option value="newest">Mới nhất</option>
                        <option value="oldest">Cũ nhất</option>
                    </select>
                </div>
                {
                    ratingsQuery.isFetched
                        ? (
                            ratings.length > 0
                                ? <div className="data-table-wrapper">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th >Mã sản phẩm</th>
                                                <th>Tên khách hàng</th>
                                                <th>Nội dung</th>
                                                <th>Sao</th>
                                                <th>Ngày viết đánh giá</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {
                                                ratings.map(rating =>
                                                    <tr key={`${rating.productId}-${rating.userAccountId}`}>
                                                        <td>{rating.productId}</td>
                                                        <td>{rating.userName}</td>
                                                        <td>{rating.content}</td>
                                                        <td ><StarRange star={rating.star} /></td>
                                                        <td>{(new Date(rating.createdAt)).toLocaleString('vi-VN', { dateStyle: 'short' })}</td>
                                                        <td>
                                                            {rating.status === 'lock' && <button className="more" onClick={() => unlockRatingHandler(rating.userAccountId, rating.productId)}><Icon.Unlock /></button>}
                                                            {rating.status === null && <button className="more" onClick={() => lockRatingHandler(rating.userAccountId, rating.productId)}><Icon.Lock /></button>}
                                                        </td>
                                                    </tr>
                                                )
                                            }
                                        </tbody>
                                    </table>
                                </div>
                                : <span>Không có đánh giá nào</span>
                        )
                        : <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '20px auto' }}><LoadingIcon /></div>
                }
            </div>
        </>
    )
}

export default RatingViewer