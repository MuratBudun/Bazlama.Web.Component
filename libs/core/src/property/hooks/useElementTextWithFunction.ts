import type BazlamaWebComponent from "../../component/BazlamaWebComponent";
import type PropertyDefine from "../PropertyDefine";
import type TPropertyChangeHook from "../types/TPropertyChangeHandler";
import type { TPropertyValueType } from "../types/TPropertyValueType";
import { queryCached } from "../../helper/SelectorCache";

/**
 * Hook that updates element text content using a custom function.
 * Provides full control over text generation with access to all change details.
 * Uses cached selectors for improved performance.
 *
 * @param query - CSS selector to find target elements
 * @param textUpdater - Function that returns the text to display
 * @returns A property change hook function
 *
 * @example
 * ```typescript
 * @Property()
 * @ChangeHooks([useElementTextWithFunction('.status', (value, target, prop, oldValue, component) => {
 *   return `Status changed from ${oldValue} to ${value}`
 * })])
 * status: string = 'pending'
 * ```
 */
export default function useElementTextWithFunction(
  query: string,
  textUpdater: (
    value: TPropertyValueType,
    target: Element,
    propertyDefine: PropertyDefine,
    oldValue: TPropertyValueType,
    bazComponent: BazlamaWebComponent
  ) => string
): TPropertyChangeHook {
  return (bazComponent, value, propertyDefine, oldValue) => {
    const targets = queryCached(bazComponent, query);
    targets.forEach((target: Element) => {
      target.textContent = textUpdater(value, target, propertyDefine, oldValue, bazComponent);
    });
  };
}
