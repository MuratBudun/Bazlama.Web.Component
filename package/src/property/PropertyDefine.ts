/*
    Bazlama Web Component Project
    Property Class for Bazlama Web Component
    2024-7-21
    Version 1.0
    muratbudun@gmail.com
*/

import BazlamaWebComponent from "../component/BazlamaWebComponent.ts"
import TPropertyChangeHook from "./types/TPropertyChangeHandler.ts"
import IPropertyDefineOption from "./types/IPropertyDefineOption.ts"
import { TPropertyValueTypeName, TPropertyValueType } from "./types/TPropertyValueType.ts"
import BazConvert from "../helper/BazConvert.ts"

class PropertyDefine {
    valueTypeName: TPropertyValueTypeName
    defaultValue: TPropertyValueType
    name: string
    isAttribute: boolean
    isAttributeObserved: boolean
    attributeName: string
    changeHooks: TPropertyChangeHook[]

    constructor(name: string, options: IPropertyDefineOption = {}) {
        this.name = name
        this.defaultValue = options.defaultValue || ""
        this.valueTypeName = options.valueTypeName || "string"
        this.isAttribute = options.isAttribute || false
        this.isAttributeObserved = options.isAttributeObserved || false
        this.attributeName = options.attributeName || name
        this.changeHooks = options.changeHooks || []
    }

    public getValue(bazComponent: BazlamaWebComponent): TPropertyValueType {
        if (!(bazComponent instanceof BazlamaWebComponent)) return this.defaultValue

        const value = bazComponent.propertyValues[this.name]
        if (value === undefined) return this.defaultValue

        if (this.valueTypeName === "string") {
            return BazConvert.anyToString(value, BazConvert.anyToString(this.defaultValue))  
        }

        if (this.valueTypeName === "number") {
            return BazConvert.anyToNumber(value, BazConvert.anyToNumber(this.defaultValue))
        }

        if (this.valueTypeName === "boolean") {
            return BazConvert.anyToBoolean(value, BazConvert.anyToBoolean(this.defaultValue))
        }

        if (this.valueTypeName === "bigint") {
            return BazConvert.anyToBigint(value, BazConvert.anyToBigint(this.defaultValue))   
        }

        return value
    }

    public setValue(bazComponent: BazlamaWebComponent, value: TPropertyValueType): void {
        if (!(bazComponent instanceof BazlamaWebComponent)) return

        const isAttributeValue = this.setAttributeValue(bazComponent, value)
        if (isAttributeValue === false) {
            this.setDirectValue(bazComponent, value)
        }
    }

    public setAttributeValue(bazComponent: BazlamaWebComponent, value: TPropertyValueType): boolean {
        if (!(bazComponent instanceof BazlamaWebComponent)) return false
        if (!this.isAttribute) return false

        const attributeName = this.attributeName || this.name
        if (!attributeName) return false

        if (value === null || value === undefined) {
            bazComponent.removeAttribute(attributeName)
            return false
        }

        const stringValue = BazConvert.anyToString(value)
        bazComponent.setAttribute(attributeName, String(stringValue))

        return true
    }

    public setDirectValue(bazComponent: BazlamaWebComponent, value: TPropertyValueType): void {
        if (!(bazComponent instanceof BazlamaWebComponent)) return

        const oldValue = bazComponent.propertyValues[this.name]

        switch (this.valueTypeName) {
            case "string":
                bazComponent.propertyValues[this.name] = 
                BazConvert.anyToString(value, BazConvert.anyToString(this.defaultValue))
                break
            case"number":
                bazComponent.propertyValues[this.name] = 
                BazConvert.anyToNumber(value, BazConvert.anyToNumber(this.defaultValue))
                break
            case "boolean":
                bazComponent.propertyValues[this.name] = 
                BazConvert.anyToBoolean(value, BazConvert.anyToBoolean(this.defaultValue))
                break
            case "bigint":
                bazComponent.propertyValues[this.name] = 
                BazConvert.anyToBigint(value, BazConvert.anyToBigint(this.defaultValue))
                break
            default:
                bazComponent.propertyValues[this.name] = value
                break
        }
        
        this.changeHooks.forEach((event) => event(bazComponent, value, this, oldValue))
    }
}

export default PropertyDefine
