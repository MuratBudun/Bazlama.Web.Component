import BazTimelineLayer from "./baz-timeline-layer"
import BazTimelineProps from "./baz-timeline-props"

export default class BazTimelineMainLayer extends BazTimelineLayer {
    public headerHeightRem: number = 2.5
    public get headerHeightPx(): number {
        return BazTimelineLayer.RemToPx(this.headerHeightRem)
    }

    constructor(name: string, canvas: HTMLCanvasElement, timelineProps: BazTimelineProps) {
        super(name, canvas, timelineProps)
        this.addDrawStyle("header-background", "#d9d9d9", "#bbb")
        this.addDrawStyle("hour-text", "#a00", "#f00")
        this.addDrawStyle("hour-line", "#a00", "#f00")
        this.addDrawStyle("half-hour-line", "#0a0", "#0f0")
        this.addDrawStyle("one-sixth-hour-line", "#00a", "#00f")
    }

    public drawFunction(): void {
        // Clear the canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.drawHeader()
        this.drawHours()
    }

    private drawHeader() {
        // Fill the header background
        this.setContextStyle("header-background")
        this.context.fillRect(0, 0, this.canvasWidthPx, this.headerHeightPx)

        // Draw header bottom border
        this.context.beginPath()
        this.context.moveTo(0, this.headerHeightPx)
        this.context.lineTo(this.canvasWidthPx, this.headerHeightPx)
        this.context.stroke()
    }

    private drawHours() {
        for (
            let hourIndex = this.timelineProps.startOffsetHour;
            hourIndex <= this.timelineProps.startOffsetHour + this.visibleHours;
            hourIndex++
        ) {
            const currentHourMs = this.timelineProps.startDateTime.getTime() + hourIndex * 60 * 60 * 1000
            const currentHourDate = new Date(currentHourMs)
            const hourText = currentHourDate.getHours().toString().padStart(2, "0") + ":00"

            // Calculate the position (considering the fractionalHourOffset)
            const positionX = (
                (hourIndex - this.timelineProps.startOffsetHour) * this.timelineProps.hourWidthPx -
                (this.timelineProps.startFractionalHourOffset / (60 * 60 * 1000)) * this.timelineProps.hourWidthPx)

            // Set the colour based on the current hour inside or outside the range
            if (
                currentHourMs < this.timelineProps.startDateTime.getTime() ||
                currentHourMs >= this.timelineProps.endDateTime.getTime()
            ) {
                // Outside the range
                //this.context.strokeStyle = this.tickColourOutsideRange
                //this.context.fillStyle = this.backgroundColourOutsideRange
            } else {
                // Inside the range
                this.setContextStyle("hour-line")
                //this.context.strokeStyle = this.tickColour
                //this.context.fillStyle = this.backgroundColour
            }

            // Draw the hour tick
            this.context.beginPath()
            this.context.moveTo(positionX, 0)
            this.context.lineTo(positionX, this.canvasHeightPx)
            this.context.stroke()

            // Draw the hour text
            this.setContextStyle("hour-text")
            this.context.font = "0.8rem Arial"
            this.context.fillText(hourText, positionX + 8, 20)

            // 1 saatlik dilim içindeki ara çizgiler
            for (let i = 1; i < 6; i++) {
                const subPositionX = positionX + (this.timelineProps.hourWidthPx / 6) * i
                this.context.beginPath()
                if (i === 3) {
                    // 30 minutes line
                    this.setContextStyle("half-hour-line")
                    this.context.moveTo(subPositionX, 15)
                    this.context.lineTo(subPositionX, this.canvasHeightPx)
                } else {
                    // 10 minutes line
                    if (this.timelineProps.hourWidthPx >  (this.timelineProps.minHourWidthPx * 2)) {
                        this.setContextStyle("one-sixth-hour-line")
                        this.context.moveTo(subPositionX, 25)
                        this.context.lineTo(subPositionX, this.canvasHeightPx)
                    }
                }
                this.context.stroke()
            }
        }
    }

    public GetFitZoomFactor(): number {
        const zoomFactor = Math.max(
            this.canvasWidthPx / (this.timelineProps.totalHours * this.timelineProps.hourWidthPx),
            this.timelineProps.minHourWidthPx / this.timelineProps.hourWidthPx
        )

        return zoomFactor
    }
}
