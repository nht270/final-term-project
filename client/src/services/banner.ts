import { jsonRequest, SERVER_ORIGIN } from './general'

export interface Banner {
    id: string,
    title: string,
    linkTo: string,
    image: string
}

const BANNER_ENDPOINT = SERVER_ORIGIN + '/banner'

export async function getBanners() {
    const response = await jsonRequest(BANNER_ENDPOINT, 'GET')
    if (response.ok) {
        const banners: Banner[] = await response.json()
        return banners
    }
    return []
}

export async function getBanner(bannerId: string) {
    const response = await jsonRequest(BANNER_ENDPOINT + '/' + bannerId, 'GET')
    if (response.ok) {
        const banner: Banner | null = await response.json()
        return banner
    }

    return null
}