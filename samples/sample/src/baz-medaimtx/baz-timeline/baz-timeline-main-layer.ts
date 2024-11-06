import { start } from "repl"
import BazTimelineLayer from "./baz-timeline-layer"
import BazTimelineProps from "./baz-timeline-props"
import BazTimeline from "./baz-timeline"
import TimelineHelper from "./classes/TimelineHelper"

enum TickLineType {
    Hour = 0,
    HalfHour = 1,
    OneSixthHour = 2,
}

export default class BazTimelineMainLayer extends BazTimelineLayer {
    public headerHeightRem: number = 2.5
    public get headerHeightPx(): number {
        return BazTimelineLayer.RemToPx(this.headerHeightRem)
    }

    public hourLabelMarginTopRem: number = 1
    public get hourLabelMarginTopPx(): number {
        return BazTimelineLayer.RemToPx(this.hourLabelMarginTopRem)
    }

    public hourLabelMarginLeftRem: number = 0.5
    public get hourLabelMarginLeftPx(): number {
        return BazTimelineLayer.RemToPx(this.hourLabelMarginLeftRem)
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

        //this.context.fillStyle = "#f0f0f0"
        //this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
        //this.setContextStyle("header-background")
        //this.context.fillRect(0, 0, this.canvasWidthPx, this.headerHeightPx)

        //this.headerHeightRem = 2.5

        //this.drawHeader()
        //this.drawHours()

        const visibleParts = this.Owner.Ruler.VisibleArea.GetVisibleSegments()

        if (visibleParts.startFragmentedTime.enable && visibleParts.startFragmentedTime.startDateTime) {
            this.drawHour(visibleParts.startFragmentedTime.startDateTime)
            /*
            const startPx = visibleParts.startFragmentedTime.startPx * this.pixelRatio
            const endPx = visibleParts.startFragmentedTime.endPx * this.pixelRatio

            this.context.fillStyle = "#ff110066"
            this.context.fillRect(startPx, 100, endPx - startPx, this.canvas.height)

            this.setContextStyle(`hour-text`)
            const hourText =
                visibleParts.startFragmentedTime.startDateTime?.getHours().toString().padStart(2, "0") +
                ":" +
                visibleParts.startFragmentedTime.startDateTime?.getMinutes().toString().padStart(2, "0")
            this.context.font = "0.8rem Arial"
            this.context.fillText(hourText, startPx + 5, 120)
            */
        }

        /*
        this.context.fillStyle = "#ff1100bb"
        this.context.fillRect(
            visibleParts.visibleHours.startPx * this.pixelRatio, 100, 
            (visibleParts.visibleHours.endPx - visibleParts.visibleHours.startPx) * this.pixelRatio, 
            this.canvas.height)        
        */
        //this.headerHeightRem = 5

        if (visibleParts.visibleHours.count === 0 || !visibleParts.visibleHours.startDateTime) return
        for (let i = 0; i < visibleParts.visibleHours.count; i++) {
            const currentDateTime = new Date(visibleParts.visibleHours.startDateTime.getTime() + i * 60 * 60 * 1000)
            this.drawHour(currentDateTime)
            /*
            const startPx = (visibleParts.visibleHours.startPx + i * this.Owner.Ruler.Calculated.HourWidthWithZoomPx)
                * this.pixelRatio

            this.drawHourLabel(startPx + 4, 120, this.Owner.Ruler.Calculated.HourWidthWithZoomPx, currentDateTime)
            this.drawTickLine(startPx, 100, this.canvas.height, "hour-line")
            */
        }

        if (visibleParts.endFragmentedTime.enable && visibleParts.endFragmentedTime.startDateTime) {
            this.drawHour(visibleParts.endFragmentedTime.startDateTime)
            /*
            const startPx = visibleParts.endFragmentedTime.startPx * this.pixelRatio
            const endPx = visibleParts.endFragmentedTime.endPx * this.pixelRatio

            this.context.fillStyle = "#ff110066"
            this.context.fillRect(startPx, 100, endPx - startPx, this.canvas.height)

            this.setContextStyle(`hour-text`)
            const hourText =
                visibleParts.endFragmentedTime.startDateTime?.getHours().toString().padStart(2, "0") +
                ":" +
                visibleParts.endFragmentedTime.startDateTime?.getMinutes().toString().padStart(2, "0")
            this.context.font = "0.8rem Arial"
            this.context.fillText(hourText, startPx + 5, 120)
            */
        }

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

    private drawHourLabel(time: Date) {
        const startPx = this.VisibleArea.GetStartPxFromDateTime(time) + this.hourLabelMarginLeftPx
        if (startPx >= this.canvasWidthPx || startPx < 0) return

        const endDateTime = this.Calculated.CalculateEndHourDateTimeFromTime(time)
        let width = this.VisibleArea.GetStartPxFromDateTime(endDateTime)
        console.log(`width = (${width}) - ${startPx} [${time} - ${endDateTime}]`)
        width = width - startPx
        if (startPx + width > this.canvasWidthPx) {
            width = this.canvasWidthPx - startPx
        }

        const hourText = time.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        })

