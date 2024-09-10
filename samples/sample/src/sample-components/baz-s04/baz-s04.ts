import {
    Attribute, BazConvert, BazlamaWebComponent, ChangeHooks, CustomElement, EventAction, ShadowRootMode,
    useElementAttribute, useElementProperty, useElementText, useFunction,} from "bazlama-web-component"
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
    ])
    @Attribute("volume", true)
    public volume: number = 0

    @ChangeHooks([
        useElementAttribute("baz-icon", "icon", (value) => {
            return BazConvert.anyToBoolean(value) ? "volumeOff" : "volume"
        }),
        useFunction((bazComponent, value) => {
            const videoElement = bazComponent.root?.querySelector("video")
            if (videoElement) {
                videoElement.muted = BazConvert.anyToBoolean(value)
            }
        }),
    ])
    @Attribute("muted", true)
    public muted: boolean = false

    @EventAction("video", "volumechange")
    public onVolumeChange = (name: string, element: HTMLVideoElement) => {
        this.volume = element.volume
        this.muted = element.muted || element.volume <= 0
    }

    @EventAction("button[ref='btn-mute']", "click")
    public onMute = () => {
        this.muted = !this.muted
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
        const videoElement = this.root?.querySelector("video")
        if (videoElement) {
            videoElement.volume = this.volume
            videoElement.muted = this.muted
        }
    }

    getRenderTemplate() {
        return htmlTemplate
    }
}
