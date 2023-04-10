import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ProductCard from '../../../compoments/ProductCard'
import QueryKeyPrefix from '../../../configures/queryKeyPrefix'
import useAutoFetchNextPage from '../../../hooks/useAutoFecthNextPage'
import * as ProductService from '../../../services/product'
import './index.scss'

function Search() {
    const keyword = useSearchParams()[0].get('q') || ''
    const [filteredProducts, setFilteredProducts] = useState<ProductService.Product[]>([])
    const searchProduct = useInfiniteQuery(
        [QueryKeyPrefix.SEARCH_PRODUCT_PREFIX, keyword],
        ({ pageParam }) => {
            return ProductService.getProducts({ page: pageParam?.nextPage, include: { priceAndSize: true }, filter: { searchString: keyword, status: 'show' } })
        },
        {
            getNextPageParam: (lastPage, allPages) => {
                if (lastPage.hasNextPage) return { nextPage: allPages.length + 1 }
            },
            enabled: keyword !== ''
        }
    )

    const { htmlDockRef, hasNextPageRef } = useAutoFetchNextPage<HTMLDivElement>(searchProduct.fetchNextPage, [filteredProducts])

    useEffect(() => {
        if (searchProduct.data) {
            setFilteredProducts(searchProduct.data.pages.flatMap(page => page.data))
            hasNextPageRef.current = searchProduct.hasNextPage
        }
    }, [searchProduct.data])
    return (
        <div className="grid wide" style={{ gap: '20px', justifyContent: 'center' }}>
            <div className="col l-12 m-12 s-12 xs-11">
                <h2 className="title">
                    <Link to="/">
                        <div className="breadcrumb">Trang chủ</div>
                    </Link>
                    <div className="slug">/</div>
                    <div className="breadcrumb main">Tìm kiếm: '{keyword}'</div>
                </h2>
            </div>
            {

                filteredProducts.length > 0 ? (
                    <>
                        {
                            filteredProducts.map((product, index) => (
                                <div
                                    className="col l-2 m-3 s-4 xs-12 align-center-wrapper"
                                    key={product.id}
                                    ref={index === filteredProducts.length - 1 ? htmlDockRef : undefined}
                                >
                                    <ProductCard {...product} />
                                </div>
                            ))
                        }
                    </>
                ) : (
                    <div className="col l-12 m-12 s-12 xs-11 no-product">Không có sản phẩm nào</div>
                )
            }
        </div>
    )
}

export default Search