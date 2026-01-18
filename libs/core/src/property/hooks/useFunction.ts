import type BazlamaWebComponent from "../../component/BazlamaWebComponent";
import type PropertyDefine from "../PropertyDefine";
import type TPropertyChangeHook from "../types/TPropertyChangeHandler";
import type { TPropertyValueType } from "../types/TPropertyValueType";

/**
 * Hook that executes a custom function when a property changes.
 * The simplest way to add custom logic to property changes.
 *
 * @param func - Function to execute on property change
 * @returns A property change hook function
 *
 * @example
 * ```typescript
 * @Property()
 * @ChangeHooks([useFunction((component, value, prop, oldValue) => {
 *   console.log(`${prop.name} changed from ${oldValue} to ${value}`)
 * })])
 * count: number = 0
 * ```
 */
export default function useFunction(
  func: (
    bazComponent: BazlamaWebComponent,
    value: TPropertyValueType,
    propertyDefine: PropertyDefine,
    oldValue: TPropertyValueType
  ) => void
): TPropertyChangeHook {
  return func;
}
