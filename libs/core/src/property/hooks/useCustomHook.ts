import type BazlamaWebComponent from "../../component/BazlamaWebComponent";
import type PropertyDefine from "../PropertyDefine";
import type TPropertyChangeHook from "../types/TPropertyChangeHandler";
import type { TPropertyValueType } from "../types/TPropertyValueType";

/**
 * Hook that executes a custom function for each element matching a query.
 * Provides access to both the element and property change details.
 *
 * @param query - CSS selector to find target elements
 * @param func - Function to execute for each matched element
 * @returns A property change hook function
 *
 * @example
 * ```typescript
 * @Property()
 * @ChangeHooks([useCustomHook('.item', (target, value) => {
 *   target.setAttribute('data-value', String(value))
 * })])
 * selectedItem: string = ''
 * ```
 */
export default function useCustomHook(
  query: string,
  func: (
    target: Element,
    value: TPropertyValueType,
    propertyDefine: PropertyDefine,
    oldValue: TPropertyValueType,
    bazComponent: BazlamaWebComponent
  ) => void
): TPropertyChangeHook {
  return (bazComponent, value, propertyDefine, oldValue) => {
    const targets = bazComponent.root?.querySelectorAll(query);
    targets?.forEach((target: Element) => {
      if (target) {
        func(target, value, propertyDefine, oldValue, bazComponent);
      }
    });
  };
}
