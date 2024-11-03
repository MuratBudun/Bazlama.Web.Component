import { start } from "repl"
import BazTimelineLayer from "./baz-timeline-layer"
import BazTimelineProps from "./baz-timeline-props"
import BazTimeline from "./baz-timeline"

export default class BazTimelineMainLayer extends BazTimelineLayer {
    public headerHeightRem: number = 2.5
    public get headerHeightPx(): number {
        return BazTimelineLayer.RemToPx(this.headerHeightRem)
    }

    constructor(owner: BazTimeline, name: string, canvas: HTMLCanvasElement, timelineProps: BazTimelineProps) {
        super(owner, name, canvas, timelineProps)
        this.addDrawStyle("header-background", "#d9d9d9", "#bbb")
        this.addDrawStyle("header-background-outside", "#d9d9d9", "#bbb")

        this.addDrawStyle("hour-text", "#a00", "#f00")
        this.addDrawStyle("hour-text-outside", "#a00", "#f00")

        this.addDrawStyle("hour-line", "#a00", "#f00")
        this.addDrawStyle("hour-line-outside", "#a00", "#f00")

        this.addDrawStyle("half-hour-line", "#0a0", "#0f0")
        this.addDrawStyle("half-hour-line-outside", "#0a0", "#0f0")

        this.addDrawStyle("one-sixth-hour-line", "#00a", "#00f")
        this.addDrawStyle("one-sixth-hour-line-outside", "#00a", "#00f")
    }

    public drawFunction(): void {
        // Clear the canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
        //this.drawHeader()
        this.drawHours()

        /*
        this.setContextStyle(`hour-line`)
        this.context.beginPath()
        this.context.moveTo(0, 0)
        this.context.lineTo(0, this.canvasHeightPx)
        this.context.stroke()

        const startDateMs = this.timelineProps.startDateTime.getTime()
        const currentHourDate = new Date(startDateMs + this.timelineProps.startOffsetMs)
        const hourText = currentHourDate.toLocaleString()  // currentHourDate.getHours().toString().padStart(2, "0") + ":" + this.timelineProps.startDateTime.getMinutes().toString().padStart(2, "0")

        this.setContextStyle(`hour-text`)
        this.context.font = "0.8rem Arial"
        this.context.fillText(hourText, 8, 20)        
        */

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

    private drawHours2() {
        
    }

    private drawHours() {
        for (
            let hourIndex = this.timelineProps.startOffsetHour;
            hourIndex <= this.timelineProps.startOffsetHour + this.visibleHours;
            hourIndex++
        ) {
            const currentHourMs = 
                (this.timelineProps.startDateTime.getTime() - this.timelineProps.startOutsideHours * 60 * 60 * 1000) +
                hourIndex * 60 * 60 * 1000
            const currentHourDate = new Date(currentHourMs)
            const hourText = currentHourDate.getHours().toString().padStart(2, "0") + ":00"

            // Calculate the position (considering the fractionalHourOffset)
            const positionX = (
                (hourIndex - this.timelineProps.startOffsetHour) * this.timelineProps.hourWidthPx -
                (this.timelineProps.startFractionalHourOffset / (60 * 60 * 1000)) * this.timelineProps.hourWidthPx)

            // Set the colour based on the current hour inside or outside the range
            const isOutsideRange = (
                currentHourMs < this.timelineProps.startDateTime.getTime() ||
                currentHourMs >= this.timelineProps.endDateTime.getTime()
            )

            if (isOutsideRange) {
                this.setContextStyle("header-background-outside")
                this.context.fillRect(positionX, 0, positionX + this.timelineProps.hourWidthPx, this.canvasHeightPx)
            }    

            // Draw the hour tick
            this.setContextStyle(`hour-line${isOutsideRange ? "-outside" : ""}`)
            this.context.beginPath()
            this.context.moveTo(positionX, 0)
            this.context.lineTo(positionX, this.canvasHeightPx)
            this.context.stroke()

            // Draw the hour text
            this.setContextStyle(`hour-text${isOutsideRange ? "-outside" : ""}`)
            this.context.font = "0.8rem Arial"
            this.context.fillText(hourText, positionX + 8, 20)

            // 1 saatlik dilim içindeki ara çizgiler
            for (let i = 1; i < 6; i++) {
                const subPositionX = positionX + (this.timelineProps.hourWidthPx / 6) * i
                this.context.beginPath()
                if (i === 3) {
                    // 30 minutes line
                    this.setContextStyle(`half-hour-line${isOutsideRange ? "-outside" : ""}`)
                    this.context.moveTo(subPositionX, 15)
                    this.context.lineTo(subPositionX, this.canvasHeightPx)
                } else {
                    // 10 minutes line
                    if (this.timelineProps.hourWidthPx >  (this.timelineProps.minHourWidthPx * 2)) {
                        this.setContextStyle(`one-sixth-hour-line${isOutsideRange ? "-outside" : ""}`)
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
