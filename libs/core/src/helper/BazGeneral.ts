/**
 * Utility class providing general-purpose helper methods.
 * Includes type guards for type-safe value checking and unique ID generation.
 *
 * @example
 * ```typescript
 * // Type guards
 * if (BazGeneral.isString(value)) {
 *   console.log(value.toUpperCase()) // TypeScript knows value is string
 * }
 *
 * // ID generation
 * const id = BazGeneral.createId('btn') // e.g., "btn-1699123456789"
 * ```
 */
class BazGeneral {
  /**
   * Creates a unique ID with optional prefix and suffix.
   *
   * @param prefix - Text to prepend before the random ID
   * @param suffix - Text to append after the random ID
   * @returns A unique string ID
   *
   * @example
   * ```typescript
   * BazGeneral.createId('item') // "item-1699123456789"
   * BazGeneral.createId('btn', 'primary') // "btn-1699123456789-primary"
   * ```
   */
  public static createId(prefix = "", suffix = ""): string {
    return `${prefix ? `${prefix}-` : ""}${Math.floor(Math.random() * Date.now())}${suffix ? `-${suffix}` : ""}`;
  }

  /**
   * Type guard that checks if a value is a non-null object.
   * @param value - Value to check
   * @returns True if value is an object (not null)
   */
  public static isObject(value: unknown): value is object {
    return value !== null && typeof value === "object";
  }

  /**
   * Type guard that checks if a value is a string.
   * @param value - Value to check
   * @returns True if value is a string
   */
  public static isString(value: unknown): value is string {
    return typeof value === "string";
  }

  /**
   * Type guard that checks if a value is a number.
   * @param value - Value to check
   * @returns True if value is a number
   */
  public static isNumber(value: unknown): value is number {
    return typeof value === "number";
  }

  /**
   * Type guard that checks if a value is a boolean.
   * @param value - Value to check
   * @returns True if value is a boolean
   */
  public static isBoolean(value: unknown): value is boolean {
    return typeof value === "boolean";
  }

  /**
   * Type guard that checks if a value is an array.
   * @param value - Value to check
   * @returns True if value is an array
   */
  public static isArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
  }

  /**
   * Type guard that checks if a value is a function.
   * @param value - Value to check
   * @returns True if value is a function
   */
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  public static isFunction(value: unknown): value is Function {
    return typeof value === "function";
  }

  /**
   * Type guard that checks if a value is a Date instance.
   * @param value - Value to check
   * @returns True if value is a Date
   */
  public static isDate(value: unknown): value is Date {
    return value instanceof Date;
  }

  /**
   * Type guard that checks if a value is null.
   * @param value - Value to check
   * @returns True if value is null
   */
  public static isNull(value: unknown): value is null {
    return value === null;
  }
}

export default BazGeneral;
