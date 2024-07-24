import TPropertyChangeHandler from "../TPropertyChangeHandler"

export default function useElementProperty<T>(
    query: string,
    property: string
): TPropertyChangeHandler<T> {
    return (element, value) => {
        const targets = element.root?.querySelectorAll(query)
        targets?.forEach((target) => {
            if (target) {
                (target as any)[property] = value
            }
        })
    }
}