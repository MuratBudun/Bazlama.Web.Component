import BazlamaWebComponent from "../../component/BazlamaWebComponent"
import BazlamaProperty from "../BazlamaProperty"
import TPropertyChangeHandler from "../TPropertyChangeHandler"

export default function useCustomHook<T>(
    query: string,
    func: (target: Element, value: any, prop: BazlamaProperty<T>, element: BazlamaWebComponent) => void
): TPropertyChangeHandler<T> {
    return (element, value, prop) => {
        const targets = element.root?.querySelectorAll(query)
        targets?.forEach((target) => {
            if (target) {
                func(target, value, prop, element)
            }
        })
    }
}