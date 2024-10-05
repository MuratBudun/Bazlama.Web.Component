import {
    Attribute,
    BazlamaWebComponent,
    ChangeHooks,
    CustomElement,
    EventAction,
    Property,
    ShadowRootMode,
    useFunction,
} from "bazlama-web-component"
import htmlTemplate from "./template.htm"
import BazTimelineMainLayer from "./baz-timeline-main-layer"
import BazTimelineProps from "./baz-timeline-props"

@CustomElement("baz-timeline")
export default class BazTimeline extends BazlamaWebComponent {
    #TimeLineProps: BazTimelineProps = new BazTimelineProps()
    #Theme: string = "default"

    //#region Attributes
    @ChangeHooks([
        useFunction((bazComponent, value) =>
            (bazComponent as BazTimeline).#TimeLineProps.SetStartDateTimeFromString(value as string)
        ),
    ])
    @Attribute("start-date-time", true)
    public StartDateTimeStr: string = BazTimelineProps.GetDefaultStartDateTime().toISOString()

    @ChangeHooks([
        useFunction((bazComponent, value) =>
            (bazComponent as BazTimeline).#TimeLineProps.SetEndDateTimeFromString(value as string)
        ),
    ])
    @Attribute("end-date-time", true)
    public EndDateTimeStr: string = BazTimelineProps.GetDefaultEndDateTime().toISOString()

    @ChangeHooks([
        useFunction((bazComponent, value) =>
            (bazComponent as BazTimeline).#TimeLineProps.SetZoomFactorFromString(value as string)
        ),
    ])
    @Attribute("zoom", true)
    public ZoomFactor: number = 1.0

    @ChangeHooks([
        useFunction((bazComponent, value) =>
            (bazComponent as BazTimeline).#TimeLineProps.SetStartOffsetMsFromString(value as string)
        ),
    ])
    @Attribute("start-offset-ms", true)
    public StartOffsetMs: number = 0
    //#endregion
    getRenderTemplate() { return htmlTemplate }

    constructor() {
        super(ShadowRootMode.None)
        this.InitBazlamaWebComponent()
        this.setLayerColors()
        this.initObservers()
    }

    private initObservers() {
        new ResizeObserver(() => {
            this.#TimeLineProps.setLayersSize(this.clientWidth, this.clientHeight)
            this.#TimeLineProps.fireDrawLayers()
        }).observe(this)

        const htmlElement = document.querySelector("html")
        if (htmlElement) {
            this.#Theme = htmlElement.getAttribute("data-theme") || "default"
        }

        new MutationObserver(() => {
            console.log("Theme changed")
            const htmlElement = document.querySelector("html")
            if (htmlElement) {
                this.#Theme = htmlElement.getAttribute("data-theme") || "default"
                this.setLayerColors()
            }
            console.log(`Theme: ${this.#Theme}`)
        }).observe(htmlElement as Node, { attributes: true, attributeFilter: ["data-theme"] })
    }

    private setLayerColors() {
        if (!this.isRendered) return
        for (const layerName in this.#TimeLineProps.subscribedLayers) {
            const layer = this.#TimeLineProps.subscribedLayers[layerName]
            if (layer) {
                for (const drawStyleName in layer.DrawStyles) {
                    const drawStyle = layer.DrawStyles[drawStyleName]
                    const fillStyle = getComputedStyle(this).getPropertyValue(drawStyle.cssVariableNames.fillStyle)
                    const strokeStyle = getComputedStyle(this).getPropertyValue(drawStyle.cssVariableNames.strokeStyle)
                    
                    if (fillStyle && fillStyle !== "") drawStyle.fillStyle = fillStyle
                    if (strokeStyle && strokeStyle !== "") drawStyle.strokeStyle = strokeStyle

                    layer.postDrawMessage()
                }
            }
        }
    }

    private renderLoop = () => {
        this.#TimeLineProps.drawLayers()
        requestAnimationFrame(this.renderLoop)
    }

    afterRender(): void {
        const canvasList = this.root?.querySelectorAll("canvas")
        canvasList?.forEach((canvas) => {
            const canvasName = canvas.getAttribute("ref")
            if (canvasName === "main-canvas") {
                    const mainLayer = new BazTimelineMainLayer(canvasName, canvas as HTMLCanvasElement, this.#TimeLineProps)
            }
        })

        this.setLayerColors()

        const zoomSlider = document.getElementById("zoomSlider") as HTMLInputElement
        if (zoomSlider) {
            zoomSlider.value = this.ZoomFactor.toFixed(1)
            zoomSlider.oninput = () => {
                this.ZoomFactor = parseFloat(zoomSlider.value)
            }
        }

        this.renderLoop()
    }


    public fit() {
        const mainLayer = this.#TimeLineProps.subscribedLayers["main-canvas"]
        if (!mainLayer) return

        let zoomFactor = (mainLayer as BazTimelineMainLayer).GetFitZoomFactor()
        if (zoomFactor < 0.1) zoomFactor = 0.1

        this.StartOffsetMs = 0
        this.ZoomFactor = zoomFactor
    }
}
