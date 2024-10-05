import BazTimelineProps from "./baz-timeline-props"


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
    #_name: string = ""
    public get name(): string { return this.#_name }

    public canvas: HTMLCanvasElement
    public context: CanvasRenderingContext2D
    public pixelRatio: number = window.devicePixelRatio || 1
    public timelineProps: BazTimelineProps
    public isNeedRedraw: boolean = true
    public DrawStyles: Record<string, TCanvasDrawStyle> = {}

    public get visibleHours(): number {
        return Math.ceil(this.canvasWidthPx / this.timelineProps.hourWidthPx)
    }

    public get canvasWidthPx(): number {
        return this.canvas.width
    }

    public get canvasHeightPx(): number {
        return this.canvas.height
    }

    public get maxOffsetMs(): number {
        return Math.max(
            this.timelineProps.totalTimeMs - (this.canvasWidthPx * (60 * 60 * 1000)) / this.timelineProps.hourWidthPx,
            0
        )
    }

    constructor(name: string, canvas: HTMLCanvasElement, timelineProps: BazTimelineProps) {
        if (timelineProps == null) throw new Error("timelineProps is null")
        if (name in timelineProps.subscribedLayers) throw new Error(`Layer with name '${name}' already exists`)
        if (canvas == null) throw new Error("canvas is null")
        if (canvas instanceof HTMLCanvasElement == false) throw new Error("canvas is not an instance of HTMLCanvasElement")
        if (canvas.getContext("2d") == null) throw new Error("CanvasRenderingContext2D is null")

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
}