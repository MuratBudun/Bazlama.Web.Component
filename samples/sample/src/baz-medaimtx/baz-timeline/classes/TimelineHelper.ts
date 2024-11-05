import { isDate } from "util/types"

export default class TimelineHelper {
    public static PxToRem(px: number): number {
        return px / this.RemInPx()
    }

    public static RemToPx(rem: number): number {
        return rem * this.RemInPx()
    }

    public static RemInPx(): number {
        return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    }

    public static GetDefaultStartDateTime(): Date {
        return new Date("2024-10-14T10:00:00")
    }

    public static GetDefaultEndDateTime(): Date {
        return new Date((new Date("2024-10-14T10:00:00")).getTime() + (5 * 60 * 60 * 1000))
    }

    public static IsTwoDateSame(date1: Date, date2: Date) {
        if (!date1 || !date2) return false
        if (date1 === null || date2 === null) return false

        return date1.getTime() === date2.getTime()
    }
}    