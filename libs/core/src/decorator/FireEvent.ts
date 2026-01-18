import BazlamaWebComponent from "../component/BazlamaWebComponent";
import { BazlamaDecoratorError, BazlamaPropertyError } from "../helper/BazlamaError";

/**
 * Decorator that dispatches custom events when the property value changes.
 * Dispatches both 'property-changed' and '{propertyName}-changed' events.
 * Must be used after @Property decorator.
 *
 * @returns A property decorator function
 * @throws {BazlamaPropertyError} If property is not defined with @Property first
 *
 * @example
 * ```typescript
 * class MyComponent extends BazlamaWebComponent {
 *   @Property()
 *   @FireEvent()
 *   value: string = ''
 * }
 * // Listen: element.addEventListener('value-changed', (e) => { ... })
 * ```
 */
export default function FireEvent() {
  return function (target: BazlamaWebComponent, propertyName: string) {
    if (!(target instanceof BazlamaWebComponent)) {
      throw new BazlamaDecoratorError(`Target is not BazlamaWebComponent`, {
        decoratorName: "FireEvent",
        propertyName,
      });
    }

    const bazComponent = target as BazlamaWebComponent;
    const constructor = bazComponent.getConstructor();

    if (constructor.HasPropertyDefine(propertyName)) {
      constructor.PropertyDefines[propertyName].isFireEventOnChanged = true;
      return;
    }

    throw new BazlamaPropertyError(`PropertyDefine not found`, {
      decoratorName: "FireEvent",
      propertyName,
      componentName: constructor.name,
    });
  };
}
