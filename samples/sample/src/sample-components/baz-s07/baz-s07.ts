import { Attribute, BazlamaWebComponent, ChangeHooks, CustomElement, EventAction, ShadowRootMode, useToggleClass } from "bazlama-web-component"
import htmlTemplate from "./template.htm"

@CustomElement("baz-s07")
export default class BazS07 extends BazlamaWebComponent {
    constructor() {
        super(ShadowRootMode.None)
        this.InitBazlamaWebComponent()
    }

    @ChangeHooks([
        useToggleClass(".panel-content", "hidden"),
        useToggleClass(".toggle-icon", "rotate-180")
    ])
    @Attribute("collapsed", true)
    public collapsed: boolean = false

    @EventAction(".toggle-btn", "click")
    public onToggle = () => {
        this.collapsed = !this.collapsed
    }

    getRenderTemplate() {
        return htmlTemplate
    }
}
