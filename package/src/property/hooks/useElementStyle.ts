import TPropertyChangeHandler from "../TPropertyChangeHandler"

export default function useElementStyle<T>(
    query: string,
    style: string,
    suffix: string = ""
): TPropertyChangeHandler<T> {
    return (element, value) => {
        const targets = element.root?.querySelectorAll(query)
        targets?.forEach((target) => {
            if (target) {
                (target as HTMLElement).style.setProperty(style, `${value}${suffix}`);
            }
        })
    }
}