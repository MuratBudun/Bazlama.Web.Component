/*
    Bazlama Web Component Project
    Property Class for Bazlama Web Component
    2024-7-21
    Version 1.0
    muratbudun@gmail.com
*/

import BazlamaWebComponent from "../component/BazlamaWebComponent.ts";
import TPropertyChangeHandler from "./TPropertyChangeHandler.ts";
import IBazlamaPropertyOptions from "./IBazlamaPropertyOptions.ts";

class BazlamaProperty<T> {
    #value: T | undefined = undefined;
    name: string;
    defaultValue: T | null;
    isAttribute: boolean;
    isAttributeObserved: boolean;
    attributeName: string;
    changeHooks: TPropertyChangeHandler<T>[];

    constructor(name: string, options: IBazlamaPropertyOptions<T> = {}) {
        this.name = name;
        this.defaultValue = options.defaultValue || null;
        this.isAttribute = options.isAttribute || false;
        this.isAttributeObserved = options.isAttributeObserved || false;
        this.attributeName = options.attributeName || name;
        this.changeHooks = options.changeHooks || [];
    }

    get(element: HTMLElement): T | null {
        if (!this.isAttribute) {
            return this.#value !== undefined ? this.#value : this.defaultValue;
        }

        const attributeValue = element.getAttribute(this.attributeName);
        return attributeValue !== null ? (attributeValue as unknown as T) : this.defaultValue;
    }

    set(element: HTMLElement, value: T): void {
        this.setAttributeValue(element, value);
        this.setDirectValue(element, value);
    }

    public setAttributeValue(element: HTMLElement, value: T): void {
        if (!this.isAttribute) return;

        const attributeName = this.attributeName || this.name;
        if (!attributeName) return;

        if (value === null || value === undefined) {
            element.removeAttribute(attributeName);
            return;
        }

        element.setAttribute(attributeName, String(value));
    }

    public setDirectValue(element: HTMLElement, value: T): void {
        if (!(element instanceof BazlamaWebComponent)) return;

        const component = element as BazlamaWebComponent;
        this.#value = value;
        this.changeHooks.forEach((event) => event(component, value, this));
    }
}

export default BazlamaProperty;
