import TPropertyChangeHook from "../TPropertyChangeHandler"

export default function useElementStyleFromInteger(
    query: string,
    style: string,
    suffix: string = ""
): TPropertyChangeHook {
    return (bazComponent, value) => {
        const integerValue = parseInt(value as string, 10) ?? 0;
        const targets = bazComponent.root?.querySelectorAll(query)
        targets?.forEach((target) => {
            if (target) {
                (target as HTMLElement).style.setProperty(`--${style}`, `${integerValue}${suffix}`);
            }
        })
    }
}