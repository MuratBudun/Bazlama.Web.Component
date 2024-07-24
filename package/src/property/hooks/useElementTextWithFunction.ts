import BazlamaProperty from "../BazlamaProperty"
import TPropertyChangeHandler from "../TPropertyChangeHandler"

export default function useElementTextWithFunction<T>(
    query: string,
    textUpdater: (
        value: T,
        target: Element,
        property: BazlamaProperty<T>
    ) => string
): TPropertyChangeHandler<T> {
    return (element, value, property) => {
        const targets = element.root?.querySelectorAll(query)
        targets?.forEach((target) => {
            if (target) {
                target.textContent = textUpdater(value, target, property)
            }
        })
    }
}