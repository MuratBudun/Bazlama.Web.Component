import TimelineLayer from "./layers/TimelineLayer"

export type TSubscribedLayer = Record<string, TimelineLayer>

export default class BazTimelineProps {
    #defaultStartDateTime: Date
    #defaultEndDateTime: Date

    public startOutsideHours: number = 0
    public startDateTime: Date = new Date()
    
    public endOutsideHours: number = 0
    public endDateTime: Date = new Date()

    public hourWidthRem: number = 15
    public minHourWidthRem: number = 5
    public zoomFactor: number = 1.0
    public startOffsetMs: number = 0
    public subscribedLayers: TSubscribedLayer = {}

    public fireDrawLayers() {
        for (const layer in this.subscribedLayers) {
            this.subscribedLayers[layer].isNeedRedraw = true
        }
    }

    public drawLayers(isForceRedraw: boolean = false) {
        for (const layer in this.subscribedLayers) {
            this.subscribedLayers[layer].draw(isForceRedraw)
        }
    }

    public setLayersSize(width: number, height: number) {
        for (const layer in this.subscribedLayers) {
            this.subscribedLayers[layer].setSize(width, height)
        }
    }

    public get startOffsetHour(): number {
        return Math.floor(this.startOffsetMs / (60 * 60 * 1000))
    }

    public get startFractionalHourOffset(): number {
        return this.startOffsetMs % (60 * 60 * 1000)
    }

    public get totalTimeMs(): number {
        return (this.endDateTime.getTime() - this.startDateTime.getTime()) +
            this.startOutsideHours * 60 * 60 * 1000 +
            this.endOutsideHours * 60 * 60 * 1000
    }

    public get totalHours(): number {
        return Math.ceil(this.totalTimeMs / (60 * 60 * 1000))
    }

    public get minHourWidthPx(): number {
        return this.minHourWidthRem * this.remInPx
    }

    public get hourWidthPx(): number {
        return Math.max(this.hourWidthRem * this.remInPx * this.zoomFactor, this.minHourWidthPx)
    }

    public get remInPx(): number {
        return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    }

    public SetStartDateTimeFromString(dateTimeString: string, fireDrawLayers: boolean = true) {
        this.startDateTime = new Date(dateTimeString)
        if (fireDrawLayers) {
            this.fireDrawLayers()
        }
    }

    public SetEndDateTimeFromString(dateTimeString: string, fireDrawLayers: boolean = true) {
        this.endDateTime = new Date(dateTimeString)
        if (fireDrawLayers) {
            this.fireDrawLayers()
        }
    }

    public SetZoomFactorFromString(zoomFactorString: string, fireDrawLayers: boolean = true) {
        if (isNaN(parseFloat(zoomFactorString))) {
            this.zoomFactor = 1.0
        } else {
            const zoomFactor = parseFloat(zoomFactorString)
            this.zoomFactor = zoomFactor < 0.1 ? 0.1 : zoomFactor
        }
        if (fireDrawLayers) {
            this.fireDrawLayers()
        }
    }

    public SetStartOffsetMsFromString(startOffsetMsString: string, fireDrawLayers: boolean = true) {
        if (isNaN(parseFloat(startOffsetMsString))) {
            this.startOffsetMs = 0
        } else {
            this.startOffsetMs = parseFloat(startOffsetMsString)
        }

        if (fireDrawLayers) {
            this.fireDrawLayers()
        }
    }

    constructor(startDateTime?: Date, endDateTime?: Date) {
        this.startDateTime = startDateTime || BazTimelineProps.GetDefaultStartDateTime()
        this.endDateTime = endDateTime || BazTimelineProps.GetDefaultEndDateTime()

        this.#defaultStartDateTime = this.startDateTime
        this.#defaultEndDateTime = this.endDateTime
    }

    public static GetDefaultStartDateTime(): Date {
        return new Date("2024-10-14T10:00:00")
    }

    public static GetDefaultEndDateTime(): Date {
        return new Date((new Date("2024-10-15T10:30:00")).getTime())
    }
}
