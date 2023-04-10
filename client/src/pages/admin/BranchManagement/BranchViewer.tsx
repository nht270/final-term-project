import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Dropdown from '../../../compoments/Dropdown'
import * as Icon from '../../../compoments/Icon'
import LoadingIcon from '../../../compoments/Icon/LoadingIcon'
import Popup from '../../../compoments/Popup'
import useStore from '../../../hooks/useStore'
import * as BranchService from '../../../services/branch'
import * as AdminService from '../../../services/admin'
import './BranchViewer.scss'

function BranchViewer() {
    const [, dispatch] = useStore()
    const [branches, setBranches] = useState<BranchService.Branch[]>([])
    const [wouldDeleteBranchId, setWoudDeleteBranchId] = useState('')
    const [warningDeleteBranch, setWarningDeleteBranch] = useState('')

    const branchesQuery = useQuery(['get-branches-query'], () => {
        return BranchService.getBranches()
    })

    useEffect(() => {
        if (branchesQuery.isFetched &&
            branchesQuery.data) {
            setBranches(branchesQuery.data)
        }
    }, [branchesQuery.isFetched])

    const deleteBranch = useMemo(() => async (branchId: string) => {
        if (branchId) {
            dispatch({ type: 'loading', payload: true })
            const result = await AdminService.deleteBranch(branchId)
            dispatch({ type: 'loading', payload: false })
            dispatch({ type: 'alert', payload: result ? 'Xóa thành công' : 'Lỗi khi xóa' })
            if (result) {
                branchesQuery.remove()
                branchesQuery.refetch()
            }
        }

        setWarningDeleteBranch('')
        setWoudDeleteBranchId('')
    }, [])

    const showWarningDeleteBranch = useMemo(() => (branchId: string) => {
        setWarningDeleteBranch(`Bạn có muốn xóa sản phẩm #${branchId} không?`)
    }, [])

    return (
        <>
            <Link to="./add" className="add-new"><Icon.Plus /> Thêm chi nhánh</Link>
            <br />
            {
                branchesQuery.isFetching
                    ? <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '20px auto' }}><LoadingIcon /></div>
                    : (
                        branches.length > 0
                            ? <div className="data-table-wrapper">
                                <table className='data-table'>
                                    <thead>
                                        <tr>
                                            <th>Id</th>
                                            <th>Tên</th>
                                            <th>Số điện thoại</th>
                                            <th>Địa chỉ</th>
                                            <th>Giờ mở cửa</th>
                                            <th>Giờ đóng cửa</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            branches.map(branch =>
                                                <tr key={branch.id}>
                                                    <td>{branch.id}</td>
                                                    <td>{branch.name}</td>
                                                    <td>{branch.phone}</td>
                                                    <td>{branch.address}</td>
                                                    <td>{branch.openedAt}</td>
                                                    <td>{branch.closedAt}</td>
                                                    <td>
                                                        <Dropdown
                                                            label={
                                                                <button className='more' style={{ height: '24px', width: '24px' }}>
                                                                    <Icon.HorizontalMore />
                                                                </button>
                                                            }
                                                            content={
                                                                <div className='more-menu'>
                                                                    <Link to={'edit/' + branch.id}>Chỉnh sửa</Link>
                                                                    <a
                                                                        onClick={() => {
                                                                            setWoudDeleteBranchId(branch.id)
                                                                            showWarningDeleteBranch(branch.id)
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
                            </div>
                            : <span>Không tìm thấy thông tin cửa hàng</span>
                    )
            }

            {
                warningDeleteBranch &&
                <Popup
                    closeHandler={() => {
                        setWarningDeleteBranch('')
                        setWoudDeleteBranchId('')
                    }}
                >
                    <div className="warning-wrapper">
                        <div className="content">
                            {warningDeleteBranch}
                        </div>
                        <div className="buttons">
                            <button
                                className="confirm"
                                onClick={() => deleteBranch(wouldDeleteBranchId)}
                            >
                                Có
                            </button>
                            <button
                                className="cancel"
                                onClick={() => {
                                    setWarningDeleteBranch('')
                                    setWoudDeleteBranchId('')
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

export default BranchViewer