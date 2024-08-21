import BazlamaWebComponent from "../../component/BazlamaWebComponent"
import TPropertyChangeHook from "../types/TPropertyChangeHandler"

export type TCalcValue = (value: any, query: string, attribute: string, bazComponent: BazlamaWebComponent) => any

export default function useElementAttribute(query: string, attribute: string, calcValue?: TCalcValue): TPropertyChangeHook {
    return (bazComponent, value) => {
        const targets = bazComponent.root?.querySelectorAll(query)
        targets?.forEach((target: Element) => {
            if (target) {
                if (calcValue !== undefined) {
                    const newValue = calcValue(value, query, attribute, bazComponent)
                    target.setAttribute(attribute, `${newValue}`)
                    return
                }
                target.setAttribute(attribute, `${value}`)
            }
        })
    }
}
