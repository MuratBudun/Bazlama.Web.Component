import type TPropertyChangeHook from "../types/TPropertyChangeHandler";
import { queryCached } from "../../helper/SelectorCache";

/**
 * Hook that creates two-way binding between a property and input element values.
 * Automatically syncs property changes to input and input changes back to property.
 * Uses cached selectors for improved performance.
 *
 * @param query - CSS selector to find input elements
 * @returns A property change hook function
 *
 * @example
 * ```typescript
 * @Property()
 * @ChangeHooks([useElementInputValue('input.name-field')])
 * name: string = ''
 * ```
 */
export default function useElementInputValue(query: string): TPropertyChangeHook {
  return (bazComponent, value, propertyDefine) => {
    const targets = queryCached(bazComponent, query);
    targets.forEach((target: Element) => {
      if (target instanceof HTMLInputElement) {
        if (!target.oninput) {
          target.oninput = (event) => {
            if (propertyDefine) {
              propertyDefine.setValue(bazComponent, (event.target as HTMLInputElement).value);
            }
          };
        }

        target.value = value as unknown as string;
      }
    });
  };
}
