import { debounce } from 'lodash'
import { useMemo } from 'react'

const DEFAULT_DELAY_TIME = 400

export default function useDebounce(functionWantedDebounce: (...args: any) => any, delay: number = DEFAULT_DELAY_TIME) {
    const debouncedFunction = useMemo(() => debounce(functionWantedDebounce, delay), [])
    return debouncedFunction
}