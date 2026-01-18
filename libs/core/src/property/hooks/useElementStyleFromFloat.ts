import type TPropertyChangeHook from "../types/TPropertyChangeHandler";
import { queryCached } from "../../helper/SelectorCache";

/**
 * Hook that parses a property value as float and sets a CSS custom property.
 * Useful for numeric values that need decimal precision.
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
 * @ChangeHooks([useElementStyleFromFloat('.slider', 'position', '%')])
 * sliderValue: number = 0  // Sets --position: 0%
 * ```
 */
export default function useElementStyleFromFloat(
  query: string,
  style: string,
  suffix = ""
): TPropertyChangeHook {
  return (bazComponent, value) => {
    const floatValue = parseFloat(value as string) ?? 0;
    const targets = queryCached(bazComponent, query);
    targets.forEach((target: Element) => {
      (target as HTMLElement).style.setProperty(`--${style}`, `${floatValue}${suffix}`);
    });
  };
}
