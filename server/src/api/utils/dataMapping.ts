export function convertUnderscorePropertiesToCamelCase(obj: Record<string, any>) {
    if (!obj || Array.isArray(obj) || typeof obj !== 'object' || Object.prototype.toString.apply(obj) === '[object Date]') {
        return obj
    } else {
        const newObj: Record<string, any> = {}
        for (let property in obj) {
            const camelProperty = convertUnderscoreStringToCamelCase(property)
            newObj[camelProperty] = convertUnderscorePropertiesToCamelCase(obj[property])
        }
        return newObj
    }
}

function convertUnderscoreStringToCamelCase(s: string) {
    const wordsOfString = s.split('_')
    let camelString = wordsOfString[0]

    for (let i = 1; i < wordsOfString.length; i++) {
        camelString +=
            wordsOfString[i][0].toUpperCase() + wordsOfString[i].slice(1)
    }

    return camelString
}

export function decodeGender(code: number | Buffer) {

    const codeIndex = typeof code === 'number' ? code : Number(code.readInt8())
    const GENDER = ['male', 'female', 'other']
    return GENDER[codeIndex] || GENDER[0]
}

export function encodeGender(gender: string) {
    const GENDER = ['male', 'female', 'other']
    const indexOfGender = GENDER.indexOf(gender)

    return indexOfGender >= 0 ? indexOfGender : 0
}

export function groupObjectsInOne(objects: Record<string, unknown>[], properties: string[], replaceName: string, replaceProperty: boolean = false) {
    if (objects.length <= 0) { return null }
    const keysOfObject = Array.from(new Set(objects.map(Object.keys).reduce((totalKeys, keys) => [...totalKeys, ...keys], [])))
    const keepedProperties = keysOfObject.filter(key => !properties.includes(key))
    const groupedObject: Record<string, unknown> = getFromProperties(objects[0], keepedProperties)
    for (let object of objects) {
        const groupedValues: Record<string, unknown> = getFromProperties(object, properties)
        const groupedValue: unknown = replaceProperty ? groupedValues[properties[0]] : groupedValues
        if (!Array.isArray(groupedObject[replaceName])) {
            groupedObject[replaceName] = []
        }
        (groupedObject[replaceName] as unknown[]).push(groupedValue)
    }
    return groupedObject
}

export function getFromProperties(object: Record<string, unknown>, properties: string[]) {
    const objectEntries = Object.entries(object).filter(([key]) => properties.includes(key))
    return Object.fromEntries(objectEntries)
}