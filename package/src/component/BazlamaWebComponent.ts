/*
    Bazlama Web Component Project
    Base Web Component for Bazlama Web Component
    2024-7-21
    Version 1.0
    muratbudun@gmail.com
*/

import BazlamaProperty from "../property/BazlamaProperty"
import { ShadowRootMode } from "./ShadowRootMode"

export default class BazlamaWebComponent extends HTMLElement {
    public root: ShadowRoot | HTMLElement | null = null

    constructor(shadowMode: ShadowRootMode = ShadowRootMode.Closed) {
        super()
        this.root = this

        if (shadowMode === ShadowRootMode.Open) {
            this.attachShadow({ mode: "open" })
            this.root = this.shadowRoot || this
        }

        if (shadowMode === ShadowRootMode.Closed) {
            this.root = this.attachShadow({ mode: "closed" }) || this
        }
    }

    //#region Static
    static get Properties(): BazlamaProperty<any>[] {
        return []
    }

    static get PropertiesIsNullOrEmpty(): boolean {
        return (
            !this.Properties ||
            !Array.isArray(this.Properties) ||
            this.Properties.length === 0
        )
    }

    static HasProperty(propertyName: string, isOnlyAttribute = false): boolean {
        if (this.PropertiesIsNullOrEmpty) return false
        const _isOnlyAttribute = isOnlyAttribute === true

        return this.Properties.some(
            (prop) =>
                prop.name === propertyName &&
                (!_isOnlyAttribute || prop.isAttribute)
        )
    }

    static GetProperty(
        propertyName: string,
        isOnlyAttribute = false
    ): BazlamaProperty<any> | null {
        if (this.PropertiesIsNullOrEmpty) return null
        const _isOnlyAttribute = isOnlyAttribute === true

        return (
            this.Properties.find(
                (prop) =>
                    prop.name === propertyName &&
                    (!_isOnlyAttribute || prop.isAttribute)
            ) || null
        )
    }

    static GetPropertyByAttributeName(
        attributeName: string
    ): BazlamaProperty<any> | null {
        if (this.PropertiesIsNullOrEmpty) return null

        return (
            this.Properties.find(
                (prop) => prop.attributeName === attributeName
            ) || null
        )
    }

    static get observedAttributes(): string[] {
        if (this.PropertiesIsNullOrEmpty) return []
        return this.Properties.filter((prop) => prop.isAttribute).map(
            (prop) => prop.attributeName
        )
    }

    getConstructor(): typeof BazlamaWebComponent {
        return this.constructor as typeof BazlamaWebComponent
    }
    //#endregion

    attributeChangedCallback(
        name: string,
        oldValue: string | null,
        newValue: string | null
    ): void {
        if (oldValue === newValue) return

        const prop = this.getConstructor().GetPropertyByAttributeName(name)
        if (!prop) return

        prop.setDirectValue(this, newValue)
    }

    connectedCallback(): void {
        const constructor = this.getConstructor()

        if (constructor.PropertiesIsNullOrEmpty) return

        constructor.Properties.forEach((prop: BazlamaProperty<any>) => {
            if (prop instanceof BazlamaProperty) {
                Object.defineProperty(this, prop.name, {
                    get() {
                        return prop.get(this)
                    },

                    set(value: any) {
                        prop.set(this, value)
                    },
                })
            }
        })

        this.render()
    }

    getRenderTemplate(): string {
        return `<span>Not implemented.</span>`
    }

    render(): void {
        const constructor = this.getConstructor()

        const htmlTemplate = this.getRenderTemplate()
        if (this.root) {
            this.root.innerHTML = htmlTemplate
        }
        if (constructor.PropertiesIsNullOrEmpty) return

        constructor.Properties.forEach((prop: BazlamaProperty<any>) => {
            if (prop instanceof BazlamaProperty) {
                prop.changeHooks.forEach((event) =>
                    event(this, prop.get(this), prop)
                )
            }
        })
    }
}