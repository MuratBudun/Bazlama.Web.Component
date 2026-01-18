/*
    Bazlama Web Component Project
    Color utility functions for web components
    2026-1-18
    Version 1.0
    muratbudun@gmail.com
*/

/**
 * RGB color representation
 */
export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * HSL color representation
 */
export interface HSL {
  h: number;
  s: number;
  l: number;
}

/**
 * Color stop for gradient interpolation
 */
export interface ColorStop {
  position: number; // 0-100
  color: string; // hex color
}

/**
 * Utility class for color manipulation and interpolation.
 * Provides methods for converting between color formats and creating gradients.
 *
 * @example
 * ```typescript
 * // Parse hex color
 * BazColor.hexToRgb('#ff5733') // { r: 255, g: 87, b: 51 }
 *
 * // Interpolate between two colors
 * BazColor.lerp('#ff0000', '#00ff00', 0.5) // '#808000'
 *
 * // Create gradient function
 * const gradient = BazColor.createGradient([
 *   { position: 0, color: '#ef4444' },
 *   { position: 50, color: '#f59e0b' },
 *   { position: 100, color: '#22c55e' }
 * ])
 * gradient(75) // returns color between orange and green
 * ```
 */
class BazColor {
  /**
   * Converts a hex color string to RGB values.
   *
   * @param hex - Hex color string (with or without #)
   * @returns RGB object or null if invalid
   *
   * @example
   * ```typescript
   * BazColor.hexToRgb('#ff5733')  // { r: 255, g: 87, b: 51 }
   * BazColor.hexToRgb('ff5733')   // { r: 255, g: 87, b: 51 }
   * BazColor.hexToRgb('#f53')     // { r: 255, g: 85, b: 51 }
   * ```
   */
  public static hexToRgb(hex: string): RGB | null {
    // Remove # if present
    const cleanHex = hex.replace(/^#/, "");

    // Handle shorthand (3 chars) and full (6 chars) hex
    let r: number, g: number, b: number;

    if (cleanHex.length === 3) {
      r = parseInt(cleanHex[0] + cleanHex[0], 16);
      g = parseInt(cleanHex[1] + cleanHex[1], 16);
      b = parseInt(cleanHex[2] + cleanHex[2], 16);
    } else if (cleanHex.length === 6) {
      r = parseInt(cleanHex.substring(0, 2), 16);
      g = parseInt(cleanHex.substring(2, 4), 16);
      b = parseInt(cleanHex.substring(4, 6), 16);
    } else {
      return null;
    }

    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      return null;
    }

    return { r, g, b };
  }

