import TPropertyChangeHook from "../TPropertyChangeHandler"

export default function useElementInputValue(query: string): TPropertyChangeHook {
    return (bazComponent, value, propertyDefine) => {
        const targets = bazComponent.root?.querySelectorAll(query)
        targets?.forEach((target) => {
            if (target && (target instanceof HTMLInputElement)) {
                
                if (!target.oninput) {
                    target.oninput = (event) => {
                        if (propertyDefine) {
                            propertyDefine.setValue(bazComponent, (event.target as HTMLInputElement).value)
                        }                            
                    }
                }

                target.value = value as unknown as string                
            }
        })
    }
}