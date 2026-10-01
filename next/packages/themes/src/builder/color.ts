/**
 * Colour helpers for the theme editor: hex <-> OKLCH (perceptual lightness/chroma/hue, so a
 * palette derived by changing L looks even), sRGB gamut mapping by reducing chroma, and the
 * WCAG 2 contrast ratio. No dependencies.
 */

export type Rgb = [number, number, number]
export interface Oklch {
  l: number
  c: number
  h: number
}

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v))

export function isHex(value: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim())
}

export function hexToRgb(hex: string): Rgb {
  let h = hex.trim().replace("#", "")
  if (h.length === 3) h = [...h].map((c) => c + c).join("")
  const n = parseInt(h, 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

export function rgbToHex([r, g, b]: Rgb): string {
  const to = (v: number) => Math.round(clamp(v) * 255).toString(16).padStart(2, "0")
  return `#${to(r)}${to(g)}${to(b)}`
}

const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
const toGamma = (v: number) => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055)

export function rgbToOklch(rgb: Rgb): Oklch {
  const [r, g, b] = rgb.map(toLinear)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const c = Math.hypot(A, B)
  const h = c < 1e-4 ? 0 : ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360
  return { l: L, c, h }
}

/** Linear-free result, may be outside [0, 1] (out of the sRGB gamut). */
function oklchToRgbRaw({ l: L, c, h }: Oklch): Rgb {
  const A = c * Math.cos((h * Math.PI) / 180)
  const B = c * Math.sin((h * Math.PI) / 180)
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3
  const lin: Rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
  return lin.map((v) => (v < 0 ? -toGamma(-v) : toGamma(v))) as Rgb
}

const inGamut = (rgb: Rgb) => rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4)

/** OKLCH to hex; out-of-gamut colours keep L and h and lose chroma until they fit. */
export function oklchToHex(color: Oklch): string {
  const l = clamp(color.l)
  let rgb = oklchToRgbRaw({ ...color, l })
  if (!inGamut(rgb)) {
    let lo = 0
    let hi = color.c
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2
      if (inGamut(oklchToRgbRaw({ l, c: mid, h: color.h }))) lo = mid
      else hi = mid
    }
    rgb = oklchToRgbRaw({ l, c: lo, h: color.h })
  }
  return rgbToHex(rgb)
}

export const hexToOklch = (hex: string) => rgbToOklch(hexToRgb(hex))

/** A copy of `hex` with some OKLCH channels changed (l / c absolute, or via a function). */
export function adjust(hex: string, change: { l?: number | ((l: number) => number); c?: number | ((c: number) => number); h?: number }): string {
  const o = hexToOklch(hex)
  const pick = (v: number | ((x: number) => number) | undefined, x: number) => (v === undefined ? x : typeof v === "function" ? v(x) : v)
  return oklchToHex({ l: pick(change.l, o.l), c: Math.max(0, pick(change.c, o.c)), h: change.h ?? o.h })
}

/** WCAG 2 relative luminance. */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(toLinear)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG 2 contrast ratio, 1 … 21. */
export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

/** The colour of the two with the better contrast on `bg`. */
export function bestOn(bg: string, light = "#ffffff", dark = "#0b0d12"): string {
  return contrast(light, bg) >= contrast(dark, bg) ? light : dark
}

/**
 * Moves `hex` in lightness (keeping hue and chroma) until it reaches `ratio` against `bg`:
 * darker on a light background, lighter on a dark one. Unchanged when it already passes.
 */
export function ensureContrast(hex: string, bg: string, ratio: number): string {
  if (contrast(hex, bg) >= ratio) return hex
  const o = hexToOklch(hex)
  const darker = luminance(bg) > 0.18
  let color = hex
  for (let i = 1; i <= 50; i++) {
    color = oklchToHex({ ...o, l: clamp(o.l + (darker ? -0.01 : 0.01) * i) })
    if (contrast(color, bg) >= ratio) break
  }
  return color
}
