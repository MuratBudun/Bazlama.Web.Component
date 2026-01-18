import BazlamaWebComponent from "../component/BazlamaWebComponent";
import { BazlamaDecoratorError } from "../helper/BazlamaError";
import type IPropertyDefineOption from "../property/types/IPropertyDefineOption";
import PropertyDefine from "../property/PropertyDefine";

/**
 * Decorator that defines a reactive property on a BazlamaWebComponent.
 * Properties can optionally be synced with HTML attributes and trigger change hooks.
 *
 * @param options - Configuration options for the property
 * @returns A property decorator function
 *
 * @example
 * ```typescript
 * class MyComponent extends BazlamaWebComponent {
 *   @Property({ defaultValue: 0 })
 *   count: number = 0
 *
 *   @Property({
 *     isAttribute: true,
 *     attributeName: 'label',
 *     changeHooks: [useElementText('.label')]
 *   })
 *   label: string = 'Click me'
 * }
 * ```
 */
export default function Property(options: IPropertyDefineOption = {}) {
  return function (target: BazlamaWebComponent, propertyName: string) {
    if (!(target instanceof BazlamaWebComponent)) {
      throw new BazlamaDecoratorError(`Target is not BazlamaWebComponent`, {
        decoratorName: "Property",
        propertyName,
      });
    }

    const bazComponent = target as BazlamaWebComponent;
    const constructor = bazComponent.getConstructor();

    if (constructor.HasPropertyDefine(propertyName)) {
      constructor.PropertyDefines[propertyName].isAttribute = options.isAttribute || false;
      constructor.PropertyDefines[propertyName].attributeName = options.attributeName || "";
      constructor.PropertyDefines[propertyName].isAttributeObserved =
        options.isAttributeObserved || false;
      constructor.PropertyDefines[propertyName].isFireRenderOnChanged =
        options.isFireRenderOnChanged || false;
      constructor.PropertyDefines[propertyName].changeHooks = [
        ...constructor.PropertyDefines[propertyName].changeHooks,
        ...(options.changeHooks || []),
      ];
      return;
    }

    const prop = new PropertyDefine(propertyName, options);
    constructor.PropertyDefines[propertyName] = prop;
  };
}
