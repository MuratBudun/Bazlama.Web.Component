import { Attribute, BazlamaWebComponent, ChangeHooks, CustomElement, ShadowRootMode, useAddRemoveClass, useElementInputRadioValue } from "bazlama-web-component"
import htmlTemplate from "./template.htm"
import "./style.css"

@CustomElement("baz-s05")
export default class BazS05 extends BazlamaWebComponent {
    constructor() {
        super(ShadowRootMode.None)
        this.InitBazlamaWebComponent()
    }

    @ChangeHooks([
        useElementInputRadioValue("selected-tab"),
        useAddRemoveClass(
            (value) => `div[ref="${value}-content"]`,
            (oldValue) => `div[ref="${oldValue}-content"]`, "active"),
        useAddRemoveClass(
            (value) => `li[ref="${value}"]`,
            (oldValue) => `li[ref="${oldValue}"]`, "active")        
    ])
    @Attribute("selected-tab", true)
    public SelectedTab: string = "tab-2"

    getRenderTemplate() {
        return htmlTemplate
    }    
}