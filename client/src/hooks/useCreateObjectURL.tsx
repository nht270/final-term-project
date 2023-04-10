import { useEffect, useMemo, useRef } from 'react'

function useCreateObjectURL(obj?: Blob | MediaSource) {
    const urlRef = useRef('')
    urlRef.current = useMemo(() => {
        if (!obj) { return '' }
        if (urlRef.current) {
            URL.revokeObjectURL(urlRef.current)
        }
        return URL.createObjectURL(obj)
    }, [obj])

    useEffect(() => {
        return () => {
            URL.revokeObjectURL(urlRef.current)
        }
    }, [])

    return urlRef.current
}

export default useCreateObjectURL