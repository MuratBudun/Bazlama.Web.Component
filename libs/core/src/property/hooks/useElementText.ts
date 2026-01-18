import type { TPropertyChangeCalculateValue } from "../types/TPropertyChangeCalculateValue";
import type TPropertyChangeHook from "../types/TPropertyChangeHandler";
import { queryCached } from "../../helper/SelectorCache";

/**
 * Hook that updates the text content of elements when a property changes.
 * Uses cached selectors for improved performance.
 *
 * @param query - CSS selector to find target elements
 * @param prefix - Text to prepend before the value
 * @param suffix - Text to append after the value
 * @param onCalculate - Optional function to transform the value before display
 * @returns A property change hook function
 *
 * @example
 * ```typescript
 * @Property()
 * @ChangeHooks([useElementText('.counter', 'Count: ', ' items')])
 * count: number = 0
 * ```
 */
export default function useElementText(
  query: string,
  prefix = "",
  suffix = "",
  onCalculate?: TPropertyChangeCalculateValue
): TPropertyChangeHook {
  return (bazComponent, value) => {
    const targets = queryCached(bazComponent, query);
    targets.forEach((target: Element) => {
      if (onCalculate !== undefined) {
        const newValue = onCalculate(value, query, "", bazComponent);
        target.textContent = `${prefix}${newValue}${suffix}`;
        return;
      }
      target.textContent = `${prefix}${value}${suffix}`;
    });
  };
}
