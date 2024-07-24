import TPropertyChangeHandler from "../TPropertyChangeHandler"

export default function useElementStyleFromFloat<T>(
    query: string,
    style: string,
    suffix: string = ""
): TPropertyChangeHandler<T> {
    return (element, value) => {
        const floatValue = parseFloat(value as string) ?? 0;
        const targets = element.root?.querySelectorAll(query)
        targets?.forEach((target) => {
            if (target) {
                (target as HTMLElement).style.setProperty(`--${style}`, `${floatValue}${suffix}`);
            }
        })
    }
}