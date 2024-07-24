import TPropertyChangeHandler from "../TPropertyChangeHandler"

export default function useElementInputValue<T>(query: string): TPropertyChangeHandler<T> {
    return (element, value, property) => {
        const targets = element.root?.querySelectorAll(query)
        targets?.forEach((target) => {
            if (target && (target instanceof HTMLInputElement)) {
                
                if (!target.oninput) {
                    target.oninput = (event) => {
                        if (property) {
                            property.set(element, (event.target as HTMLInputElement).value as unknown as T)
                        }                            
                    }
                }

                target.value = value as unknown as string                
            }
        })
    }
}