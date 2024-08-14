import TPropertyChangeHook from "../types/TPropertyChangeHandler"

export default function useElementStyleFromFloat(
    query: string,
    style: string,
    suffix: string = ""
): TPropertyChangeHook {
    return (bazComponent, value) => {
        const floatValue = parseFloat(value as string) ?? 0
        const targets = bazComponent.root?.querySelectorAll(query)
        targets?.forEach((target: Element) => {
            if (target) {
                ;(target as HTMLElement).style.setProperty(`--${style}`, `${floatValue}${suffix}`)
            }
        })
    }
}