        this.setContextStyle(`hour-text${this.Calculated.IsTimeInRange(time) ? "" : "-outside"}`)
        this.context.font = "0.8rem Arial"

        const hourTextWidth =  Math.round(this.context.measureText(hourText).width) 
        console.log(`hourTextWidth = (${hourText}) - ${hourTextWidth}  - ${hourTextWidth * 0.95} - ${width} - canvasWidthPx: ${this.canvasWidthPx}`)

        //console.log(`drawHourLabel: ${hourText} => ${startPx}px - ${time}`)
        if (hourTextWidth * 0.8 > width) {
            console.log(`drawHourLabel: Exit ${hourText} => ${startPx}px - ${time} - ${hourTextWidth} - (${width})`)
            return
        } 

        this.fillText(hourText, startPx, this.hourLabelMarginTopPx, 
            Math.min(width - this.hourLabelMarginLeftPx, hourTextWidth + this.hourLabelMarginLeftPx * 2))
    }

    private _drawHourLabel(x: number, width: number, time: Date, isRange: boolean) {
        const hourText = time.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        })
        const hourLeftPx = (x + this.hourLabelMarginLeftPx)
        const hourTopPx = this.hourLabelMarginTopPx

        this.setContextStyle(`hour-text${isRange ? "" : "-outside"}`)
        this.context.font = "0.8rem Arial"

        const hourTextWidth = this.context.measureText(hourText)
        if (hourTextWidth.width > width) return

        this.fillText(hourText, hourLeftPx, hourTopPx, width - this.hourLabelMarginLeftPx * 2)
    }

    private drawHourTickLine(hourDateTime: Date, tickLineTypes?: TickLineType[]) {
        const tickLineType = tickLineTypes
            ? tickLineTypes
            : [TickLineType.Hour, TickLineType.HalfHour, TickLineType.OneSixthHour]
        const startHourDateTime = this.Calculated.CalculateStartHourDateTimeFromTime(hourDateTime)

        tickLineType.forEach((tickLineType) => {
            if (tickLineType === TickLineType.Hour) {
                const startPx = this.VisibleArea.GetStartPxFromDateTime(startHourDateTime)
                const isRange = this.Calculated.IsTimeInRange(startHourDateTime)
                this.setContextStyle(`hour-line${isRange ? "" : "-outside"}`)
                this.drawLineVertical(startPx, 0, this.canvasHeightPx)
            }

            if (tickLineType === TickLineType.HalfHour) {
                const adjustedDateTime = new Date(startHourDateTime)
                adjustedDateTime.setMinutes(30)
                const startPx = this.VisibleArea.GetStartPxFromDateTime(adjustedDateTime)
                const isRange = this.Calculated.IsTimeInRange(adjustedDateTime)
                this.setContextStyle(`half-hour-line${isRange ? "" : "-outside"}`)
                this.drawLineVertical(startPx, Math.floor(this.headerHeightPx / 2), this.canvasHeightPx)
            }

            if (tickLineType === TickLineType.OneSixthHour) {
                for (let i = 1; i < 6; i++) {
                    const adjustedDateTime = new Date(startHourDateTime)
                    adjustedDateTime.setMinutes(10 * i)
                    const startPx = this.VisibleArea.GetStartPxFromDateTime(adjustedDateTime)
                    const isRange = this.Calculated.IsTimeInRange(adjustedDateTime)
                    this.setContextStyle(`one-sixth-hour-line${isRange ? "" : "-outside"}`)
                    this.drawLineVertical(startPx, Math.floor(this.headerHeightPx / 4) * 3, this.canvasHeightPx)
                }
            }
        })
    }

    private drawHour(currentDateTime: Date) {
        const inRangeEndDateTime = this.Calculated.GetEndHourDateTimeFromTime(currentDateTime)
        const calEndDateTime = this.Calculated.CalculateEndHourDateTimeFromTime(currentDateTime)

        const inRange = TimelineHelper.IsTwoDateSame(inRangeEndDateTime, calEndDateTime)
        const endDateTime = inRange ? new Date(inRangeEndDateTime) : new Date(calEndDateTime)

        const startPx = this.VisibleArea.GetStartPxFromDateTime(currentDateTime)
        const endPx = this.VisibleArea.GetStartPxFromDateTime(endDateTime)

        const widthPx = endPx - startPx

        // this.setContextStyle(`header-background${inRange ? "" : "-outside"}`)
        // this.context.fillRect(startPx, 0, widthPx, this.canvasHeightPx)
        // this.drawLineHorizontal(startPx, this.headerHeightPx, widthPx)

        this.getDrawStyle(`header-background${inRange ? "" : "-outside"}`)
        this.drawHourBackground(currentDateTime)

        //this._drawHourLabel(startPx, this.Owner.Ruler.Calculated.HourWidthWithZoomPx, currentDateTime, inRange)
        this.drawHourLabel(currentDateTime)

        this.drawHourTickLine(currentDateTime)
    }

    private drawHourBackground(currentDateTime: Date) {
        //const startHourDateTime = this.Calculated.CalculateStartHourDateTimeFromTime(currentDateTime)
        const inRange = this.Calculated.IsTimeInRange(new Date(currentDateTime.setMilliseconds(1)))

        const inRangeEndDateTime = this.Calculated.GetEndHourDateTimeFromTime(currentDateTime)
        const calEndDateTime = this.Calculated.CalculateEndHourDateTimeFromTime(currentDateTime)

        let endDateTime = inRange ? new Date(inRangeEndDateTime) : new Date(calEndDateTime)

        const startPx = this.VisibleArea.GetStartPxFromDateTime(currentDateTime)
        const endPx = this.VisibleArea.GetStartPxFromDateTime(endDateTime)

        this.drawBackground(inRange, startPx, endPx)

        /*
        const widthPx = endPx - startPx


        this.setContextStyle(`header-background${inRange ? "" : "-outside"}`)
        this.fillRect(startPx, 0, widthPx, this.canvasHeightPx)
        this.drawLineHorizontal(startPx, this.headerHeightPx, widthPx)
        */

        if (inRange && calEndDateTime.getTime() > inRangeEndDateTime.getTime()) {
            this.drawBackground(false, 
                this.VisibleArea.GetStartPxFromDateTime(inRangeEndDateTime),
                this.VisibleArea.GetStartPxFromDateTime(calEndDateTime)
            )

            /*                
            this.setContextStyle(`header-background-outside`)
            this.context.fillStyle = "#ff0000"
            this.fillRect(endPx, 0, hourEndPx - endPx, this.canvasHeightPx)
            this.drawLineHorizontal(endPx, this.headerHeightPx, hourEndPx - endPx)
            */
        }
    }

    private drawBackground(inRange: boolean, startPx: number, endPx: number, isDebug = false) {
        if (startPx >= this.canvasWidthPx || endPx <= 0) return
        const widthPx = startPx + endPx > this.canvasWidthPx ? 
            this.canvasWidthPx - startPx : endPx - startPx

        this.setContextStyle(`header-background${inRange ? "" : "-outside"}`)
        if (isDebug) { 
            console.log(`drawBackground: ${inRange ? "YES" : "NO"} => ${startPx}px - ${endPx}px`)
            this.context.fillStyle = "#00ff33aa"
        }
        this.fillRect(startPx, 0, widthPx, this.canvasHeightPx)
        this.drawLineHorizontal(startPx, this.headerHeightPx, widthPx)
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
            const currentHourMs =
                this.timelineProps.startDateTime.getTime() -
                this.timelineProps.startOutsideHours * 60 * 60 * 1000 +
                hourIndex * 60 * 60 * 1000
            const currentHourDate = new Date(currentHourMs)
            const hourText = currentHourDate.getHours().toString().padStart(2, "0") + ":00"

            // Calculate the position (considering the fractionalHourOffset)
            const positionX =
                (hourIndex - this.timelineProps.startOffsetHour) * this.timelineProps.hourWidthPx -
                (this.timelineProps.startFractionalHourOffset / (60 * 60 * 1000)) * this.timelineProps.hourWidthPx

            // Set the colour based on the current hour inside or outside the range
            const isOutsideRange =
                currentHourMs < this.timelineProps.startDateTime.getTime() ||
                currentHourMs >= this.timelineProps.endDateTime.getTime()

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
                    if (this.timelineProps.hourWidthPx > this.timelineProps.minHourWidthPx * 2) {
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
