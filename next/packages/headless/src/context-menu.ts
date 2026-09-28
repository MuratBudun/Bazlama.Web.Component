import { define, effect, html, onCleanup, prop } from "@bazlama/core"
import { openMenu, type MenuElement, type MenuItemData } from "./menu"

/**
 * Desktop-style context menus (right click), declarative or programmatic:
 *
 *   <bz-context-menu for="orders" selector="tbody tr">
 *     <bz-menu-item value="open" icon="external-link">Aç</bz-menu-item>
 *     <bz-menu-item value="delete" variant="danger" shortcut="Del">Sil</bz-menu-item>
 *   </bz-context-menu>
 *
 *   contextMenu(el, (event) => items | null, (value, event) => …)
 *
 * Opens on right click (at the cursor), the keyboard context-menu key / Shift+F10 (next to
 * the focused element) and a long press on touch screens (iOS fires no contextmenu event).
 * Right click elsewhere while open moves the menu; press-drag-release selects.
 */

export interface ContextRequest {
  /** Where to open: the cursor, or the focused element for keyboard requests. */
  anchor: Element | { x: number; y: number }
  /** The element the request happened on. */
  origin: Element
  event: Event
}

/**
 * Calls `handler` for context-menu requests on `target`. Return true from the handler when
 * the request was used (the browser menu is then suppressed). Returns a remover.
 */
export function onContextRequest(target: Element, handler: (request: ContextRequest) => boolean): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined
  let start: { x: number; y: number } | null = null
  let suppressClick = false

  const onContextmenu = (e: Event) => {
    clearTimeout(timer)
    const event = e as MouseEvent
    // Keyboard requests (context-menu key, Shift+F10): Chrome reports button -1 with a point
    // inside the element, other browsers (0, 0). Anchor to the element instead.
    const keyboard = event.button === -1 || (event.button !== 2 && event.clientX === 0 && event.clientY === 0)
    const origin = event.target as Element
    const anchor = keyboard ? origin : { x: event.clientX, y: event.clientY }
    if (handler({ anchor, origin, event })) event.preventDefault()
  }
  const onPointerdown = (e: Event) => {
    const event = e as PointerEvent
    if (event.pointerType !== "touch") return
    start = { x: event.clientX, y: event.clientY }
    const origin = event.target as Element
    clearTimeout(timer)
    timer = setTimeout(() => {
      if (!start) return
      if (handler({ anchor: { ...start }, origin, event })) {
        suppressClick = true
        navigator.vibrate?.(10)
      }
    }, 550)
  }
  const cancel = () => {
    clearTimeout(timer)
    start = null
  }
  const onPointermove = (e: Event) => {
    const event = e as PointerEvent
    if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) cancel()
  }
  // The finger lifting after a long press must not click the element under it.
  const onClick = (e: Event) => {
    if (!suppressClick) return
    suppressClick = false
    e.preventDefault()
    e.stopPropagation()
  }

  target.addEventListener("contextmenu", onContextmenu)
  target.addEventListener("pointerdown", onPointerdown)
  target.addEventListener("pointermove", onPointermove)
  target.addEventListener("pointerup", cancel)
  target.addEventListener("pointercancel", cancel)
  target.addEventListener("click", onClick, true)
  return () => {
    cancel()
    target.removeEventListener("contextmenu", onContextmenu)
    target.removeEventListener("pointerdown", onPointerdown)
    target.removeEventListener("pointermove", onPointermove)
    target.removeEventListener("pointerup", cancel)
    target.removeEventListener("pointercancel", cancel)
    target.removeEventListener("click", onClick, true)
  }
}

/**
 * Programmatic context menu. `items` may depend on the event (e.g. the clicked row);
 * returning null keeps the browser menu. Returns a remover.
 */
export function contextMenu(
  target: Element,
  items: MenuItemData[] | ((event: MouseEvent) => MenuItemData[] | null),
  onSelect?: (value: string, event: MouseEvent) => void
): () => void {
  return onContextRequest(target, ({ anchor, event }) => {
    const list = typeof items === "function" ? items(event as MouseEvent) : items
    if (!list) return false
    void openMenu({ items: list, anchor }).then((value) => {
      if (value !== undefined) onSelect?.(value, event as MouseEvent)
    })
    return true
  })
}

/**
 * <bz-context-menu for="id" selector="css"> — declarative context menu; children are menu
 * items (bz-menu-item, -separator, -group, nested bz-menu). Target: the element with id
 * `for`, or the parent element. With `selector`, it opens only on matching elements inside
 * the target (e.g. "tbody tr") and exposes the matched element as `contextTarget`.
 *
 * Events: cancelable `before-open` { target, event } (preventDefault → browser menu;
 * a good place to enable/disable items for the clicked row), and the menu's `select`
 * { value, item, checked } — read `contextTarget` for the row.
 */
export const ContextMenu = define("bz-context-menu", {
  props: {
    for: prop.string(),
    selector: prop.string(),
    disabled: prop.boolean(),
    label: prop.string(),
    /** The element the menu was opened for (set before `before-open`). */
    contextTarget: prop.object<Element | null>(null),
  },
  setup(props, ctx) {
    const { host } = ctx
    let menu!: MenuElement

    const target = () => (props.for() ? document.getElementById(props.for()) : host.parentElement)

    ctx.onMount(() =>
      effect(() => {
        const el = target()
        if (!el) return
        const remove = onContextRequest(el, ({ anchor, origin, event }) => {
          if (props.disabled.peek()) return false
          const selector = props.selector.peek()
          const matched = selector ? origin.closest(selector) : el
          if (!matched || !el.contains(matched)) return false
          props.contextTarget.set(matched)
          if (!ctx.emit("before-open", { target: matched, event }, { cancelable: true })) return false
          // Keyboard requests anchor to the matched element rather than the focused child.
          menu.show(anchor instanceof Element ? matched : anchor)
          return true
        })
        onCleanup(remove)
      })
    )

    return html`<bz-menu label=${() => props.label() || null} ref=${(el: MenuElement) => (menu = el)}>${ctx.slot()}</bz-menu>`
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "bz-context-menu": InstanceType<typeof ContextMenu>
  }
}
