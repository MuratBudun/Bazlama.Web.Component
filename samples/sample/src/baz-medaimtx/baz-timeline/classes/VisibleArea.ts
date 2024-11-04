import { TVisibleHours } from "../types/TVisibleHours"
import TimelineRuler from "./TimelineRuler"

export default class VisibleArea {
    #owner: TimelineRuler
    public get Owner() { return this.#owner }
    public get Calculated() { return this.Owner.Calculated }
    public get Constraints() { return this.Owner.Constraints }

    #widthPx: number = 0
    public get WidthPx() { return this.#widthPx }

    #heightPx: number = 0
    public get HeightPx() { return this.#heightPx }

    constructor(owner: TimelineRuler) {
        this.#owner = owner
    } 
    
    public SetSize(widthPx: number, heightPx: number) {
        this.#widthPx = widthPx
        this.#heightPx = heightPx
    }
 
    public GetFirstVisibleHourDateTime(): Date {
        const adjustedDateTime = new Date(this.Owner.StartDateTime.getTime() + this.Owner.StartOffsetMs)

        const firstVisibleHour = new Date(adjustedDateTime)
        firstVisibleHour.setMinutes(0, 0, 0) 
        if (adjustedDateTime.getMinutes() > 0 || adjustedDateTime.getSeconds() > 0 || adjustedDateTime.getMilliseconds() > 0) {
            firstVisibleHour.setHours(firstVisibleHour.getHours() + 1); // Saati bir sonraki tam saate ayarla
        }

        return firstVisibleHour        
    } 

    public GetLastVisibleHourDateTime(): Date {
        const firstVisibleHour = this.GetFirstVisibleHourDateTime()
        const lastVisibleHour = new Date(firstVisibleHour.getTime() + this.WidthPx 
            / this.Calculated.HourWidthWithZoomPx * 60 * 60 * 1000)

        return lastVisibleHour
    }
    
    public GetStartPxFromDateTime(dateTime: Date): number {
        return (dateTime.getTime() - this.Owner.StartDateTime.getTime()) 
            / (1000 * 60 * 60) * this.Calculated.HourWidthWithZoomPx
    }

    public GetVisibleHours(): TVisibleHours {
        const firstVisibleHour = this.GetFirstVisibleHourDateTime()
        const lastVisibleHour = new Date(firstVisibleHour.getTime() + this.WidthPx 
            / this.Calculated.HourWidthWithZoomPx * 60 * 60 * 1000)

        const startPx = this.GetStartPxFromDateTime(firstVisibleHour)
        const endPx = this.GetStartPxFromDateTime(lastVisibleHour)

        return {
            count: Math.ceil(this.WidthPx / this.Calculated.HourWidthWithZoomPx),
            startDateTime: firstVisibleHour,
            endDateTime: lastVisibleHour,
            startPx: startPx,
            endPx: endPx,
            startAbsolutePx: this.GetStartPxFromDateTime(this.Owner.StartDateTime),
            endAbsolutePx: this.GetStartPxFromDateTime(this.Owner.EndDateTime)
        }
    }    
}