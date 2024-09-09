import { Attribute, BazConvert, BazlamaWebComponent, ChangeHooks, CustomElement, EventAction, ShadowRootMode, useElementAttribute, useElementProperty, useElementText, useElementTextWithFunction } from "bazlama-web-component"
import htmlTemplate from "./template.htm"

@CustomElement("baz-s04")
export default class BazS04 extends BazlamaWebComponent {
    constructor() {
        super(ShadowRootMode.None)
        this.InitBazlamaWebComponent()
    }

    @ChangeHooks([
        useElementProperty("video", "volume"),
        useElementText("span[ref='volume']", "Volume: ", "%", (value) => {
            return `${(value * 100).toFixed(0)}`
        }),
        useElementAttribute("baz-icon", "icon", (value) => {
            return value <= 0 ? "volumeOff" : "volume"
        })
    ])
    @Attribute("volume", true)
    public volume: number = 0

    @EventAction("video", "volumechange")
    public onVolumeChange = (name: string, element: HTMLVideoElement) => {
        this.volume = element.volume
    }

    @EventAction("button[ref='btn-volume-up']", "click")
    public onVolumeUp = () => {
        this.volume = Math.min(1, BazConvert.anyToNumber(this.volume + 0.05, 0, 2))
    }

    @EventAction("button[ref='btn-volume-down']", "click")
    public onVolumeDown = () => {
        this.volume = Math.max(0, BazConvert.anyToNumber(this.volume - 0.05, 0, 2))
    }

    afterRender(): void {
        this.volume = this.root?.querySelector("video")?.volume ?? 0
    }

    getRenderTemplate() {
        return htmlTemplate
    }
}