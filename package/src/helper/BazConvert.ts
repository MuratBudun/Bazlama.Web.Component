/*
    Bazlama Web Component Project
    Convert any value to string, number, boolean, bigint
    2024-8-9
    Version 1.0
    muratbudun@gmail.com
*/

class BazConvert {
    public static anyToString(value: any, defaultValue: string = ""): string {
        if (value === null || value === undefined) return defaultValue

        switch (typeof value) {
            case "string":
                return value
                break
            case "number":
                return value.toString()
                break
            case "bigint":
                return value.toString()
                break
            case "boolean":
                return value ? "true" : "false"
                break
            case "object":
                return JSON.stringify(value)
                break
        }

        return defaultValue
    }

    public static anyToNumber(value: any, defaultValue: number = 0, decimalCount: number = 4): number {
        if (value === null || value === undefined) return defaultValue

        switch (typeof value) {
            case "string":
                const parsedNumber = parseFloat(value)
                return isNaN(parsedNumber) ? defaultValue : parseFloat(parsedNumber.toFixed(decimalCount))
                break
            case "number":
                return parseFloat(value.toFixed(decimalCount))
                break
            case "bigint":
                return Number(value)
                break
            case "boolean":
                return value ? 1 : 0
                break
        }

        return defaultValue        
    }

    public static anyToBoolean(value: any, defaultValue: boolean = false): boolean {
        if (value === null || value === undefined) return defaultValue

        switch (typeof value) {
            case "string":
                const normalizedValue = value.toLowerCase().trim()
                return normalizedValue === "true" || 
                    normalizedValue === "1" || 
                    normalizedValue === "yes" || 
                    normalizedValue === "on" || 
                    normalizedValue === "ok" || 
                    normalizedValue === "evet" ||
                    normalizedValue === "doğru"
                break
            case "number":
                return value === 1
                break
            case "bigint":
                return value === 1n
                break
            case "boolean":
                return value
                break
        }

        return defaultValue
    }

    public static anyToBigint(value: any, defaultValue: bigint = BigInt(0)): bigint {
        if (value === null || value === undefined) return defaultValue

        switch (typeof value) {
            case "string":
                try { return BigInt(value) } catch { return defaultValue }                
                break
            case "number":
                return BigInt(Math.floor(value))
                break
            case "bigint":
                return value
                break
            case "boolean":
                return value ? 1n : 0n
                break
        }

        return defaultValue
    }

    public static remToPx(value: number, defaultValue: number = 0): number {
        if (value === null || value === undefined) return defaultValue
        const remInPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16

        return parseFloat((value * remInPx).toFixed(4))
    }

    public static pxToRem(value: number, defaultValue: number = 0): number {
        if (value === null || value === undefined) return defaultValue
        const remInPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16

        return parseFloat((value / remInPx).toFixed(4))
    }

    public static remToPt(value: number, defaultValue: number = 0): number {
        if (value === null || value === undefined) return defaultValue
        const remInPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16

        return parseFloat((value * remInPx * 0.75).toFixed(4))
    }

    public static ptToRem(value: number, defaultValue: number = 0): number {
        if (value === null || value === undefined) return defaultValue
        const remInPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16

        return parseFloat((value / remInPx / 0.75).toFixed(4))
    }

    public static remToEm(value: number, defaultValue: number = 0): number {
        if (value === null || value === undefined) return defaultValue
        const remInPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16

        return parseFloat((value * remInPx / 16).toFixed(4))
    }

    public static emToRem(value: number, defaultValue: number = 0): number {
        if (value === null || value === undefined) return defaultValue
        const remInPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16

        return parseFloat((value * 16 / remInPx).toFixed(4))
    }

    public static pxToPt(value: number, defaultValue: number = 0): number {
        if (value === null || value === undefined) return defaultValue

        return parseFloat((value * 0.75).toFixed(4))
    }

    public static ptToPx(value: number, defaultValue: number = 0): number {
        if (value === null || value === undefined) return defaultValue

        return parseFloat((value / 0.75).toFixed(4))
    }

    public static pxToEm(value: number, defaultValue: number = 0): number {
        if (value === null || value === undefined) return defaultValue

        return parseFloat((value / 16).toFixed(4))
    }

    public static emToPx(value: number, defaultValue: number = 0): number {
        if (value === null || value === undefined) return defaultValue

        return parseFloat((value * 16).toFixed(4))
    }

    public static ptToEm(value: number, defaultValue: number = 0): number {
        if (value === null || value === undefined) return defaultValue

        return parseFloat((value / 12).toFixed(4))
    }

    public static emToPt(value: number, defaultValue: number = 0): number {
        if (value === null || value === undefined) return defaultValue

        return parseFloat((value * 12).toFixed(4))
    }
    //https://cssunitconverter.vercel.app/
}

export default BazConvert