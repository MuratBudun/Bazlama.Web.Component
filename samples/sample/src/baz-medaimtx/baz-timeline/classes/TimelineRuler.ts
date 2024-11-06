import TimelineConstraints from "./TimelineConstraints"
import TimelineRulerComputed from "./TimelineRulerComputed"
import TimelineHelper from "./TimelineHelper"
import TimelineVisibleArea from "./TimelineVisibleArea"
import BazTimeline from "../baz-timeline"

export default class TimelineRuler {
    #owner: BazTimeline
    public get Owner() { return this.#owner }

    //#region Fields
    #startDateTime: Date
    public get StartDateTime() { return this.#startDateTime }

    #endDateTime: Date
    public get EndDateTime() { return this.#endDateTime }

    #constraints: TimelineConstraints = new TimelineConstraints(this)
    public get Constraints() { return this.#constraints }

    #computed: TimelineRulerComputed = new TimelineRulerComputed(this)
    public get Computed() { return this.#computed }

    #visibleArea: TimelineVisibleArea = new TimelineVisibleArea(this)
    public get VisibleArea() { return this.#visibleArea }


    #hourWidthRem: number = 15
    public get HourWidthRem() { return this.#hourWidthRem }
    public set HourWidthRem(value: number) { 
        this.#hourWidthRem = value 

        this.fireDrawLayers()
    }

    
    #headerHeightRem: number = 2.5
    public get HeaderHeightRem() { return this.#headerHeightRem }
    public set HeaderHeightRem(value: number) { 
        this.#headerHeightRem = value 

        this.fireDrawLayers()
    }

    #hourLabelMarginTopRem: number = 1
    public get HourLabelMarginTopRem() { return this.#hourLabelMarginTopRem }
    public set HourLabelMarginTopRem(value: number) { 
        this.#hourLabelMarginTopRem = value 

        this.fireDrawLayers()
    }

    #hourLabelMarginLeftRem: number = 0.5
    public get HourLabelMarginLeftRem() { return this.#hourLabelMarginLeftRem }
    public set HourLabelMarginLeftRem(value: number) { 
        this.#hourLabelMarginLeftRem = value 

        this.fireDrawLayers()
    }

    #hourLabelFontSizeRem: number = 0.8
    public get HourLabelFontSizeRem() { return this.#hourLabelFontSizeRem }
    public set HourLabelFontSizeRem(value: number) { 
        this.#hourLabelFontSizeRem = value 

        this.fireDrawLayers()
    }


    #startOffsetMs: number = 0
    public get StartOffsetMs() { return this.#startOffsetMs }
    public set StartOffsetMs(value: number) { 
        this.#startOffsetMs = value

        this.fireDrawLayers()
    }


    #zoomFactor: number = 1.0
    public get ZoomFactor() { return this.#zoomFactor }
    public set ZoomFactor(value: number) { 
        const newZoomFactor = Math.max(Math.min(value, this.Computed.ZoomFactorMax), this.Computed.ZoomFactorMin)
        this.#zoomFactor = newZoomFactor 

        this.fireDrawLayers()
    }
    //#endregion

    constructor(owner: BazTimeline, startDateTime?: Date, endDateTime?: Date) {
        this.#owner = owner
        this.#startDateTime = startDateTime || TimelineHelper.GetDefaultStartDateTime()
        this.#endDateTime = endDateTime || TimelineHelper.GetDefaultEndDateTime()
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

        this.fireDrawLayers()
    }

    public SetVisibleSize(widthPx: number, heightPx: number) {
        this.VisibleArea.SetSize(widthPx, heightPx)

        this.fireDrawLayers()
    }


    public SetStartDateTimeFromString(dateTimeString: string, fireDrawLayers: boolean = true) {
        this.#startDateTime = new Date(dateTimeString)
        if (fireDrawLayers) {
            this.fireDrawLayers()
        }
    }

    public SetEndDateTimeFromString(dateTimeString: string, fireDrawLayers: boolean = true) {
        this.#endDateTime = new Date(dateTimeString)
        if (fireDrawLayers) {
            this.fireDrawLayers()
        }
    }

    public SetZoomFactorFromString(zoomFactorString: string, fireDrawLayers: boolean = true) {
        if (isNaN(parseFloat(zoomFactorString))) {
            this.#zoomFactor = 1.0
        } else {
            const zoomFactor = parseFloat(zoomFactorString)
            this.#zoomFactor = Math.max(Math.min(zoomFactor, this.Computed.ZoomFactorMax), this.Computed.ZoomFactorMin)
        }

        if (fireDrawLayers) {
            this.fireDrawLayers()
        }
    }  

    public SetStartOffsetMsFromString(startOffsetMsString: string, fireDrawLayers: boolean = true) {
        if (isNaN(parseFloat(startOffsetMsString))) {
            this.#startOffsetMs = 0
        } else {
            this.#startOffsetMs = parseFloat(startOffsetMsString)
        }

        if (fireDrawLayers) {
            this.fireDrawLayers()
        }
    }

    public fireDrawLayers() {
        this.Owner.LayerManager.postDrawMessage()
    }
}