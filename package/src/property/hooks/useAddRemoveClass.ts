import TPropertyChangeHook from "../types/TPropertyChangeHandler"
import { TPropertyValueType } from "../types/TPropertyValueType"

export type TAddRemoveClassHookConfig = {
    addClassName?: string | string[]
    removeClassName?: string | string[]
    addElQuery?: (value: TPropertyValueType, oldValue: TPropertyValueType) => string
    removeElQuery?: (oldValue: TPropertyValueType, value: TPropertyValueType) => string
}

export default function useAddRemoveClass(config: TAddRemoveClassHookConfig): TPropertyChangeHook {
    if (!config) return () => {}

    const getClassList = (className?: string | string[]): string[] => {
        if (!className) return []
        if (typeof className === "string") return [className]
        return className
    }

    return (bazComponent, value, _propertyDefine, oldValue) => {
        if (!config.addClassName && !config.removeClassName) return
        if (!config.addElQuery && !config.removeElQuery) return

        const _oldValue: TPropertyValueType = oldValue === value ? "" : oldValue

        const addTargets = config.addElQuery ? bazComponent.root?.querySelectorAll(config.addElQuery(value, _oldValue)) : null
        const removeTargets = config.removeElQuery ? bazComponent.root?.querySelectorAll(config.removeElQuery(_oldValue, value)) : null

        const addClassList = getClassList(config.addClassName)
        const removeClassList = getClassList(config.removeClassName)

        if (addClassList.length > 0) {
            addTargets?.forEach((target: Element) => {
                if (target) {
                    addClassList.forEach((className) => {
                        target.classList.add(className)
                    })
                }
            })
        }

        if (removeClassList.length > 0) {
            removeTargets?.forEach((target: Element) => {
                if (target) {
                    removeClassList.forEach((className) => {
                        target.classList.remove(className)
                    })
                }
            })
        }
    }
}
