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
import TimelineRuler from "./classes/TimelineRuler"
import TimelineLayerManager from "./layers/TimelineLayerManager"
import TimelineHelper from "./classes/TimelineHelper"

@CustomElement("baz-timeline")
export default class BazTimeline extends BazlamaWebComponent {
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
            me.Ruler.SetStartDateTimeFromString(value as string)
        }),
    ])
    @Attribute("start-date-time", true)
    public StartDateTimeStr: string = TimelineHelper.GetDefaultStartDateTime().toISOString()

    @ChangeHooks([
        useFunction((bazComponent, value) => {
            const me = bazComponent as BazTimeline
            me.Ruler.SetEndDateTimeFromString(value as string)
        }),
    ])
    @Attribute("end-date-time", true)
    public EndDateTimeStr: string = TimelineHelper.GetDefaultEndDateTime().toISOString()

    @ChangeHooks([
        useFunction((bazComponent, value) => {
            const me = bazComponent as BazTimeline
            me.Ruler.SetZoomFactorFromString(value as string)
            me.calculateVerticalScrollWidth()
        }),
    ])
    @Attribute("zoom", true)
    public ZoomFactor: number = 1.0

    @ChangeHooks([
        useFunction((bazComponent, value) => {
            const me = bazComponent as BazTimeline
            me.Ruler.SetStartOffsetMsFromString(value as string)
            if (me.#verticalScrollEl) {
                me.#verticalScrollEl.scrollLeft = me.Ruler.Computed.StartOffsetPx
            }
        }),
    ])
    @Attribute("start-offset-ms", true)
    public StartOffsetMs: number = 0
    //#endregion
    getRenderTemplate() { return htmlTemplate }

    constructor() {
        super(ShadowRootMode.None)
        this.InitBazlamaWebComponent()
        this.initObservers()

        document.addEventListener('gesturestart', this.gestureStart.bind(this))
        document.addEventListener('gesturechange', this.gestureChange.bind(this))
        document.addEventListener('gestureend', this.gestureEnd.bind(this))
    }

    private gestureStartedZoomFactor: number = 1.0
    private gestureApplySpeed: number = 1

    private gestureStart(e: any) {
        e.preventDefault()
        this.gestureStartedZoomFactor = this.ZoomFactor
    }

    private gestureEnd(e: any) {
        e.preventDefault()
        this.gestureStartedZoomFactor = 1.0
    }

    private gestureChange(e: any) {
        e.preventDefault()

        const zoomFactor = this.gestureStartedZoomFactor * e.scale * 
            (e.scale > 0 ? this.gestureApplySpeed : 1 / this.gestureApplySpeed) 
        this.ZoomFactor = TimelineHelper.clamp(zoomFactor, 
            this.Ruler.Constraints.ZoomFactorMin, this.Ruler.Constraints.ZoomFactorMax)
        
        console.log(`Gesture Zoom: ${e.scale}, ZoomFactor: ${this.ZoomFactor}`)
    }

    private initObservers() {
        new ResizeObserver(() => {
            this.Ruler.VisibleArea.SetSize(this.clientWidth, this.clientHeight)
            this.LayerManager.setCanvasSize(this.clientWidth, this.clientHeight)
            this.LayerManager.postDrawMessage()
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
            }
        }).observe(htmlElement as Node, { attributes: true, attributeFilter: ["data-theme"] })
    }

    private calculateVerticalScrollWidth() {
        if (!this.LayerManager.mainLayer) return

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

    public fitToCanvas() {
        let zoomFactor = this.Ruler.Computed.GetFitZoomFactor()
        if (zoomFactor < 0.1) zoomFactor = 0.1

        this.StartOffsetMs = 0
        this.ZoomFactor = zoomFactor
    }
}