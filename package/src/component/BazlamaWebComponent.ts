/*
    Bazlama Web Component Project
    Base Web Component for Bazlama Web Component
    2024-7-21
    Version 1.0
    muratbudun@gmail.com
*/

import EventAction from "../event-action/EventAction"
import PropertyDefine from "../property/PropertyDefine"
import TPropertyChangeHook from "../property/TPropertyChangeHandler"
import { TPropertyValueType, TPropertyValueTypeName } from "../property/TPropertyValueType"
import { ShadowRootMode } from "./ShadowRootMode"

export interface IPropertyValues {
    [key: string]: TPropertyValueType
}

export interface IPropertyDefines {
    [key: string]: PropertyDefine
}

export interface IPropertyChangeHandlers {
    [key: string]: TPropertyChangeHook[]
}

export default class BazlamaWebComponent extends HTMLElement {
    public propertyValues: IPropertyValues = {}
    public actionList: EventAction<any>[] = []
    public root: ShadowRoot | HTMLElement | null = null

    constructor(shadowMode: ShadowRootMode = ShadowRootMode.Closed) {
        super()
        this.style.display = "block"
        this.root = this

        if (shadowMode === ShadowRootMode.Open) {
            this.attachShadow({ mode: "open" })
            this.root = this.shadowRoot || this
        }

        if (shadowMode === ShadowRootMode.Closed) {
            this.root = this.attachShadow({ mode: "closed" }) || this
        }
    }

    //#region Initialize Properties ...
    public InitProperties(bazComponent: BazlamaWebComponent): void {
        const constructor = this.getConstructor()
        if (constructor.PropertyDefinesIsNullOrEmpty) return

        for (const key in constructor.PropertyDefines) {
            if (Object.prototype.hasOwnProperty.call(constructor.PropertyDefines, key)) {
                const prop = constructor.PropertyDefines[key]
                if (prop instanceof PropertyDefine) {
                    this.InitProperty(bazComponent, prop)
                }
            }
        }
    }

    public InitProperty(bazComponent: BazlamaWebComponent, propertyDefine: PropertyDefine) {
        let defaultValue = propertyDefine.defaultValue

        if (Object.keys(bazComponent).includes(propertyDefine.name)) {
            defaultValue = bazComponent[propertyDefine.name as keyof BazlamaWebComponent] as TPropertyValueType
            propertyDefine.valueTypeName = (typeof defaultValue) as TPropertyValueTypeName || "string"
            propertyDefine.defaultValue = defaultValue
        }

        this.propertyValues[propertyDefine.name] = defaultValue

        Object.defineProperty(bazComponent, propertyDefine.name, {
            get() {
                return this.propertyValues[propertyDefine.name]
                //const prop = bazComponent.getConstructor().GetProperty(propertyDefine.name)
                //return prop!.getValue(bazComponent)
            },

            set(value: any) {
                const prop = bazComponent.getConstructor().GetPropertyDefine(propertyDefine.name)
                prop!.setValue(bazComponent, value)
            },
        })
    }
    //#endregion

    //#region Static
    static isPropertyDefineInitialized = false
    static PropertyDefines: IPropertyDefines = {}
    static PropertyChangeHandlers: IPropertyChangeHandlers = {}

    static InitPropertyDefines(): void {
        const propertyDefines = this.CreatePropertyDefines()
        const createPropertyHooks = this.CreatePropertyHooks()

        if (propertyDefines && Array.isArray(propertyDefines) && propertyDefines.length > 0) {
            propertyDefines.forEach((prop) => {
                if (this.HasPropertyDefine(prop.name)) {
                    this.PropertyDefines[prop.name].isAttribute = prop.isAttribute
                    this.PropertyDefines[prop.name].attributeName = prop.attributeName
                    this.PropertyDefines[prop.name].isAttributeObserved = prop.isAttributeObserved
                    this.PropertyDefines[prop.name].changeHooks = [
                        ...this.PropertyDefines[prop.name].changeHooks,
                        ...prop.changeHooks]
                } else {
                    this.PropertyDefines[prop.name] = prop
                }
            })
        }

        if (createPropertyHooks) {
            for (const key in this.PropertyDefines) {
                if (Object.prototype.hasOwnProperty.call(this.PropertyDefines, key)) {
                    const prop = this.PropertyDefines[key]
                    if (createPropertyHooks[prop.name]) {
                        prop.changeHooks = [...prop.changeHooks, ...createPropertyHooks[prop.name]]
                    }
                }
            }
        }
    }

