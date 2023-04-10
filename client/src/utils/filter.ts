export function filterNull<TData>(list: (TData | undefined | null)[]): TData[] {
    return list.flatMap(item => item ? [item] : [])
}