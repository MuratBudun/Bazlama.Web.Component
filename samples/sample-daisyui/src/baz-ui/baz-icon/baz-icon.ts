import { Attribute, BazlamaWebComponent, ChangeHooks, CustomElement, EventAction, FireRender, ShadowRootMode, useElementAttribute } from "bazlama-web-component"
import { IconMap, icons } from "./baz-icon-lib"

@CustomElement("baz-icon")
export default class BazIcon extends BazlamaWebComponent {
    @FireRender()
    @Attribute("icon", true)
    public icon: string = ""

    @ChangeHooks([
        useElementAttribute("svg", "width"),
        useElementAttribute("svg", "height"),
    ])
    @Attribute("size", true)
    public size: string = "24px"

    @ChangeHooks([useElementAttribute("svg", "stroke")])
    @Attribute("stroke", true)      
    public stroke: string = "currentColor"

    @ChangeHooks([useElementAttribute("svg", "stroke-width")])
    @Attribute("stroke-width", true)    
    public strokeWidth: string = "2"

    @ChangeHooks([useElementAttribute("svg", "role")])
    @Attribute("role", true)    
    public role: string = "img"
    
    @ChangeHooks([useElementAttribute("svg", "aria-label")])
    @Attribute("aria-label", true)
    public ariaLabel: string = ""

    @ChangeHooks([useElementAttribute("svg", "aria-hidden")])
    @Attribute("aria-hidden", true)
    public ariaHidden: string = "true"

    @EventAction("svg", "click")
    public SayHello() {
        console.log("Hello")
    }

    constructor() {
        super(ShadowRootMode.None)
        this.InitBazlamaWebComponent()
    }

    getRenderTemplate() {
        return (icons as IconMap)[this.icon] || icons._default
    }
}