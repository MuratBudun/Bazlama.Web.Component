class BazGeneral {
    public static createId(prefix: string = "", suffix: string = ""): string {
        return `${prefix ? `${prefix}-` : ""}${Math.floor(Math.random() * Date.now())}${suffix ? `-${suffix}` : ""}`
    }

    public static isObject(value: any): boolean {
        return value !== null && typeof value === "object"
    }

    public static isString(value: any): boolean {
        return typeof value === "string"
    }

    public static isNumber(value: any): boolean {
        return typeof value === "number"
    }

    public static isBoolean(value: any): boolean {
        return typeof value === "boolean"
    }

    public static isArray(value: any): boolean {
        return Array.isArray(value)
    }

    public static isFunction(value: any): boolean {
        return typeof value === "function"
    }

    public static isDate(value: any): boolean {
        return value instanceof Date
    }

    public static isNull(value: any): boolean {
        return value === null
    }     
}

export default BazGeneral