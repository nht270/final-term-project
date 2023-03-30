import { AdvancedImage } from '@cloudinary/react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Dropdown from '../../../compoments/Dropdown'
import * as Icon from '../../../compoments/Icon'
import LoadingIcon from '../../../compoments/Icon/LoadingIcon'
import useAutoFetchNextPage from '../../../hooks/useAutoFecthNextPage'
import { createCloudinaryThumb } from '../../../services/image'
import * as NewsService from '../../../services/news'
import * as AdminService from '../../../services/admin'
import { StringFormatter } from '../../../utils/format'
import './NewsViewer.scss'
import useStore from '../../../hooks/useStore'
import Popup from '../../../compoments/Popup'

function NewsViewer() {
    const [newsList, setNewsList] = useState<NewsService.News[]>([])
    const [wouldDeleteNewsId, setWoudDeleteNewsId] = useState('')
    const [warningDeleteNews, setWarningDeleteNews] = useState('')
    const [, dispatch] = useStore()

    const newsListQuery = useInfiniteQuery(
        ['get-news-list'],
        ({ pageParam }) => {
            return NewsService.getNewsList(pageParam?.nextPage)
        },
        {
            getNextPageParam: (lastPage, allPages) => {
                if (lastPage.hasNextPage) { return { nextPage: allPages.length + 1 } }
            }
        }
    )

    const { htmlDockRef, hasNextPageRef } = useAutoFetchNextPage<HTMLDivElement>(newsListQuery.fetchNextPage, [newsList])

    useEffect(() => {
        if (newsListQuery.data) {
            const newsList = newsListQuery.data.pages.flatMap(page => page.data)
            setNewsList(newsList)
            hasNextPageRef.current = newsListQuery.hasNextPage
        }
    }, [newsListQuery.isFetched])

    const showWarningDeleteNews = useMemo(() => (newsId: string) => {
        setWarningDeleteNews(`Bạn có muốn xóa sản phẩm #${newsId} không?`)
    }, [])

    const deleteNews = useMemo(() => async (newsId: string) => {
        if (newsId) {
            dispatch({ type: 'loading', payload: true })
            const result = await AdminService.deleteNews(newsId)
            dispatch({ type: 'loading', payload: false })
            dispatch({ type: 'alert', payload: result ? 'Xóa thành công' : 'Lỗi khi xóa' })
            if (result) {
                newsListQuery.remove()
                newsListQuery.refetch()
            }
        }

        setWarningDeleteNews('')
        setWoudDeleteNewsId('')
    }, [])

    return (
        <>
            <Link to="./add" className="add-new"><Icon.Plus /> Thêm tin tức</Link>
            <br />
            {
                newsListQuery.isFetched
                    ? (
                        newsList.length > 0
                            ? <div className="data-table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Ảnh bìa</th>
                                            <th >Id</th>
                                            <th>Tiêu đề</th>
                                            <th>Nội dung</th>
                                            <th>Ngày thêm</th>
                                            <th>Ngày cập nhật</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            newsList.map(news =>
                                                <tr key={news.id}>
                                                    <td><AdvancedImage cldImg={createCloudinaryThumb(news.coverImage)} className="image image--wide" /></td>
                                                    <td>{news.id}</td>
                                                    <td><div className="shorten">{news.title}</div></td>
                                                    <td><div className="shorten">{StringFormatter.textFromHTML(news.content)}</div></td>
                                                    <td>{(new Date(news.createdAt)).toLocaleString('vi-VN', { dateStyle: 'short' })}</td>
                                                    <td>{news.updatedAt ? (new Date(news.updatedAt)).toLocaleString('vi-VN', { dateStyle: 'short' }) : ''}</td>
                                                    <td>
                                                        <Dropdown
                                                            label={
                                                                <button className='more' style={{ height: '24px', width: '24px' }}>
                                                                    <Icon.HorizontalMore />
                                                                </button>
                                                            }
                                                            content={
                                                                <div className='more-menu'>
                                                                    <Link to={'edit/' + news.id}>Chỉnh sửa</Link>
                                                                    <a
                                                                        onClick={() => {
                                                                            setWoudDeleteNewsId(news.id)
                                                                            showWarningDeleteNews(news.id)
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
                                <div className="hidden-dock" ref={htmlDockRef}></div>
                            </div>
                            : <span>Không có tin tức nào</span>
                    )
                    : <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '20px auto' }}><LoadingIcon /></div>
            }
            {
                warningDeleteNews &&
                <Popup
                    closeHandler={() => {
                        setWarningDeleteNews('')
                        setWoudDeleteNewsId('')
                    }}
                >
                    <div className="warning-wrapper">
                        <div className="content">
                            {warningDeleteNews}
                        </div>
                        <div className="buttons">
                            <button
                                className="confirm"
                                onClick={() => deleteNews(wouldDeleteNewsId)}
                            >
                                Có
                            </button>
                            <button
                                className="cancel"
                                onClick={() => {
                                    setWarningDeleteNews('')
                                    setWoudDeleteNewsId('')
                                }}
                            >
                                Không
                            </button>
                        </div>
                    </div>
                </Popup>
            }
        </>
    )
}

export default NewsViewer