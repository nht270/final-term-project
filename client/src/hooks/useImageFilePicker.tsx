import Joi from 'joi'
import { ChangeEvent, useMemo, useState } from 'react'
import { covertFileListToArray, getImageResolution, ImageResolution } from '../utils/misc'
import { imageFileShema } from '../utils/validate'

export interface UseImageFilePickerParams {
    initValue?: File[],
    validate?: boolean
}

export interface FileInformation {
    type: string,
    size: number
}

export type ImageFileInformation = FileInformation & ImageResolution

function extractFileInformation(file: File): FileInformation {
    const { type, size } = file
    return { type, size }
}

async function extractImageFileInformation(file: File): Promise<ImageFileInformation | FileInformation> {
    const fileInformation = extractFileInformation(file)

    const imageSource = URL.createObjectURL(file)
    let imageResolution = null
    try {
        imageResolution = await getImageResolution(imageSource)
    } catch (error) {
        console.log(error)
    } finally {
        URL.revokeObjectURL(imageSource)
    }

    return imageResolution
        ? { ...fileInformation, ...imageResolution }
        : fileInformation
}

function useImageFilePicker({ initValue, validate = true }: UseImageFilePickerParams) {
    const [imageFiles, setImageFiles] = useState<File[]>(initValue || [])
    const [error, setError] = useState<Joi.ValidationError>()
    const handlePickImageFile = useMemo(() => {
        const imageFilesSchema = Joi.array().items(imageFileShema).empty()
        return async function (e: ChangeEvent) {
            if (!e.target) { return }
            const fileList = (e.target as HTMLInputElement).files
            if (!fileList || fileList.length <= 0) { return }
            const files = covertFileListToArray(fileList)

            if (validate) {
                const informationOfFiles: (FileInformation | ImageFileInformation)[] =
                    await Promise.all(files.map(extractImageFileInformation))
                const error = imageFilesSchema.validate(informationOfFiles).error
                if (error) {
                    setError(error)
                } else {
                    setImageFiles(files)
                }
            } else {
                setImageFiles(files)
            }
        }
    }, [])

    const clearError = useMemo(() => () => setError(undefined), [])
    const clearImageFiles = useMemo(() => () => setImageFiles([]), [])

    return { error, clearError, imageFiles, clearImageFiles, handlePickImageFile }
}

export default useImageFilePicker