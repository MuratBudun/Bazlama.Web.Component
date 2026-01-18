import type { TPropertyChangeCalculateValue } from "../types/TPropertyChangeCalculateValue";
import type TPropertyChangeHook from "../types/TPropertyChangeHandler";
import { queryCached } from "../../helper/SelectorCache";

/**
 * Hook that updates a JavaScript property of elements when a component property changes.
 * Use this for properties that aren't reflected as HTML attributes (e.g., 'value', 'checked').
 * Uses cached selectors for improved performance.
 *
 * @param query - CSS selector to find target elements
 * @param property - JavaScript property name to update
 * @param onCalculate - Optional function to transform the value
 * @returns A property change hook function
 *
 * @example
 * ```typescript
 * @Property()
 * @ChangeHooks([useElementProperty('video', 'currentTime')])
 * videoTime: number = 0
 * ```
 */
export default function useElementProperty(
  query: string,
  property: string,
  onCalculate?: TPropertyChangeCalculateValue
): TPropertyChangeHook {
  return (bazComponent, value) => {
    const targets = queryCached(bazComponent, query);
    targets.forEach((target: Element) => {
      if (onCalculate !== undefined) {
        const newValue = onCalculate(value, query, property, bazComponent);
        (target as unknown as Record<string, unknown>)[property] = newValue;
        return;
      }
      (target as unknown as Record<string, unknown>)[property] = value;
    });
  };
}
