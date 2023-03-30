import { NextFunction, Request, Response } from 'express'
import formidable from 'formidable'

export type FormDataRequest<TRequest extends Request> = TRequest & {
    fields?: formidable.Fields
    files?: formidable.Files
}

export function extractFormData<TRequest extends Request>(req: FormDataRequest<TRequest>, res: Response, next: NextFunction) {
    const contentType = req.headers['content-type']

    if (typeof contentType !== 'string' || contentType.split(';')[0] !== 'multipart/form-data') {
        res.status(418).json('Sorry, we use form-data')
        return
    }

    const form = new formidable.IncomingForm({ encoding: 'utf-8', keepExtensions: true, multiples: true })

    form.parse(req, async (err, fields, files) => {

        if (err) {
            console.log(err)
            res.status(400).json('Just error')
            return
        }
        req.fields = fields
        req.files = files
        next()
    })
}