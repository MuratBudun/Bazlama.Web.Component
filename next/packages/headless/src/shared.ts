import { signal, type Signal } from "@bazlama/core"

/** Sets `name="true"` when on, removes it when off. */
export function toggleAria(el: Element, name: string, on: boolean): void {
  if (on) el.setAttribute(name, "true")
  else el.removeAttribute(name)
}

export function setAttr(el: Element, name: string, value: string | null | undefined): void {
  if (value == null || value === "") el.removeAttribute(name)
  else if (el.getAttribute(name) !== value) el.setAttribute(name, value)
}

/** Options are read from attributes so they work before <bz-option> is upgraded. */
export const optionValue = (el: Element) => el.getAttribute("value") ?? el.textContent!.trim()
export const optionLabel = (el: Element) => el.getAttribute("label") ?? el.textContent!.trim()
/** Case- and accent-insensitive form for matching: "İstanbul" and "istanbul" both become "istanbul". */
export const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
export const isDisabled = (el: Element) =>
  el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true"

export interface ListNavigation {
  active: Signal<HTMLElement | null>
  /** Enabled, visible items in DOM order. */
  enabled(): HTMLElement[]
  move(delta: number): void
  first(): void
  last(): void
  /** Handles arrow/Home/End/Page keys (and typeahead when enabled). Returns true if handled. */
  handleKey(event: KeyboardEvent): boolean
}

/**
 * Headless controller for "active descendant" navigation over a list of items.
 * Focus stays on the owner element; the active item is exposed as a signal.
 */
export function listNavigation(options: {
  items: () => HTMLElement[]
  loop?: boolean
  typeahead?: boolean
}): ListNavigation {
  const active = signal<HTMLElement | null>(null)
  const enabled = () => options.items().filter((el) => !el.hidden && !isDisabled(el))

  const go = (index: number) => {
    const list = enabled()
    if (!list.length) return
    const i = options.loop
      ? (index + list.length) % list.length
      : Math.max(0, Math.min(list.length - 1, index))
    active.set(list[i])
  }
  const move = (delta: number) => {
    const list = enabled()
    const current = list.indexOf(active.peek()!)
    if (current === -1) go(delta > 0 ? 0 : list.length - 1)
    else go(current + delta)
  }

  let buffer = ""
  let timer: ReturnType<typeof setTimeout> | undefined
  const typeahead = (char: string) => {
    clearTimeout(timer)
    timer = setTimeout(() => (buffer = ""), 500)
    buffer += fold(char)
    const list = enabled()
    const start = Math.max(0, list.indexOf(active.peek()!))
    const ordered = [...list.slice(start + (buffer.length === 1 ? 1 : 0)), ...list.slice(0, start + 1)]
    const match = ordered.find((el) => fold(optionLabel(el)).startsWith(buffer))
    if (match) active.set(match)
  }

  const handleKey = (event: KeyboardEvent): boolean => {
    switch (event.key) {
      case "ArrowDown":
        move(1)
        break
      case "ArrowUp":
        move(-1)
        break
      case "Home":
        go(0)
        break
      case "End":
        go(enabled().length - 1)
        break
      case "PageDown":
        move(10)
        break
      case "PageUp":
        move(-10)
        break
      default:
        if (
          !options.typeahead ||
          event.key.length !== 1 ||
          event.ctrlKey ||
          event.metaKey ||
          event.altKey ||
          (event.key === " " && !buffer)
        )
          return false
        typeahead(event.key)
    }
    event.preventDefault()
    return true
  }

  return { active, enabled, move, first: () => go(0), last: () => go(enabled().length - 1), handleKey }
}

/** Bumps a counter whenever the subtree's structure or option attributes change. */
export function observeOptions(host: Element): { version: Signal<number>; disconnect(): void } {
  const version = signal(0)
  const observer = new MutationObserver(() => version.update((n) => n + 1))
  observer.observe(host, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["value", "label", "disabled"],
  })
  return { version, disconnect: () => observer.disconnect() }
}
