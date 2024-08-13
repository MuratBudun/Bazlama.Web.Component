/*
    Bazlama Web Component Project
    Property Builder Class for Bazlama
    2024-8-1
    Version 1.0
    muratbudun@gmail.com
*/

import PropertyDefine from "./PropertyDefine"
import { TPropertyValueType, TPropertyValueTypeName } from "./TPropertyValueType"

export default class BazlamaPropertyBuilder {
    private name: string
    private options: any = {}

    constructor(name: string, valueTypeName: TPropertyValueTypeName) {
        this.name = name
        this.options.valueTypeName = valueTypeName
    }

    setDefaultValue(defaultValue: TPropertyValueType): BazlamaPropertyBuilder {
        this.options.defaultValue = defaultValue
        return this
    }

    setIsAttribute(isAttribute: boolean): BazlamaPropertyBuilder {
        this.options.isAttribute = isAttribute
        return this
    }

    setIsAttributeObserved(isAttributeObserved: boolean): BazlamaPropertyBuilder {
        this.options.isAttributeObserved = isAttributeObserved
        return this
    }

    setAttributeName(attributeName: string): BazlamaPropertyBuilder {
        this.options.attributeName = attributeName
        return this
    }

    setChangeHooks(...hooks: Function[]): BazlamaPropertyBuilder {
        this.options.changeHooks = hooks
        return this
    }

    setAttribute(attributeName: string, isObserved: boolean = true): BazlamaPropertyBuilder {
        this.options.isAttribute = true
        this.options.isAttributeObserved = isObserved
        this.options.attributeName = attributeName
        return this
    }

    build(): PropertyDefine {
        return new PropertyDefine(this.name, this.options)
    }
}
