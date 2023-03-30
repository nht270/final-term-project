import { Request, Response } from 'express'
import { FormDataRequest } from '../middlewares/formDataExtract.js'
import { getImage, uploadImage } from '../utils/storageImage.js'

export async function imageUpload(req: FormDataRequest<Request>, res: Response) {
    if (!req.files || !req.files.imageFile) {
        res.status(400).json('Unknown error')
        return
    }
    const imageFile = Array.isArray(req.files.imageFile) ? req.files.imageFile[0] : req.files.imageFile
    const image = await uploadImage(imageFile.filepath)
    const imageLink = await getImage(image)

    if (imageLink) {
        res.json(imageLink)
    } else {
        res.status(400).json('Error unknown')
    }
}