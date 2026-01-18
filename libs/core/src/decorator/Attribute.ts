import BazlamaWebComponent from "../component/BazlamaWebComponent";
import { BazlamaDecoratorError } from "../helper/BazlamaError";
import PropertyDefine from "../property/PropertyDefine";

/**
 * Decorator that marks a property as an HTML attribute.
 * The property value will be synced with the corresponding HTML attribute.
 *
 * @param attributeName - The HTML attribute name
 * @param isObserved - If true, attribute changes trigger attributeChangedCallback
 * @param isFireRenderOnChanged - If true, re-renders component when value changes
 * @param isFireEventOnChanged - If true, dispatches events when value changes
 * @returns A property decorator function
 *
 * @example
 * ```typescript
 * class MyComponent extends BazlamaWebComponent {
 *   @Property()
 *   @Attribute('data-count', true)
 *   count: number = 0
 * }
 * // Usage: <my-component data-count="5"></my-component>
 * ```
 */
export default function Attribute(
  attributeName: string,
  isObserved = false,
  isFireRenderOnChanged = false,
  isFireEventOnChanged = false
) {
  return function (target: BazlamaWebComponent, propertyName: string) {
    if (!(target instanceof BazlamaWebComponent)) {
      throw new BazlamaDecoratorError(`Target is not BazlamaWebComponent`, {
        decoratorName: "Attribute",
        propertyName,
      });
    }
    const bazComponent = target as BazlamaWebComponent;
    const constructor = bazComponent.getConstructor();

    if (constructor.HasPropertyDefine(propertyName)) {
      constructor.PropertyDefines[propertyName].isAttribute = true;
      constructor.PropertyDefines[propertyName].attributeName = attributeName;
      constructor.PropertyDefines[propertyName].isAttributeObserved = isObserved;
      constructor.PropertyDefines[propertyName].isFireRenderOnChanged = isFireRenderOnChanged;
      constructor.PropertyDefines[propertyName].isFireEventOnChanged = isFireEventOnChanged;
      constructor.PropertyDefines[propertyName].changeHooks = [
        ...constructor.PropertyDefines[propertyName].changeHooks,
      ];
      return;
    }

    const prop = new PropertyDefine(propertyName, {
      isAttribute: true,
      attributeName: attributeName,
      isAttributeObserved: isObserved,
      isFireRenderOnChanged: isFireRenderOnChanged,
      isFireEventOnChanged: isFireEventOnChanged,
    });

    constructor.PropertyDefines[propertyName] = prop;
  };
}
