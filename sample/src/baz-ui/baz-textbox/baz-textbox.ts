import { Attribute, BazlamaWebComponent, ChangeHooks, CustomElement, ShadowRootMode, useElementInputValue, useElementText, useFunction, useToggleClass } from "bazlama-web-component"
import htmlTemplate from "./template.htm"
import { IPropertyChangeHandlers } from "bazlama-web-component/dist/property/types/IPropertyChangeHandlers"

type TColor = "neutral" | "primary" | "secondary" | "accent" | "info" | "success" | "warning" | "error" 

@CustomElement("baz-textbox")
export class BazTextbox extends BazlamaWebComponent {
    @ChangeHooks([useElementInputValue("input")])
    @Attribute("value", true)
    public value: string = ""

    @Attribute("color", true)
    public color: TColor = "neutral"

    @ChangeHooks([useElementText("span[ref='label']")])
    @Attribute("label", true)
    public label: string = "Bazlama Textbox"

    @ChangeHooks([useElementText("span[ref='label-alt-left']")])
    @Attribute("label-alt-left", true)
    public labelAltLeft: string = "Alt Left" 

    @ChangeHooks([useElementText("span[ref='label-alt-right']")])
    @Attribute("label-alt-right", true)
    public labelAltRight: string = "Alt Right" 

    static CreatePropertyHooks(): IPropertyChangeHandlers {
        return {
            color: [
                useFunction((bazComponent, value, propertyDefine, oldValue) => {
                    const input = bazComponent.root?.querySelector("label[ref='input-border']")
                    if (input) {
                        input.classList.remove("input-" + oldValue)
                        input.classList.add("input-" + value)
                    }
                })
            ]
        }
        
    }

    private buttons: any[] = []

    constructor() {
        super(ShadowRootMode.None)
        this.buttons = [...this.children]
        console.log(this.buttons)
    }

    afterRender(): void {
        const buttonContainer = this.root?.querySelector("div[ref='button-container']")
        this.buttons.forEach((button, index) => {
            buttonContainer?.appendChild(button)
            console.log("button add", button)
        })
    }

    getRenderTemplate() {
        return htmlTemplate
    }
}