/*
    Bazlama Web Component Project
    Base Web Component for Bazlama Web Component
    2024-7-21
    Version 1.0
    muratbudun@gmail.com
*/

import EventActionMap from "../event-action/EventActionMap"
import { IEventActionDefines } from "../event-action/types/IEventActionDefines"
import { IEventActionMaps } from "../event-action/types/IEventActionMaps"
import { IPropertyChangeHandlers } from "../property/types/IPropertyChangeHandlers"
import { IPropertyDefines } from "../property/types/IPropertyDefines"
import { IPropertyValues } from "../property/types/IPropertyValues"
import PropertyDefine from "../property/PropertyDefine"
import { TPropertyValueType, TPropertyValueTypeName } from "../property/types/TPropertyValueType"
import { ShadowRootMode } from "./ShadowRootMode"

export default class BazlamaWebComponent extends HTMLElement {
    public propertyValues: IPropertyValues = {}
    public eventActionMaps: IEventActionMaps = {}
    public root: ShadowRoot | HTMLElement | null = null

    constructor(shadowMode: ShadowRootMode = ShadowRootMode.Closed) {
        super()

        //this.style.display = "block"
        this.root = this

        if (shadowMode === ShadowRootMode.Open) {
            this.attachShadow({ mode: "open" })
            this.root = this.shadowRoot || this
        }

        if (shadowMode === ShadowRootMode.Closed) {
            this.root = this.attachShadow({ mode: "closed" }) || this
        }
    }

    render(): void {
        const htmlTemplate = this.beforeRender(this.getRenderTemplate())

        if (this.root) {
            this.root.innerHTML = htmlTemplate
        }

        this.ApplyAllPropertyChangeHooks()
        this.CreateHtmlElementEventActions()

        this.afterRender()
    }    

    public InitBazlamaWebComponent(): void {
        this.InitProperties()

        const eventActionMaps = this.createEventActionMaps()
        if (eventActionMaps && Array.isArray(eventActionMaps) && eventActionMaps.length > 0) {
            eventActionMaps.forEach((eventAction) => {
                this.eventActionMaps[eventAction.name] = eventAction
            })
        }

        this.InitEventActionDecorators()
    }

    //#region Initialize Properties ...
    public InitProperties(): void {
        const constructor = this.getConstructor()
        if (constructor.PropertyDefinesIsNullOrEmpty) return

        for (const key in constructor.PropertyDefines) {
            if (Object.prototype.hasOwnProperty.call(constructor.PropertyDefines, key)) {
                const prop = constructor.PropertyDefines[key]
                if (prop instanceof PropertyDefine) {
                    this.InitProperty(prop)
                }
            }
        }
    }

    public InitProperty(propertyDefine: PropertyDefine) {
        let defaultValue = propertyDefine.defaultValue

        if (Object.keys(this).includes(propertyDefine.name)) {
            defaultValue = this[propertyDefine.name as keyof BazlamaWebComponent] as TPropertyValueType
            propertyDefine.valueTypeName = (typeof defaultValue as TPropertyValueTypeName) || "string"
            propertyDefine.defaultValue = defaultValue
        }

        this.propertyValues[propertyDefine.name] = defaultValue

        Object.defineProperty(this, propertyDefine.name, {
            get() {
                return this.propertyValues[propertyDefine.name]
            },

            set(value: any) {
                const prop = this.getConstructor().GetPropertyDefine(propertyDefine.name)
                prop!.setValue(this, value)
            },
        })
    }

    public ApplyAllPropertyChangeHooks(): void {
        const constructor = this.getConstructor()
        if (constructor.PropertyDefinesIsNullOrEmpty) return

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

    public GetPropertyValue(propertyName: string): TPropertyValueType {
        return this.propertyValues[propertyName]
    }

    public SetPropertyValue(propertyName: string, value: TPropertyValueType): void {
        const prop = this.getConstructor().GetPropertyDefine(propertyName)
        if (prop) {
            prop.setValue(this, value)
        }
    }
    //#endregion

    //#region Event Actions ...
    public InitEventActionDecorators(): void {
        const constructor = this.getConstructor()
        if (constructor.EventActionDefines) {
            for (const key in constructor.EventActionDefines) {
                if (Object.prototype.hasOwnProperty.call(constructor.EventActionDefines, key)) {
                    const eventActionDefine = constructor.EventActionDefines[key]

                    const eventMethod = (this as any)[eventActionDefine.actionMethodName]

                    if (!eventMethod) {
                        console.error(`Event method not found: ${eventActionDefine.actionMethodName} for ${key} on ${this.constructor.name}`)
                        continue
                    }

                    const eventAction = new EventActionMap(
                        eventActionDefine.name,
                        eventActionDefine.elQuery,
                        eventActionDefine.eventName,
                        eventMethod
                    )

                    this.eventActionMaps[eventActionDefine.name] = eventAction
                }
            }
        }
    }

    public CreateHtmlElementEventActions(): void {
        for (const key in this.eventActionMaps) {
            if (Object.prototype.hasOwnProperty.call(this.eventActionMaps, key)) {
                const eventAction = this.eventActionMaps[key]
                eventAction.CreateElementEvent(this)
            }
        }
    }
    //#endregion

    //#region Static ...
    static get isPropertyDefineInitialized(): boolean {
        if ((this as any)["_isPropertyDefineInitialized"] === undefined) {
            (this as any)["_isPropertyDefineInitialized"] = false
        }

        return (this as any)["_isPropertyDefineInitialized"] as boolean
    }

    static set isPropertyDefineInitialized(value: boolean) {
        (this as any)["_isPropertyDefineInitialized"] = value
    }

    static get PropertyDefines(): IPropertyDefines {
        if ((this as any)["_PropertyDefines"] === undefined) {
            (this as any)["_PropertyDefines"] = {}
        }

        return (this as any)["_PropertyDefines"] as IPropertyDefines
    }

    static get EventActionDefines(): IEventActionDefines {
        if ((this as any)["_EventActionDefines"] === undefined) {
            (this as any)["_EventActionDefines"] = {}
        }

        return (this as any)["_EventActionDefines"] as IEventActionDefines
    }

    static get PropertyChangeHandlers(): IPropertyChangeHandlers {
        if ((this as any)["_PropertyChangeHandlers"] === undefined) {
            (this as any)["_PropertyChangeHandlers"] = {}
        }

        return (this as any)["_PropertyChangeHandlers"] as IPropertyChangeHandlers
    }

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
                        ...prop.changeHooks,
                    ]
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
        const attributes = Object.values(this.PropertyDefines)
            .filter((prop) => prop.isAttribute)
            .map((prop) => prop.attributeName)
        return attributes
    }

    getConstructor(): typeof BazlamaWebComponent {
        return this.constructor as typeof BazlamaWebComponent
    }
    //#endregion

    //#region Callbacks ...
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
    //#endregion

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

    createEventActionMaps(): EventActionMap[] {
        return []
    }
    //#endregion
}
