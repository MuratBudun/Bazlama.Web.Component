import TPropertyChangeHook from "../types/TPropertyChangeHandler"

export default function useElementText(query: string, prefix: string = "", suffix: string = ""): TPropertyChangeHook {
    return (bazComponent, value) => {
        const targets = bazComponent.root?.querySelectorAll(query)
        targets?.forEach((target: Element) => {
            if (target) {
                target.textContent = `${prefix}${value}${suffix}`
            }
        })
    }
}
