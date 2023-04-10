import { AdvancedImage } from '@cloudinary/react'
import { MouseEvent, UIEvent, useEffect, useRef, useState } from 'react'
import { Pause, Play, ShortArrowLeft, ShortArrowRight } from '../../../compoments/Icon'
import { Banner } from '../../../services/banner'
import { createCloudinaryImage } from '../../../services/image'
import './SlideShow.scss'

interface SlideShowProps {
	banners: Banner[]
}

function SlideShow({ banners }: SlideShowProps) {
	const AUTO_PLAY_TIME = 3000
	const [autoPlay, setAutoPlay] = useState(true)
	const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
	const slideShowRef = useRef<HTMLDivElement>(null)
	let autoPlayTimer: null | NodeJS.Timer = null

	function autoPlayHandler() {
		setAutoPlay(!autoPlay)
	}

	useEffect(() => {
		if (autoPlay) {
			autoPlayTimer = setInterval(() => {
				scrollNextSlideHandler()
			}, AUTO_PLAY_TIME)
		}

		return () => {
			if (!!autoPlayTimer) {
				clearInterval(autoPlayTimer)
			}
		}
	})

	function scrollSlideShowHandler(e: UIEvent) {
		const scrollLeftOfSlideShow = (e.target as HTMLDivElement).scrollLeft
		const indexToScroll = Math.round(scrollLeftOfSlideShow / window.innerWidth)

		if (indexToScroll !== currentSlideIndex) {
			setCurrentSlideIndex(indexToScroll)
		}
	}

	function scrollNextSlideHandler() {
		const windowWidth = window.innerWidth
		const slideShow = slideShowRef.current
		if (!!slideShow) {
			let indexToScroll = currentSlideIndex + 1
			if (indexToScroll >= banners.length) {
				indexToScroll = 0
			}

			slideShow.scrollLeft = windowWidth * indexToScroll
		}
	}

	function scrollPreviousSlideHandler() {
		const windowWidth = window.innerWidth
		const slideShow = slideShowRef.current
		if (!!slideShow) {
			let indexToScroll = currentSlideIndex - 1
			if (indexToScroll < 0) {
				indexToScroll = banners.length - 1
			}

			(slideShow as HTMLDivElement).scrollLeft = windowWidth * indexToScroll
		}
	}

	function scrollToSlideHandler(e: MouseEvent) {
		const slideIndexDot = e.target
		const windowWidth = window.innerWidth
		const slideShow = slideShowRef.current

		if (!!slideShow && !!slideIndexDot) {
			const slideIndex = Number(
				(slideIndexDot as HTMLDivElement).dataset.index || 0
			)
			slideShow.scrollLeft = windowWidth * slideIndex
		}
	}

	return (
		<div className="slideshow-container">
			<div
				className="slideshow"
				onScroll={scrollSlideShowHandler}
				ref={slideShowRef}
			>
				<div className="slider" style={{ width: banners.length * 100 + '%' }}>
					{banners.map((banner) => {
						return (
							<a href={banner.linkTo} className="slide" key={banner.id}>
								<AdvancedImage cldImg={createCloudinaryImage(banner.image)} alt={banner.title} />
							</a>
						)
					})}
				</div>
			</div>
			<div className="autoplay-control" onClick={autoPlayHandler}>
				{autoPlay ? <Pause /> : <Play />}
			</div>
			<div className="previous-control" onClick={scrollPreviousSlideHandler}>
				<ShortArrowLeft />
			</div>
			<div className="indexs">
				{
					banners.map((banner, index) => {
						const classNameForIndex =
							currentSlideIndex === index ? 'dot selected' : 'dot'
						return (
							<div
								key={banner.id}
								className={classNameForIndex}
								data-index={index}
								onClick={scrollToSlideHandler}
							></div>
						)
					})}
			</div>
			<div className="next-control" onClick={scrollNextSlideHandler}>
				<ShortArrowRight />
			</div>
		</div>
	)
}

export default SlideShow
