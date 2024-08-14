import BazlamaWebComponent from "../../component/BazlamaWebComponent"
import PropertyDefine from "../PropertyDefine"
import TPropertyChangeHook from "../types/TPropertyChangeHandler"
import { TPropertyValueType } from "../types/TPropertyValueType"

export default function useFunction(
    func: (
        bazComponent: BazlamaWebComponent,
        value: TPropertyValueType,
        propertyDefine: PropertyDefine,
        oldValue: TPropertyValueType
    ) => void
): TPropertyChangeHook {
    return func
}
