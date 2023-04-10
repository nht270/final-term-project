import { jsonRequest, SERVER_ORIGIN } from './general'
const BRANCH_ENDPOINT = SERVER_ORIGIN + '/branch'

export interface Branch {
    id: string,
    name: string,
    phone: string,
    address: string,
    openedAt: string,
    closedAt: string,
    longitude: string,
    latitude: string
}

export async function getBranches() {
    const response = await jsonRequest(BRANCH_ENDPOINT, 'GET')
    if (response.ok) {
        const branches: Branch[] = await response.json()
        return branches
    } else {
        return []
    }
}

export async function getBranch(id: string) {
    const response = await jsonRequest(BRANCH_ENDPOINT + '/' + id, 'GET')
    if (response.ok) {
        const branch: Branch = await response.json()
        return branch
    }
    return null
}

export async function search(text: string) {
    const response = await jsonRequest(BRANCH_ENDPOINT + '/search/' + text, 'GET')
    if (response.ok) {
        const branches: Branch[] = await response.json()
        return branches
    }
    return []
}