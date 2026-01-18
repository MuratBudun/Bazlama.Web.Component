import BazlamaWebComponent from "../component/BazlamaWebComponent";
import { BazlamaDecoratorError, BazlamaPropertyError } from "../helper/BazlamaError";
import type TPropertyChangeHook from "../property/types/TPropertyChangeHandler";

/**
 * Decorator that attaches change hooks to a property.
 * Hooks are called whenever the property value changes.
 * Must be used after @Property decorator.
 *
 * @param changeHooks - Array of hook functions to execute on property change
 * @returns A property decorator function
 * @throws {BazlamaPropertyError} If property is not defined with @Property first
 *
 * @example
 * ```typescript
 * class MyComponent extends BazlamaWebComponent {
 *   @Property()
 *   @ChangeHooks([useElementText('.count')])
 *   count: number = 0
 * }
 * ```
 */
export default function ChangeHooks(changeHooks: TPropertyChangeHook[]) {
  return function (target: BazlamaWebComponent, propertyName: string) {
    if (!(target instanceof BazlamaWebComponent)) {
      throw new BazlamaDecoratorError(`Target is not BazlamaWebComponent`, {
        decoratorName: "ChangeHooks",
        propertyName,
      });
    }

    const bazComponent = target as BazlamaWebComponent;
    const constructor = bazComponent.getConstructor();

    if (constructor.HasPropertyDefine(propertyName)) {
      constructor.PropertyDefines[propertyName].changeHooks = [
        ...constructor.PropertyDefines[propertyName].changeHooks,
        ...(changeHooks || []),
      ];

      return;
    }

    throw new BazlamaPropertyError(`PropertyDefine not found`, {
      decoratorName: "ChangeHooks",
      propertyName,
      componentName: constructor.name,
    });
  };
}
