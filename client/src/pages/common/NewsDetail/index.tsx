import { AdvancedImage } from '@cloudinary/react'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { createCloudinaryImage } from '../../../services/image'
import * as NewsService from '../../../services/news'
import './index.scss'

function NewsDetail() {
    const newsId = useParams()['newsId']
    const [news, setNews] = useState<NewsService.News>()
    const newsContentRef = useRef<HTMLDivElement>(null)
    const newsQuery = useQuery(
        ['get-news', newsId],
        () => newsId ? NewsService.getNews(newsId) : null,
        { enabled: !!newsId }
    )

    useEffect(() => {
        if (newsQuery.data) {
            setNews(newsQuery.data)
        }
    }, [newsQuery.data])

    useEffect(() => {
        if (news && newsContentRef.current) {
            newsContentRef.current.innerHTML = news.content
        }
    }, [newsContentRef.current, news])

    if (!newsId || !news) {
        return (
            <>
                Not found news
            </>
        )
    }

    if (news) {
        return (
            <div className="news">
                <AdvancedImage cldImg={createCloudinaryImage(news.coverImage)} className="news-cover" />
                <div className='grid wide'>
                    <div className="l-12 m-12 s-12 xs-12">
                        <h2>{news.title}</h2>
                        <div className="content" ref={newsContentRef}>
                        </div>
                    </div>
                </div>
            </div>
        )
    } else {
        return null
    }

}

export default NewsDetail