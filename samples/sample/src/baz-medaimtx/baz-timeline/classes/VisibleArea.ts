import { TFragmentedTime, TVisibleHours, TVisibleTimeSegments } from "../types/TVisibleHours"
import TimelineRuler from "./TimelineRuler"

export default class VisibleArea {
    #owner: TimelineRuler
    public get Owner() {
        return this.#owner
    }
    public get Calculated() {
        return this.Owner.Calculated
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
                (this.WidthPx / this.Calculated.HourWidthWithZoomPx) * 60 * 60 * 1000
        )
        return result //> this.Owner.EndDateTime ? this.Owner.EndDateTime : result
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

        return lastVisibleHour // > this.LastVisibleDateTime ? undefined : lastVisibleHour
    }

    public get VisibleHourCount(): number {
        const firstVisibleHour = this.FirstVisibleHourDateTime
        if (firstVisibleHour === undefined) return 0

        const visibleHours = Math.floor((this.WidthPx - this.GetStartPxFromDateTime(firstVisibleHour)) / this.Calculated.HourWidthWithZoomPx)  

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
        return Math.round(((ms - this.Owner.StartOffsetMs) / (1000 * 60 * 60)) * this.Calculated.HourWidthWithZoomPx)
    }

    public GetStartPxFromDateTime(dateTime: Date): number {
        return this.GetStartPxFromMs(dateTime.getTime() - this.Owner.StartDateTime.getTime())
    }

    public GetVisibleHours(): TVisibleHours {
        const startDateTime = this.FirstVisibleHourDateTime
        const endDateTime = this.LastVisibleHourDateTime

        if (startDateTime === undefined || endDateTime === undefined) {
            return {
                count: 0,
                startDateTime: undefined,
                endDateTime: undefined,
                startPx: 0,
                endPx: 0,
            }
        }

        const startPx = this.GetStartPxFromDateTime(startDateTime)
        const endPx = this.GetStartPxFromDateTime(endDateTime)

        return {
            count: this.VisibleHourCount,
            startDateTime: startDateTime,
            endDateTime: endDateTime,
            startPx: startPx,
            endPx: endPx,
        }
    }

    public GetVisibleSegments(): TVisibleTimeSegments {
        const visibleHours = this.GetVisibleHours()
        
        let startFragmentedTime: TFragmentedTime = {
            enable: false,
            startDateTime: undefined,
            endDateTime: undefined,
            startPx: 0,
            endPx: 0
        }

        if (this.FirstVisibleHourDateTime && this.FirstVisibleDateTime.getTime() < this.FirstVisibleHourDateTime.getTime()) {
            startFragmentedTime = {
                enable: true,
                startDateTime: this.FirstVisibleDateTime,
                endDateTime: this.FirstVisibleHourDateTime,
                startPx: 0,
                endPx: this.GetStartPxFromDateTime(this.FirstVisibleHourDateTime)
            }
        }

        let endFragmentedTime: TFragmentedTime = {
            enable: false,
            startDateTime: undefined,
            endDateTime: undefined,
            startPx: 0,
            endPx: 0
        }

        if (this.LastVisibleHourDateTime && this.LastVisibleDateTime.getTime() > this.LastVisibleHourDateTime.getTime()) {
            endFragmentedTime = {
                enable: true,
                startDateTime: this.LastVisibleHourDateTime,
                endDateTime: this.LastVisibleDateTime,
                startPx: this.GetStartPxFromDateTime(this.LastVisibleHourDateTime),
                endPx: this.WidthPx
            }
        }

        return {
            startFragmentedTime: startFragmentedTime,
            visibleHours: visibleHours,
            endFragmentedTime: endFragmentedTime
        }
    }

    public GetFragmentedTime(dateTime: Date): TVisibleHours {
        const startDateTime = new Date(dateTime)
        const endDateTime = new Date(dateTime)
        startDateTime.setMinutes(0, 0, 0)
        endDateTime.setMinutes(59, 59, 999)

        const startPx = this.GetStartPxFromDateTime(startDateTime)
        const endPx = this.GetStartPxFromDateTime(endDateTime)

        return {
            count: 1,
            startDateTime: startDateTime,
            endDateTime: endDateTime,
            startPx: startPx,
            endPx: endPx,
        }
    }
}
