import { define, html, prop } from "@bazlama/core"

/**
 * SVG icons: one shared sprite, one <symbol> per used icon, cheap <svg><use> instances.
 *
 *   defineIcons({ home: { body: '<path d="…"/>' } })   // register (camelCase keys → kebab names)
 *   icon("home")                                     // SVGSVGElement, for templates and hot paths
 *   <bz-icon name="home" label="Ana sayfa">           // element form
 *
 * Icons use currentColor and 1em by default; stroke width comes from --bz-icon-stroke-width.
 * `body` is inserted as SVG markup: register trusted, developer-provided icons only.
 */

export interface IconDefinition {
  /** Default: "0 0 24 24". */
  viewBox?: string
  /** Inner SVG markup (path, circle, rect…). */
  body: string
  /** "stroke" (default): outlined with currentColor. "fill": filled with currentColor. */
  mode?: "stroke" | "fill"
}

export interface IconOptions {
  /** Accessible name. Without it the icon is decorative (aria-hidden). */
  label?: string
  /** CSS length or px number; default "1em". */
  size?: string | number
  /** Copy the shapes into the <svg> instead of <use>: needed inside shadow roots. */
  inline?: boolean
}

const SVG_NS = "http://www.w3.org/2000/svg"
const registry = new Map<string, IconDefinition>()
const inSprite = new Set<string>()
const requested = new Set<string>()
const templates = new Map<string, SVGSVGElement>()
let sprite: SVGSVGElement | null = null

const toKebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
const symbolId = (name: string) => `bz-icon-${name.replace(/[^\w-]/g, "_")}`

function paint(el: SVGElement, def: IconDefinition): void {
  el.setAttribute("viewBox", def.viewBox ?? "0 0 24 24")
  if ((def.mode ?? "stroke") === "stroke") {
    el.setAttribute("fill", "none")
    el.setAttribute("stroke", "currentColor")
    el.setAttribute("stroke-linecap", "round")
    el.setAttribute("stroke-linejoin", "round")
  } else {
    el.setAttribute("fill", "currentColor")
  }
}

function ensureSymbol(name: string): void {
  const def = registry.get(name)
  if (!def || inSprite.has(name)) return
  if (!sprite || !sprite.isConnected) {
    sprite = document.createElementNS(SVG_NS, "svg")
    sprite.id = "bz-icon-sprite"
    sprite.setAttribute("aria-hidden", "true")
    sprite.style.cssText = "position:absolute;width:0;height:0;overflow:hidden"
    document.body.appendChild(sprite)
    inSprite.clear()
  }
  const symbol = document.createElementNS(SVG_NS, "symbol")
  symbol.id = symbolId(name)
  paint(symbol, def)
  symbol.innerHTML = def.body
  sprite.appendChild(symbol)
  inSprite.add(name)
}

/** Registers icons. Keys may be kebab-case or camelCase ("chevronRight" → "chevron-right"). */
export function defineIcons(icons: Record<string, IconDefinition>): void {
  templates.clear()
  for (const [key, def] of Object.entries(icons)) {
    const name = toKebab(key)
    registry.set(name, def)
    if (inSprite.has(name)) {
      // Redefinition: replace the symbol; existing <use> elements follow the id.
      document.getElementById(symbolId(name))?.remove()
      inSprite.delete(name)
      ensureSymbol(name)
    } else if (requested.has(name)) {
      // Used before it was defined: the empty <use> elements start rendering now.
      ensureSymbol(name)
    }
  }
}

/** Registers an icon from a complete <svg> string (e.g. exported from a design tool). */
export function defineIconFromSvg(name: string, svg: string): void {
  const doc = new DOMParser().parseFromString(svg.trim(), "image/svg+xml")
  const root = doc.documentElement
  if (root.localName !== "svg" || doc.querySelector("parsererror"))
    throw new Error(`bazlama: invalid SVG for icon "${name}"`)
  const stroke = root.getAttribute("stroke")
  const fill = root.getAttribute("fill")
  defineIcons({
    [name]: {
      viewBox: root.getAttribute("viewBox") ?? undefined,
      body: root.innerHTML,
      mode: fill === "none" || (stroke && stroke !== "none") ? "stroke" : "fill",
    },
  })
}

export const hasIcon = (name: string) => registry.has(name)
export const iconNames = () => [...registry.keys()]

function create(name: string, size: string, inline: boolean): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg")
  svg.setAttribute("class", "bz-icon")
  svg.setAttribute("data-icon", name)
  svg.setAttribute("width", size)
  svg.setAttribute("height", size)
  // Presentation attribute: a CSS rule (--bz-icon-stroke-width) overrides it.
  svg.setAttribute("stroke-width", "2")
  svg.setAttribute("aria-hidden", "true")
  svg.setAttribute("focusable", "false")
  const def = registry.get(name)
  if (inline && def) {
    paint(svg, def)
    svg.innerHTML = def.body
    return svg
  }
  const use = document.createElementNS(SVG_NS, "use")
  use.setAttribute("href", `#${symbolId(name)}`)
  svg.appendChild(use)
  return svg
}

/** Creates an icon element. Unknown names render empty and start working once defined. */
export function icon(name: string, options: IconOptions = {}): SVGSVGElement {
  const size =
    options.size == null || options.size === "" ? "1em" : typeof options.size === "number" ? `${options.size}px` : options.size
  const inline = !!options.inline
  if (registry.has(name)) ensureSymbol(name)
  else if (!requested.has(name))
    queueMicrotask(() => {
      if (!registry.has(name)) console.warn(`bazlama: icon "${name}" is not defined (see defineIcons)`)
    })
  requested.add(name)

  // Cloning a cached instance is cheaper than building one (hot path in trees and tables).
  const key = `${name}|${size}|${inline}`
  let template = templates.get(key)
  if (!template) templates.set(key, (template = create(name, size, inline)))
  const svg = template.cloneNode(true) as SVGSVGElement
  if (options.label) {
    svg.removeAttribute("aria-hidden")
    svg.setAttribute("role", "img")
    svg.setAttribute("aria-label", options.label)
  }
  return svg
}

/** <bz-icon name="home" label="Ana sayfa" size="20">: element form of icon(). */
export const Icon = define("bz-icon", {
  props: {
    name: prop.string(),
    label: prop.string(),
    size: prop.string(),
  },
  setup: (props) =>
    html`${() => (props.name() ? icon(props.name(), { label: props.label(), size: props.size() }) : null)}`,
})

declare global {
  interface HTMLElementTagNameMap {
    "bz-icon": InstanceType<typeof Icon>
  }
}
