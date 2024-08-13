import BazlamaWebComponent from "../../component/BazlamaWebComponent"
import PropertyDefine from "../PropertyDefine"
import TPropertyChangeHook from "../TPropertyChangeHandler"
import { TPropertyValueType } from "../TPropertyValueType"

export default function useCustomHook(
    query: string,
    func: (
        target: Element, 
        value: TPropertyValueType, 
        propertyDefine: PropertyDefine, 
        oldValue: TPropertyValueType,
        bazComponent: BazlamaWebComponent) => void ): TPropertyChangeHook {
    return (bazComponent, value, propertyDefine, oldValue) => {
        const targets = bazComponent.root?.querySelectorAll(query)
        targets?.forEach((target) => {
            if (target) {
                func(target, value, propertyDefine, oldValue, bazComponent)
            }
        })
    }
}