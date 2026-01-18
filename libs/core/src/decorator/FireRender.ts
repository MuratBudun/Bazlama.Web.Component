import BazlamaWebComponent from "../component/BazlamaWebComponent";
import { BazlamaDecoratorError, BazlamaPropertyError } from "../helper/BazlamaError";

/**
 * Decorator that triggers a re-render when the property value changes.
 * Must be used after @Property decorator.
 *
 * @returns A property decorator function
 * @throws {BazlamaPropertyError} If property is not defined with @Property first
 *
 * @example
 * ```typescript
 * class MyComponent extends BazlamaWebComponent {
 *   @Property()
 *   @FireRender()
 *   items: string[] = []
 *
 *   // Component re-renders when items changes
 * }
 * ```
 */
export default function FireRender() {
  return function (target: BazlamaWebComponent, propertyName: string) {
    if (!(target instanceof BazlamaWebComponent)) {
      throw new BazlamaDecoratorError(`Target is not BazlamaWebComponent`, {
        decoratorName: "FireRender",
        propertyName,
      });
    }

    const bazComponent = target as BazlamaWebComponent;
    const constructor = bazComponent.getConstructor();

    if (constructor.HasPropertyDefine(propertyName)) {
      constructor.PropertyDefines[propertyName].isFireRenderOnChanged = true;
      return;
    }

    throw new BazlamaPropertyError(`PropertyDefine not found`, {
      decoratorName: "FireRender",
      propertyName,
      componentName: constructor.name,
    });
  };
}
