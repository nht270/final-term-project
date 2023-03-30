import NewsCard from '../../../compoments/NewsCard'
import ProductCard from '../../../compoments/ProductCard'
import SlideShow from './SlideShow'

import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import * as ProductService from '../../../services/product'
import * as BannerService from '../../../services/banner'
import * as NewsService from '../../../services/news'
import './index.scss'
import QueryKeyPrefix from '../../../configures/queryKeyPrefix'

function Home() {

    const getNewestProductsOptions: ProductService.GetProductOptions = useMemo(() => ({
        sort: 'newest',
        include: { priceAndSize: true },
        filter: { status: 'show' }
    }), [])

    const getCoffeeOptions: ProductService.GetProductOptions = useMemo(() => ({
        sort: 'newest',
        include: { priceAndSize: true },
        filter: { status: 'show', searchString: 'Ca phe' }
    }), [])

    const newProductsQuery = useQuery(
        [QueryKeyPrefix.GET_PRODUCT, getNewestProductsOptions],
        async () => {
            const paginatedData = await ProductService.getProducts(getNewestProductsOptions)
            return paginatedData.data
        }
    )

    const coffeesQuery = useQuery(
        [QueryKeyPrefix.GET_PRODUCT, getCoffeeOptions],
        async () => {
            const paginatedData = await ProductService.getProducts(getCoffeeOptions)
            return paginatedData.data
        }
    )

    const bannersQuery = useQuery([QueryKeyPrefix.GET_BANNER_PREFIX], BannerService.getBanners)
    const someNewsQuery = useQuery([QueryKeyPrefix.GET_NEWS_PREFIX], () => NewsService.getNewsList())
    const [newsList, setNewsList] = useState<NewsService.News[]>([])
    const [newProducts, setNewProducts] = useState<ProductService.Product[]>([])
    const [newCoffees, setNewCoffees] = useState<ProductService.Product[]>([])

    useEffect(() => {
        if (newProductsQuery.isFetched && newProductsQuery.data) {
            setNewProducts(newProductsQuery.data)
        }
    }, [newProductsQuery.isFetched])

    useEffect(() => {
        if (coffeesQuery.isFetched && coffeesQuery.data) {
            setNewCoffees(coffeesQuery.data)
        }
    }, [coffeesQuery.isFetched])

    useEffect(() => {
        if (someNewsQuery.data) {
            setNewsList(someNewsQuery.data.data)
        }
    }, [someNewsQuery.data])

    return (
        <>
            <div className="content">
                {bannersQuery.data && <SlideShow banners={bannersQuery.data} />}
                <div className="title">
                    <h1>Cà phê & ...</h1>
                    <p>
                        Cuộc đời là những giọt cà phê đen, bản thân ta sẽ là những viên
                        đường bé nhỏ.
                    </p>
                </div>
                <div className="grid wide" style={{ gap: '20px', justifyContent: 'center' }}>
                    {
                        newCoffees.map((coffee) => {
                            return (
                                <div className="col l-2 m-3 xs-12 s-4 align-center-wrapper" key={coffee.id}>
                                    <ProductCard {...coffee} />
                                </div>
                            )
                        })
                    }
                </div>
                <div className="title">
                    <h1>Tin nổi bật</h1>
                </div>
                <div className="grid wide" style={{ gap: '30px', justifyContent: 'center' }}>
                    {
                        newsList.map((news) => {
                            return (
                                <div className="col l-3 m-4 s-6 xs-12 align-center-wrapper" key={news.id}>
                                    <NewsCard {...news} />
                                </div>
                            )
                        })
                    }
                </div>
                <div className="title">
                    <h1>Mới ra mắt</h1>
                </div>

                <div className="grid wide" style={{ gap: '20px', justifyContent: 'center' }}>

                    {
                        newProducts.map((product) => {
                            return (
                                <div className="col l-2 m-3 xs-12 s-4 align-center-wrapper" style={{ marginTop: '10px' }} key={product.id}>
                                    <ProductCard {...product} />
                                </div>
                            )
                        })
                    }
                </div>
            </div>
        </>
    )
}

export default Home