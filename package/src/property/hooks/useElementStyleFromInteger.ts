import TPropertyChangeHandler from "../TPropertyChangeHandler"

export default function useElementStyleFromInteger<T>(
    query: string,
    style: string,
    suffix: string = ""
): TPropertyChangeHandler<T> {
    return (element, value) => {
        const integerValue = parseInt(value as string, 10) ?? 0;
        const targets = element.root?.querySelectorAll(query)
        targets?.forEach((target) => {
            if (target) {
                (target as HTMLElement).style.setProperty(`--${style}`, `${integerValue}${suffix}`);
            }
        })
    }
}