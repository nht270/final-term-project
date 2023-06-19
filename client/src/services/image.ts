import { Cloudinary } from '@cloudinary/url-gen'
import { limitFit, thumbnail } from '@cloudinary/url-gen/actions/resize'
import { formDataRequest, SERVER_ORIGIN } from './general'

const CLOUD_NAME_CLOUDINARY = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || ''
const IMAGE_UPLOAD_ENDPOINT = SERVER_ORIGIN + '/image/upload'

export const cloudinary = new Cloudinary({ cloud: { cloudName: CLOUD_NAME_CLOUDINARY } })

export function createCloudinaryThumb(publicId: string, width: number = 150, heigh: number = 150) {
    return cloudinary.image(publicId).resize(thumbnail(width, heigh))
}

export function createCloudinaryThumbLink(publicId: string, width: number = 150, heigh: number = 150) {
    const thumbnailImageLink = createCloudinaryThumb(publicId, width, heigh).toURL()

    return thumbnailImageLink
}

export function createCloudinaryImage(publicId: string, width?: number, heigh?: number) {
    const image = cloudinary.image(publicId).resize(limitFit(width, heigh))
    return image
}

export function createCloudinaryImageLink(publicId: string, width?: number, heigh?: number) {
    const imageLink = createCloudinaryImage(publicId, width, heigh).toURL()
    return imageLink
}

export async function upload(file: File) {

    const formData = new FormData()
    formData.append('imageFile', file)
    const response = await formDataRequest(IMAGE_UPLOAD_ENDPOINT, 'POST', formData)
    if (response.ok) {
        const link: string = await response.json()
        return link
    } else {
        return ''
    }
}