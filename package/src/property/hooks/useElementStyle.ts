import TPropertyChangeHook from "../types/TPropertyChangeHandler"

export default function useElementStyle(query: string, style: string, suffix: string = ""): TPropertyChangeHook {
    return (bazComponent, value) => {
        const targets = bazComponent.root?.querySelectorAll(query)
        targets?.forEach((target: Element) => {
            if (target) {
                ;(target as HTMLElement).style.setProperty(style, `${value}${suffix}`)
            }
        })
    }
}
