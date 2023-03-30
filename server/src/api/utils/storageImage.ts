import { v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

cloudinary.config({
    secure: true,
    api_key: process.env.API_KEY_CLOUDINARY || '',
    api_secret: process.env.API_SECRET_CLOUDINARY || '',
    cloud_name: process.env.CLOUD_NAME_CLOUDINARY || ''
})

export async function uploadImage(imagePath: string) {
    if (fs.existsSync(imagePath) &&
        fs.statSync(imagePath).isFile()) {
        try {
            const { public_id } = await cloudinary.uploader.upload(imagePath)
            return public_id
        } catch (error) {
            console.log(error)
        }
    }
    return ''
}

export async function getImage(imageId: string) {
    try {
        const uploadedImage = await cloudinary.api.resource(imageId)
        return uploadedImage.url as string || ''
    } catch (error) {
        console.log(error)
        return ''
    }
}

export async function deleteImage(imageId: string) {
    try {

        const result = await cloudinary.api.delete_resources([imageId])
        return !!result?.['deleted']?.[imageId]
    } catch (error) {
        console.log(error)
        return false
    }
}