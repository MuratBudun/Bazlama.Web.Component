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

    public static anyToNumber(value: any, defaultValue: number = 0): number {
        if (value === null || value === undefined) return defaultValue

        switch (typeof value) {
            case "string":
                const parsedNumber = parseFloat(value)
                return isNaN(parsedNumber) ? defaultValue : parsedNumber
                break
            case "number":
                return value
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
}

export default BazConvert