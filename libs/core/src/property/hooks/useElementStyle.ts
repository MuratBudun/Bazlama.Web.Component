import type TPropertyChangeHook from "../types/TPropertyChangeHandler";
import type { TPropertyValueType } from "../types/TPropertyValueType";
import { queryCached } from "../../helper/SelectorCache";

/**
 * Function type for calculating custom style values.
 * Receives the raw value and returns the computed style value.
 */
export type TStyleCalculateValue = (
  value: TPropertyValueType,
  query: string,
  style: string
) => string | number;

/**
 * Hook that updates a CSS style property of elements when a property changes.
 * Uses cached selectors for improved performance.
 *
 * @param query - CSS selector to find target elements
 * @param style - CSS property name (e.g., 'width', 'color', 'transform')
 * @param suffix - Unit or suffix to append (e.g., 'px', '%', 'rem')
 * @param prefix - Prefix to prepend to the value
 * @param onCalculate - Optional function to calculate custom value before applying
 * @returns A property change hook function
 *
 * @example
 * ```typescript
 * // Simple usage with suffix
 * @Property()
 * @ChangeHooks([useElementStyle('.progress-bar', 'width', '%')])
 * progress: number = 0
 * 
 * // With custom calculation for dynamic colors
 * @Property()
 * @ChangeHooks([
 *   useElementStyle('.progress-bar', 'background-color', '', '', (value) => {
 *     if (value < 30) return '#ef4444'
 *     if (value < 70) return '#f59e0b'
 *     return '#22c55e'
 *   })
 * ])
 * progress: number = 0
 * ```
 */
export default function useElementStyle(
  query: string,
  style: string,
  suffix = "",
  prefix = "",
  onCalculate?: TStyleCalculateValue
): TPropertyChangeHook {
  return (bazComponent, value) => {
    const targets = queryCached(bazComponent, query);
    const computedValue = onCalculate
      ? onCalculate(value, query, style)
      : value;
    
    targets.forEach((target: Element) => {
      (target as HTMLElement).style.setProperty(
        style,
        `${prefix}${computedValue}${suffix}`
      );
    });
  };
}
