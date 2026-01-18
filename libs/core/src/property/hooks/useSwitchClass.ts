import type TPropertyChangeHook from "../types/TPropertyChangeHandler";
import { queryCached } from "../../helper/SelectorCache";

/**
 * Hook that switches CSS classes based on property value.
 * Removes the old value class and adds the new value class.
 * Uses cached selectors for improved performance.
 *
 * @param query - CSS selector to find target elements
 * @param prefix - Prefix to add before value in class name
 * @param sufix - Suffix to add after value in class name
 * @returns A property change hook function
 *
 * @example
 * ```typescript
 * @Property()
 * @ChangeHooks([useSwitchClass('.box', 'theme-')])
 * theme: string = 'light'  // Switches between 'theme-light', 'theme-dark', etc.
 * ```
 */
export default function useSwitchClass(
  query: string,
  prefix = "",
  sufix = ""
): TPropertyChangeHook {
  return (bazComponent, value, _, oldValue) => {
    const targets = queryCached(bazComponent, query);
    targets.forEach((target: Element) => {
      const className = `${prefix}${value}${sufix}`;
      target.classList.remove(`${prefix}${oldValue}${sufix}`);
      target.classList.add(className);
    });
  };
}
