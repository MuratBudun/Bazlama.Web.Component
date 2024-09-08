import { Attribute, BazlamaWebComponent, ChangeHooks, CustomElement, ShadowRootMode, useElementText } from "bazlama-web-component"
import htmlTemplate from "./template.htm"

@CustomElement("baz-s01")
export default class BazS01 extends BazlamaWebComponent {
    constructor() {
        super(ShadowRootMode.None)
        this.InitBazlamaWebComponent()
    }

    @ChangeHooks([useElementText("span[ref='label-text']")])
    @Attribute("label-text", true)
    public LabelText = "Bazlama Sample 01"

    getRenderTemplate() {
        return htmlTemplate
    }
}
