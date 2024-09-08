import TPropertyChangeHook from "../types/TPropertyChangeHandler"
import { TPropertyValueType } from "../types/TPropertyValueType"

export default function useAddRemoveClass(
    addElQuery: (oldValue: TPropertyValueType, value: TPropertyValueType) => string,
    removeElQuery: (value: TPropertyValueType, oldValue: TPropertyValueType) => string,
    className: string | string[],
): TPropertyChangeHook {
    return (bazComponent, value, _propertyDefine, oldValue) => {
        const _oldValue: TPropertyValueType = oldValue === value ? "" : oldValue

        const addTargets = bazComponent.root?.querySelectorAll(addElQuery(_oldValue, value))
        const removeTargets = bazComponent.root?.querySelectorAll(removeElQuery(value, _oldValue))

        let classList: string[] = []
        if (typeof className === "string") {
            classList = [className]
        } 
        if (Array.isArray(className)) {
            classList = className
        }
        
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
