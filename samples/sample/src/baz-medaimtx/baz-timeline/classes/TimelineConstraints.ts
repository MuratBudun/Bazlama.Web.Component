import TimelineHelper from "./TimelineHelper"
import TimelineRuler from "./TimelineRuler"

export default class TimelineConstraints {
    #owner: TimelineRuler
    public get Owner() { return this.#owner }

    constructor(owner: TimelineRuler) {
        this.#owner = owner
    }

    public HourMinWidthRem: number = 2.5
    public HourMaxWidthRem: number = 2000

    public ZoomFactorMin: number = 0.01
    public ZoomFactorMax: number = 4000.0

    public get HourMinWidthPx() { return TimelineHelper.RemToPx(this.HourMinWidthRem) }
    public get HourMaxWidthPx() { return TimelineHelper.RemToPx(this.HourMaxWidthRem) }
}