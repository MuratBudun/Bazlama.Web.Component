import { describe, expect, it } from "vitest"
import { applyTheme, contrast, contrastChecks, contrastFailures, DEFAULT_SETTINGS, removeTheme, diffOverrides, ensureContrast, generate, hexToOklch, oklchToHex, parseCss, previewCss, toCss } from "@bazlama/themes/builder"

describe("theme editor: colour", () => {
  it("round-trips hex through OKLCH", () => {
    for (const hex of ["#2563eb", "#dc2626", "#15803d", "#ffffff", "#000000", "#777777"]) {
      expect(oklchToHex(hexToOklch(hex))).toBe(hex)
    }
  })

  it("maps out-of-gamut colours into sRGB", () => {
    expect(oklchToHex({ l: 0.7, c: 0.5, h: 150 })).toMatch(/^#[0-9a-f]{6}$/)
  })

  it("computes WCAG contrast", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 5)
    expect(contrast("#ffffff", "#ffffff")).toBeCloseTo(1, 5)
    expect(contrast("#767676", "#ffffff")).toBeGreaterThanOrEqual(4.5)
  })

  it("darkens or lightens a colour until it reaches a ratio", () => {
    expect(contrast(ensureContrast("#9ca3af", "#ffffff", 4.5), "#ffffff")).toBeGreaterThanOrEqual(4.5)
    expect(contrast(ensureContrast("#1e3a8a", "#141417", 4.5), "#141417")).toBeGreaterThanOrEqual(4.5)
  })
})

describe("theme editor: tokens", () => {
  it("generates readable light and dark variants", () => {
    for (const mode of ["light", "dark"] as const) {
      const failing = contrastChecks(generate(DEFAULT_SETTINGS, mode)).filter((c) => !c.advisory && c.ratio < c.min)
      expect(failing.map((c) => `${mode}: ${c.label} ${c.ratio.toFixed(2)}`)).toEqual([])
    }
  })

  it("layers the dark variant and keeps control borders at 3:1", () => {
    for (const neutral of ["cool", "neutral", "warm", "brand"] as const) {
      const t = generate({ ...DEFAULT_SETTINGS, neutral }, "dark")
      // page → panel → popup get lighter; panels stand apart from the page
      expect(contrast(t["--bz-color-bg"], t["--bz-color-surface"])).toBeGreaterThanOrEqual(1.2)
      expect(contrast(t["--bz-color-surface"], t["--bz-color-surface-raised"])).toBeGreaterThanOrEqual(1.08)
      // hairlines visible, control borders (radio, checkbox, input) at WCAG 1.4.11
      expect(contrast(t["--bz-color-border"], t["--bz-color-surface"])).toBeGreaterThanOrEqual(1.7)
      for (const layer of ["--bz-color-bg", "--bz-color-surface", "--bz-color-surface-raised"])
        expect(contrast(t["--bz-color-border-strong"], t[layer])).toBeGreaterThanOrEqual(3)
      // text and the brand colour read on popups too
      expect(contrast(t["--bz-color-fg-muted"], t["--bz-color-surface-raised"])).toBeGreaterThanOrEqual(4.5)
      expect(contrast(t["--bz-color-primary"], t["--bz-color-surface-raised"])).toBeGreaterThanOrEqual(4.5)
    }
  })

  it("keeps readable text for a light brand colour", () => {
    const tokens = generate({ ...DEFAULT_SETTINGS, primary: "#facc15" }, "light")
    expect(contrast(tokens["--bz-color-primary-fg"], tokens["--bz-color-primary"])).toBeGreaterThanOrEqual(4.5)
  })

  it("leaves the modern-only tokens out of the classic style", () => {
    const tokens = generate({ ...DEFAULT_SETTINGS, style: "classic" }, "light")
    expect(tokens["--bz-badge-ring"]).toBeUndefined()
    expect(previewCss({ ...DEFAULT_SETTINGS, style: "classic" }, "light", ".p")).toContain("--bz-badge-ring: initial;")
  })

  it("applies overrides", () => {
    const tokens = generate({ ...DEFAULT_SETTINGS, overrides: { light: { "--bz-color-bg": "#fafafa" }, dark: {} } }, "light")
    expect(tokens["--bz-color-bg"]).toBe("#fafafa")
  })

  it("writes and reads back a theme file", () => {
    const settings = { ...DEFAULT_SETTINGS, name: "Acme Portal", overrides: { light: { "--bz-color-bg": "#fafafa" }, dark: {} } }
    const css = toCss(settings)
    expect(css).toContain('[data-theme="acme-portal"]')
    expect(css).toContain('[data-theme="acme-portal-dark"]')
    const parsed = parseCss(css)
    expect(parsed.name).toBe("acme-portal")
    expect(parsed.light["--bz-color-primary"]).toBe(DEFAULT_SETTINGS.primary)
    expect(parsed.light["--bz-font-family"]).toBe(DEFAULT_SETTINGS.font)
    expect(diffOverrides(DEFAULT_SETTINGS, parsed)).toEqual({ light: { "--bz-color-bg": "#fafafa" }, dark: {} })
  })

  it("lists contrast failures for a hard brand colour", () => {
    expect(contrastFailures(DEFAULT_SETTINGS)).toEqual([])
    // Yellow on white: links and selected tabs in the light variant are hard to read.
    const failures = contrastFailures({ ...DEFAULT_SETTINGS, primary: "#facc15" })
    expect(failures.some((f) => f.mode === "light" && f.check.id === "primary-surface")).toBe(true)
  })
})

describe("theme builder: run time", () => {
  it("installs a theme in a <style> and returns its data-theme names", () => {
    const names = applyTheme({ ...DEFAULT_SETTINGS, name: "Kiracı A" }, { id: "t1" })
    expect(names).toEqual({ light: "kiraci-a", dark: "kiraci-a-dark" })
    const style = document.getElementById("t1")!
    expect(style.textContent).toContain('[data-theme="kiraci-a"]')
    // A second call updates the same element.
    applyTheme({ ...DEFAULT_SETTINGS, name: "Kiracı A", primary: "#be123c" }, { id: "t1" })
    expect(document.querySelectorAll("#t1")).toHaveLength(1)
    expect(style.textContent).toContain("--bz-color-primary: #be123c;")
    removeTheme("t1")
    expect(document.getElementById("t1")).toBeNull()
  })
})
