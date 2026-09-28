import { render } from "@bazlama/core"
import { place } from "./position"

/**
 * Tooltips with one shared bubble and document-level delegation (no per-element cost):
 *
 *   <bz-button data-tooltip="Kaydet (Ctrl+S)">…</bz-button>
 *   <span data-tooltip="Sağda" data-tooltip-placement="right">?</span>
 *   tooltip(el, html`<b>Zengin</b> içerik`, { placement: "bottom" })   // programmatic
 *
 * - Shows after a delay on hover (immediately while "warm", i.e. right after another
 *   tooltip), and at once on keyboard focus (not on focus from a click). Not on touch.
 * - The pointer can move onto the bubble (WCAG 1.4.13); Escape hides it without closing
 *   the dialog around it.
 * - The bubble is a manual popover (top layer, above modal dialogs), placed on the
 *   preferred side and flipped/clamped to stay in the viewport.
 * - The trigger gets aria-describedby while the tooltip is shown. A tooltip describes; an
 *   icon-only button still needs its own aria-label.
 *
 * Anatomy: [data-bz-tooltip][data-placement] (role=tooltip), styling hook [data-open].
 */

export type TooltipPlacement = "top" | "bottom" | "left" | "right"

export interface TooltipOptions {
  placement?: TooltipPlacement
}

interface Registration {
  content: unknown
  placement?: TooltipPlacement
}

export const tooltipDefaults = { delay: 500, hideDelay: 100, warmFor: 400, offset: 8 }

const registry = new WeakMap<Element, Registration>()
let bubble: HTMLElement | null = null
let current: HTMLElement | null = null
let showTimer: ReturnType<typeof setTimeout> | undefined
let hideTimer: ReturnType<typeof setTimeout> | undefined
let lastHidden = 0
/** Focus caused by a pointer (click) does not show the tooltip; keyboard focus does. */
let pointerFocus = false

const BUBBLE_ID = "bz-tooltip"

/** Attaches (or with `content` null, removes) a programmatic tooltip. Returns a remover. */
export function tooltip(el: Element, content: unknown, options: TooltipOptions = {}): () => void {
  install()
  if (content == null || content === "") {
    registry.delete(el)
    if (current === el) hide()
    return () => {}
  }
  registry.set(el, { content, placement: options.placement })
  if (current === el) show(el as HTMLElement)
  return () => tooltip(el, null)
}

function triggerFrom(node: EventTarget | null): HTMLElement | null {
  let el = node instanceof Element ? node : null
  while (el) {
    if (el === bubble) return null
    if (registry.has(el) || el.hasAttribute("data-tooltip")) return el as HTMLElement
    el = el.parentElement
  }
  return null
}

function contentOf(el: Element): unknown {
  return registry.get(el)?.content ?? el.getAttribute("data-tooltip")
}

function placementOf(el: Element): TooltipPlacement {
  return (registry.get(el)?.placement ?? el.getAttribute("data-tooltip-placement") ?? "top") as TooltipPlacement
}

function ensureBubble(): HTMLElement {
  if (bubble?.isConnected) return bubble
  bubble = document.createElement("div")
  bubble.id = BUBBLE_ID
  bubble.setAttribute("data-bz-tooltip", "")
  bubble.setAttribute("role", "tooltip")
  if (typeof bubble.showPopover === "function") bubble.popover = "manual"
  bubble.addEventListener("pointerenter", () => clearTimeout(hideTimer))
  bubble.addEventListener("pointerleave", (e) => {
    if (!current?.contains(e.relatedTarget as Node)) scheduleHide()
  })
  document.body.append(bubble)
  return bubble
}

function describe(el: HTMLElement, on: boolean): void {
  const ids = (el.getAttribute("aria-describedby") ?? "").split(/\s+/).filter((id) => id && id !== BUBBLE_ID)
  if (on) ids.push(BUBBLE_ID)
  if (ids.length) el.setAttribute("aria-describedby", ids.join(" "))
  else el.removeAttribute("aria-describedby")
}

function show(el: HTMLElement): void {
  clearTimeout(showTimer)
  clearTimeout(hideTimer)
  const content = contentOf(el)
  if (content == null || content === "" || !el.isConnected) return
  const b = ensureBubble()
  if (current && current !== el) describe(current, false)
  current = el
  b.replaceChildren()
  render(content, b)
  describe(el, true)
  b.setAttribute("data-open", "")
  if (typeof b.showPopover === "function") {
    // Re-show: a dialog opened meanwhile would otherwise cover it.
    if (b.matches(":popover-open")) b.hidePopover()
    b.showPopover()
  }
  place(el, b, { placement: placementOf(el), offset: tooltipDefaults.offset, padding: 4 })
}

function hide(): void {
  clearTimeout(showTimer)
  clearTimeout(hideTimer)
  if (!current) return
  describe(current, false)
  current = null
  lastHidden = Date.now()
  if (!bubble) return
  bubble.removeAttribute("data-open")
  if (typeof bubble.hidePopover === "function" && bubble.matches(":popover-open")) bubble.hidePopover()
}

function scheduleShow(el: HTMLElement): void {
  clearTimeout(hideTimer)
  if (current === el) return
  clearTimeout(showTimer)
  const warm = current !== null || Date.now() - lastHidden < tooltipDefaults.warmFor
  if (warm) show(el)
  else showTimer = setTimeout(() => show(el), tooltipDefaults.delay)
}

function scheduleHide(): void {
  clearTimeout(showTimer)
  clearTimeout(hideTimer)
  hideTimer = setTimeout(hide, tooltipDefaults.hideDelay)
}

let installed = false
function install(): void {
  if (installed || typeof document === "undefined") return
  installed = true
  document.addEventListener("pointerover", (e) => {
    if (e.pointerType === "touch") return
    const el = triggerFrom(e.target)
    if (el) scheduleShow(el)
  })
  document.addEventListener("pointerout", (e) => {
    if (!current && showTimer === undefined) return
    const from = triggerFrom(e.target)
    if (!from) return
    const to = e.relatedTarget as Node | null
    if (to && (from.contains(to) || bubble?.contains(to))) return
    if (from === current) scheduleHide()
    else clearTimeout(showTimer)
  })
  document.addEventListener(
    "pointerdown",
    (e) => {
      pointerFocus = true
      if (!bubble?.contains(e.target as Node)) hide()
    },
    true
  )
  document.addEventListener("keydown", () => (pointerFocus = false), true)
  document.addEventListener("focusin", (e) => {
    const el = triggerFrom(e.target)
    if (el && !pointerFocus) show(el)
  })
  document.addEventListener("focusout", (e) => {
    if (current && triggerFrom(e.target) === current && !bubble?.contains(e.relatedTarget as Node)) hide()
  })
  // Capture: runs before the dialog manager, whose Escape handler skips handled events.
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key !== "Escape" || !current) return
      hide()
      e.preventDefault()
    },
    true
  )
  addEventListener("scroll", () => current && hide(), { capture: true, passive: true })
  addEventListener("resize", () => current && hide())
}

// data-tooltip works as soon as the module is loaded.
install()

/** The element whose tooltip is shown (for tests and debugging). */
export const activeTooltip = () => current
