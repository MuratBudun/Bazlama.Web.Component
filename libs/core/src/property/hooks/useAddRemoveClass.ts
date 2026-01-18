import type TPropertyChangeHook from "../types/TPropertyChangeHandler";
import type { TPropertyValueType } from "../types/TPropertyValueType";

/**
 * Configuration for the useAddRemoveClass hook.
 *
 * @property addClassName - CSS class(es) to add when conditions are met
 * @property removeClassName - CSS class(es) to remove when conditions are met
 * @property addElQuery - Function that returns CSS selector for elements to add classes to
 * @property removeElQuery - Function that returns CSS selector for elements to remove classes from
 */
export interface TAddRemoveClassHookConfig {
  addClassName?: string | string[];
  removeClassName?: string | string[];
  addElQuery?: (value: TPropertyValueType, oldValue: TPropertyValueType) => string;
  removeElQuery?: (oldValue: TPropertyValueType, value: TPropertyValueType) => string;
}

/**
 * Hook that adds and removes CSS classes based on dynamic query functions.
 * Provides fine-grained control over which elements receive which classes.
 *
 * @param config - Configuration object for add/remove class behavior
 * @returns A property change hook function
 *
 * @example
 * ```typescript
 * @Property()
 * @ChangeHooks([useAddRemoveClass({
 *   addClassName: 'active',
 *   removeClassName: 'active',
 *   addElQuery: (value) => `[data-id="${value}"]`,
 *   removeElQuery: (oldValue) => `[data-id="${oldValue}"]`
 * })])
 * selectedId: string = ''
 * ```
 */
export default function useAddRemoveClass(config: TAddRemoveClassHookConfig): TPropertyChangeHook {
  if (!config) return () => {};

  const getClassList = (className?: string | string[]): string[] => {
    if (!className) return [];
    if (typeof className === "string") return [className];
    return className;
  };

  return (bazComponent, value, _propertyDefine, oldValue) => {
    if (!config.addClassName && !config.removeClassName) return;
    if (!config.addElQuery && !config.removeElQuery) return;

    const _oldValue: TPropertyValueType = oldValue === value ? "" : oldValue;

    const addTargets = config.addElQuery
      ? bazComponent.root?.querySelectorAll(config.addElQuery(value, _oldValue))
      : null;
    const removeTargets = config.removeElQuery
      ? bazComponent.root?.querySelectorAll(config.removeElQuery(_oldValue, value))
      : null;

    const addClassList = getClassList(config.addClassName);
    const removeClassList = getClassList(config.removeClassName);

    if (addClassList.length > 0) {
      addTargets?.forEach((target: Element) => {
        if (target) {
          addClassList.forEach((className) => {
            target.classList.add(className);
          });
        }
      });
    }

    if (removeClassList.length > 0) {
      removeTargets?.forEach((target: Element) => {
        if (target) {
          removeClassList.forEach((className) => {
            target.classList.remove(className);
          });
        }
      });
    }
  };
}
