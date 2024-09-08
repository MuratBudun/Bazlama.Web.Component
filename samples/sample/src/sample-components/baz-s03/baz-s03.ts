import { Attribute, BazConvert, BazlamaWebComponent, ChangeHooks, CustomElement, FireEvent, ShadowRootMode, useElementAttribute, useElementInputValue, useElementText, useElementTextWithFunction } from "bazlama-web-component"
import htmlTemplate from "./template.htm"

@CustomElement("baz-s03")
export default class BazS03 extends BazlamaWebComponent {
    constructor() {
        super(ShadowRootMode.None)
        this.InitBazlamaWebComponent()
    }

    @ChangeHooks([
        useElementInputValue("input"),
        useElementTextWithFunction("span[ref='label-summary']", 
            (value) =>  BazConvert.anyToString(value) === "" ? "" : `Summary: ${value}`
        ),
    ])
    @Attribute("value", true)
    public value: string = ""

    @ChangeHooks([useElementAttribute("input", "placeholder")])
    @Attribute("placeholder", true)
    public placheHolder: string = "Please input text"

    @ChangeHooks([useElementText("span[ref='label']")])
    @Attribute("label", true)
    public label: string = "Bazlama S03"

    getRenderTemplate() {
        return htmlTemplate
    }
}