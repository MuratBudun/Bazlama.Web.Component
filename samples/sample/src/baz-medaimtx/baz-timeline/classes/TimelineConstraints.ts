import TimelineRuler from "./TimelineRuler"

export default class TimelineConstraints {
    #owner: TimelineRuler
    public get Owner() { return this.#owner }

    constructor(owner: TimelineRuler) {
        this.#owner = owner
    }

    public HourMinWidthRem: number = 10
    public HourMaxWidthRem: number = 20

    public ZoomFactorMin: number = 0.1
    public ZoomFactorMax: number = 10.0

    public get HourMinWidthPx() { return TimelineRuler.RemToPx(this.HourMinWidthRem) }
    public get HourMaxWidthPx() { return TimelineRuler.RemToPx(this.HourMaxWidthRem) }
}