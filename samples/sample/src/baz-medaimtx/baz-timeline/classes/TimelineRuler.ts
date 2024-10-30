import TimelineConstraints from "./TimelineConstraints"
import TimelineRulerCalculate from "./TimelineRulerCalculate"
import { TVisibleHours } from "../types/TVisibleHours"
import TimelineHelper from "./TimelineHelper"
import VisibleArea from "./VisibleArea"

export default class TimelineRuler {
    //#region Fields
    #startDateTime: Date
    public get StartDateTime() { return this.#startDateTime }

    #endDateTime: Date
    public get EndDateTime() { return this.#endDateTime }

    #constraints: TimelineConstraints = new TimelineConstraints(this)
    public get Constraints() { return this.#constraints }

    #calculated: TimelineRulerCalculate = new TimelineRulerCalculate(this)
    public get Calculated() { return this.#calculated }

    #visibleArea: VisibleArea = new VisibleArea(this)
    public get VisibleArea() { return this.#visibleArea }


    #hourWidthRem: number = 10
    public get hourWidthRem() { return this.#hourWidthRem }
    public set hourWidthRem(value: number) { 
        this.#hourWidthRem = value 
        this.UpdateLayerTimes()
    }


    #startOffsetMs: number = 0
    public get startOffsetMs() { return this.#startOffsetMs }
    public set startOffsetMs(value: number) { 
        this.#startOffsetMs = value 
        this.UpdateLayerTimes()
    }


    #zoomFactor: number = 1.0
    public get zoomFactor() { return this.#zoomFactor }
    public set zoomFactor(value: number) { 
        const newZoomFactor = Math.max(Math.min(value, this.GetMaxZoomFactor()), this.GetMinZoomFactor())
        this.#zoomFactor = newZoomFactor 
        this.UpdateLayerTimes()
    }
    //#endregion

    constructor(startDateTime?: Date, endDateTime?: Date) {
        this.#startDateTime = startDateTime || TimelineHelper.GetDefaultStartDateTime()
        this.#endDateTime = endDateTime || TimelineHelper.GetDefaultEndDateTime()

        this.UpdateLayerTimes()
    }

    public SetTimes(startDateTime: Date, endDateTime: Date) {
        this.#startDateTime = startDateTime
        this.#endDateTime = endDateTime

        this.UpdateLayerTimes()
    }

    public SetVisibleSize(widthPx: number, heightPx: number) {
        this.#visibleWidthPx = widthPx
        this.#visibleHeightPx = heightPx

        this.UpdateLayerTimes()
    }

    public GetFirstVisibleHourDateTime(): Date {
        const adjustedDateTime = new Date(this.StartDateTime.getTime() + this.startOffsetMs)

        const firstVisibleHour = new Date(adjustedDateTime)
        firstVisibleHour.setMinutes(0, 0, 0); 
        if (adjustedDateTime.getMinutes() > 0 || adjustedDateTime.getSeconds() > 0 || adjustedDateTime.getMilliseconds() > 0) {
            firstVisibleHour.setHours(firstVisibleHour.getHours() + 1); // Saati bir sonraki tam saate ayarla
        }

        return firstVisibleHour        
    }

    public GetStartPxFromDateTime(dateTime: Date): number {
        return (dateTime.getTime() - this.#startDateTime.getTime()) / (1000 * 60 * 60) * this.GetCalculatedHourWidthPx()
    }


    public GetVisibleHours(): TVisibleHours {
        const firstVisibleHour = this.GetFirstVisibleHourDateTime()
        const lastVisibleHour = new Date(firstVisibleHour.getTime() + this.visibleWidthPx / this.GetCalculatedHourWidthPx() * 60 * 60 * 1000)

        const startPx = this.GetStartPxFromDateTime(firstVisibleHour)
        const endPx = this.GetStartPxFromDateTime(lastVisibleHour)

        return {
            count: Math.ceil(this.visibleWidthPx / this.GetCalculatedHourWidthPx()),
            startDateTime: firstVisibleHour,
            endDateTime: lastVisibleHour,
            startPx: startPx,
            endPx: endPx,
            startAbsolutePx: this.GetStartPxFromDateTime(this.#startDateTime),
            endAbsolutePx: this.GetStartPxFromDateTime(this.#endDateTime)
        }
    }


    //#region Zoom Factor
    public SetZoomFactorFromString(zoomFactorString: string, fireDrawLayers: boolean = true) {
        if (isNaN(parseFloat(zoomFactorString))) {
            this.#zoomFactor = 1.0
        } else {
            const zoomFactor = parseFloat(zoomFactorString)
            this.#zoomFactor = Math.max(Math.min(zoomFactor, this.GetMaxZoomFactor()), this.GetMinZoomFactor())
        }
        if (fireDrawLayers) {
            this.UpdateLayerTimes()
        }
    }    


    public GetFitZoomFactor(): number {
        return Math.max(
            this.GetMinZoomFactor(),
            Math.min(
                this.GetMaxZoomFactor(),
                this.visibleWidthPx / this.GetRulerWidthPx()
            )
        )
    }
    //#endregion

    private UpdateLayerTimes() {
        console.log(`UpdateLayerTimes: ${this.#startDateTime} - ${this.#endDateTime}`)
    }

}