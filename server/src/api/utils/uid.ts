export function createUid(size = 20) {
    const headTokenLength = Math.round(size / 2)
    const tailTokenLength = size - headTokenLength

    const headToken =
        getLastSubString(Date.now().toString(36), headTokenLength).padStart(headTokenLength, '0')
    const tailToken =
        getLastSubString(Math.random().toString(36).replace(/\./g, ''), tailTokenLength).padEnd(tailTokenLength, '0')
    return headToken + tailToken
}

function getLastSubString(s: string, size = 10) {
    const startIndexToCut = s.length > size ? s.length - size : 0
    const endIndexToCut = startIndexToCut + size
    return s.slice(startIndexToCut, endIndexToCut)
}