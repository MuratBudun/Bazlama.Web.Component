/*
    Bazlama Web Component Project
    Property Class for Bazlama Web Component
    2024-7-21
    Version 1.0
    muratbudun@gmail.com
*/

import BazlamaWebComponent from "../component/BazlamaWebComponent.ts";
import type TPropertyChangeHook from "./types/TPropertyChangeHandler.ts";
import type IPropertyDefineOption from "./types/IPropertyDefineOption.ts";
import type { TPropertyValueTypeName, TPropertyValueType } from "./types/TPropertyValueType.ts";
import BazConvert from "../helper/BazConvert.ts";
import type IPropertyEventDetail from "./types/IPropertyEventDetail.ts";

/**
 * Defines a property for a BazlamaWebComponent.
 * Handles value storage, type conversion, attribute binding, and change notifications.
 *
 * @example
 * ```typescript
 * const propertyDefine = new PropertyDefine('count', {
 *   valueTypeName: 'number',
 *   defaultValue: 0,
 *   isAttribute: true,
 *   isFireEventOnChanged: true
 * })
 * ```
 */
class PropertyDefine {
  /** The type name for value conversion (string, number, boolean, bigint) */
  valueTypeName: TPropertyValueTypeName;
  /** Default value when property is undefined */
  defaultValue: TPropertyValueType;
  /** Property name */
  name: string;
  /** Whether this property is reflected as an HTML attribute */
  isAttribute: boolean;
  /** Whether to observe attribute changes from DOM */
  isAttributeObserved: boolean;
  /** HTML attribute name (defaults to property name) */
  attributeName: string;
  /** Whether to trigger render when property changes */
  isFireRenderOnChanged: boolean;
  /** Whether to dispatch custom events when property changes */
  isFireEventOnChanged: boolean;
  /** Array of hook functions called when property changes */
  changeHooks: TPropertyChangeHook[];

  /**
   * Creates a new property definition.
   * @param name - The property name
   * @param options - Configuration options for the property
   */
  constructor(name: string, options: IPropertyDefineOption = {}) {
    this.name = name;
    this.defaultValue = options.defaultValue || "";
    this.valueTypeName = options.valueTypeName || "string";
    this.isAttribute = options.isAttribute || false;
    this.isAttributeObserved = options.isAttributeObserved || false;
    this.attributeName = options.attributeName || name;
    this.isFireRenderOnChanged = options.isFireRenderOnChanged || false;
    this.isFireEventOnChanged = options.isFireEventOnChanged || false;
    this.changeHooks = options.changeHooks || [];
  }

  /**
   * Gets the current value of the property from a component.
   * @param bazComponent - The component instance
   * @returns The property value, converted to the appropriate type
   */
  public getValue(bazComponent: BazlamaWebComponent): TPropertyValueType {
    if (!(bazComponent instanceof BazlamaWebComponent)) return this.defaultValue;

    const value = bazComponent.propertyValues[this.name];
    if (value === undefined) return this.defaultValue;

    if (this.valueTypeName === "string") {
      return BazConvert.anyToString(value, BazConvert.anyToString(this.defaultValue));
    }

    if (this.valueTypeName === "number") {
      return BazConvert.anyToNumber(value, BazConvert.anyToNumber(this.defaultValue));
    }

    if (this.valueTypeName === "boolean") {
      return BazConvert.anyToBoolean(value, BazConvert.anyToBoolean(this.defaultValue));
    }

    if (this.valueTypeName === "bigint") {
      return BazConvert.anyToBigint(value, BazConvert.anyToBigint(this.defaultValue));
    }

    return value;
  }

  /**
   * Sets the property value on a component.
   * Handles attribute reflection if configured.
   * @param bazComponent - The component instance
   * @param value - The new value to set
   */
  public setValue(bazComponent: BazlamaWebComponent, value: TPropertyValueType): void {
    if (!(bazComponent instanceof BazlamaWebComponent)) return;

    const isAttributeValue = this.setAttributeValue(bazComponent, value);
    if (isAttributeValue === false) {
      this.setDirectValue(bazComponent, value);
    }
  }

  /**
   * Sets the property value via attribute reflection.
   * @param bazComponent - The component instance
   * @param value - The new value to set
   * @returns True if attribute was set, false otherwise
   */
  public setAttributeValue(bazComponent: BazlamaWebComponent, value: TPropertyValueType): boolean {
    if (!(bazComponent instanceof BazlamaWebComponent)) return false;
    if (!this.isAttribute) return false;

    const attributeName = this.attributeName || this.name;
    if (!attributeName) return false;

    if (value === null || value === undefined) {
      bazComponent.removeAttribute(attributeName);
      return false;
    }

    const stringValue = BazConvert.anyToString(value);
    bazComponent.setAttribute(attributeName, String(stringValue));

    return true;
  }

  /**
   * Sets the property value directly, bypassing attribute reflection.
   * Triggers change hooks, render requests, and custom events as configured.
   * @param bazComponent - The component instance
   * @param value - The new value to set
   * @param disableRenderRequest - If true, suppresses automatic render
   */
  public setDirectValue(
    bazComponent: BazlamaWebComponent,
    value: TPropertyValueType,
    disableRenderRequest = false
  ): void {
    if (!(bazComponent instanceof BazlamaWebComponent)) return;

    const oldValue = bazComponent.propertyValues[this.name];

    switch (this.valueTypeName) {
      case "string":
        bazComponent.propertyValues[this.name] = BazConvert.anyToString(
          value,
          BazConvert.anyToString(this.defaultValue)
        );
        break;
      case "number":
        bazComponent.propertyValues[this.name] = BazConvert.anyToNumber(
          value,
          BazConvert.anyToNumber(this.defaultValue)
        );
        break;
      case "boolean":
        bazComponent.propertyValues[this.name] = BazConvert.anyToBoolean(
          value,
          BazConvert.anyToBoolean(this.defaultValue)
        );
        break;
      case "bigint":
        bazComponent.propertyValues[this.name] = BazConvert.anyToBigint(
          value,
          BazConvert.anyToBigint(this.defaultValue)
        );
        break;
      default:
        bazComponent.propertyValues[this.name] = value;
        break;
    }

    this.changeHooks.forEach((event) => event(bazComponent, value, this, oldValue));
    if (
      this.isFireRenderOnChanged &&
      disableRenderRequest === false &&
      bazComponent.isRendered === true
    ) {
      bazComponent.render();
    }

    if (this.isFireEventOnChanged) {
      const eventDetail: IPropertyEventDetail = {
        bazComponent: bazComponent,
        name: this.name,
        value: value,
        oldValue: oldValue,
      };

      bazComponent.dispatchEvent(new CustomEvent("property-changed", { detail: eventDetail }));
      bazComponent.dispatchEvent(new CustomEvent(this.name + "-changed", { detail: eventDetail }));
    }
  }
}

export default PropertyDefine;
