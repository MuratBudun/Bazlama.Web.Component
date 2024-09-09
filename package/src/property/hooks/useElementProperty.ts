import { TPropertyChangeCalculateValue } from "../types/TPropertyChangeCalculateValue"
import TPropertyChangeHook from "../types/TPropertyChangeHandler"

export default function useElementProperty(
    query: string, property: string, onCalculate?: TPropertyChangeCalculateValue): TPropertyChangeHook {
    return (bazComponent, value) => {
        const targets = bazComponent.root?.querySelectorAll(query)
        targets?.forEach((target: Element) => {
            if (target) {
                if (onCalculate !== undefined) {
                    const newValue = onCalculate(value, query, property, bazComponent)
                    { (target as any)[property] = newValue }
                    return
                }
                (target as any)[property] = value
            }
        })
    }
}       