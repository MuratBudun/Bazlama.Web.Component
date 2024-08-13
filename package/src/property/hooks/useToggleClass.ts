import BazlamaWebComponent from "../../component/BazlamaWebComponent"
import PropertyDefine from "../PropertyDefine"
import TPropertyChangeHook from "../TPropertyChangeHandler"
import { TPropertyValueType } from "../TPropertyValueType"

export default function useToggleClass(
    query: string,
    className: string,
    calcActive : (
        value: TPropertyValueType,
        target: Element,
        propertyDefine: PropertyDefine,
        oldValue: TPropertyValueType,
        bazComponent: BazlamaWebComponent
    ) => boolean
): TPropertyChangeHook {
    return (bazComponent, value, propertyDefine, oldValue) => {
        const targets = bazComponent.root?.querySelectorAll(query)
        targets?.forEach((target) => {
            if (target) {
                const add = calcActive(value, target, propertyDefine, oldValue, bazComponent)

                if (add) {
                    target.classList.add(className)
                } else {
                    target.classList.remove(className)
                }
            }
        })
    }
}