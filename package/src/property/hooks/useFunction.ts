import BazlamaWebComponent from "../../component/BazlamaWebComponent"
import PropertyDefine from "../PropertyDefine"
import TPropertyChangeHook from "../TPropertyChangeHandler"
import { TPropertyValueType } from "../TPropertyValueType"

export default function useFunction(
    func: (
        bazComponent: BazlamaWebComponent, 
        value: TPropertyValueType, 
        propertyDefine: PropertyDefine,
        oldValue: TPropertyValueType
    ) => void ): TPropertyChangeHook {
    return func
}