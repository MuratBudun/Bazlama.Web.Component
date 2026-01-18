import { Attribute, BazlamaWebComponent, ChangeHooks, CustomElement, EventAction, ShadowRootMode, useSwitchClass } from "bazlama-web-component"
import htmlTemplate from "./template.htm"

@CustomElement("baz-s08")
export default class BazS08 extends BazlamaWebComponent {
    constructor() {
        super(ShadowRootMode.None)
        this.InitBazlamaWebComponent()
    }

    @ChangeHooks([
        useSwitchClass(".theme-box", "theme-")
    ])
    @Attribute("theme", true)
    public theme: string = "primary"

    @EventAction("button", "click")
    public onButtonClick = (_name: string, element: HTMLButtonElement) => {
        const newTheme = element.dataset.theme
        if (newTheme) {
            this.theme = newTheme
        }
    }

    getRenderTemplate() {
        return htmlTemplate
    }
}
