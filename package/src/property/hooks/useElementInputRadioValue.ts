import TPropertyChangeHook from "../types/TPropertyChangeHandler"

export default function useElementInputRadioValue(name: string): TPropertyChangeHook {
    return (bazComponent, value, propertyDefine) => {
        const targets = bazComponent.root?.querySelectorAll(`input[type='radio'][name='${name}']`)
        console.log(bazComponent.root?.innerHTML)
        console.log("useElementInputRadioValue", name, value, targets)
        targets?.forEach((target: Element) => {
            if (target && target instanceof HTMLInputElement) {
                if (!target.onchange) {
                    target.onchange = (event) => {
                        if (propertyDefine) {
                            propertyDefine.setValue(bazComponent, (event.target as HTMLInputElement).value)
                        }
                    }
                }
                const checked = (target.value === value)
                if (!checked)  
                    target.removeAttribute("checked")
                else 
                    target.setAttribute("checked", "")
            }
        })
    }
}