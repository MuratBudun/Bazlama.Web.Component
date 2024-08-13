import TPropertyChangeHook from "../TPropertyChangeHandler"

export default function useElementText(
    query: string,
    prefix: string = "",
    suffix: string = ""
): TPropertyChangeHook {
    return (bazComponent, value) => {
        const targets = bazComponent.root?.querySelectorAll(query)
        targets?.forEach((target) => {
            if (target) {
                target.textContent = `${prefix}${value}${suffix}`
            }
        })
    }
}