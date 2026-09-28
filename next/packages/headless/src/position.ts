/**
 * Places a floating element (popover, menu, tooltip) next to an anchor, without libraries.
 *
 * placement = side[-align]: "bottom-start", "right-start", "top", …
 * - Flips to the opposite side when the preferred one has less room.
 * - Shifts along the cross axis to stay in the viewport (`padding` from the edges).
 * - `fitHeight`: limits max-height to the room on the chosen side (long menus scroll).
 * - Sets position: fixed + left/top inline (overrides the UA popover `inset/margin`),
 *   `data-placement`, and --bz-anchor-x / --bz-anchor-y (anchor center relative to the
 *   floating element, for arrows).
 * - `start`/`end` follow the text direction (RTL aware).
 */

export type Side = "top" | "bottom" | "left" | "right"
export type Placement = Side | `${Side}-start` | `${Side}-end`

export interface PlaceOptions {
  placement?: Placement
  /** Gap between anchor and floating element (px). */
  offset?: number
  /** Minimum distance from the viewport edges (px). */
  padding?: number
  fitHeight?: boolean
}

export interface PlaceResult {
  placement: Placement
  x: number
  y: number
}

type Anchor = Element | DOMRect | { x: number; y: number }

const OPPOSITE: Record<Side, Side> = { top: "bottom", bottom: "top", left: "right", right: "left" }

function rectOf(anchor: Anchor): { left: number; top: number; right: number; bottom: number; width: number; height: number } {
  if (anchor instanceof Element) return anchor.getBoundingClientRect()
  if ("width" in anchor) return anchor
  return { left: anchor.x, top: anchor.y, right: anchor.x, bottom: anchor.y, width: 0, height: 0 }
}

export function place(anchor: Anchor, floating: HTMLElement, options: PlaceOptions = {}): PlaceResult {
  const { placement = "bottom-start", offset = 6, padding = 8, fitHeight = false } = options
  const [preferred, align = "center"] = placement.split("-") as [Side, "start" | "end" | "center" | undefined]
  const r = rectOf(anchor)
  const vw = document.documentElement.clientWidth
  const vh = document.documentElement.clientHeight
  const rtl = getComputedStyle(floating).direction === "rtl"

  const s = floating.style
  s.position = "fixed"
  s.inset = "auto"
  s.margin = "0"
  if (fitHeight) s.maxHeight = ""
  const w = floating.offsetWidth
  let h = floating.offsetHeight

  const room: Record<Side, number> = {
    top: r.top - offset - padding,
    bottom: vh - r.bottom - offset - padding,
    left: r.left - offset - padding,
    right: vw - r.right - offset - padding,
  }
  const need = (side: Side) => (side === "top" || side === "bottom" ? h : w)
  const side = need(preferred) <= room[preferred] || room[preferred] >= room[OPPOSITE[preferred]] ? preferred : OPPOSITE[preferred]
  const vertical = side === "top" || side === "bottom"

  if (fitHeight) {
    const available = Math.floor(vertical ? room[side] : vh - padding * 2)
    if (h > available) {
      s.maxHeight = `${Math.max(available, 80)}px`
      h = floating.offsetHeight
    }
  }

  // start/end alignment flips to the other edge when it would overflow (desktop behavior:
  // a context menu at the right edge of the screen opens to the left of the cursor).
  const fitsX = (v: number) => v >= padding && v + w <= vw - padding
  const fitsY = (v: number) => v >= padding && v + h <= vh - padding
  let x: number
  let y: number
  let alignUsed = align
  if (vertical) {
    y = side === "top" ? r.top - offset - h : r.bottom + offset
    const start = rtl ? r.right - w : r.left
    const end = rtl ? r.left : r.right - w
    // A point anchor has no width: "end" means the cursor is the right edge.
    const endAt = r.width === 0 && !rtl ? r.left - w : end
    if (align === "start") {
      x = start
      if (!fitsX(start) && fitsX(endAt)) (x = endAt), (alignUsed = "end")
    } else if (align === "end") {
      x = end
      if (!fitsX(end) && fitsX(start)) (x = start), (alignUsed = "start")
    } else x = r.left + r.width / 2 - w / 2
  } else {
    x = side === "left" ? r.left - offset - w : r.right + offset
    if (align === "start") {
      y = r.top
      if (!fitsY(y) && fitsY(r.bottom - h)) (y = r.bottom - h), (alignUsed = "end")
    } else if (align === "end") {
      y = r.bottom - h
      if (!fitsY(y) && fitsY(r.top)) (y = r.top), (alignUsed = "start")
    } else y = r.top + r.height / 2 - h / 2
  }
  x = Math.round(Math.max(padding, Math.min(x, vw - w - padding)))
  y = Math.round(Math.max(padding, Math.min(y, vh - h - padding)))

  s.left = `${x}px`
  s.top = `${y}px`
  s.setProperty("--bz-anchor-x", `${Math.round(r.left + r.width / 2 - x)}px`)
  s.setProperty("--bz-anchor-y", `${Math.round(r.top + r.height / 2 - y)}px`)
  const result = (alignUsed === "center" ? side : `${side}-${alignUsed}`) as Placement
  floating.setAttribute("data-placement", result)
  return { placement: result, x, y }
}

/** Popover helpers with a fallback (hidden attribute) where the Popover API is missing. */
export const supportsPopover = () => typeof HTMLElement !== "undefined" && typeof HTMLElement.prototype.showPopover === "function"

export function showPopup(el: HTMLElement): void {
  if (supportsPopover() && el.hasAttribute("popover")) {
    if (!el.matches(":popover-open")) el.showPopover()
  } else el.hidden = false
}

export function hidePopup(el: HTMLElement): void {
  if (supportsPopover() && el.hasAttribute("popover")) {
    if (el.matches(":popover-open")) el.hidePopover()
  } else el.hidden = true
}

export function isPopupOpen(el: HTMLElement): boolean {
  return supportsPopover() && el.hasAttribute("popover") ? el.matches(":popover-open") : !el.hidden
}
