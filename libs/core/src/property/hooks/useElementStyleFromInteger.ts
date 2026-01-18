import type TPropertyChangeHook from "../types/TPropertyChangeHandler";
import { queryCached } from "../../helper/SelectorCache";

/**
 * Hook that parses a property value as integer and sets a CSS custom property.
 * Useful for discrete numeric values without decimals.
 * Uses cached selectors for improved performance.
 *
 * @param query - CSS selector to find target elements
 * @param style - CSS custom property name (without '--' prefix)
 * @param suffix - Unit to append (e.g., 'px', '%')
 * @returns A property change hook function
 *
 * @example
 * ```typescript
 * @Property()
 * @ChangeHooks([useElementStyleFromInteger('.grid', 'columns')])
 * columnCount: number = 3  // Sets --columns: 3
 * ```
 */
export default function useElementStyleFromInteger(
  query: string,
  style: string,
  suffix = ""
): TPropertyChangeHook {
  return (bazComponent, value) => {
    const integerValue = parseInt(value as string, 10) ?? 0;
    const targets = queryCached(bazComponent, query);
    targets.forEach((target: Element) => {
      (target as HTMLElement).style.setProperty(`--${style}`, `${integerValue}${suffix}`);
    });
  };
}
