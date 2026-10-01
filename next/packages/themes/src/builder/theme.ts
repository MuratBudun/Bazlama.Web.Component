import { adjust, bestOn, contrast, ensureContrast, hexToOklch, isHex, oklchToHex } from "./color"

/**
 * Theme builder model: a handful of choices (brand colour, neutral tone, shape, type) become
 * a full token set for a light and a dark variant. Tokens can be overridden one by one; the
 * result is the CSS of a bazlama theme ([data-theme="name"] and [data-theme="name-dark"]).
 * Used by the playground's theme editor and at run time (applyTheme), e.g. a tenant's brand.
 */

export type Mode = "light" | "dark"
export type Neutral = "cool" | "neutral" | "warm" | "brand"
export type ShadowLevel = "none" | "subtle" | "medium"
export type Style = "modern" | "classic"
export type Tokens = Record<string, string>

export interface ThemeSettings {
  name: string
  primary: string
  danger: string
  success: string
  warning: string
  info: string
  neutral: Neutral
  /** Base radius in px (controls); small and large radii follow. */
  radius: number
  /** Control height in px. */
  controlHeight: number
  fontSize: number
  font: string
  shadow: ShadowLevel
  /** "modern": the quiet details of the modern theme (tables, badges, toasts, sort arrows…). */
  style: Style
  overrides: Record<Mode, Tokens>
}

