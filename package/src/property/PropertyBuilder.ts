/*
    Bazlama Web Component Project
    Property Builder Class for Bazlama
    2024-8-1
    Version 1.0
    muratbudun@gmail.com
*/

import PropertyDefine from "./PropertyDefine"
import { TPropertyValueType, TPropertyValueTypeName } from "./types/TPropertyValueType"

export default class PropertyBuilder {
    private name: string
    private options: any = {}

    constructor(name: string, valueTypeName: TPropertyValueTypeName) {
        this.name = name
        this.options.valueTypeName = valueTypeName
    }

    setDefaultValue(defaultValue: TPropertyValueType): PropertyBuilder {
        this.options.defaultValue = defaultValue
        return this
    }

    setIsAttribute(isAttribute: boolean): PropertyBuilder {
        this.options.isAttribute = isAttribute
        return this
    }

    setIsAttributeObserved(isAttributeObserved: boolean): PropertyBuilder {
        this.options.isAttributeObserved = isAttributeObserved
        return this
    }

    setAttributeName(attributeName: string): PropertyBuilder {
        this.options.attributeName = attributeName
        return this
    }

    setChangeHooks(...hooks: Function[]): PropertyBuilder {
        this.options.changeHooks = hooks
        return this
    }

    setAttribute(attributeName: string, isObserved: boolean = true): PropertyBuilder {
        this.options.isAttribute = true
        this.options.isAttributeObserved = isObserved
        this.options.attributeName = attributeName
        return this
    }

    build(): PropertyDefine {
        return new PropertyDefine(this.name, this.options)
    }
}
