const GOONGIO_API_KEY = 'fUK51BQaDjlOb6JfcQ1YwMJtqYrVC47fnwS0wCpD'
const GOONGIO_DIRECTION_API = 'https://rsapi.goong.io/Direction'

export interface GoongIoCoordinate {
    longitude: string,
    latitude: string
}

// return -1 if error when get distance
export async function getLengthFromOriginToDestinationGoongIo(origin: GoongIoCoordinate, destination: GoongIoCoordinate) {
    const getDirectionUrl = new URL(GOONGIO_DIRECTION_API)
    getDirectionUrl.searchParams.append('api_key', GOONGIO_API_KEY)
    getDirectionUrl.searchParams.append('origin', `${origin.latitude},${origin.longitude}`)
    getDirectionUrl.searchParams.append('destination', `${destination.latitude},${destination.longitude}`)

    const response = await fetch(getDirectionUrl)

    if (response.ok) {
        const result = await response.json()
        const distance = result?.routes?.[0]?.legs?.[0]?.distance
        return Number(distance.value) || 0
    }

    return -1
}