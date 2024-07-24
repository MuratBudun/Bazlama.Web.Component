import TPropertyChangeHandler from "../TPropertyChangeHandler"

export default function useElementText<T>(
    query: string,
    prefix: string = "",
    suffix: string = ""
): TPropertyChangeHandler<T> {
    return (element, value) => {
        const targets = element.root?.querySelectorAll(query)
        targets?.forEach((target) => {
            if (target) {
                target.textContent = `${prefix}${value}${suffix}`
            }
        })
    }
}