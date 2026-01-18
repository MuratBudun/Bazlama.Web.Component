import type TPropertyChangeHook from "../types/TPropertyChangeHandler";

/**
 * Hook that creates two-way binding between a property and radio button groups.
 * Automatically syncs the property value with the selected radio button.
 *
 * @param name - The name attribute of the radio button group
 * @returns A property change hook function
 *
 * @example
 * ```typescript
 * @Property()
 * @ChangeHooks([useElementInputRadioValue('color-choice')])
 * selectedColor: string = 'red'
 *
 * // In template:
 * // <input type="radio" name="color-choice" value="red">
 * // <input type="radio" name="color-choice" value="blue">
 * ```
 */
export default function useElementInputRadioValue(name: string): TPropertyChangeHook {
  return (bazComponent, value, propertyDefine) => {
    const targets = bazComponent.root?.querySelectorAll(`input[type='radio'][name='${name}']`);
    targets?.forEach((target: Element) => {
      if (target && target instanceof HTMLInputElement) {
        if (!target.onchange) {
          target.onchange = (event) => {
            if (propertyDefine) {
              propertyDefine.setValue(bazComponent, (event.target as HTMLInputElement).value);
            }
          };
        }
        const checked = target.value === value;
        if (!checked) target.removeAttribute("checked");
        else target.setAttribute("checked", "");
      }
    });
  };
}
