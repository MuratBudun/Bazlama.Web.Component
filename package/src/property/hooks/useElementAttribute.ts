import TPropertyChangeHook from "../TPropertyChangeHandler"

export default function useElementAttribute(
    query: string,
    attribute: string
): TPropertyChangeHook {
    return (bazComponent, value) => {
        const targets = bazComponent.root?.querySelectorAll(query)
        targets?.forEach((target) => {
            if (target) {
                target.setAttribute(attribute, `${value}`);
            }
        })
    }
}