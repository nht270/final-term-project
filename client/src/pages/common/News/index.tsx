import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import NewsCard from '../../../compoments/NewsCard'
import QueryKeyPrefix from '../../../configures/queryKeyPrefix'
import useAutoFetchNextPage from '../../../hooks/useAutoFecthNextPage'
import * as NewsService from '../../../services/news'

function News() {
    const [newsList, setNewsList] = useState<NewsService.News[]>([])
    const newsListQuery = useInfiniteQuery(
        [QueryKeyPrefix.GET_NEWS_LIST_PREFIX],
        ({ pageParam }) => NewsService.getNewsList(pageParam?.nextPage),
        {
            getNextPageParam: (lastPage, allPages) => {
                if (lastPage.hasNextPage) { return { nextPage: allPages.length + 1 } }
            }
        }
    )
    const { htmlDockRef, hasNextPageRef } = useAutoFetchNextPage<HTMLDivElement>(newsListQuery.fetchNextPage, [newsList])
    useEffect(() => {
        if (newsListQuery.data) {
            setNewsList(newsListQuery.data.pages.flatMap(page => page.data))
            hasNextPageRef.current = newsListQuery.hasNextPage
        }
    }, [newsListQuery.data])

    return (
        <div>
            <div className="grid wide">
                <h2>Tin tức</h2>
            </div>
            <div className="grid wide" style={{ gap: '30px', justifyContent: 'center' }}>
                {
                    newsList.map((news) => {
                        return (
                            <div key={news.id} className="col l-3 m-4 s-6 xs-12 align-center-wrapper">
                                <NewsCard {...news} />
                            </div>
                        )
                    })
                }
                <div className="hidden-dock" ref={htmlDockRef}></div>
            </div>
        </div>
    )
}

export default News