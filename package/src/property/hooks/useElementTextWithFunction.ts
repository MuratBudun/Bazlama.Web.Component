import BazlamaWebComponent from "../../component/BazlamaWebComponent"
import PropertyDefine from "../PropertyDefine"
import TPropertyChangeHook from "../types/TPropertyChangeHandler"
import { TPropertyValueType } from "../types/TPropertyValueType"

export default function useElementTextWithFunction(
    query: string,
    textUpdater: (
        value: TPropertyValueType,
        target: Element,
        propertyDefine: PropertyDefine,
        oldValue: TPropertyValueType,
        bazComponent: BazlamaWebComponent
    ) => string
): TPropertyChangeHook {
    return (bazComponent, value, propertyDefine, oldValue) => {
        const targets = bazComponent.root?.querySelectorAll(query)
        targets?.forEach((target: Element) => {
            if (target) {
                target.textContent = textUpdater(value, target, propertyDefine, oldValue, bazComponent)
            }
        })
    }
}
