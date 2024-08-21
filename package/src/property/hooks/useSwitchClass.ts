import TPropertyChangeHook from "../types/TPropertyChangeHandler"

export default function useSwitchClass(
    query: string,
    prefix: string = "",
    sufix: string = ""
): TPropertyChangeHook {
    return (bazComponent, value, _, oldValue) => {
        const targets = bazComponent.root?.querySelectorAll(query)
        targets?.forEach((target: Element) => {
            if (target) {
                const className = `${prefix}${value}${sufix}`
                target.classList.remove(`${prefix}${oldValue}${sufix}`)
                target.classList.add(className)
            }
        })
    }
}