    static CreatePropertyDefines(): PropertyDefine[] {
        return []
    }

    static CreatePropertyHooks(): IPropertyChangeHandlers {
        return {}
    }

    static get PropertyDefinesIsNullOrEmpty(): boolean {
        return !this.PropertyDefines || Object.keys(this.PropertyDefines).length === 0
    }

    static HasPropertyDefine(propertyName: string, isOnlyAttribute = false): boolean {
        if (this.PropertyDefinesIsNullOrEmpty) return false
        const _isOnlyAttribute = isOnlyAttribute === true

        const prop = this.PropertyDefines[propertyName]
        if (!prop) return false
        if (!_isOnlyAttribute) return true
        
        return prop.isAttribute
    }

    static GetPropertyDefine(propertyName: string, isOnlyAttribute = false): PropertyDefine | null {
        if (this.PropertyDefinesIsNullOrEmpty) return null
        const _isOnlyAttribute = isOnlyAttribute === true
        const prop = this.PropertyDefines[propertyName]
        if (!prop) return null
        if (!_isOnlyAttribute) return prop
        if (prop.isAttribute) return prop

        return null
    }

    static GetPropertyDefineByAttributeName(attributeName: string): PropertyDefine | null {
        if (this.PropertyDefinesIsNullOrEmpty) return null
        
        for (const key in this.PropertyDefines) {
            if (Object.prototype.hasOwnProperty.call(this.PropertyDefines, key)) {
                const prop = this.PropertyDefines[key]
                if (prop.attributeName === attributeName) return prop
            }
        }

        return null
    }

    static get observedAttributes(): string[] {
        if (this.isPropertyDefineInitialized === false) {
            this.InitPropertyDefines()
            this.isPropertyDefineInitialized = true
        }
        
        if (this.PropertyDefinesIsNullOrEmpty) return []
        const attributes = 
            Object.values(this.PropertyDefines)
                .filter((prop) => prop.isAttribute)
                .map((prop) => prop.attributeName)
        return attributes
    }

    getConstructor(): typeof BazlamaWebComponent {
        return this.constructor as typeof BazlamaWebComponent
    }
    //#endregion

    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
        if (oldValue === newValue) return

        const prop = this.getConstructor().GetPropertyDefineByAttributeName(name)
        if (!prop) return

        prop.setDirectValue(this, newValue ?? "")
    }

    connectedCallback(): void {
        this.onConnected()
        this.render()
    }

    disconnectedCallback(): void {
        this.onDisconnected()
    }

    //#region Virtual Methods ...
    onConnected(): void {}
    onDisconnected(): void {}

    getRenderTemplate(): string {
        return `<span>Not implemented.</span>`
    }
    beforeRender(htmlTemplate: string): string {
        return htmlTemplate
    }
    afterRender(): void {}
    //#endregion

    render(): void {
        const htmlTemplate = this.beforeRender(this.getRenderTemplate())

        const constructor = this.getConstructor()

        if (this.root) {
            this.root.innerHTML = htmlTemplate
        }

        if (!constructor.PropertyDefinesIsNullOrEmpty) {
            for (const key in constructor.PropertyDefines) {
                if (Object.prototype.hasOwnProperty.call(constructor.PropertyDefines, key)) {
                    const prop = constructor.PropertyDefines[key]
                    if (prop instanceof PropertyDefine) {
                        const value = prop.getValue(this)
                        prop.changeHooks.forEach((event) => event(this, value, prop, value))
                    }
                }
            }
        }

        for (const action of this.actionList) {
            action.CreateAction()
        }

        this.afterRender()
    }
}
