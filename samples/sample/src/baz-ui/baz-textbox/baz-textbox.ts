import { Attribute, BazlamaWebComponent, ChangeHooks, CustomElement, FireEvent, ShadowRootMode, useElementAttribute, useElementInputValue, useElementText, useSwitchClass } from "bazlama-web-component"
import htmlTemplate from "./template.htm"

type TColor = "neutral" | "primary" | "secondary" | "accent" | "info" | "success" | "warning" | "error" 

@CustomElement("baz-textbox")
export class BazTextbox extends BazlamaWebComponent {
    @FireEvent()
    @ChangeHooks([useElementInputValue("input")])
    @Attribute("value", true)
    public value: string = ""

    @ChangeHooks([useElementAttribute("input", "placeholder")])
    @Attribute("placeholder", true)
    public placheHolder: string = "Please input text"

    @ChangeHooks([useSwitchClass("label[ref='input-border']", "input-")])
    @Attribute("color", true)
    public color: TColor = "neutral"

    @ChangeHooks([useElementText("span[ref='label']")])
    @Attribute("label", true)
    public label: string = "Bazlama Textbox"

    @ChangeHooks([useElementText("span[ref='label-alt-left']")])
    @Attribute("label-alt-left", true)
    public labelAltLeft: string = "" 

    @ChangeHooks([useElementText("span[ref='label-alt-right']")])
    @Attribute("label-alt-right", true)
    public labelAltRight: string = "" 

    private buttons: any[] = []

    constructor() {
        super(ShadowRootMode.None)
        this.InitBazlamaWebComponent()
        this.buttons = [...this.children]
    }

    afterRender(): void {
        const buttonContainer = this.root?.querySelector("div[ref='button-container']")
        this.buttons.forEach((button) => {
            buttonContainer?.appendChild(button)
        })
    }

    getRenderTemplate() {
        return htmlTemplate
    }
}