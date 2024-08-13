import TPropertyChangeHook from "../TPropertyChangeHandler"

export default function useElementProperty(
    query: string,
    property: string
): TPropertyChangeHook {
    return (bazComponent, value) => {
        const targets = bazComponent.root?.querySelectorAll(query)
        targets?.forEach((target) => {
            if (target) {
                (target as any)[property] = value
            }
        })
    }
}