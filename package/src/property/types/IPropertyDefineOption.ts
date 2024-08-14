/*
    Bazlama Web Component Project
    Property Define Option for Bazlama Web Component
    2024-7-21
    Version 1.0
    muratbudun@gmail.com
*/

import TPropertyChangeHook from "./TPropertyChangeHandler"
import { TPropertyValueType, TPropertyValueTypeName } from "./TPropertyValueType"

interface IPropertyDefineOption {
    defaultValue?: TPropertyValueType
    valueTypeName?: TPropertyValueTypeName 
    isAttribute?: boolean
    isAttributeObserved?: boolean
    attributeName?: string
    changeHooks?: TPropertyChangeHook[]
}

export default IPropertyDefineOption
