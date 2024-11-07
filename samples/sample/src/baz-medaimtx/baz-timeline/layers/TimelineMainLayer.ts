import TimelineLayer from "./TimelineLayer"
import BazTimeline from "../baz-timeline"

export enum TickLineType {
    Hour = 0,
    HalfHour = 1,
    OneSixthHour = 2,
}

export default class TimelineMainLayer extends TimelineLayer {
    constructor(owner: BazTimeline, name: string, canvas: HTMLCanvasElement) {
        super(owner, name, canvas)
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
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)

        let time = this.Ruler.VisibleArea.FirstVisibleDateTime
        this.drawHour(time)

        while (time.getTime() < this.Ruler.VisibleArea.LastVisibleDateTime.getTime()) {
            time = this.Ruler.Computed.CalculateEndHourDateTimeFromTime(time)
            this.drawHour(time)
        }
    }

    private drawHour(currentDateTime: Date) {
        this.drawHourBackground(currentDateTime)
        this.drawHourLabel(currentDateTime)
        this.drawHourTickLine(currentDateTime)
    }

    private drawHourLabel(time: Date) {
        const startPx = this.VisibleArea.GetStartPxFromDateTime(time) + this.Computed.HourLabelMarginLeftPx
        if (startPx >= this.CanvasWidthPx || startPx < 0) return

        const endDateTime = this.Computed.CalculateEndHourDateTimeFromTime(time)
        let width = this.VisibleArea.GetStartPxFromDateTime(endDateTime)
        width = width - startPx
        if (startPx + width > this.CanvasWidthPx) {
            width = this.CanvasWidthPx - startPx
        }

        const hourText = time.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        })

        const hourTextWidth = Math.round(this.context.measureText(hourText).width)
        if (hourTextWidth * 0.8 > width) return

        this.setContextStyle(`hour-text${this.Computed.IsTimeInRange(time) ? "" : "-outside"}`)
        this.context.font = "0.8rem Arial"
        this.fillText(
            hourText,
            startPx,
            this.Computed.HourLabelMarginTopPx,
            Math.min(
                width - this.Computed.HourLabelMarginLeftPx,
                hourTextWidth + this.Computed.HourLabelMarginLeftPx * 2
            )
        )
    }

    private drawHourTickLine(hourDateTime: Date, tickLineTypes?: TickLineType[]) {
        const tickLineType = tickLineTypes
            ? tickLineTypes
            : [TickLineType.Hour, TickLineType.HalfHour, TickLineType.OneSixthHour]
        const startHourDateTime = this.Computed.CalculateStartHourDateTimeFromTime(hourDateTime)

        tickLineType.forEach((tickLineType) => {
            if (tickLineType === TickLineType.Hour) {
                const startPx = this.VisibleArea.GetStartPxFromDateTime(startHourDateTime)
                const isRange = this.Computed.IsTimeInRange(startHourDateTime)
                this.setContextStyle(`hour-line${isRange ? "" : "-outside"}`)
                this.drawLineVertical(startPx, 0, this.CanvasHeightPx)
            }

            if (tickLineType === TickLineType.HalfHour && this.Computed.HourWidthWithZoomRem > 4) {
                const adjustedDateTime = new Date(startHourDateTime)
                adjustedDateTime.setMinutes(30)
                const startPx = this.VisibleArea.GetStartPxFromDateTime(adjustedDateTime)
                const isRange = this.Computed.IsTimeInRange(adjustedDateTime)
                this.setContextStyle(`half-hour-line${isRange ? "" : "-outside"}`)
                this.drawLineVertical(startPx, Math.floor(this.Computed.HeaderHeightPx / 2), this.CanvasHeightPx)
            }

            if (tickLineType === TickLineType.OneSixthHour && this.Computed.HourWidthWithZoomRem > 6) {
                for (let i = 1; i < 6; i++) {
                    const adjustedDateTime = new Date(startHourDateTime)
                    adjustedDateTime.setMinutes(10 * i)
                    const startPx = this.VisibleArea.GetStartPxFromDateTime(adjustedDateTime)
                    const isRange = this.Computed.IsTimeInRange(adjustedDateTime)
                    this.setContextStyle(`one-sixth-hour-line${isRange ? "" : "-outside"}`)
                    this.drawLineVertical(
                        startPx,
                        Math.floor(this.Computed.HeaderHeightPx / 4) * 3,
                        this.CanvasHeightPx
                    )
                }
            }
        })
    }

    private drawHourBackground(currentDateTime: Date) {
        const inRange = this.Computed.IsTimeInRange(new Date(currentDateTime.setMilliseconds(1)))

        const inRangeEndDateTime = this.Computed.GetEndHourDateTimeFromTime(currentDateTime)
        const calEndDateTime = this.Computed.CalculateEndHourDateTimeFromTime(currentDateTime)

        let endDateTime = inRange ? new Date(inRangeEndDateTime) : new Date(calEndDateTime)

        const startPx = this.VisibleArea.GetStartPxFromDateTime(currentDateTime)
        const endPx = this.VisibleArea.GetStartPxFromDateTime(endDateTime)

        this.drawBackground(inRange, startPx, endPx)

        if (inRange && calEndDateTime.getTime() > inRangeEndDateTime.getTime()) {
            this.drawBackground(
                false,
                this.VisibleArea.GetStartPxFromDateTime(inRangeEndDateTime),
                this.VisibleArea.GetStartPxFromDateTime(calEndDateTime)
            )
        }
    }

    private drawBackground(inRange: boolean, startPx: number, endPx: number) {
        if (startPx >= this.CanvasWidthPx || endPx <= 0) return
        const widthPx = startPx + endPx > this.CanvasWidthPx ? this.CanvasWidthPx - startPx : endPx - startPx

        this.setContextStyle(`header-background${inRange ? "" : "-outside"}`)
        this.fillRect(startPx, 0, widthPx, this.CanvasHeightPx)
        this.drawLineHorizontal(startPx, this.Computed.HeaderHeightPx, widthPx)
    }
}
