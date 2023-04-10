import { AdvancedImage } from '@cloudinary/react'
import { MouseEvent, useEffect, useState } from 'react'
import { Pause, Play, ShortArrowLeft, ShortArrowRight } from '../../../compoments/Icon'
import { createCloudinaryImage } from '../../../services/image'
import { SECOND } from '../../../utils/format'

interface ProductImagePreviewProps {
    images: string[]
}

function ProductImagePreview({ images }: ProductImagePreviewProps) {
    const CHANGE_IMAGE_TIME = 3 * SECOND
    const [indexOfImageToPreview, setIndexOfImageToPreview] = useState(0)
    const [autoPlay, setAutoPlay] = useState(true)

    useEffect(() => {
        if (autoPlay) {
            const autoPlayTimerId = setInterval(() => {
                nextImage()
            }, CHANGE_IMAGE_TIME)
            return () => {
                clearInterval(autoPlayTimerId)
            }
        }
    }, [autoPlay])

    function toggleAutoPlay() {
        setAutoPlay(prevAutoPlay => !prevAutoPlay)
    }

    function nextImage() {
        setIndexOfImageToPreview(prevIndex => {
            if (prevIndex < images.length - 1) {
                return prevIndex + 1
            } else {
                return 0
            }
        })
    }

    function previouseImage() {
        setIndexOfImageToPreview(prevIndex => {
            if (prevIndex > 0) {
                return prevIndex - 1
            } else {
                return images.length - 1
            }
        })
    }

    function changeIndexImage(e: MouseEvent) {
        if (e.target) {
            const imageThumb = e.target as HTMLDivElement
            const indexOfThumb = Number(imageThumb.dataset.index || 0)
            setIndexOfImageToPreview(indexOfThumb)
        }
    }

    return (
        <div className="product-image-preview">
            <div className="previewer">
                <AdvancedImage cldImg={createCloudinaryImage(images[indexOfImageToPreview])} />
                <div className="controls">
                    <button
                        className="autoplay"
                        onClick={toggleAutoPlay}
                    >
                        {autoPlay ? <Pause /> : <Play />}
                    </button>
                    <button
                        className="previous"
                        onClick={previouseImage}
                    >
                        <ShortArrowLeft />
                    </button>
                    <button
                        className="next"
                        onClick={nextImage}
                    >
                        <ShortArrowRight />
                    </button>
                </div>
            </div>
            <div className="image-picker">
                {
                    images.map((image, index) => {
                        return (
                            <div
                                className={
                                    index === indexOfImageToPreview
                                        ? 'image-thumb selected'
                                        : 'image-thumb'
                                }
                                key={image}
                            >
                                <AdvancedImage
                                    data-index={index}
                                    onClick={changeIndexImage}
                                    cldImg={createCloudinaryImage(image)}
                                />
                            </div>
                        )
                    })
                }
            </div>
        </div>
    )
}

export default ProductImagePreview