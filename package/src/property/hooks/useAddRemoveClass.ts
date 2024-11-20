import TPropertyChangeHook from "../types/TPropertyChangeHandler"
import { TPropertyValueType } from "../types/TPropertyValueType"

export default function useAddRemoveClass(
    className: string | string[],
    addElQuery?: (value: TPropertyValueType, oldValue: TPropertyValueType) => string,
    removeElQuery?: (oldValue: TPropertyValueType, value: TPropertyValueType) => string,
): TPropertyChangeHook {
    return (bazComponent, value, _propertyDefine, oldValue) => {
        if (!addElQuery && !removeElQuery) return

        const _oldValue: TPropertyValueType = oldValue === value ? "" : oldValue

        const addTargets = addElQuery ? bazComponent.root?.querySelectorAll(addElQuery(value, _oldValue)) : null
        const removeTargets = removeElQuery ? bazComponent.root?.querySelectorAll(removeElQuery(_oldValue, value)) : null

        let classList: string[] = []
        if (typeof className === "string") {
            classList = [className]
        } 
        if (Array.isArray(className)) {
            classList = className
        }
       
        if (classList.length === 0) return

        addTargets?.forEach((target: Element) => {
            if (target) {
                classList.forEach((className) => {
                    target.classList.add(className)
                })
            }
        })

        removeTargets?.forEach((target: Element) => {
            if (target) {
                classList.forEach((className) => {
                    target.classList.remove(className)
                })
            }
        })
    }
}
