import { AdvancedImage } from '@cloudinary/react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Dropdown from '../../../compoments/Dropdown'
import * as Icon from '../../../compoments/Icon'
import LoadingIcon from '../../../compoments/Icon/LoadingIcon'
import Popup from '../../../compoments/Popup'
import useAutoFetchNextPage from '../../../hooks/useAutoFecthNextPage'
import useStore from '../../../hooks/useStore'
import * as AdminService from '../../../services/admin'
import { createCloudinaryImage } from '../../../services/image'
import * as PromotionService from '../../../services/promotion'
import { StringFormatter } from '../../../utils/format'
import './PromotionViewer.scss'

function PromotionViewer() {

    const [promotions, setPromotions] = useState<PromotionService.Promotion[]>([])
    const [, dispatch] = useStore()
    const [wouldDeletePromotionId, setWoudDeletePromotionId] = useState('')
    const [warningDeletePromotion, setWarningDeletePromotion] = useState('')
    const promotionsQuery = useInfiniteQuery(
        ['get-promotion-list'],
        ({ pageParam }) => PromotionService.getPromotions(pageParam?.nextPage),
        {
            getNextPageParam: (lastPage, allPages) => {
                if (lastPage.hasNextPage) { return allPages.length + 1 }
            }
        }
    )

    const { htmlDockRef, hasNextPageRef } = useAutoFetchNextPage<HTMLDivElement>(promotionsQuery.fetchNextPage, [promotions])

    useEffect(() => {
        if (promotionsQuery.data) {
            setPromotions(promotionsQuery.data.pages.flatMap(page => page.data))
            hasNextPageRef.current = promotionsQuery.hasNextPage
        }
    }, [promotionsQuery.data])

    const showWarningDeletePromotion = useMemo(() => (promotionId: string) => {
        setWarningDeletePromotion(`Bạn có muốn xóa sản phẩm #${promotionId} không?`)
    }, [])

    const deletePromotion = useMemo(() => async (promotionId: string) => {
        if (promotionId) {
            dispatch({ type: 'loading', payload: true })
            const result = await AdminService.deletePromotion(promotionId)
            dispatch({ type: 'loading', payload: false })
            dispatch({ type: 'alert', payload: result ? 'Xóa thành công' : 'Lỗi khi xóa' })
            result && promotionsQuery.refetch()
        }

        setWarningDeletePromotion('')
        setWoudDeletePromotionId('')
    }, [])
    return (
        <div>
            <br />
            <Link to="./add" className="add-new"><Icon.Plus /> Thêm tin khuyến mãi</Link>
            <br />
            {
                promotionsQuery.isFetched
                    ? (
                        promotions.length > 0
                            ? <div className="data-table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Ảnh bìa</th>
                                            <th>Id</th>
                                            <th>Tiêu đề</th>
                                            <th>Nội dung</th>
                                            <th>Mã coupon</th>
                                            <th>Ngày thêm</th>
                                            <th>Ngày cập nhật</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            promotions.map(promotion =>
                                                <tr key={promotion.id}>
                                                    <td>
                                                        <AdvancedImage cldImg={createCloudinaryImage(promotion.coverImage)} className='image image--wide' />
                                                    </td>
                                                    <td>{promotion.id}</td>
                                                    <td>{promotion.title}</td>
                                                    <td>
                                                        <div className="shorten" title={StringFormatter.textFromHTML(promotion.content)}>
                                                            {StringFormatter.textFromHTML(promotion.content)}
                                                        </div>
                                                    </td>
                                                    <td>{promotion.couponCode}</td>
                                                    <td>{(new Date(promotion.createdAt)).toLocaleString('vn', { dateStyle: 'short' })}</td>
                                                    <td>{promotion.updatedAt ? (new Date(promotion.updatedAt)).toLocaleString('vn', { dateStyle: 'short' }) : ''}</td>
                                                    <td>
                                                        <Dropdown
                                                            label={
                                                                <button className='more' style={{ height: '24px', width: '24px' }}>
                                                                    <Icon.HorizontalMore />
                                                                </button>
                                                            }
                                                            content={
                                                                <div className='more-menu'>
                                                                    <Link to={'edit/' + promotion.id}>Chỉnh sửa</Link>
                                                                    <a
                                                                        onClick={() => {
                                                                            setWoudDeletePromotionId(promotion.id)
                                                                            showWarningDeletePromotion(promotion.id)
                                                                        }}
                                                                    >
                                                                        Xóa
                                                                    </a>
                                                                </div>
                                                            }
                                                            noneArrowIcon
                                                            placement='bottom-end'
                                                        />
                                                    </td>
                                                </tr>
                                            )
                                        }
                                    </tbody>
                                </table>
                                <div className='hidden-dock' ref={htmlDockRef}></div>
                            </div>
                            : <span>Không có tin khuyến mãi nào</span>
                    )
                    : <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '20px auto' }}><LoadingIcon /></div>
            }
            {
                warningDeletePromotion &&
                <Popup
                    closeHandler={() => {
                        setWarningDeletePromotion('')
                        setWoudDeletePromotionId('')
                    }}
                >
                    <div className="warning-wrapper">
                        <div className="content">
                            {warningDeletePromotion}
                        </div>
                        <div className="buttons">
                            <button
                                className="confirm"
                                onClick={() => deletePromotion(wouldDeletePromotionId)}
                            >
                                Có
                            </button>
                            <button
                                className="cancel"
                                onClick={() => {
                                    setWarningDeletePromotion('')
                                    setWoudDeletePromotionId('')
                                }}
                            >
                                Không
                            </button>
                        </div>
                    </div>
                </Popup>
            }
        </div>
    )
}

export default PromotionViewer