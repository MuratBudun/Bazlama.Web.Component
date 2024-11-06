import TimelineHelper from "./TimelineHelper"
import TimelineRuler from "./TimelineRuler"

export default class TimelineRulerComputed {
    #owner: TimelineRuler
    public get Owner() { return this.#owner }
    public get VisibleArea() { return this.Owner.VisibleArea }

    constructor(owner: TimelineRuler) {
        this.#owner = owner
    }

    public get HourWidthPx(): number {
        const hourWidthPx = TimelineHelper.RemToPx(this.Owner.HourWidthRem)
        const result = Math.max(Math.min(hourWidthPx, this.Owner.Constraints.HourMaxWidthPx), this.Owner.Constraints.HourMinWidthPx)
        return Math.ceil(result)
    }

    public get HourWidthWithZoomPx(): number {
        const hourWidthPx = this.HourWidthPx * this.Owner.ZoomFactor
        const result = Math.max(Math.min(hourWidthPx, this.Owner.Constraints.HourMaxWidthPx), this.Owner.Constraints.HourMinWidthPx)
        return Math.ceil(result)
    }

    public get HeaderHeightPx(): number {
        return TimelineHelper.RemToPx(this.Owner.HeaderHeightRem)
    }

    public get HourLabelMarginTopPx(): number {
        return TimelineHelper.RemToPx(this.Owner.HourLabelMarginTopRem)
    }

    public get HourLabelMarginLeftPx(): number {
        return TimelineHelper.RemToPx(this.Owner.HourLabelMarginLeftRem)
    }

    public get HourLabelFontSizePx(): number {
        return TimelineHelper.RemToPx(this.Owner.HourLabelFontSizeRem)
    }


    public get StartOffsetPx(): number {
        return Math.ceil(this.Owner.StartOffsetMs / (60 * 60 * 1000) * this.HourWidthWithZoomPx)
    }

    public get StartOffsetRem(): number {
        return TimelineHelper.PxToRem(this.StartOffsetPx)
    }

    public get StartOffsetDateTime(): Date {
        return new Date(this.Owner.StartDateTime.getTime() + this.#owner.StartOffsetMs)
    }


    public get TotalMs(): number {
        return this.Owner.EndDateTime.getTime() - this.Owner.StartDateTime.getTime()
    }

    public get TotalHours(): number {
        return this.TotalMs / (60 * 60 * 1000)
    }

    public get TotalWidthPx(): number {
        return this.TotalHours * this.HourWidthPx
    }

    public get TotalWidthRem(): number {
        return TimelineHelper.PxToRem(this.TotalWidthPx)
    }

    public get TotalWidthWithZoomPx(): number {
        return this.TotalHours * this.HourWidthWithZoomPx
    }

    public get TotalWidthWithZoomRem(): number {
        return TimelineHelper.PxToRem(this.TotalWidthWithZoomPx)
    }


    public get ZoomFactorMin(): number {
        const minZoomFactor = this.Owner.Constraints.HourMaxWidthPx / this.HourWidthPx
        return Math.min(this.Owner.Constraints.ZoomFactorMin, minZoomFactor)
    }

    public get ZoomFactorMax(): number {
        const maxZoomFactor = this.Owner.Constraints.HourMinWidthPx / this.HourWidthPx
        return Math.max(this.Owner.Constraints.ZoomFactorMax, maxZoomFactor)
    }

    public get ZoomFactor(): number {
        return Math.max(Math.min(this.Owner.ZoomFactor, this.ZoomFactorMax), this.ZoomFactorMin)
    }


    public GetMsFromPx(px: number): number {
        return (px / this.TotalWidthPx) * this.TotalMs
    }

    public GetMsFromPxWithZoom(px: number): number {
        return (px / this.TotalWidthWithZoomPx) * this.TotalMs
    }

    public GetFitZoomFactor(): number {
        return Math.max(
            this.ZoomFactorMin,
            Math.min(
                this.ZoomFactorMax,
                this.VisibleArea.WidthPx / this.TotalWidthPx
            )
        )
    }    

    public IsTimeInRange(dateTime: Date): boolean {
        return dateTime.getTime() >= this.Owner.StartDateTime.getTime() 
            && dateTime.getTime() <= this.Owner.EndDateTime.getTime()
    }

    public GetEndHourDateTimeFromTime(time: Date): Date {
        const adjustedDateTime = new Date(time)
        adjustedDateTime.setMinutes(0, 0, 0)
        adjustedDateTime.setHours(adjustedDateTime.getHours() + 1)

        if (adjustedDateTime.getTime() > this.Owner.EndDateTime.getTime()) {
            return this.Owner.EndDateTime
        }

        return adjustedDateTime
    }

    public CalculateStartHourDateTimeFromTime(time: Date): Date {
        const adjustedDateTime = new Date(time)
        adjustedDateTime.setMinutes(0, 0, 0)

        return adjustedDateTime
    }

    public CalculateEndHourDateTimeFromTime(time: Date): Date {
        const adjustedDateTime = new Date(time)
        adjustedDateTime.setMinutes(0, 0, 0)
        adjustedDateTime.setHours(adjustedDateTime.getHours() + 1)

        return adjustedDateTime
    }
}   