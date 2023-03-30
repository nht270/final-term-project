import { AdvancedImage } from '@cloudinary/react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { ChangeEvent, ForwardedRef, forwardRef, useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Dropdown from '../../../compoments/Dropdown'
import * as Icon from '../../../compoments/Icon'
import StarRange from '../../../compoments/StarRange'
import QueryKeyPrefix from '../../../configures/queryKeyPrefix'
import useAutoFetchNextPage from '../../../hooks/useAutoFecthNextPage'
import useStore from '../../../hooks/useStore'
import { createCloudinaryThumb } from '../../../services/image'
import * as RatingService from '../../../services/rating'
import * as UserService from '../../../services/user'
import { DateFormatter, StringFormatter, WEEK } from '../../../utils/format'

interface RatingSectorProps {
    productId: string
}

interface RatingInputProps {
    star: number,
    content: string,
    updateInformationHandler: (star: number, content: string) => void,
}

function RatingSector({ productId }: RatingSectorProps) {
    const [globalState, dispatch] = useStore()
    const signInLink = useMemo(() => `/sign-in?continue=/product/${productId}`, [productId])
    const [ratings, setRattings] = useState<RatingService.Rating[]>([])
    const [triggerRatingInput, setTriggerRatingInput] = useState(false)
    const [ownRating, setOwnRating] = useState({ productId, star: 0, content: '' })
    const location = useLocation()
    const getRatingQuery = useInfiniteQuery(
        [QueryKeyPrefix.GET_RATING_PREFIX, productId],
        ({ pageParam }) => {
            return RatingService.getRatings(productId, { page: pageParam?.nextPgae })
        },
        {
            getNextPageParam: (lastPage, allPages) => {
                if (lastPage.hasNextPage) { return { nextPage: allPages.length + 1 } }
            }
        }
    )

    const { htmlDockRef, hasNextPageRef } = useAutoFetchNextPage<HTMLDivElement>(getRatingQuery.fetchNextPage, [ratings])

    const ownRatingQuery = useQuery(
        ['get-own-rating'],
        () => UserService.getOwnRating(productId),
        { enabled: globalState.isSignIn && globalState.role === 'user' }
    )

    useEffect(() => {
        if (getRatingQuery.data) {
            setRattings(getRatingQuery.data.pages.flatMap(page => page.data))
            hasNextPageRef.current = getRatingQuery.hasNextPage
        }
    }, [getRatingQuery.data])

    useEffect(() => {
        if (ownRatingQuery.data) {
            setOwnRating(ownRatingQuery.data)
        }
    }, [ownRatingQuery.data])

    const canRatingQuery = useQuery(
        ['can-rating'],
        () => UserService.canRating(productId),
        { enabled: globalState.role === 'user' && globalState.isSignIn }
    )
    function updateOwnRating(star: number, content: string) {
        setOwnRating(prevRating => ({ ...prevRating, star, content }))
    }

    async function rateProduct() {
        if (!productId) { return }
        const success = await UserService.addRating(ownRating)
        if (success) {
            getRatingQuery.refetch()
            ownRatingQuery.refetch()
            setTriggerRatingInput(false)
        } else {
            dispatch({ type: 'alert', payload: 'Không thể đánh giá' })
        }
    }

    async function updateRating() {
        if (!productId) { return }
        const success = await UserService.updateRating(productId, ownRating)
        if (success) {
            getRatingQuery.refetch()
            ownRatingQuery.refetch()
            setTriggerRatingInput(false)
        } else {
            dispatch({ type: 'alert', payload: 'Không thể cập nhật đánh giá' })
        }
    }

    async function deleteRating() {
        if (!productId) { return }
        const success = await UserService.deleteRating(productId)
        if (success) {
            getRatingQuery.refetch()
            ownRatingQuery.refetch()
            setTriggerRatingInput(false)
        } else {
            dispatch({ type: 'alert', payload: 'Không thể xóa đánh giá' })
        }
    }

    return (
        <div className="rating-wrapper">
            <div className="own-rating">
                {
                    ownRatingQuery.data && globalState.isSignIn && globalState.role === 'user' &&
                    <>
                        <span className="own-rating__label">Đánh giá của bạn</span>
                        {
                            triggerRatingInput
                                ? (
                                    <>
                                        <RatingInput {...ownRating} updateInformationHandler={updateOwnRating} />
                                        <div
                                            style={{
                                                margin: '0 15px 15px 15px'
                                            }}
                                        >
                                            <button
                                                className='btn'
                                                onClick={() => setTriggerRatingInput(false)}
                                                style={{
                                                    marginRight: '10px'
                                                }}
                                            >
                                                Hủy
                                            </button>
                                            <button
                                                className='btn'
                                                onClick={updateRating}
                                            >
                                                Cập nhật
                                            </button>
                                        </div>
                                    </>
                                )
                                : (
                                    <div
                                        style={{
                                            position: 'relative'
                                        }}
                                    >
                                        <RatingRow {...ownRatingQuery.data} nonButtonBorder />
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: '0px',
                                                right: '15px'
                                            }}
                                        >
                                            <Dropdown
                                                label={<button type="button" className='more'><Icon.HorizontalMore /></button>}
                                                content={
                                                    <div className='more-menu'>
                                                        <button onClick={() => setTriggerRatingInput(true)}>Chỉnh sửa</button>
                                                        <button onClick={deleteRating}>Xóa đánh giá</button>
                                                    </div>
                                                }
                                                noneArrowIcon
                                                placement='bottom-end'
                                            />
                                        </div>
                                    </div>
                                )
                        }
                    </>
                }
            </div>
            <div className="all-rating">

                <div className="all-rating__label">Đánh giá</div>
                {
                    ratings.length > 0 ? (
                        <>
                            {
                                ratings.map((rating, index) =>
                                    <RatingRow key={rating.userAccountId} {...rating} ref={index === ratings.length - 1 ? htmlDockRef : undefined} nonButtonBorder={ratings.length === index + 1} />
                                )
                            }
                        </>
                    ) : (
                        <div className="all-rating__no-rating">Chưa có đánh giá nào</div>
                    )
                }
                {
                    !ownRatingQuery.data &&
                    <>
                        {
                            triggerRatingInput
                                ? (
                                    <>
                                        <RatingInput
                                            {...ownRating}
                                            updateInformationHandler={updateOwnRating}
                                        />
                                        <div>
                                            <button
                                                className='btn'
                                                onClick={() => setTriggerRatingInput(false)}
                                                style={{
                                                    marginRight: '10px'
                                                }}
                                            >
                                                Hủy
                                            </button>
                                            <button
                                                className='btn'
                                                onClick={rateProduct}
                                            >
                                                Đánh giá
                                            </button>
                                        </div>
                                    </>
                                ) : (

                                    globalState.isSignIn && globalState.role === 'user'
                                        ? (
                                            canRatingQuery.data && <button className="leave-rating" type="button" onClick={() => setTriggerRatingInput(true)}>Viết đánh giá</button>
                                        )
                                        : (
                                            <Link
                                                to={signInLink}
                                                state={{ backgroundLocation: location }}
                                                style={{
                                                    textDecoration: 'none',
                                                    color: 'black',
                                                    fontWeight: 'bold',
                                                    padding: '15px'
                                                }}
                                            >
                                                Đăng nhập để viết đánh giá
                                            </Link>
                                        )
                                )
                        }
                    </>
                }
            </div>
        </div>
    )
}

