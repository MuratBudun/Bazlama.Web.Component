import type BazlamaWebComponent from "../../component/BazlamaWebComponent";
import type PropertyDefine from "../PropertyDefine";
import type TPropertyChangeHook from "../types/TPropertyChangeHandler";
import type { TPropertyValueType } from "../types/TPropertyValueType";
import { queryCached } from "../../helper/SelectorCache";

/**
 * Hook that toggles a CSS class on elements based on a condition.
 * Uses cached selectors for improved performance.
 *
 * @param query - CSS selector to find target elements
 * @param className - CSS class name to toggle
 * @param calcActive - Optional function that returns true to add class, false to remove. If not provided, uses truthiness of the property value.
 * @returns A property change hook function
 *
 * @example
 * ```typescript
 * @Property()
 * @ChangeHooks([useToggleClass('.panel', 'visible')])
 * isOpen: boolean = false
 * 
 * // Or with custom logic
 * @Property()
 * @ChangeHooks([useToggleClass('.panel', 'visible', (value) => value === true)])
 * isOpen: boolean = false
 * ```
 */
export default function useToggleClass(
  query: string,
  className: string,
  calcActive?: (
    value: TPropertyValueType,
    target: Element,
    propertyDefine: PropertyDefine,
    oldValue: TPropertyValueType,
    bazComponent: BazlamaWebComponent
  ) => boolean
): TPropertyChangeHook {
  return (bazComponent, value, propertyDefine, oldValue) => {
    const targets = queryCached(bazComponent, query);
    targets.forEach((target: Element) => {
      const add = calcActive 
        ? calcActive(value, target, propertyDefine, oldValue, bazComponent)
        : !!value;

      if (add) {
        target.classList.add(className);
      } else {
        target.classList.remove(className);
      }
    });
  };
}
