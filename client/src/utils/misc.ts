const PRICE_PER_KM = 3000
const PRICE_FOR_FIRST_KMS = 15000
const FIRST_KMS = 3

export interface ImageResolution {
    heigh: number,
    width: number
}

export function calculateDeliveryCharge(distanceByMet: number) {
    const kmCount = distanceByMet / 1000
    let deliveryCharge = PRICE_FOR_FIRST_KMS
    let restKmCount = kmCount - FIRST_KMS
    if (restKmCount < 0) {
        restKmCount = 0
    }
    deliveryCharge += PRICE_PER_KM * restKmCount
    return deliveryCharge
}

export async function getImageResolution(imageSource: string): Promise<ImageResolution> {
    const imageTag = document.createElement('img')
    imageTag.src = imageSource

    return new Promise((resolve, reject) => {
        imageTag.onload = () => {
            const heigh = imageTag.naturalHeight
            const width = imageTag.naturalWidth
            imageTag.src = ''
            imageTag.remove()
            resolve({ heigh, width })
        }

        imageTag.onerror = () => {
            reject('Image source invalid')
        }
    })
}

export function covertFileListToArray(fileList: FileList) {
    const files: File[] = []
    for (let i = 0; i < fileList.length; i++) {
        files.push(fileList[i])
    }

    return files
}

export function getToDayString() {
    const today = new Date()
    return today.toISOString().split('T')[0]
}

export function getTomorrowString() {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
}