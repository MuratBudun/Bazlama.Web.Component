import { themeNames, toCss, type ThemeSettings } from "./theme"

/**
 * Applies a generated theme at run time: its CSS goes into a <style> element (created once,
 * updated on every call) and the returned names go on an element's data-theme, e.g.
 *
 *   const names = applyTheme(settings)
 *   document.documentElement.dataset.theme = dark ? names.dark : names.light
 *
 * `id`: the <style> element's id, so several run-time themes can live side by side.
 */
export function applyTheme(settings: ThemeSettings, { id = "bz-runtime-theme" }: { id?: string } = {}): { light: string; dark: string } {
  let style = document.getElementById(id) as HTMLStyleElement | null
  if (!style) {
    style = Object.assign(document.createElement("style"), { id })
    document.head.append(style)
  }
  style.textContent = toCss(settings)
  return themeNames(settings)
}

/** Removes a theme added by applyTheme (elements still naming it fall back to :root). */
export function removeTheme(id = "bz-runtime-theme"): void {
  document.getElementById(id)?.remove()
}
