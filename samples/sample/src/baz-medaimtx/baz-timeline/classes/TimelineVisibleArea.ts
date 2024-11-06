import TimelineRuler from "./TimelineRuler"

export default class TimelineVisibleArea {
    #owner: TimelineRuler
    public get Owner() {
        return this.#owner
    }
    public get Computed() {
        return this.Owner.Computed
    }
    public get Constraints() {
        return this.Owner.Constraints
    }

    #widthPx: number = 0
    public get WidthPx() {
        return this.#widthPx
    }

    #heightPx: number = 0
    public get HeightPx() {
        return this.#heightPx
    }

    public get FirstVisibleDateTime(): Date {
        const result = new Date(this.Owner.StartDateTime.getTime() + this.Owner.StartOffsetMs)
        return result > this.Owner.EndDateTime ? this.Owner.EndDateTime : result
    }

    public get LastVisibleDateTime(): Date {
        const result = new Date(
            this.Owner.StartDateTime.getTime() +
                this.Owner.StartOffsetMs +
                (this.WidthPx / this.Computed.HourWidthWithZoomPx) * 60 * 60 * 1000
        )
        return result
    }

    public get FirstVisibleHourDateTime(): Date | undefined {
        const adjustedDateTime = this.FirstVisibleDateTime
        const firstVisibleHour = new Date(adjustedDateTime)

        firstVisibleHour.setMinutes(0, 0, 0)
        if (
            adjustedDateTime.getMinutes() > 0 ||
            adjustedDateTime.getSeconds() > 0 ||
            adjustedDateTime.getMilliseconds() > 0
        ) {
            firstVisibleHour.setHours(firstVisibleHour.getHours() + 1)
        }

        return firstVisibleHour > this.LastVisibleDateTime ? undefined : firstVisibleHour
    }

    public get LastVisibleHourDateTime(): Date | undefined {
        const firstVisibleHour = this.FirstVisibleHourDateTime
        if (firstVisibleHour === undefined) return undefined

        const lastVisibleHour = new Date(firstVisibleHour.getTime() + this.VisibleHourCount * 60 * 60 * 1000)

        return lastVisibleHour
    }

    public get VisibleHourCount(): number {
        const firstVisibleHour = this.FirstVisibleHourDateTime
        if (firstVisibleHour === undefined) return 0

        const visibleHours = Math.floor((this.WidthPx - this.GetStartPxFromDateTime(firstVisibleHour)) / this.Computed.HourWidthWithZoomPx)  

        return visibleHours
    }

    constructor(owner: TimelineRuler) {
        this.#owner = owner
    }

    public SetSize(widthPx: number, heightPx: number) {
        this.#widthPx = widthPx
        this.#heightPx = heightPx
    }

    public GetStartPxFromMs(ms: number): number {
        return Math.round(((ms - this.Owner.StartOffsetMs) / (1000 * 60 * 60)) * this.Computed.HourWidthWithZoomPx)
    }

    public GetStartPxFromDateTime(dateTime: Date): number {
        return this.GetStartPxFromMs(dateTime.getTime() - this.Owner.StartDateTime.getTime())
    }
}