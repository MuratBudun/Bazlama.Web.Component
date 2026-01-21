import { 
    Attribute, 
    BazlamaWebComponent, 
    ChangeHooks, 
    CustomElement, 
    FireEvent, 
    ShadowRootMode, 
    useElementAttribute, 
    useElementInputValue, 
    useElementText, 
    useSwitchClass 
} from "bazlama-web-component"
import htmlTemplate from "./template.htm"

type TColor = "neutral" | "primary" | "secondary" | "accent" | "info" | "success" | "warning" | "error"
type TSize = "xs" | "sm" | "md" | "lg"

/**
 * BazTextbox - DaisyUI styled input component with label and actions
 * 
 * @example
 * ```html
 * <baz-textbox 
 *   label="Username" 
 *   placeholder="Enter username"
 *   value="john_doe"
 *   color="primary"
 *   size="md">
 *   <button class="btn btn-ghost btn-xs">Clear</button>
 * </baz-textbox>
 * ```
 * 
 * @fires value - Emitted when input value changes
 */
@CustomElement("baz-textbox")
export class BazTextbox extends BazlamaWebComponent {
    @FireEvent()
    @ChangeHooks([useElementInputValue("input")])
    @Attribute("value", true)
    public value: string = ""

    @ChangeHooks([useElementAttribute("input", "placeholder")])
    @Attribute("placeholder", true)
    public placeholder: string = "Type here..."

    @ChangeHooks([useSwitchClass("label[ref='input-border']", "input-")])
    @Attribute("color", true)
    public color: TColor = "neutral"

    @ChangeHooks([useSwitchClass("label[ref='input-border']", "input-", "input-bordered")])
    @Attribute("size", true)
    public size: TSize = "md"

    @ChangeHooks([useElementText("[ref='label']")])
    @Attribute("label", true)
    public label: string = ""

    @ChangeHooks([useElementText("[ref='label-alt-left']")])
    @Attribute("label-alt-left", true)
    public labelAltLeft: string = ""

    @ChangeHooks([useElementText("[ref='label-alt-right']")])
    @Attribute("label-alt-right", true)
    public labelAltRight: string = ""

    @Attribute("disabled", false)
    public disabled: boolean = false

    @Attribute("type", true)
    public type: string = "text"

    private buttons: HTMLElement[] = []

    constructor() {
        super(ShadowRootMode.None)
        this.InitBazlamaWebComponent()
        this.buttons = [...this.children] as HTMLElement[]
    }

    afterRender(): void {
        const buttonContainer = this.root?.querySelector("div[ref='button-container']")
        const inputElement = this.root?.querySelector("input") as HTMLInputElement
        
        // Move slotted buttons to container
        this.buttons.forEach((button) => {
            buttonContainer?.appendChild(button)
        })

        // Apply disabled state
        if (this.disabled && inputElement) {
            inputElement.disabled = true
        }

        // Set input type
        if (inputElement) {
            inputElement.type = this.type
        }

        // Hide label if empty
        const labelElement = this.root?.querySelector("div[ref='label-container']")
        if (!this.label && labelElement) {
            labelElement.classList.add("hidden")
        }

        // Hide alt labels if empty
        const altLabelContainer = this.root?.querySelector("div[ref='label-alt-container']")
        if (!this.labelAltLeft && !this.labelAltRight && altLabelContainer) {
            altLabelContainer.classList.add("hidden")
        }
    }

    getRenderTemplate() {
        return htmlTemplate
    }
}