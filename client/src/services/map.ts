const MAPBOX_GEOCODING_API = 'https://api.mapbox.com/geocoding/v5/mapbox.places/'
const MAPBOX_GEOCODING_ACCESS_TOKEN = 'pk.eyJ1IjoidGVtcHRlc3Q5MTgyIiwiYSI6ImNsOXM4ZWJrYzAxcTgzdXRhZWtlMjA3dHUifQ.Rh3WVWrl7YUuocQ59DiQDA'

const LOCATIONIQ_GEOCODING_API = 'https://us1.locationiq.com/v1/search'
const LOCATIONIQ_GEOCODING_ACCESS_TOKEN = 'pk.671d39abcdc5a7341e6c60246e2b22cc'
const LOCATIONIQ_REVERSE_GEOCODING_API = 'https://us1.locationiq.com/v1/reverse'
const GOONGIO_API_KEY = 'fUK51BQaDjlOb6JfcQ1YwMJtqYrVC47fnwS0wCpD'
const GOONGIO_GEOCODING_API = 'https://rsapi.goong.io/geocode'
const GOONGIO_DIRECTION_API = 'https://rsapi.goong.io/Direction'

interface MapboxAddressLocation {
    textVi: string,
    longitude: number,
    latitude: number
}

interface LocationiqAddressLocation {
    placeId: string,
    longitude: string,
    latitude: string,
    displayName: string
}

export interface GoongIoAddressLocation {
    longitude: string,
    latitude: string,
    formattedAddress: string
}

export interface GoongIoCoordinate {
    longitude: string,
    latitude: string
}

export async function searchAddressMapbox(searchText: string) {
    if (searchText === '') return []

    const searchOptions = '?language=vi&country=vn&access_token=' + MAPBOX_GEOCODING_ACCESS_TOKEN
    const respone = await fetch(encodeURI(MAPBOX_GEOCODING_API + searchText + '.json' + searchOptions))
    const { features } = await respone.json()
    if (Array.isArray(features)) {
        const locations = features.map(extractAddressLocationMapbox)
        return locations
    }
    return []
}

function extractAddressLocationMapbox(data: Record<string, any>): MapboxAddressLocation {
    const textVi = data?.['text_vi'] || ''
    const [longitude, latitude] = data?.['center'] || [0, 0]
    return { textVi, longitude, latitude }
}

export async function searchAddressLocationiq(searchText: string) {
    if (searchText === '') return []

    const searchParams = `?key=${LOCATIONIQ_GEOCODING_ACCESS_TOKEN}&q=${encodeURI(searchText)}&countrycodes=vn&format=json&normalizeaddress=1&addressdetails=1`
    const respone = await fetch(LOCATIONIQ_GEOCODING_API + searchParams, { headers: { 'accept-language': 'vi' } })
    const places = await respone.json()
    if (Array.isArray(places)) {
        const locations = places.map(extractAddressLocationLocationiq)
        return locations
    }
    return []
}

function extractAddressLocationLocationiq(data: Record<string, any>): LocationiqAddressLocation {
    const displayName = data['display_name'] || ''
    const placeId = data['place_id'] || ''
    const longitude = data['lon'] || 0
    const latitude = data['lat'] || 0
    return { placeId, displayName, longitude, latitude }
}

export async function reverseCoordinatesToAddress(longitude: number | string, latitude: number | string): Promise<LocationiqAddressLocation | null> {
    const findParams =
        `?key=${LOCATIONIQ_GEOCODING_ACCESS_TOKEN}` +
        `&lon=${longitude}&lat=${latitude}` +
        `&countrycodes=vn&format=json&normalizeaddress=1&addressdetails=1`
    const respone = await fetch(LOCATIONIQ_REVERSE_GEOCODING_API + findParams, { headers: { 'accept-language': 'vi' } })

    if (respone.ok) {
        const data = await respone.json()
        const location = extractAddressLocationLocationiq(data)
        return location
    } else {
        return null
    }
}

function extractAddressLocationGoongIo(data: Record<string, any>): GoongIoAddressLocation {
    const formattedAddress = data?.['formatted_address']
    const latitude = String(data?.['geometry']['location']['lat'] || '')
    const longitude = String(data?.['geometry']['location']['lng'] || '')
    return { formattedAddress, longitude, latitude }
}

export async function getLengthFromOriginToDestinationGoongIo(origin: GoongIoCoordinate, destination: GoongIoCoordinate) {
    const getDirectionUrl = new URL(GOONGIO_DIRECTION_API)
    getDirectionUrl.searchParams.append('api_key', GOONGIO_API_KEY)
    getDirectionUrl.searchParams.append('origin', `${origin.latitude},${origin.longitude}`)
    getDirectionUrl.searchParams.append('destination', `${destination.latitude},${destination.longitude}`)
    const respone = await fetch(getDirectionUrl)
    if (respone.ok) {
        const result = await respone.json()
        const distance = result?.routes?.[0]?.legs?.[0]?.distance
        if (distance) {
            return Number(distance.value || 0)
        }
    }

    return -1
}

export async function searchAddressGoongIo(searchText: string) {
    if (searchText === '') return []

    const searchParams = `?api_key=${GOONGIO_API_KEY}&address=${encodeURI(searchText)}`
    const respone = await fetch(GOONGIO_GEOCODING_API + searchParams)
    const { results = [] } = await respone.json()
    if (Array.isArray(results)) {
        const locations = results.map(extractAddressLocationGoongIo)
        return locations
    }
    return []
}