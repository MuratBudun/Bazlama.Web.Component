/*
    Bazlama Web Component Project
    Property Builder Class for Bazlama
    2024-8-1
    Version 1.0
    muratbudun@gmail.com
*/

import PropertyDefine from "./PropertyDefine";
import type IPropertyDefineOption from "./types/IPropertyDefineOption";
import type TPropertyChangeHook from "./types/TPropertyChangeHandler";
import type { TPropertyValueType, TPropertyValueTypeName } from "./types/TPropertyValueType";

/**
 * Fluent builder for creating PropertyDefine instances.
 * Provides a chainable API for configuring property definitions.
 *
 * @example
 * ```typescript
 * const prop = new PropertyBuilder('count', 'number')
 *   .setDefaultValue(0)
 *   .setAttribute('data-count', true)
 *   .setChangeHooks(useElementText('.counter'))
 *   .build()
 * ```
 */
export default class PropertyBuilder {
  private name: string;
  private options: IPropertyDefineOption = {};

  /**
   * Creates a new PropertyBuilder.
   * @param name - The property name
   * @param valueTypeName - The value type ('string', 'number', 'boolean', 'object', 'bigint')
   */
  constructor(name: string, valueTypeName: TPropertyValueTypeName) {
    this.name = name;
    this.options.valueTypeName = valueTypeName;
  }

  /**
   * Sets the default value for the property.
   * @param defaultValue - The default value
   * @returns This builder for chaining
   */
  setDefaultValue(defaultValue: TPropertyValueType): PropertyBuilder {
    this.options.defaultValue = defaultValue;
    return this;
  }

  /**
   * Sets whether this property is synced with an HTML attribute.
   * @param isAttribute - True to sync with attribute
   * @returns This builder for chaining
   */
  setIsAttribute(isAttribute: boolean): PropertyBuilder {
    this.options.isAttribute = isAttribute;
    return this;
  }

  /**
   * Sets whether attribute changes trigger callbacks.
   * @param isAttributeObserved - True to observe attribute changes
   * @returns This builder for chaining
   */
  setIsAttributeObserved(isAttributeObserved: boolean): PropertyBuilder {
    this.options.isAttributeObserved = isAttributeObserved;
    return this;
  }

  /**
   * Sets the HTML attribute name.
   * @param attributeName - The attribute name
   * @returns This builder for chaining
   */
  setAttributeName(attributeName: string): PropertyBuilder {
    this.options.attributeName = attributeName;
    return this;
  }

  /**
   * Sets change hooks that execute when property value changes.
   * @param hooks - Hook functions to execute on change
   * @returns This builder for chaining
   */
  setChangeHooks(...hooks: TPropertyChangeHook[]): PropertyBuilder {
    this.options.changeHooks = hooks;
    return this;
  }

  /**
   * Convenience method to configure attribute syncing.
   * Sets isAttribute, attributeName, and optionally isAttributeObserved.
   * @param attributeName - The attribute name
   * @param isObserved - Whether to observe changes (default: true)
   * @returns This builder for chaining
   */
  setAttribute(attributeName: string, isObserved = true): PropertyBuilder {
    this.options.isAttribute = true;
    this.options.isAttributeObserved = isObserved;
    this.options.attributeName = attributeName;
    return this;
  }

  /**
   * Builds and returns the PropertyDefine instance.
   * @returns A new PropertyDefine with the configured options
   */
  build(): PropertyDefine {
    return new PropertyDefine(this.name, this.options);
  }
}
