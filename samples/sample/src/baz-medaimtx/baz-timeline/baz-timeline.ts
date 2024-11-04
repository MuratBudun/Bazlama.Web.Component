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
import TimelineRuler from "./classes/TimelineRuler"

@CustomElement("baz-timeline")
export default class BazTimeline extends BazlamaWebComponent {
    #TimeLineProps: BazTimelineProps = new BazTimelineProps()
    #Theme: string = "default"
    VerticalScrollEl: HTMLElement | undefined | null = null
    VerticalScrollBarEl: HTMLElement | undefined | null = null


    public Ruler: TimelineRuler = new TimelineRuler()

    //#region Attributes
    @ChangeHooks([
        useFunction((bazComponent, value) => {
            const me = bazComponent as BazTimeline
            me.#TimeLineProps.SetStartDateTimeFromString(value as string)
            me.Ruler.SetTimes(me.#TimeLineProps.startDateTime, me.#TimeLineProps.endDateTime)
        }),
    ])
    @Attribute("start-date-time", true)
    public StartDateTimeStr: string = BazTimelineProps.GetDefaultStartDateTime().toISOString()

    @ChangeHooks([
        useFunction((bazComponent, value) => {
            const me = bazComponent as BazTimeline
            me.#TimeLineProps.SetEndDateTimeFromString(value as string)
            me.Ruler.SetTimes(me.#TimeLineProps.startDateTime, me.#TimeLineProps.endDateTime)
        }),
    ])
    @Attribute("end-date-time", true)
    public EndDateTimeStr: string = BazTimelineProps.GetDefaultEndDateTime().toISOString()

    @ChangeHooks([
        useFunction((bazComponent, value) => {
            const me = bazComponent as BazTimeline
            const valueStr = (value as string)
            me.#TimeLineProps.SetZoomFactorFromString(valueStr)
            me.calculateVerticalScrollWidth()
        }),
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
            this.Ruler.VisibleArea.SetSize(this.clientWidth, this.clientHeight)
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

    private calculateVerticalScrollWidth() {
        const mainLayer = this.#TimeLineProps.subscribedLayers["main-canvas"]
        if (!mainLayer) return

        const widthBySeconds = this.#TimeLineProps.totalTimeMs / 1000
        const widthBySecondsPx = widthBySeconds * (this.#TimeLineProps.hourWidthPx / 3600) 
            
        this.VerticalScrollBarEl?.style.setProperty("width", widthBySecondsPx + "px")
    }

    @EventAction("div[ref='vertical-scroll']", "scroll")
    public onScroll = (_name: string, element: HTMLElement, e: Event) => {
        const mainLayer = this.#TimeLineProps.subscribedLayers["main-canvas"]
        if (!mainLayer) return

        const leftMargin = element.scrollLeft / mainLayer.pixelRatio
        this.StartOffsetMs = leftMargin * 36000
        this.Ruler.StartOffsetMs = this.StartOffsetMs
    }

    private setLayerColors() {
        if (!this.isRendered) return

        this.calculateVerticalScrollWidth()

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
        this.VerticalScrollEl = this.root?.querySelector("div[ref='vertical-scroll']")
        this.VerticalScrollBarEl = this.root?.querySelector("div[ref='vertical-scroll-bar']")

        const canvasList = this.root?.querySelectorAll("canvas")
        canvasList?.forEach((canvas) => {
            const canvasName = canvas.getAttribute("ref")
            if (canvasName === "main-canvas") {
                const mainLayer = new BazTimelineMainLayer(this, canvasName, canvas as HTMLCanvasElement, this.#TimeLineProps)
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