/** Font stacks (no font files are loaded: each falls back to what the system has). */
export const FONTS: { id: string; label: string; value: string }[] = [
  { id: "modern", label: "Modern (Inter → Segoe UI Variable → system)", value: '"Inter var", Inter, "Segoe UI Variable Text", "Segoe UI Variable", "Segoe UI", system-ui, -apple-system, Roboto, sans-serif' },
  { id: "system", label: "System font", value: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
  { id: "segoe", label: "Segoe UI", value: '"Segoe UI", system-ui, sans-serif' },
  { id: "roboto", label: "Roboto", value: "Roboto, system-ui, sans-serif" },
  { id: "serif", label: "Serif (Georgia)", value: 'Georgia, "Times New Roman", serif' },
]

export const DEFAULT_SETTINGS: ThemeSettings = {
  name: "marka",
  primary: "#2563eb",
  danger: "#dc2626",
  success: "#15803d",
  warning: "#b45309",
  info: "#0369a1",
  neutral: "cool",
  radius: 8,
  controlHeight: 36,
  fontSize: 14,
  font: FONTS[0].value,
  shadow: "subtle",
  style: "modern",
  overrides: { light: {}, dark: {} },
}

/** Hue and chroma of the greys. */
function neutralTone(s: ThemeSettings): { h: number; c: number } {
  if (s.neutral === "neutral") return { h: 0, c: 0 }
  if (s.neutral === "warm") return { h: 70, c: 0.008 }
  if (s.neutral === "brand") return { h: hexToOklch(s.primary).h, c: 0.012 }
  return { h: 285, c: 0.006 }
}

const rem = (px: number) => `${+(px / 16).toFixed(4)}rem`

/** Tokens the modern style adds; "classic" leaves them unset (components use their defaults). */
export const STYLE_TOKENS = [
  "--bz-font-numeric", "--bz-table-header-weight", "--bz-table-header-size", "--bz-table-header-fg", "--bz-sort-idle-opacity",
  "--bz-tab-selected-weight", "--bz-tree-selected-weight", "--bz-badge-font-size", "--bz-badge-weight", "--bz-badge-padding",
  "--bz-badge-radius", "--bz-badge-ring", "--bz-card-bg", "--bz-card-border", "--bz-card-shadow", "--bz-toast-accent-width",
  "--bz-toast-accent-color", "--bz-menu-danger-focus-bg", "--bz-menu-danger-focus-fg", "--bz-button-press-scale",
  "--bz-dialog-backdrop-filter", "--bz-data-grid-row-height", "--bz-data-grid-pinned-bg", "scrollbar-color",
]

export function generate(s: ThemeSettings, mode: Mode): Tokens {
  const dark = mode === "dark"
  const { h, c } = neutralTone(s)
  const grey = (l: number, chroma = c) => oklchToHex({ l, c: chroma, h })

  // Greys: lightness steps for each mode. Dark: not near-black; each layer up is lighter
  // (page → panel → popup), hairline borders ~1.8:1 and control borders 3:1+ on every layer
  // (WCAG 2.2, 1.4.11) — as the built-in dark themes (references: Carbon g90, GitHub dimmed).
  const bg = dark ? grey(0.2) : grey(0.982, c * 0.6)
  const surface = dark ? grey(0.28) : "#ffffff"
  const raised = dark ? grey(0.312) : surface
  const surfaceHover = dark ? grey(0.332) : grey(0.965)
  const border = dark ? grey(0.434) : grey(0.922)
  const borderStrong = dark ? ensureContrast(grey(0.605), raised, 3) : grey(0.87)
  const borderHover = dark ? grey(0.705) : grey(0.72)
  const fg = dark ? grey(0.94, c * 0.5) : grey(0.2)
  // Colours must read on the lightest layer text sits on (popups in dark mode).
  const top = raised
  const fgMuted = ensureContrast(dark ? grey(0.758) : grey(0.5), top, 4.5)

  // Brand colour: kept as picked in light mode; in dark mode lifted until it reads on the layers
  // and on its own soft tint (selected items).
  const baseOk = hexToOklch(s.primary)
  const primarySoft = dark
    ? oklchToHex({ l: 0.33, c: Math.min(0.07, baseOk.c * 0.45), h: baseOk.h })
    : oklchToHex({ l: 0.965, c: Math.min(0.03, baseOk.c * 0.2), h: baseOk.h })
  const primary = dark
    ? ensureContrast(ensureContrast(adjust(s.primary, { l: (l) => Math.max(l, 0.68) }), top, 4.5), primarySoft, 4.5)
    : s.primary
  const primaryHover = adjust(primary, { l: (l) => l + (dark ? 0.07 : -0.07) })
  const primaryFg = bestOn(primary, "#ffffff", grey(0.16))

  const danger = dark ? ensureContrast(adjust(s.danger, { l: (l) => Math.max(l, 0.68) }), top, 4.5) : ensureContrast(s.danger, surface, 4.5)
  const tone = (hex: string) => (dark ? ensureContrast(adjust(hex, { l: (l) => Math.max(l, 0.72) }), top, 4.5) : ensureContrast(hex, surface, 4.5))

  const shadows: Record<ShadowLevel, Tokens> = dark
    ? {
        none: { control: "none", surface: "none", solid: "none", popup: "0 0 0 1px rgb(255 255 255 / 0.08)", dialog: "0 0 0 1px rgb(255 255 255 / 0.1)" },
        subtle: {
          control: "0 1px 2px rgb(0 0 0 / 0.4)",
          surface: "0 1px 2px rgb(0 0 0 / 0.3)",
          solid: "0 1px 2px rgb(0 0 0 / 0.4), inset 0 1px 0 rgb(255 255 255 / 0.2)",
          popup: "0 16px 40px -6px rgb(0 0 0 / 0.6), 0 0 0 1px rgb(255 255 255 / 0.04)",
          dialog: "0 28px 64px -12px rgb(0 0 0 / 0.7), 0 0 0 1px rgb(255 255 255 / 0.06)",
        },
        medium: {
          control: "0 1px 3px rgb(0 0 0 / 0.5)",
          surface: "0 2px 8px rgb(0 0 0 / 0.4)",
          solid: "0 2px 4px rgb(0 0 0 / 0.5), inset 0 1px 0 rgb(255 255 255 / 0.2)",
          popup: "0 20px 48px -6px rgb(0 0 0 / 0.7), 0 0 0 1px rgb(255 255 255 / 0.05)",
          dialog: "0 32px 72px -12px rgb(0 0 0 / 0.8), 0 0 0 1px rgb(255 255 255 / 0.06)",
        },
      }
    : {
        none: { control: "none", surface: "none", solid: "none", popup: "0 0 0 1px rgb(24 24 27 / 0.08)", dialog: "0 0 0 1px rgb(24 24 27 / 0.1)" },
        subtle: {
          control: "0 1px 2px rgb(24 24 27 / 0.05)",
          surface: "0 1px 2px rgb(24 24 27 / 0.04), 0 1px 3px rgb(24 24 27 / 0.04)",
          solid: "0 1px 2px rgb(24 24 27 / 0.15), inset 0 1px 0 rgb(255 255 255 / 0.14)",
          popup: "0 12px 32px -4px rgb(24 24 27 / 0.12), 0 4px 8px -2px rgb(24 24 27 / 0.06)",
          dialog: "0 24px 56px -12px rgb(24 24 27 / 0.3), 0 0 0 1px rgb(24 24 27 / 0.05)",
        },
        medium: {
          control: "0 1px 3px rgb(24 24 27 / 0.1)",
          surface: "0 2px 8px rgb(24 24 27 / 0.08), 0 1px 2px rgb(24 24 27 / 0.06)",
          solid: "0 2px 4px rgb(24 24 27 / 0.2), inset 0 1px 0 rgb(255 255 255 / 0.14)",
          popup: "0 16px 40px -4px rgb(24 24 27 / 0.18), 0 4px 10px -2px rgb(24 24 27 / 0.08)",
          dialog: "0 28px 64px -12px rgb(24 24 27 / 0.38), 0 0 0 1px rgb(24 24 27 / 0.05)",
        },
      }
  const sh = shadows[s.shadow]

  const t: Tokens = {
    "color-scheme": mode,
    "--bz-font-family": s.font,
    "--bz-font-size": rem(s.fontSize),
    "--bz-line-height": "1.5",
    "--bz-radius": rem(s.radius),
    "--bz-radius-sm": rem(Math.round(s.radius * 0.75)),
    "--bz-radius-lg": rem(Math.round(s.radius * 1.5)),
    "--bz-control-height": rem(s.controlHeight),

    "--bz-color-bg": bg,
    "--bz-color-surface": surface,
    "--bz-color-surface-raised": raised,
    "--bz-color-surface-hover": surfaceHover,
    "--bz-color-fg": fg,
    "--bz-color-fg-muted": fgMuted,
    "--bz-color-border": border,
    "--bz-color-border-strong": borderStrong,
    "--bz-color-border-hover": borderHover,
    "--bz-color-primary": primary,
    "--bz-color-primary-hover": primaryHover,
    "--bz-color-primary-fg": primaryFg,
    "--bz-color-primary-soft": primarySoft,
    "--bz-color-focus": primary,
    "--bz-color-danger": danger,
    "--bz-color-danger-hover": adjust(danger, { l: (l) => l + (dark ? 0.07 : -0.07) }),
    "--bz-color-danger-fg": bestOn(danger, "#ffffff", grey(0.16)),
    "--bz-color-success": tone(s.success),
    "--bz-color-warning": tone(s.warning),
    "--bz-color-info": tone(s.info),

    "--bz-table-header-bg": dark ? grey(0.297) : grey(0.985, c * 0.6),
    "--bz-data-grid-header-bg": dark ? grey(0.297) : grey(0.985, c * 0.6),
    "--bz-tooltip-bg": dark ? grey(0.389) : grey(0.22),
    "--bz-dialog-backdrop": dark ? "rgb(0 0 0 / 0.55)" : "rgb(24 24 27 / 0.4)",

    "--bz-shadow-control": sh.control,
    "--bz-shadow-surface": sh.surface,
    "--bz-shadow-button-solid": sh.solid,
    "--bz-shadow-popup": sh.popup,
    "--bz-shadow-dialog": sh.dialog,
  }

  if (s.style === "modern") {
    Object.assign(t, {
      "--bz-font-numeric": "tabular-nums",
      "--bz-table-header-weight": "500",
      "--bz-table-header-size": rem(Math.max(12, s.fontSize - 1)),
      "--bz-table-header-fg": fgMuted,
      "--bz-sort-idle-opacity": "0",
      "--bz-tab-selected-weight": "500",
      "--bz-tree-selected-weight": "500",
      "--bz-badge-font-size": "0.75rem",
      "--bz-badge-weight": "500",
      "--bz-badge-padding": "0.0625rem 0.5rem",
      "--bz-badge-radius": rem(Math.max(2, Math.round(s.radius * 0.75))),
      "--bz-badge-ring": "22%",
      "--bz-card-bg": surface,
      "--bz-card-border": border,
      "--bz-card-shadow": sh.surface,
      "--bz-toast-accent-width": "1px",
      "--bz-toast-accent-color": border,
      "--bz-menu-danger-focus-bg": oklchToHex({ ...hexToOklch(danger), l: dark ? 0.37 : 0.95, c: Math.min(0.06, hexToOklch(danger).c * 0.3) }),
      "--bz-menu-danger-focus-fg": danger,
      "--bz-button-press-scale": "0.98",
      "--bz-dialog-backdrop-filter": "blur(2px)",
      "--bz-data-grid-row-height": `${Math.round(s.controlHeight + 2)}px`,
      "--bz-data-grid-pinned-bg": dark ? grey(0.3) : grey(0.975, c * 0.6),
      "scrollbar-color": `${dark ? grey(0.46) : grey(0.86)} transparent`,
    })
  }
  return { ...t, ...s.overrides[mode] }
}

/** A data-theme name from any text: accents dropped ("Kiracı Şube" → "kiraci-sube"). */
const slug = (name: string) =>
  name
    .trim()
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "theme"

export const themeNames = (s: ThemeSettings) => ({ light: slug(s.name), dark: `${slug(s.name)}-dark` })

function block(selector: string, tokens: Tokens, indent = "  "): string {
  const lines = Object.entries(tokens).map(([k, v]) => `${indent}  ${k}: ${v};`)
  return `${indent}${selector} {\n${lines.join("\n")}\n${indent}}`
}

/** The theme file: both variants in bazlama's token layer. */
export function toCss(s: ThemeSettings): string {
  const names = themeNames(s)
  return [
    `/* bazlama theme "${names.light}" (light) and "${names.dark}" (dark), made with the theme builder. */`,
    "@layer bazlama.tokens {",
    block(`[data-theme="${names.light}"]`, generate(s, "light")),
    "",
    block(`[data-theme="${names.dark}"]`, generate(s, "dark")),
    "}",
    "",
  ].join("\n")
}

/**
 * CSS for the live preview: the same tokens on a preview selector. The "classic" style resets
 * the modern-only tokens to `initial` so values inherited from the page's own theme do not leak
 * in (a custom property set to `initial` makes var() use its fallback).
 */
export function previewCss(s: ThemeSettings, mode: Mode, selector: string): string {
  const tokens = generate(s, mode)
  const resets = Object.fromEntries(STYLE_TOKENS.filter((k) => !(k in tokens) && k.startsWith("--")).map((k) => [k, "initial"]))
  return `@layer bazlama.tokens {\n${block(selector, { ...resets, ...tokens }, "")}\n}`
}

/** Reads a theme file back: the declarations of [data-theme="x"] and [data-theme="x-dark"]. */
export function parseCss(css: string): { name?: string; light: Tokens; dark: Tokens } {
  const out: { name?: string; light: Tokens; dark: Tokens } = { light: {}, dark: {} }
  const blocks = [...css.matchAll(/\[data-theme="([^"]+)"\]\s*\{([^}]*)\}/g)]
  for (const [, name, body] of blocks) {
    const mode: Mode = name.endsWith("-dark") ? "dark" : "light"
    if (mode === "light") out.name ??= name
    else out.name ??= name.replace(/-dark$/, "")
    for (const [, key, value] of body.matchAll(/((?:--)?[\w-]+)\s*:\s*([^;]+);/g)) out[mode][key] = value.trim()
  }
  return out
}

/**
 * Tokens of an imported theme that differ from what the settings generate: kept as overrides,
 * so the import reproduces the file exactly and the controls still work for the rest.
 */
export function diffOverrides(s: ThemeSettings, imported: { light: Tokens; dark: Tokens }): Record<Mode, Tokens> {
  const base = { ...s, overrides: { light: {}, dark: {} } }
  const diff = (mode: Mode) => {
    const generated = generate(base, mode)
    return Object.fromEntries(Object.entries(imported[mode]).filter(([k, v]) => generated[k] !== v))
  }
  return { light: diff("light"), dark: diff("dark") }
}

export type ContrastCheckId =
  | "text-bg" | "text-surface" | "muted-surface" | "muted-bg" | "primary-button" | "primary-surface"
  | "primary-soft" | "danger-button" | "danger-surface" | "success-surface" | "warning-surface"
  | "info-surface" | "focus-surface" | "border-surface"

export interface ContrastCheck {
  /** Stable id (for translated labels). */
  id: ContrastCheckId
  /** English label. */
  label: string
  fg: string
  bg: string
  ratio: number
  /** 4.5 for text, 3 for large text and non-text (borders, focus rings). */
  min: number
  /** Shown as advice, not as a failure (WCAG asks it only when the border alone marks the control). */
  advisory?: boolean
}

export function contrastChecks(tokens: Tokens): ContrastCheck[] {
  const color = (key: string) => (isHex(tokens[key] ?? "") ? tokens[key] : undefined)
  const pairs: [ContrastCheckId, string, string, string, number, boolean?][] = [
    ["text-bg", "Text / background", "--bz-color-fg", "--bz-color-bg", 4.5],
    ["text-surface", "Text / surface", "--bz-color-fg", "--bz-color-surface", 4.5],
    ["muted-surface", "Muted text / surface", "--bz-color-fg-muted", "--bz-color-surface", 4.5],
    ["muted-bg", "Muted text / background", "--bz-color-fg-muted", "--bz-color-bg", 4.5],
    ["primary-button", "Primary button text", "--bz-color-primary-fg", "--bz-color-primary", 4.5],
    ["primary-surface", "Link, selected tab (primary / surface)", "--bz-color-primary", "--bz-color-surface", 4.5],
    ["primary-soft", "Selected item (primary / soft)", "--bz-color-primary", "--bz-color-primary-soft", 4.5],
    ["danger-button", "Danger button text", "--bz-color-danger-fg", "--bz-color-danger", 4.5],
    ["danger-surface", "Error text / surface", "--bz-color-danger", "--bz-color-surface", 4.5],
    ["success-surface", "Success / surface", "--bz-color-success", "--bz-color-surface", 4.5],
    ["warning-surface", "Warning / surface", "--bz-color-warning", "--bz-color-surface", 4.5],
    ["info-surface", "Info / surface", "--bz-color-info", "--bz-color-surface", 4.5],
    ["focus-surface", "Focus ring / surface", "--bz-color-focus", "--bz-color-surface", 3],
    ["border-surface", "Control border / surface", "--bz-color-border-strong", "--bz-color-surface", 3, true],
  ]
  return pairs.flatMap(([id, label, f, b, min, advisory]) => {
    const fg = color(f)
    const bg = color(b)
    return fg && bg ? [{ id, label, fg, bg, ratio: contrast(fg, bg), min, advisory }] : []
  })
}

/** The checks that fail (advisory ones excluded), for both variants. */
export function contrastFailures(s: ThemeSettings): { mode: Mode; check: ContrastCheck }[] {
  return (["light", "dark"] as const).flatMap((mode) =>
    contrastChecks(generate(s, mode))
      .filter((c) => !c.advisory && c.ratio < c.min)
      .map((check) => ({ mode, check }))
  )
}
