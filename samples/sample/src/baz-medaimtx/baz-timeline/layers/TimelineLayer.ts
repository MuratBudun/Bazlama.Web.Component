import BazTimeline from "../baz-timeline"
import TimelineConstraints from "../classes/TimelineConstraints"
import TimelineHelper from "../classes/TimelineHelper"
import TimelineRuler from "../classes/TimelineRuler"
import TimelineRulerComputed from "../classes/TimelineRulerComputed"
import TimelineVisibleArea from "../classes/TimelineVisibleArea"


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

export default abstract class TimelineLayer {
    #owner: BazTimeline
    public get Owner() { return this.#owner }   

    #ruler: TimelineRuler
    public get Ruler() { return this.#ruler }

    #computed: TimelineRulerComputed
    public get Computed() { return this.#computed }

    #constraints: TimelineConstraints
    public get Constraints() { return this.#constraints }

    #visibleArea: TimelineVisibleArea
    public get VisibleArea() { return this.#visibleArea }

    #name: string = ""
    public get Name(): string { return this.#name }

    public canvas: HTMLCanvasElement
    public context: CanvasRenderingContext2D

    public topMarginPx: number = 4
    public leftMarginPx: number = 4

    public isNeedRedraw: boolean = true
    public drawStyles: Record<string, TCanvasDrawStyle> = {}

    public get CanvasWidthPx(): number {
        return this.canvas.width - (this.leftMarginPx * 2)
    }

    public get CanvasHeightPx(): number {
        return this.canvas.height - (this.topMarginPx * 2)
    }

    constructor(owner: BazTimeline, name: string, canvas: HTMLCanvasElement) {
        if (owner == null) throw new Error("owner is null")
        if (canvas == null) throw new Error("canvas is null")
        if (canvas instanceof HTMLCanvasElement == false) throw new Error("canvas is not an instance of HTMLCanvasElement")
        if (canvas.getContext("2d") == null) throw new Error("CanvasRenderingContext2D is null")

        this.#owner = owner
        this.#ruler = owner.Ruler
        this.#computed = owner.Ruler.Computed
        this.#constraints = owner.Ruler.Constraints
        this.#visibleArea = owner.Ruler.VisibleArea

        this.canvas = canvas
        this.context = this.canvas.getContext("2d") || new CanvasRenderingContext2D()
    }

    public addDrawStyle(name: string, fillStyle: string, strokeStyle: string, cssVariableNames?: TCanvasDrawStyleCssVariableNames) {
        let newCssVariableNames = cssVariableNames || {
            fillStyle: `--${name}-fill-style`,
            strokeStyle: `--${name}-stroke-style`
        }
        this.drawStyles[name] = { name, fillStyle, strokeStyle, cssVariableNames: newCssVariableNames }
    }

    public getDrawStyle(name: string): TCanvasDrawStyle | undefined {
        if (name in this.drawStyles) {
            return this.drawStyles[name]
        } 
        return undefined
    }

    public computeDrawStyles() {
        for (const drawStyleName in this.drawStyles) {
            const drawStyle = this.drawStyles[drawStyleName]
            const fillStyle = getComputedStyle(this.Owner).getPropertyValue(drawStyle.cssVariableNames.fillStyle)
            const strokeStyle = getComputedStyle(this.Owner).getPropertyValue(drawStyle.cssVariableNames.strokeStyle)
            
            if (fillStyle && fillStyle !== "") drawStyle.fillStyle = fillStyle
            if (strokeStyle && strokeStyle !== "") drawStyle.strokeStyle = strokeStyle
        }
    }

    public setContextStyle(styleName: string) {
        const style = this.getDrawStyle(styleName)

        if (style) {
            this.context.fillStyle = style.fillStyle
            this.context.strokeStyle = style.strokeStyle
        }
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
        const pixelRatio = TimelineHelper.PixelRatio
        
        this.canvas.style.width = width + "px"
        this.canvas.style.height = height + "px"
        this.canvas.width = width 
        this.canvas.height = height 

        // this.context.scale(pixelRatio, pixelRatio)

        // this.canvas.width = width 
        // this.canvas.height = height 
        // this.canvas.style.width = width + "px"
        // this.canvas.style.height = height + "px"

        console.log(`Canvas ${this.Name} resized to ${width}x${height} | ${this.canvas.width}x${this.canvas.height} | ${pixelRatio}x`)
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
        if (x > this.CanvasWidthPx || x < 0) return
        if (y > this.CanvasHeightPx || y < 0) return

        this.context.beginPath()
        this.context.moveTo(this.convertMarginedX(x), 
            this.convertMarginedY(y))
        this.context.lineTo(this.convertMarginedX(x), 
            this.convertMarginedY(Math.min(y + height, this.CanvasHeightPx)))
        this.context.stroke()
        this.context.closePath()
    }

    public drawLineHorizontal(x: number, y: number, width: number) {
        if (x > this.CanvasWidthPx || x < 0) return
        if (y > this.CanvasHeightPx || y < 0) return
        this.context.beginPath()
        this.context.moveTo(this.convertMarginedX(x), this.convertMarginedY(y))
        this.context.lineTo(this.convertMarginedX(Math.min(x + width, this.CanvasWidthPx)), 
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