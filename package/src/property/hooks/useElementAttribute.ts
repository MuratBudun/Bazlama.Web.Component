import TPropertyChangeHandler from "../TPropertyChangeHandler"

export default function useElementAttribute<T>(
    query: string,
    attribute: string
): TPropertyChangeHandler<T> {
    return (element, value) => {
        const targets = element.root?.querySelectorAll(query)
        targets?.forEach((target) => {
            if (target) {
                target.setAttribute(attribute, `${value}`);
            }
        })
    }
}