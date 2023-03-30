import * as Icon from '../Icon'
import './index.scss'

interface StarRangeProps {
    star: number
}

function StarRange({ star }: StarRangeProps) {
    return (
        <div className='star-range'>
            <span className={star >= 1 ? 'star-range__light' : ''}><Icon.BoldStar /></span>
            <span className={star >= 2 ? 'star-range__light' : ''}><Icon.BoldStar /></span>
            <span className={star >= 3 ? 'star-range__light' : ''}><Icon.BoldStar /></span>
            <span className={star >= 4 ? 'star-range__light' : ''}><Icon.BoldStar /></span>
            <span className={star >= 5 ? 'star-range__light' : ''}><Icon.BoldStar /></span>
        </div>
    )
}

export default StarRange