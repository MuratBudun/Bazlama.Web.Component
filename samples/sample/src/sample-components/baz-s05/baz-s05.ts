import { Attribute, BazlamaWebComponent, ChangeHooks, CustomElement, Property, ShadowRootMode, useAddRemoveClass, useElementInputRadioValue } from "bazlama-web-component"
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
        useAddRemoveClass({
            addClassName: "active",
            removeClassName: "active",
            addElQuery: (value) => `div[ref="${value}-content"], li[ref="${value}"]`,
            removeElQuery: (oldValue) => `div[ref="${oldValue}-content"], li[ref="${oldValue}"]`
        })
    ])
    @Attribute("selected-tab", true)
    @Property()
    public SelectedTab: string = "tab-2"

    getRenderTemplate() {
        return htmlTemplate
    }    
}