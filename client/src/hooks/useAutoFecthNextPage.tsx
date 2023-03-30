import { DependencyList, useEffect, useMemo, useRef } from 'react';

export default function useAutoFetchNextPage<THTMLElement extends HTMLElement>(fetchNextPage: Function, dependencies: DependencyList) {
    const htmlDockRef = useRef<THTMLElement>(null)
    const hasNextPageRef = useRef<boolean | undefined>()

    const observer = useMemo(() => new IntersectionObserver((entries, observer) => {
        if (typeof hasNextPageRef.current === 'boolean' && !hasNextPageRef.current) {
            observer.disconnect()
            return
        }

        if (entries.length > 0 && entries[0].isIntersecting) {
            fetchNextPage()
        }

    }), [])

    useEffect(() => {
        if (htmlDockRef.current) {
            observer.disconnect()
            observer.observe(htmlDockRef.current)
        }
    }, dependencies)

    useEffect(() => {
        return () => {
            observer.disconnect()
        }
    }, [])

    return { htmlDockRef, hasNextPageRef }
}