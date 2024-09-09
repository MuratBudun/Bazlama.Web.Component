import { TPropertyChangeCalculateValue } from "../types/TPropertyChangeCalculateValue"
import TPropertyChangeHook from "../types/TPropertyChangeHandler"

export default function useElementText(
    query: string, prefix: string = "", suffix: string = "", 
    onCalculate?: TPropertyChangeCalculateValue): TPropertyChangeHook {
    return (bazComponent, value) => {
        const targets = bazComponent.root?.querySelectorAll(query)
        targets?.forEach((target: Element) => {
            if (target) {
                if (onCalculate !== undefined) {
                    const newValue = onCalculate(value, query, "", bazComponent)
                    target.textContent = `${prefix}${newValue}${suffix}`
                    return
                }                
                target.textContent = `${prefix}${value}${suffix}`
            }
        })
    }
}