const RatingRow = forwardRef(({ nonButtonBorder = false, ...rating }: RatingService.Rating & { nonButtonBorder?: boolean }, ref: ForwardedRef<HTMLDivElement>) => {

    const ratingDate = new Date(rating.updatedAt || rating.createdAt)
    const currentDate = new Date()
    let ratingDateString = ''

    if (Math.abs(currentDate.getTime() - ratingDate.getTime()) > 4 * WEEK) {
        ratingDateString = ratingDate.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
    } else {
        ratingDateString =
            StringFormatter.toUpperFirstLetter(DateFormatter.getRelativeTime(ratingDate))
    }
    return (
        <div className="rating-row" style={nonButtonBorder ? { borderBottom: 'none' } : {}}>
            <AdvancedImage cldImg={createCloudinaryThumb(rating.userAvatar)} alt={rating.userName} className="user-avatar" />
            <div className="user-name">{rating.userName}</div>
            <div className="star"><StarRange star={rating.star} /></div>
            <div className="content">{rating.content}</div>
            <div className="rating-date">{ratingDateString}</div>
        </div>
    )
})

function RatingInput({ star, content, updateInformationHandler }: RatingInputProps) {

    const [starRating, setStarRating] = useState(star)
    const [contentRating, setContentRating] = useState(content)

    function updateContentRating(e: ChangeEvent) {
        if (!e.target) { return }
        const content = (e.target as HTMLTextAreaElement).value
        setContentRating(content)
    }

    function updateStarRating(e: ChangeEvent) {
        if (!e.target) { return }
        const star = Number((e.target as HTMLTextAreaElement).value)
        setStarRating(star)
    }

    useEffect(() => {
        updateInformationHandler(starRating, contentRating)
    }, [starRating, contentRating])

    return (
        <div className="rating-input">
            <div className="star-wrapper">
                <input
                    type="radio"
                    name="star"
                    value="5"
                    id="star-5"
                    className='star'
                    onChange={updateStarRating}
                    checked={starRating === 5}
                />
                <label htmlFor="star-5"><Icon.BoldStar /></label>
                <input
                    type="radio"
                    name="star"
                    value="4"
                    id="star-4"
                    className='star'
                    onChange={updateStarRating}
                    checked={starRating === 4}
                />
                <label htmlFor="star-4"><Icon.BoldStar /></label>
                <input
                    type="radio"
                    name="star"
                    value="3"
                    id="star-3"
                    className='star'
                    onChange={updateStarRating}
                    checked={starRating === 3}
                />
                <label htmlFor="star-3"><Icon.BoldStar /></label>
                <input
                    type="radio"
                    name="star"
                    value="2"
                    id="star-2"
                    className='star'
                    onChange={updateStarRating}
                    checked={starRating === 2}
                />
                <label htmlFor="star-2"><Icon.BoldStar /></label>
                <input
                    type="radio"
                    name="star"
                    value="1"
                    id="star-1"
                    className='star'
                    onChange={updateStarRating}
                    checked={starRating === 1}
                />
                <label htmlFor="star-1"><Icon.BoldStar /></label>
            </div>
            <textarea
                name="rating-content"
                id="rating-content"
                placeholder="Nội dung đánh giá"
                value={contentRating}
                onChange={updateContentRating}
            >
            </textarea>
        </div>
    )
}

export default RatingSector