export const SECOND = 1000
export const MINUTE = 60 * SECOND
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR
export const WEEK = 7 * DAY
export const KB = 1024
export const MB = 1024 * KB

export class StringFormatter {
    static toUpperFirstLetter(s: string) {
        return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : ''
    }

    static removeAscent(str: string) {

        // with lower case
        str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a")
        str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e")
        str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i")
        str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o")
        str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u")
        str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y")
        str = str.replace(/đ/g, "d")

        // with upper case
        str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A")
        str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E")
        str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I")
        str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O")
        str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U")
        str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y")
        str = str.replace(/Đ/g, "D")
        return str;
    }

    static textFromHTML(html: string) {
        const span = document.createElement('span')
        span.innerHTML = html
        return span.textContent || ''
    }
}


export class DateFormatter {
    static getRelativeTime(date: Date, local = 'vi') {
        const relativeTimeFormat = new Intl.RelativeTimeFormat(local, { style: 'narrow', numeric: 'auto' })
        const currentDate = new Date()
        const msDistance = date.getTime() - currentDate.getTime()
        const msDistanceAbs = Math.abs(msDistance)

        if (msDistanceAbs < MINUTE) {
            return relativeTimeFormat.format(Math.round(msDistance / SECOND), 'second')
        } else if (msDistanceAbs < HOUR) {
            return relativeTimeFormat.format(Math.round(msDistance / MINUTE), 'minute')
        } else if (msDistanceAbs < DAY) {
            return relativeTimeFormat.format(Math.round(msDistance / HOUR), 'hours')
        } else if (msDistanceAbs < WEEK) {
            return relativeTimeFormat.format(Math.round(msDistance / DAY), 'days')
        } else if (msDistanceAbs >= WEEK) {
            return relativeTimeFormat.format(Math.round(msDistance / WEEK), 'weeks')
        }

        return ''
    }
}

export class NumberFormatter {
    static currency(number: number, locales: string | string[] = 'vi-VN', unit = 'VND') {
        const currencyFormatter = new Intl.NumberFormat(locales, { style: 'currency', currency: unit })
        return currencyFormatter.format(number)
    }

    static capacity(number: number, locales: string | string[] = 'vi-VN') {
        const unit = number > MB ? 'megabyte' : 'kilobyte'
        const relativeNumber = number > MB ? number / MB : number / KB
        const capacityFormatter = new Intl.NumberFormat(locales, { style: 'unit', unit })
        return capacityFormatter.format(relativeNumber)
    }

    static decimal(number: number, locales: string | string[] = 'vi-VN') {
        const numberFormatter = new Intl.NumberFormat(locales, { style: 'decimal' })
        return numberFormatter.format(number)
    }
}