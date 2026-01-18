import { Attribute, BazColor, BazlamaWebComponent, ChangeHooks, CustomElement, EventAction, ShadowRootMode, useElementStyle, useElementText } from "bazlama-web-component"
import htmlTemplate from "./template.htm"

// Create gradient function once (red → orange → green)
const progressColor = BazColor.progressGradient()

@CustomElement("baz-s06")
export default class BazS06 extends BazlamaWebComponent {
    constructor() {
        super(ShadowRootMode.None)
        this.InitBazlamaWebComponent()
    }

    @ChangeHooks([
        useElementStyle(".progress-bar", "width", "%"),
        useElementStyle(".progress-bar", "background-color", "", "", (value) => {
            return progressColor(Number(value))
        }),
        useElementText(".progress-value", "%")
    ])
    @Attribute("progress", true)
    public progress: number = 50

    @EventAction("input[type='range']", "input")
    public onRangeChange = (_name: string, element: HTMLInputElement) => {
        this.progress = Number(element.value)
    }

    getRenderTemplate() {
        return htmlTemplate
    }
}
