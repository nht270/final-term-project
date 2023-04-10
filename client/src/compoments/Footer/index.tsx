import { useQuery } from '@tanstack/react-query'
import { Facebook, Instagram, WhatsApp, Youtube } from '../Icon'
import * as BranchService from '../../services/branch'
import './index.scss'

function Footer() {

	const branchesQuery = useQuery(['get-branches'], BranchService.getBranches)

	return (
		<div className="footer" style={{ marginTop: '50px' }}>
			<div className="grid wide">

				<div className="col l-4 m-6 s-6 xs-12 shop">
					<h3 id="shop-list">Cửa hàng</h3>
					{
						branchesQuery.isFetched &&
						branchesQuery.data &&
						branchesQuery.data.map((branch) => <BranchInformation key={branch.id} {...branch} />)
					}
				</div>
				<div className="col l-4 m-6 s-6 xs-12 about">
					<h3 id="about">GIỚI THIỆU ACE COFFEE</h3>
					<p>Thương hiệu bắt nguồn từ cà phê Việt Nam</p>
					<p>
						Từ tình yêu với Việt Nam và niềm đam mê cà phê, năm 2020, thương
						hiệu AceCoffee® ra đời với khát vọng nâng tầm di sản cà phê lâu
						đời của Việt Nam và lan rộng tinh thần tự hào, kết nối hài hoà
						giữa truyền thống với hiện đại.
					</p>
				</div>
				<div className="col l-4 m-6 s-6 xs-12 social">
					<h3>Kết nối với chúng tôi</h3>
					<Facebook />
					<Instagram />
					<WhatsApp />
					<Youtube />
				</div>
			</div>
		</div>
	)
}

function BranchInformation({ name, address, phone, openedAt, closedAt }: BranchService.Branch) {
	return (
		<div className="branch">
			<div className="branch-name">{name}</div>
			<div className="branch-address">Địa chỉ: {address}</div>
			<div className="branch-contact">Điện thoại: {phone}</div>
			<div className="branch-active-time">
				{openedAt} - {closedAt}
			</div>
		</div>
	)
}

export default Footer
