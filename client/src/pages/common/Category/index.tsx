import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { ChangeEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import ProductCard from '../../../compoments/ProductCard'
import QueryKeyPrefix from '../../../configures/queryKeyPrefix'
import useAutoFetchNextPage from '../../../hooks/useAutoFecthNextPage'
import * as CategoryService from '../../../services/category'
import * as ProductService from '../../../services/product'
import { Product } from '../../../services/product'
import './index.scss'

function Category() {

    const { categoryId = '' } = useParams()
    const [productsOfCategory, setProductsOfCategory] = useState<Product[]>([])
    const [category, setCategory] = useState<CategoryService.Category>()
    const navigate = useNavigate()
    const currentUrl = new URL(window.location.href)
    const productOrder = String(currentUrl.searchParams.get('order') || 'highPopular') as ProductService.SortType

    const categoryQuery = useQuery(
        [QueryKeyPrefix.GET_CATEGORY, categoryId],
        () => CategoryService.getCategory(categoryId),
        { enabled: categoryId !== '' }
    )

    const productsOfCategoryQuery = useInfiniteQuery(
        ['get-products-of', categoryId, productOrder],
        ({ pageParam, queryKey }) => {
            const [, categoryId] = queryKey
            const currentUrl = new URL(window.location.href)
            const productOrder = String(currentUrl.searchParams.get('order') || 'highPopular') as ProductService.SortType
            return ProductService.getProducts({ page: pageParam?.nextPage, include: { priceAndSize: true }, filter: { categoryId, status: 'show' }, sort: productOrder })
        },
        {
            enabled: categoryId !== '',
            getNextPageParam: (lastPage, allPages) => {
                if (lastPage.hasNextPage) { return { nextPage: allPages.length + 1 } }
            }
        }
    )

    const { htmlDockRef, hasNextPageRef } = useAutoFetchNextPage<HTMLDivElement>(productsOfCategoryQuery.fetchNextPage, [productsOfCategory])

    useEffect(() => {
        if (categoryQuery.data) {
            setCategory(categoryQuery.data)
        }
    }, [categoryQuery.data])

    useEffect(() => {
        if (productsOfCategoryQuery.data) {
            setProductsOfCategory(productsOfCategoryQuery.data.pages.flatMap(page => page.data))
            hasNextPageRef.current = productsOfCategoryQuery.hasNextPage
        }

    }, [productsOfCategoryQuery.data])

    function changeProductOrder(e: ChangeEvent) {
        if (!e.target) { return }
        const productOrder = (e.target as HTMLSelectElement).value
        navigate('?order=' + productOrder)
    }

    if (productsOfCategory && category) {
        return (
            <div className="grid wide" style={{ gap: '20px', justifyContent: 'center' }}>
                <div className="col l-12 m-12 s-12 xs-11">
                    <h2 className='title'>
                        <Link to="/">
                            <div className="breadcrumb">Trang chủ</div>
                        </Link>
                        <div className="slug">/</div>
                        <div className="breadcrumb main">{category.name}</div>
                    </h2>
                    <div className="sort-wrapper">
                        Sắp sếp theo:
                        <select name="sort" className="sort-selections" onChange={changeProductOrder}>
                            <option value="highPopular">Phổ biến</option>
                            <option value="highRating">Đánh giá cao</option>
                        </select>
                    </div>
                </div>
                {
                    productsOfCategory.length > 0 ? (
                        <>
                            {
                                productsOfCategory.map((product, index) => (
                                    <div className="col l-2 m-3 s-4 xs-12 align-center-wrapper" key={product.id} ref={index === productsOfCategory.length - 1 ? htmlDockRef : undefined}>
                                        <ProductCard {...product} />
                                    </div>
                                ))
                            }
                        </>
                    ) : (
                        <div className="no-product">Không có sản phẩm nào</div>
                    )
                }
            </div>
        )
    } else {
        return (
            <div className="grid wide">
                <div className="col l-12 m-12 s-12 xs-12">
                    <div className="no-category">Không có loại sản phẩm này</div>
                </div>
            </div>
        )
    }
}

export default Category