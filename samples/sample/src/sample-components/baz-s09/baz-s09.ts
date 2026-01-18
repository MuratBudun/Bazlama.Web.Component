import { Attribute, BazlamaWebComponent, ChangeHooks, CustomElement, EventAction, ShadowRootMode, useCustomHook } from "bazlama-web-component"
import htmlTemplate from "./template.htm"

@CustomElement("baz-s09")
export default class BazS09 extends BazlamaWebComponent {
    constructor() {
        super(ShadowRootMode.None)
        this.InitBazlamaWebComponent()
    }

    @ChangeHooks([
        useCustomHook(".card", (target, value, _propertyDefine, _oldValue, _bazComponent) => {
            const element = target as HTMLElement
            const numValue = Number(value)
            
            // Update data attribute
            element.dataset.rating = String(numValue)
            
            // Update visual stars
            const starsEl = element.querySelector(".stars")
            if (starsEl) {
                starsEl.innerHTML = "★".repeat(numValue) + "☆".repeat(5 - numValue)
            }
            
            // Update rating text
            const ratingTextEl = element.querySelector(".rating-text")
            if (ratingTextEl) {
                const labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"]
                ratingTextEl.textContent = labels[numValue] || ""
            }
        })
    ])
    @Attribute("rating", true)
    public rating: number = 3

    @EventAction(".star-btn", "click")
    public onStarClick = (_name: string, element: HTMLButtonElement) => {
        const value = element.dataset.value
        if (value) {
            this.rating = Number(value)
        }
    }

    getRenderTemplate() {
        return htmlTemplate
    }
}
