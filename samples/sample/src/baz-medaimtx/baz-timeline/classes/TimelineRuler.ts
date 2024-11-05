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


    #hourWidthRem: number = 15
    public get HourWidthRem() { return this.#hourWidthRem }
    public set HourWidthRem(value: number) { 
        this.#hourWidthRem = value 

        this.UpdateLayerTimes()
    }


    #startOffsetMs: number = 0
    public get StartOffsetMs() { return this.#startOffsetMs }
    public set StartOffsetMs(value: number) { 
        this.#startOffsetMs = value

        this.UpdateLayerTimes()
    }


    #zoomFactor: number = 1.0
    public get ZoomFactor() { return this.#zoomFactor }
    public set ZoomFactor(value: number) { 
        const newZoomFactor = Math.max(Math.min(value, this.Calculated.ZoomFactorMax), this.Calculated.ZoomFactorMin)
        this.#zoomFactor = newZoomFactor 

        this.UpdateLayerTimes()
    }
    //#endregion

    constructor(startDateTime?: Date, endDateTime?: Date) {
        this.#startDateTime = startDateTime || TimelineHelper.GetDefaultStartDateTime()
        this.#endDateTime = endDateTime || TimelineHelper.GetDefaultEndDateTime()

        this.UpdateLayerTimes()
    }

    public SilentSetValues(startDateTime?: Date, endDateTime?: Date, 
        hourWidthRem?: number, startOffsetMs?: number, zoomFactor?: number) {
        this.#startDateTime = startDateTime || this.#startDateTime
        this.#endDateTime = endDateTime || this.#endDateTime
        this.#hourWidthRem = hourWidthRem || this.#hourWidthRem
        this.#startOffsetMs = startOffsetMs || this.#startOffsetMs
        this.#zoomFactor = zoomFactor || this.#zoomFactor
    }

    public SetTimes(startDateTime: Date, endDateTime: Date) {
        this.#startDateTime = startDateTime
        this.#endDateTime = endDateTime

        this.UpdateLayerTimes()
    }

    public SetVisibleSize(widthPx: number, heightPx: number) {
        this.VisibleArea.SetSize(widthPx, heightPx)

        this.UpdateLayerTimes()
    }

    public UpdateLayerTimes() {
        console.log(`UpdateLayerTimes: ${this.#startDateTime} - ${this.#endDateTime}`)
    }
}