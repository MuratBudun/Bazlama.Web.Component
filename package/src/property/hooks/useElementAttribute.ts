import TPropertyChangeHook from "../types/TPropertyChangeHandler"
import { TPropertyChangeCalculateValue } from "../types/TPropertyChangeCalculateValue"

export default function useElementAttribute(
    query: string, attribute: string, onCalculate?: TPropertyChangeCalculateValue): TPropertyChangeHook {
    return (bazComponent, value) => {
        const targets = bazComponent.root?.querySelectorAll(query)
        targets?.forEach((target: Element) => {
            if (target) {
                if (onCalculate !== undefined) {
                    const newValue = onCalculate(value, query, attribute, bazComponent)
                    target.setAttribute(attribute, `${newValue}`)
                    return
                }
                target.setAttribute(attribute, `${value}`)
            }
        })
    }
}