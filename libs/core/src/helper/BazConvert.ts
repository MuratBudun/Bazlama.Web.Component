/*
    Bazlama Web Component Project
    Convert any value to string, number, boolean, bigint
    2024-8-9
    Version 1.0
    muratbudun@gmail.com
*/

/**
 * Utility class for safely converting values between types.
 * Handles null, undefined, and edge cases gracefully with default values.
 *
 * @example
 * ```typescript
 * BazConvert.anyToString(123)           // "123"
 * BazConvert.anyToNumber("3.14")        // 3.14
 * BazConvert.anyToBoolean("yes")        // true
 * BazConvert.anyToBigint("12345678901") // 12345678901n
 * ```
 */
class BazConvert {
  /**
   * Converts any value to a string.
   *
   * @param value - The value to convert
   * @param defaultValue - Value to return if conversion fails
   * @returns String representation of the value
   *
   * @example
   * ```typescript
   * BazConvert.anyToString(42)        // "42"
   * BazConvert.anyToString(true)      // "true"
   * BazConvert.anyToString({a: 1})    // "{\"a\":1}"
   * BazConvert.anyToString(null, "-") // "-"
   * ```
   */
  public static anyToString(value: unknown, defaultValue = ""): string {
    if (value === null || value === undefined) return defaultValue;

    switch (typeof value) {
      case "string":
        return value;
      case "number":
        return value.toString();
      case "bigint":
        return value.toString();
      case "boolean":
        return value ? "true" : "false";
      case "object":
        return JSON.stringify(value);
    }

    return defaultValue;
  }

  /**
   * Converts any value to a number.
   *
   * @param value - The value to convert
   * @param defaultValue - Value to return if conversion fails
   * @param decimalCount - Number of decimal places to preserve
   * @returns Numeric representation of the value
   *
   * @example
   * ```typescript
   * BazConvert.anyToNumber("3.14159", 0, 2) // 3.14
   * BazConvert.anyToNumber(true)             // 1
   * BazConvert.anyToNumber("invalid", -1)   // -1
   * ```
   */
  public static anyToNumber(value: unknown, defaultValue = 0, decimalCount = 4): number {
    if (value === null || value === undefined) return defaultValue;

    switch (typeof value) {
      case "string": {
        const parsedNumber = parseFloat(value);
        return isNaN(parsedNumber) ? defaultValue : parseFloat(parsedNumber.toFixed(decimalCount));
      }
      case "number":
        return parseFloat(value.toFixed(decimalCount));
      case "bigint":
        return Number(value);
      case "boolean":
        return value ? 1 : 0;
    }

    return defaultValue;
  }

  /**
   * Converts any value to a boolean.
   * Recognizes common truthy strings: "true", "1", "yes", "on", "ok", "evet", "doğru"
   *
   * @param value - The value to convert
   * @param defaultValue - Value to return if conversion fails
   * @returns Boolean representation of the value
   *
   * @example
   * ```typescript
   * BazConvert.anyToBoolean("yes")  // true
   * BazConvert.anyToBoolean("1")    // true
   * BazConvert.anyToBoolean(1)      // true
   * BazConvert.anyToBoolean("no")   // false
   * ```
   */
  public static anyToBoolean(value: unknown, defaultValue = false): boolean {
    if (value === null || value === undefined) return defaultValue;

    switch (typeof value) {
      case "string": {
        const normalizedValue = value.toLowerCase().trim();
        return (
          normalizedValue === "true" ||
          normalizedValue === "1" ||
          normalizedValue === "yes" ||
          normalizedValue === "on" ||
          normalizedValue === "ok" ||
          normalizedValue === "evet" ||
          normalizedValue === "doğru"
        );
      }
      case "number":
        return value === 1;
      case "bigint":
        return value === 1n;
      case "boolean":
        return value;
    }

    return defaultValue;
  }

  /**
   * Converts any value to a bigint.
   *
   * @param value - The value to convert
   * @param defaultValue - Value to return if conversion fails
   * @returns BigInt representation of the value
   *
   * @example
   * ```typescript
   * BazConvert.anyToBigint("12345678901234567890") // 12345678901234567890n
   * BazConvert.anyToBigint(42)                      // 42n
   * BazConvert.anyToBigint(true)                    // 1n
   * ```
   */
  public static anyToBigint(value: unknown, defaultValue = BigInt(0)): bigint {
    if (value === null || value === undefined) return defaultValue;

    switch (typeof value) {
      case "string":
        try {
          return BigInt(value);
        } catch {
          return defaultValue;
        }
      case "number":
        return BigInt(Math.floor(value));
      case "bigint":
        return value;
      case "boolean":
        return value ? 1n : 0n;
    }

    return defaultValue;
  }

