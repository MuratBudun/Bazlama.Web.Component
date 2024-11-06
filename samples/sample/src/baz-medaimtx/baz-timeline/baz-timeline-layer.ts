import BazTimeline from "./baz-timeline"
import BazTimelineProps from "./baz-timeline-props"
import TimelineConstraints from "./classes/TimelineConstraints"
import TimelineRuler from "./classes/TimelineRuler"
import TimelineRulerCalculate from "./classes/TimelineRulerCalculate"
import VisibleArea from "./classes/VisibleArea"


export type TCanvasDrawStyleCssVariableNames = {
    fillStyle: string
    strokeStyle: string
}

export type TCanvasDrawStyle = {
    name: string
    fillStyle: string
    strokeStyle: string
    cssVariableNames: TCanvasDrawStyleCssVariableNames
}

export default abstract class BazTimelineLayer {
    #owner: BazTimeline
    public get Owner() { return this.#owner }   

    #ruler: TimelineRuler
    public get Ruler() { return this.#ruler }

    #calculated: TimelineRulerCalculate
    public get Calculated() { return this.#calculated }

    #constraints: TimelineConstraints
    public get Constraints() { return this.#constraints }

    #visibleArea: VisibleArea
    public get VisibleArea() { return this.#visibleArea }

    #_name: string = ""
    public get name(): string { return this.#_name }

    public canvas: HTMLCanvasElement
    public context: CanvasRenderingContext2D
    public pixelRatio: number = window.devicePixelRatio || 1

    public topMarginPx: number = 4
    public leftMarginPx: number = 4

    public timelineProps: BazTimelineProps
    public isNeedRedraw: boolean = true
    public DrawStyles: Record<string, TCanvasDrawStyle> = {}

    public get visibleHours(): number {
        return Math.ceil(this.canvasWidthPx / this.timelineProps.hourWidthPx)
    }

    public get canvasWidthPx(): number {
        return this.canvas.width - (this.leftMarginPx * 2)
    }

    public get canvasHeightPx(): number {
        return this.canvas.height - (this.topMarginPx * 2)
    }

    public get maxOffsetMs(): number {
        return Math.max(
            this.timelineProps.totalTimeMs - (this.canvasWidthPx * (60 * 60 * 1000)) / this.timelineProps.hourWidthPx,
            0
        )
    }

    constructor(owner: BazTimeline, name: string, canvas: HTMLCanvasElement, timelineProps: BazTimelineProps) {
        if (owner == null) throw new Error("owner is null")
        if (timelineProps == null) throw new Error("timelineProps is null")
        if (name in timelineProps.subscribedLayers) throw new Error(`Layer with name '${name}' already exists`)
        if (canvas == null) throw new Error("canvas is null")
        if (canvas instanceof HTMLCanvasElement == false) throw new Error("canvas is not an instance of HTMLCanvasElement")
        if (canvas.getContext("2d") == null) throw new Error("CanvasRenderingContext2D is null")

        this.#owner = owner
        this.#ruler = owner.Ruler
        this.#calculated = owner.Ruler.Calculated
        this.#constraints = owner.Ruler.Constraints
        this.#visibleArea = owner.Ruler.VisibleArea

        this.timelineProps = timelineProps
        this.timelineProps.subscribedLayers[name] = this
        this.canvas = canvas
        this.context = this.canvas.getContext("2d") || new CanvasRenderingContext2D()
    }

    public addDrawStyle(name: string, fillStyle: string, strokeStyle: string, cssVariableNames?: TCanvasDrawStyleCssVariableNames) {
        let newCssVariableNames = cssVariableNames || {
            fillStyle: `--${name}-fill-style`,
            strokeStyle: `--${name}-stroke-style`
        }
        this.DrawStyles[name] = { name, fillStyle, strokeStyle, cssVariableNames: newCssVariableNames }
    }

    public getDrawStyle(name: string): TCanvasDrawStyle | undefined {
        if (name in this.DrawStyles) {
            return this.DrawStyles[name]
        } 
        return undefined
    }

    public setContextStyle(styleName: string) {
        const style = this.getDrawStyle(styleName)

        if (style) {
            this.context.fillStyle = style.fillStyle
            this.context.strokeStyle = style.strokeStyle
        }
    }

    public static RemToPx(rem: number): number {
        const result = rem * parseFloat(getComputedStyle(document.documentElement).fontSize)
        return Math.round(result)
    } 

    public postDrawMessage() {
        this.isNeedRedraw = true
    }

    public draw(isForceRedraw: boolean = false) {
        if (this.isNeedRedraw || isForceRedraw) {
            this.drawFunction()
            this.isNeedRedraw = false
        }
    }

    public abstract drawFunction(): void

    public setSize(width: number, height: number) {
        this.canvas.width = width * this.pixelRatio
        this.canvas.height = height * this.pixelRatio
        this.canvas.style.width = width + "px"
        this.canvas.style.height = height + "px"

        this.context.scale(this.pixelRatio, this.pixelRatio)
    }

    public convertMarginedX(x: number): number {
        return x + this.leftMarginPx
    }

    public convertMarginedY(y: number): number {
        return y + this.topMarginPx
    }

    public drawLine(x1: number, y1: number, x2: number, y2: number) {
        this.context.beginPath()
        this.context.moveTo(this.convertMarginedX(x1), this.convertMarginedY(y1))
        this.context.lineTo(this.convertMarginedX(x2), this.convertMarginedY(y2))
        this.context.stroke()
        this.context.closePath()
    }

    public drawLineVertical(x: number, y: number, height: number) {   
        if (x > this.canvasWidthPx || x < 0) return
        if (y > this.canvasHeightPx || y < 0) return

        this.context.beginPath()
        this.context.moveTo(this.convertMarginedX(x), 
            this.convertMarginedY(y))
        this.context.lineTo(this.convertMarginedX(x), 
            this.convertMarginedY(Math.min(y + height, this.canvasHeightPx)))
        this.context.stroke()
        this.context.closePath()
    }

    public drawLineHorizontal(x: number, y: number, width: number) {
        if (x > this.canvasWidthPx || x < 0) return
        if (y > this.canvasHeightPx || y < 0) return
        this.context.beginPath()
        this.context.moveTo(this.convertMarginedX(x), this.convertMarginedY(y))
        this.context.lineTo(this.convertMarginedX(Math.min(x + width, this.canvasWidthPx)), 
            this.convertMarginedY(y))
        this.context.stroke()
        this.context.closePath()
    }   
    
    public fillRect(x: number, y: number, width: number, height: number) {
        this.context.fillRect(
            this.convertMarginedX(x), 
            this.convertMarginedY(y), 
            width, 
            height)
    }

    public fillText(text: string, x: number, y: number, maxWidth?: number) {
        console.log("fillText", text, x, y, maxWidth)
        this.context.fillText(text, 
            this.convertMarginedX(x),
            this.convertMarginedY(y), 
            maxWidth)
    }

    public clearRect(x: number, y: number, width: number, height: number) {
        this.context.clearRect(
            this.convertMarginedX(x), 
            this.convertMarginedY(y), 
            width, 
            height)
    }
}