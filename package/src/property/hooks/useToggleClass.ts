import BazlamaProperty from "../BazlamaProperty"
import TPropertyChangeHandler from "../TPropertyChangeHandler"

export default function useToggleClass<T>(
    query: string,
    className: string,
    calcActive : (
        value: T,
        target: Element,
        property: BazlamaProperty<T>
    ) => boolean
): TPropertyChangeHandler<any> {
    return (element, value, property) => {
        const targets = element.root?.querySelectorAll(query)
        targets?.forEach((target) => {
            if (target) {
                const add = calcActive(value, target, property)

                if (add) {
                    target.classList.add(className)
                } else {
                    target.classList.remove(className)
                }
            }
        })
    }
}