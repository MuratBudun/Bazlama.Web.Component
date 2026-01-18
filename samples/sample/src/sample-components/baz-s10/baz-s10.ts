import { Attribute, BazlamaWebComponent, ChangeHooks, CustomElement, EventAction, ShadowRootMode, useFunction, useElementText } from "bazlama-web-component"
import htmlTemplate from "./template.htm"

@CustomElement("baz-s10")
export default class BazS10 extends BazlamaWebComponent {
    constructor() {
        super(ShadowRootMode.None)
        this.InitBazlamaWebComponent()
    }

    @ChangeHooks([
        useElementText(".counter-display"),
        useFunction((bazComponent, value, _propertyDefine, oldValue) => {
            const element = bazComponent.root?.querySelector(".counter-display") as HTMLElement
            if (element) {
                // Add animation class
                element.classList.add("animate-pulse")
                setTimeout(() => element.classList.remove("animate-pulse"), 300)
                
                // Change color based on direction
                if (Number(value) > Number(oldValue)) {
                    element.style.color = "#22c55e"
                } else if (Number(value) < Number(oldValue)) {
                    element.style.color = "#ef4444"
                }
                setTimeout(() => element.style.color = "", 500)
            }
            
            // Log to console for demo
            console.log(`Counter changed: ${oldValue} → ${value}`)
        })
    ])
    @Attribute("count", true)
    public count: number = 0

    @EventAction(".btn-increment", "click")
    public onIncrement = () => {
        this.count++
    }

    @EventAction(".btn-decrement", "click")
    public onDecrement = () => {
        this.count--
    }

    @EventAction(".btn-reset", "click")
    public onReset = () => {
        this.count = 0
    }

    getRenderTemplate() {
        return htmlTemplate
    }
}
