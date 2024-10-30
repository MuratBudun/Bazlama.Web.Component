import TimelineHelper from "./TimelineHelper"
import TimelineRuler from "./TimelineRuler"

export default class TimelineRulerCalculate {
    #owner: TimelineRuler
    public get Owner() { return this.#owner }

    constructor(owner: TimelineRuler) {
        this.#owner = owner
    }

    public get HourWidthPx(): number {
        const hourWidthPx = this.Owner.hourWidthRem * TimelineHelper.RemInPx()
        const result = Math.max(Math.min(hourWidthPx, this.Owner.Constraints.HourMaxWidthPx), this.Owner.Constraints.HourMinWidthPx)
        return result
    }

    public get HourWidthWithZoomPx(): number {
        const hourWidthPx = this.HourWidthPx * this.Owner.zoomFactor
        const result = Math.max(Math.min(hourWidthPx, this.Owner.Constraints.HourMaxWidthPx), this.Owner.Constraints.HourMinWidthPx)
        return result
    }



    public get StartOffsetPx(): number {
        return Math.round(this.Owner.startOffsetMs / (60 * 60 * 1000) * this.HourWidthWithZoomPx)
    }

    public get StartOffsetRem(): number {
        return TimelineHelper.PxToRem(this.StartOffsetPx)
    }

    public get StartOffsetDateTime(): Date {
        return new Date(this.Owner.StartDateTime.getTime() + this.#owner.startOffsetMs)
    }


    public get TotalMs(): number {
        return this.Owner.EndDateTime.getTime() - this.Owner.StartDateTime.getTime()
    }

    public get TotalHours(): number {
        return this.TotalMs / (60 * 60 * 1000)
    }

    public get TotalWidthPx(): number {
        return this.TotalHours * this.HourWidthWithZoomPx
    }

    public get TotalWidthRem(): number {
        return TimelineHelper.PxToRem(this.TotalWidthPx)
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
        return Math.max(Math.min(this.Owner.zoomFactor, this.ZoomFactorMax), this.ZoomFactorMin)
    }
}