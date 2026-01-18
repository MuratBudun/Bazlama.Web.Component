import type TPropertyChangeHook from "../types/TPropertyChangeHandler";
import type { TPropertyChangeCalculateValue } from "../types/TPropertyChangeCalculateValue";
import { queryCached } from "../../helper/SelectorCache";

/**
 * Hook that updates an HTML attribute of elements when a property changes.
 * Uses cached selectors for improved performance.
 *
 * @param query - CSS selector to find target elements
 * @param attribute - HTML attribute name to update
 * @param onCalculate - Optional function to transform the value
 * @returns A property change hook function
 *
 * @example
 * ```typescript
 * @Property()
 * @ChangeHooks([useElementAttribute('img', 'src')])
 * imageUrl: string = ''
 * ```
 */
export default function useElementAttribute(
  query: string,
  attribute: string,
  onCalculate?: TPropertyChangeCalculateValue
): TPropertyChangeHook {
  return (bazComponent, value) => {
    const targets = queryCached(bazComponent, query);
    targets.forEach((target: Element) => {
      if (onCalculate !== undefined) {
        const newValue = onCalculate(value, query, attribute, bazComponent);
        target.setAttribute(attribute, `${newValue}`);
        return;
      }
      target.setAttribute(attribute, `${value}`);
    });
  };
}