  /**
   * Converts rem units to pixels.
   * @param value - Value in rem units
   * @param defaultValue - Value to return if conversion fails
   * @returns Value in pixels
   */
  public static remToPx(value: number, defaultValue = 0): number {
    if (value === null || value === undefined) return defaultValue;
    const remInPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

    return parseFloat((value * remInPx).toFixed(4));
  }

  /**
   * Converts pixels to rem units.
   * @param value - Value in pixels
   * @param defaultValue - Value to return if conversion fails
   * @returns Value in rem units
   */
  public static pxToRem(value: number, defaultValue = 0): number {
    if (value === null || value === undefined) return defaultValue;
    const remInPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

    return parseFloat((value / remInPx).toFixed(4));
  }

  /**
   * Converts rem units to points.
   * @param value - Value in rem units
   * @param defaultValue - Value to return if conversion fails
   * @returns Value in points
   */
  public static remToPt(value: number, defaultValue = 0): number {
    if (value === null || value === undefined) return defaultValue;
    const remInPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

    return parseFloat((value * remInPx * 0.75).toFixed(4));
  }

  /**
   * Converts points to rem units.
   * @param value - Value in points
   * @param defaultValue - Value to return if conversion fails
   * @returns Value in rem units
   */
  public static ptToRem(value: number, defaultValue = 0): number {
    if (value === null || value === undefined) return defaultValue;
    const remInPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

    return parseFloat((value / remInPx / 0.75).toFixed(4));
  }

  /**
   * Converts rem units to em units.
   * @param value - Value in rem units
   * @param defaultValue - Value to return if conversion fails
   * @returns Value in em units
   */
  public static remToEm(value: number, defaultValue = 0): number {
    if (value === null || value === undefined) return defaultValue;
    const remInPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

    return parseFloat(((value * remInPx) / 16).toFixed(4));
  }

  /**
   * Converts em units to rem units.
   * @param value - Value in em units
   * @param defaultValue - Value to return if conversion fails
   * @returns Value in rem units
   */
  public static emToRem(value: number, defaultValue = 0): number {
    if (value === null || value === undefined) return defaultValue;
    const remInPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

    return parseFloat(((value * 16) / remInPx).toFixed(4));
  }

  /**
   * Converts pixels to points.
   * @param value - Value in pixels
   * @param defaultValue - Value to return if conversion fails
   * @returns Value in points
   */
  public static pxToPt(value: number, defaultValue = 0): number {
    if (value === null || value === undefined) return defaultValue;

    return parseFloat((value * 0.75).toFixed(4));
  }

  /**
   * Converts points to pixels.
   * @param value - Value in points
   * @param defaultValue - Value to return if conversion fails
   * @returns Value in pixels
   */
  public static ptToPx(value: number, defaultValue = 0): number {
    if (value === null || value === undefined) return defaultValue;

    return parseFloat((value / 0.75).toFixed(4));
  }

  /**
   * Converts pixels to em units.
   * @param value - Value in pixels
   * @param defaultValue - Value to return if conversion fails
   * @returns Value in em units
   */
  public static pxToEm(value: number, defaultValue = 0): number {
    if (value === null || value === undefined) return defaultValue;

    return parseFloat((value / 16).toFixed(4));
  }

  /**
   * Converts em units to pixels.
   * @param value - Value in em units
   * @param defaultValue - Value to return if conversion fails
   * @returns Value in pixels
   */
  public static emToPx(value: number, defaultValue = 0): number {
    if (value === null || value === undefined) return defaultValue;

    return parseFloat((value * 16).toFixed(4));
  }

  /**
   * Converts points to em units.
   * @param value - Value in points
   * @param defaultValue - Value to return if conversion fails
   * @returns Value in em units
   */
  public static ptToEm(value: number, defaultValue = 0): number {
    if (value === null || value === undefined) return defaultValue;

    return parseFloat((value / 12).toFixed(4));
  }

  /**
   * Converts em units to points.
   * @param value - Value in em units
   * @param defaultValue - Value to return if conversion fails
   * @returns Value in points
   * @see https://cssunitconverter.vercel.app/
   */
  public static emToPt(value: number, defaultValue = 0): number {
    if (value === null || value === undefined) return defaultValue;

    return parseFloat((value * 12).toFixed(4));
  }
}

export default BazConvert;
