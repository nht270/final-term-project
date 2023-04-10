import { AdvancedImage } from '@cloudinary/react'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as Icon from '../../../compoments/Icon'
import LoadingIcon from '../../../compoments/Icon/LoadingIcon'
import useStore from '../../../hooks/useStore'
import * as AdminService from '../../../services/admin'
import * as BannerService from '../../../services/banner'
import { createCloudinaryImage } from '../../../services/image'
import './BannerViewer.scss'

function BannerViewer() {
    const [banners, setBanners] = useState<BannerService.Banner[]>([])
    const bannersQuery = useQuery(['get-banner-list'], BannerService.getBanners)
    const navigate = useNavigate()
    const [, dispatch] = useStore()

    useEffect(() => {
        if (bannersQuery.data) {
            setBanners(bannersQuery.data)
        }
    }, [bannersQuery.data])

    async function deleteBanner(bannerId: string) {
        const success = await AdminService.deleteBanner(bannerId)
        if (success) {
            bannersQuery.refetch()
            dispatch({ type: 'alert', payload: 'Xóa thành công' })
        } else {
            dispatch({ type: 'alert', payload: 'Xóa không thành công' })
        }
    }

    return (
        <>
            <Link to="./add" className="add-new"><Icon.Plus /> Thêm banner</Link>
            <br />
            {
                bannersQuery.isFetched
                    ? (
                        banners.length > 0
                            ? <div className="data-table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Id</th>
                                            <th>Ảnh</th>
                                            <th>Tiêu đề</th>
                                            <th>Liên kết</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            banners.map(banner =>
                                                <tr key={banner.id}>
                                                    <td>
                                                        <Link to={'edit/' + banner.id}>{banner.id}</Link>
                                                    </td>
                                                    <td><AdvancedImage cldImg={createCloudinaryImage(banner.image)} className="image image--wide" /></td>
                                                    <td>{banner.title}</td>
                                                    <td>{banner.linkTo}</td>
                                                    <td><button className="more" onClick={() => deleteBanner(banner.id)}><Icon.Cancel /></button></td>
                                                </tr>
                                            )
                                        }
                                    </tbody>
                                </table>
                            </div>
                            : <span>Không có banner nào</span>
                    )
                    : <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '20px auto' }}><LoadingIcon /></div>
            }
        </>
    )
}

export default BannerViewer