  /**
   * Converts RGB values to a hex color string.
   *
   * @param r - Red component (0-255)
   * @param g - Green component (0-255)
   * @param b - Blue component (0-255)
   * @returns Hex color string with #
   *
   * @example
   * ```typescript
   * BazColor.rgbToHex(255, 87, 51)  // '#ff5733'
   * BazColor.rgbToHex(0, 0, 0)      // '#000000'
   * ```
   */
  public static rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number): string => {
      const clamped = Math.max(0, Math.min(255, Math.round(n)));
      return clamped.toString(16).padStart(2, "0");
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /**
   * Converts RGB to CSS rgb() string.
   *
   * @param r - Red component (0-255)
   * @param g - Green component (0-255)
   * @param b - Blue component (0-255)
   * @returns CSS rgb() string
   *
   * @example
   * ```typescript
   * BazColor.rgbToString(255, 87, 51)  // 'rgb(255, 87, 51)'
   * ```
   */
  public static rgbToString(r: number, g: number, b: number): string {
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  }

  /**
   * Linear interpolation between two colors.
   *
   * @param color1 - Start color (hex)
   * @param color2 - End color (hex)
   * @param t - Interpolation factor (0-1)
   * @returns Interpolated color as hex string
   *
   * @example
   * ```typescript
   * BazColor.lerp('#ff0000', '#00ff00', 0)   // '#ff0000'
   * BazColor.lerp('#ff0000', '#00ff00', 0.5) // '#808000'
   * BazColor.lerp('#ff0000', '#00ff00', 1)   // '#00ff00'
   * ```
   */
  public static lerp(color1: string, color2: string, t: number): string {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    if (!rgb1 || !rgb2) {
      return color1;
    }

    const clampedT = Math.max(0, Math.min(1, t));

    const r = rgb1.r + (rgb2.r - rgb1.r) * clampedT;
    const g = rgb1.g + (rgb2.g - rgb1.g) * clampedT;
    const b = rgb1.b + (rgb2.b - rgb1.b) * clampedT;

    return this.rgbToHex(r, g, b);
  }

  /**
   * Linear interpolation returning RGB string (no rounding artifacts).
   *
   * @param color1 - Start color (hex)
   * @param color2 - End color (hex)
   * @param t - Interpolation factor (0-1)
   * @returns Interpolated color as rgb() string
   */
  public static lerpRgb(color1: string, color2: string, t: number): string {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    if (!rgb1 || !rgb2) {
      return color1;
    }

    const clampedT = Math.max(0, Math.min(1, t));

    const r = rgb1.r + (rgb2.r - rgb1.r) * clampedT;
    const g = rgb1.g + (rgb2.g - rgb1.g) * clampedT;
    const b = rgb1.b + (rgb2.b - rgb1.b) * clampedT;

    return this.rgbToString(r, g, b);
  }

  /**
   * Creates a gradient function from color stops.
   * Returns a function that takes a position (0-100) and returns the interpolated color.
   *
   * @param stops - Array of color stops with position and color
   * @returns Function that returns interpolated color for any position
   *
   * @example
   * ```typescript
   * const gradient = BazColor.createGradient([
   *   { position: 0, color: '#ef4444' },   // red
   *   { position: 50, color: '#f59e0b' },  // orange
   *   { position: 100, color: '#22c55e' }  // green
   * ])
   *
   * gradient(0)   // '#ef4444'
   * gradient(25)  // color between red and orange
   * gradient(50)  // '#f59e0b'
   * gradient(75)  // color between orange and green
   * gradient(100) // '#22c55e'
   * ```
   */
  public static createGradient(
    stops: ColorStop[]
  ): (position: number) => string {
    // Sort stops by position
    const sortedStops = [...stops].sort((a, b) => a.position - b.position);

    return (position: number): string => {
      // Clamp position to 0-100
      const pos = Math.max(0, Math.min(100, position));

      // Find the two stops to interpolate between
      let startStop = sortedStops[0];
      let endStop = sortedStops[sortedStops.length - 1];

      for (let i = 0; i < sortedStops.length - 1; i++) {
        if (pos >= sortedStops[i].position && pos <= sortedStops[i + 1].position) {
          startStop = sortedStops[i];
          endStop = sortedStops[i + 1];
          break;
        }
      }

      // Calculate interpolation factor
      const range = endStop.position - startStop.position;
      const t = range === 0 ? 0 : (pos - startStop.position) / range;

      return this.lerpRgb(startStop.color, endStop.color, t);
    };
  }

  /**
   * Creates a gradient function for progress-like values (0-100).
   * If no stops provided, uses default red → orange → green gradient.
   *
   * @param stops - Optional array of color stops. Defaults to red→orange→green
   * @returns Function that takes a value (0-100) and returns interpolated color
   *
   * @example
   * ```typescript
   * // Default red → orange → green gradient
   * const defaultGradient = BazColor.progressGradient()
   * defaultGradient(0)   // red
   * defaultGradient(50)  // orange
   * defaultGradient(100) // green
   * 
   * // Custom gradient: blue → purple → pink
   * const customGradient = BazColor.progressGradient([
   *   { position: 0, color: '#3b82f6' },
   *   { position: 50, color: '#8b5cf6' },
   *   { position: 100, color: '#ec4899' }
   * ])
   * customGradient(25) // color between blue and purple
   * ```
   */
  public static progressGradient(stops?: ColorStop[]): (value: number) => string {
    const defaultStops: ColorStop[] = [
      { position: 0, color: "#ef4444" },
      { position: 50, color: "#f59e0b" },
      { position: 100, color: "#22c55e" },
    ];
    return this.createGradient(stops ?? defaultStops);
  }

  /**
   * Adjusts the brightness of a color.
   *
   * @param hex - Hex color string
   * @param amount - Amount to adjust (-100 to 100)
   * @returns Adjusted color as hex string
   *
   * @example
   * ```typescript
   * BazColor.adjustBrightness('#808080', 20)  // lighter
   * BazColor.adjustBrightness('#808080', -20) // darker
   * ```
   */
  public static adjustBrightness(hex: string, amount: number): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;

    const factor = amount / 100;
    const adjust = (c: number): number => {
      if (factor > 0) {
        return c + (255 - c) * factor;
      } else {
        return c * (1 + factor);
      }
    };

    return this.rgbToHex(adjust(rgb.r), adjust(rgb.g), adjust(rgb.b));
  }

  /**
   * Converts a color to grayscale.
   *
   * @param hex - Hex color string
   * @returns Grayscale color as hex string
   *
   * @example
   * ```typescript
   * BazColor.toGrayscale('#ff5733') // '#8b8b8b'
   * ```
   */
  public static toGrayscale(hex: string): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;

    // Use luminance formula
    const gray = Math.round(0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b);
    return this.rgbToHex(gray, gray, gray);
  }
}

export default BazColor;
