import { ReactNode, useMemo, useState } from 'react'
import Tippy, { TippyProps } from '@tippyjs/react'
import DropdownToggle, { DropdownToggleProps } from './DropdownToggle'
import './index.scss'
import { PopperProps } from 'react-popper'

type DropdownProps = Omit<DropdownToggleProps, 'children' | 'isDown' | 'handleClick' | 'handleMouseOver' | 'handleMouseLeave'> & {
	label: ReactNode
	content: ReactNode
	showMenuWhenClick?: boolean
	showMenuWhenHover?: boolean
	gap?: number	// gap between label and menu of dropdown
	appearanceMehtod?: 'float' | 'pushBelowElement',
	placement?: TippyProps['placement']
}

const DEFAULT_GAP = 5
function Dropdown({
	label,
	content,
	labelWrapperCss,
	showMenuWhenClick = true,
	showMenuWhenHover = false,
	gap = DEFAULT_GAP,
	noneArrowIcon,
	appearanceMehtod = 'float',
	placement
}: DropdownProps) {
	const [triggerMenu, setTriggerMenu] = useState(false)

	const handleClickDropdown = useMemo(() => () => {
		if (showMenuWhenClick && !showMenuWhenHover) {
			setTriggerMenu((prev) => !prev)
		}
	}, [])

	const handleMouseOverDropdown = useMemo(() => () => {
		showMenuWhenHover && setTriggerMenu(true)
	}, [])

	const handleMouseLeaveDropdown = useMemo(() => () => {
		showMenuWhenHover && setTriggerMenu(false)
	}, [])

	if (appearanceMehtod === 'float') {
		return (
			<Tippy
				content={content}
				trigger={showMenuWhenClick && !showMenuWhenHover ? 'click' : 'mouseenter focus'}
				interactive
				placement={placement}
				onTrigger={() => setTriggerMenu(true)}
				onUntrigger={() => setTriggerMenu(false)}
				offset={[0, gap]}
				popperOptions={{
					strategy: 'fixed'
				}}
			>
				<DropdownToggle
					isDown={triggerMenu}
					noneArrowIcon={noneArrowIcon}
					labelWrapperCss={labelWrapperCss}
				>
					{label}
				</DropdownToggle>
			</Tippy>
		)
	}

	return (
		<div
			className="dropdown"
			onMouseOver={handleMouseOverDropdown}
			onMouseLeave={handleMouseLeaveDropdown}
		>
			<DropdownToggle
				isDown={triggerMenu}
				noneArrowIcon={noneArrowIcon}
				labelWrapperCss={labelWrapperCss}
				handleClick={handleClickDropdown}
			>
				{label}
			</DropdownToggle>
			{
				triggerMenu ? <div className={'dropdown-menu'}> {content}</div> : null
			}

		</div>
	)
}

export default Dropdown
