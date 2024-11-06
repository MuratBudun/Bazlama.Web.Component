import {
    Attribute,
    BazlamaWebComponent,
    ChangeHooks,
    CustomElement,
    EventAction,
    ShadowRootMode,
    useFunction,
} from "bazlama-web-component"
import htmlTemplate from "./template.htm"
import TimelineMainLayer from "./layers/TimelineMainLayer"
import BazTimelineProps from "./baz-timeline-props"
import TimelineRuler from "./classes/TimelineRuler"
import TimelineLayerManager from "./layers/TimelineLayerManager"
import TimelineHelper from "./classes/TimelineHelper"

@CustomElement("baz-timeline")
export default class BazTimeline extends BazlamaWebComponent {
    #TimeLineProps: BazTimelineProps = new BazTimelineProps()
    #currentTheme: string = "default"
    #verticalScrollEl: HTMLElement | undefined | null = null
    #verticalScrollBarEl: HTMLElement | undefined | null = null

    #layerManager: TimelineLayerManager = new TimelineLayerManager(this)
    public get LayerManager() {
        return this.#layerManager
    }

    #ruler = new TimelineRuler(this)
    public get Ruler() { return this.#ruler }

    //#region Attributes
    @ChangeHooks([
        useFunction((bazComponent, value) => {
            const me = bazComponent as BazTimeline
            //me.#TimeLineProps.SetStartDateTimeFromString(value as string)
            me.Ruler.SetStartDateTimeFromString(value as string)
        }),
    ])
    @Attribute("start-date-time", true)
    public StartDateTimeStr: string = BazTimelineProps.GetDefaultStartDateTime().toISOString()

    @ChangeHooks([
        useFunction((bazComponent, value) => {
            const me = bazComponent as BazTimeline
            //me.#TimeLineProps.SetEndDateTimeFromString(value as string)
            me.Ruler.SetEndDateTimeFromString(value as string)
        }),
    ])
    @Attribute("end-date-time", true)
    public EndDateTimeStr: string = BazTimelineProps.GetDefaultEndDateTime().toISOString()

    @ChangeHooks([
        useFunction((bazComponent, value) => {
            const me = bazComponent as BazTimeline
            me.#TimeLineProps.SetZoomFactorFromString(value as string)
            me.Ruler.SetZoomFactorFromString(value as string)
            me.calculateVerticalScrollWidth()
        }),
    ])
    @Attribute("zoom", true)
    public ZoomFactor: number = 1.0

    @ChangeHooks([
        useFunction((bazComponent, value) => {
            const me = bazComponent as BazTimeline
            me.#TimeLineProps.SetStartOffsetMsFromString(value as string)
            me.Ruler.SetStartOffsetMsFromString(value as string)
        }),
    ])
    @Attribute("start-offset-ms", true)
    public StartOffsetMs: number = 0
    //#endregion
    getRenderTemplate() { return htmlTemplate }

    constructor() {
        super(ShadowRootMode.None)
        this.InitBazlamaWebComponent()
        this.calculateVerticalScrollWidth()
        //this.setLayerColors()
        this.initObservers()
    }

    private initObservers() {
        new ResizeObserver(() => {
            this.LayerManager.setCanvasSize(this.clientWidth, this.clientHeight)
            this.Ruler.VisibleArea.SetSize(this.clientWidth, this.clientHeight)
            this.LayerManager.postDrawMessage()
            /*                
            this.#TimeLineProps.setLayersSize(this.clientWidth, this.clientHeight)
            this.#TimeLineProps.fireDrawLayers()
            */
        }).observe(this)

        const htmlElement = document.querySelector("html")
        if (htmlElement) {
            this.#currentTheme = htmlElement.getAttribute("data-theme") || "default"
        }

        new MutationObserver(() => {
            const htmlElement = document.querySelector("html")
            if (htmlElement) {
                this.#currentTheme = htmlElement.getAttribute("data-theme") || "default"
                this.LayerManager.computeDrawStyles()
                //this.setLayerColors()
            }
        }).observe(htmlElement as Node, { attributes: true, attributeFilter: ["data-theme"] })
    }

    private calculateVerticalScrollWidth() {
        if (!this.LayerManager.mainLayer) return

        //const widthBySeconds = this.Ruler.Calculated.TotalMs / 1000
        //const widthBySecondsPx = widthBySeconds * (this.Ruler.Calculated.HourWidthWithZoomPx / 3600) 

        const width = this.Ruler.Computed.TotalWidthWithZoomPx + this.LayerManager.mainLayer.leftMarginPx * 2
        this.#verticalScrollBarEl?.style.setProperty("width", `${width}px`)
    }

    @EventAction("div[ref='vertical-scroll']", "scroll")
    public onScroll = (_name: string, element: HTMLElement, e: Event) => {
        if (!this.LayerManager.mainLayer) return

        const leftMargin = element.scrollLeft
        this.StartOffsetMs = this.Ruler.Computed.GetMsFromPxWithZoom(leftMargin)
    }

    private renderLoop = () => {
        //this.#TimeLineProps.drawLayers()
        this.LayerManager.drawLoop()
        requestAnimationFrame(this.renderLoop)
    }

    afterRender(): void {
        this.#verticalScrollEl = this.root?.querySelector("div[ref='vertical-scroll']")
        this.#verticalScrollBarEl = this.root?.querySelector("div[ref='vertical-scroll-bar']")

        const canvasList = this.root?.querySelectorAll("canvas")
        canvasList?.forEach((canvas) => {
            const canvasName = canvas.getAttribute("ref")
            if (canvasName === "main-canvas") {
                this.LayerManager.mainLayer = new TimelineMainLayer(this, canvasName, canvas as HTMLCanvasElement)
            }
        })

        this.calculateVerticalScrollWidth()
        this.LayerManager.computeDrawStyles()
        this.LayerManager.postDrawMessage()

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

        let zoomFactor = this.Ruler.Computed.GetFitZoomFactor()
        if (zoomFactor < 0.1) zoomFactor = 0.1

        this.StartOffsetMs = 0
        this.ZoomFactor = zoomFactor
    }
}
