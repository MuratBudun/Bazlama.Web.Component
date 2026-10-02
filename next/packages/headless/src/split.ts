import { define, effect, html, prop, uid, untrack } from "@bazlama/core"
import { loadPersisted, savePersisted } from "./shared"

type Orientation = "horizontal" | "vertical"
type Primary = "start" | "end"

/**
 * <bz-split> — two panes with a draggable separator (WAI-ARIA window splitter). For IDE-like
 * layouts: an explorer next to an editor, an editor above a problems panel. Splits nest.
 *
 *   <bz-split size="260" min="160" persist="explorer" label="Gezgini boyutlandır">
 *     <nav>…</nav>
 *     <main>…</main>
 *   </bz-split>
 *
 * - The first child element is the start pane, the rest goes to the end pane.
 * - `orientation`: "horizontal" (side by side) or "vertical" (stacked).
 * - `primary`: the pane that has the size ("start" or "end"); the other takes the rest.
 * - `size` (px) of the primary pane; double click on the separator restores the size it
 *   had at first connection. `min` / `max` bound it (`max` 0: as wide as the other pane's
 *   `min` allows). Fires `resize` { size } (does not bubble).
 * - `collapsible`: Enter on the separator, or dragging far below `min`, collapses the primary
 *   pane; `collapsed` holds the state (reflected). Fires `toggle` { collapsed } (does not bubble).
 * - `persist="key"`: size and collapsed state in localStorage (`bz-split:key`). The saved
 *   value wins over the attributes, as in <bz-shell>.
 *
 * Keyboard on the separator: arrows along the orientation (Shift: bigger steps), Home/End
 * (min/max), Enter (collapse/restore).
 *
 * Anatomy: [data-part=pane][data-pane=start|end], [data-part=separator].
 * Styling hooks: [orientation], [primary], [collapsed], [data-resizing], --bz-split-size,
 * --bz-split-separator-size, --bz-split-separator-color.
 */
export const Split = define("bz-split", {
  props: {
    orientation: prop.string<Orientation>("horizontal", { reflect: true }),
    primary: prop.string<Primary>("start", { reflect: true }),
    size: prop.number(240),
    min: prop.number(120),
    max: prop.number(0),
    collapsible: prop.boolean(),
    collapsed: prop.boolean(false, { reflect: true }),
    persist: prop.string(),
    label: prop.string("Resize"),
  },
  setup(props, ctx) {
    const { host } = ctx
    const id = uid("bz-split")
    const initialSize = props.size.peek()
    let startPane!: HTMLElement
    let endPane!: HTMLElement
    let separator!: HTMLElement

    const nodes = ctx.slot()
    const first = nodes.find((n): n is Element => n.nodeType === Node.ELEMENT_NODE)
    const rest = nodes.filter((n) => n !== first)

    const horizontal = () => props.orientation.peek() !== "vertical"
    const primaryPane = () => (props.primary.peek() === "end" ? endPane : startPane)
    const extent = (el: Element | null | undefined) => {
      const r = el?.getBoundingClientRect()
      return r ? (horizontal() ? r.width : r.height) : 0
    }
    const bounds = () => {
      const min = Math.max(0, props.min.peek())
      const total = extent(host) - extent(separator)
      const room = total > 0 ? total - min : Number.POSITIVE_INFINITY
      const max = Math.max(min, Math.min(props.max.peek() || Number.POSITIVE_INFINITY, room))
      return { min, max }
    }
    const clamp = (v: number) => {
      const { min, max } = bounds()
      return Math.round(Math.min(max, Math.max(min, v)))
    }
    /** +1 when moving the pointer right (or down) grows the primary pane. */
    const direction = () => {
      const rtl = horizontal() && getComputedStyle(host).direction === "rtl"
      return (props.primary.peek() === "start") !== rtl ? 1 : -1
    }

    // ------------------------------------------------------------------ persistence (opt-in)
    interface Prefs {
      size?: number
      collapsed?: boolean
    }
    let loadedKey = ""
    effect(() => {
      const key = props.persist()
      if (!key || key === loadedKey) return
      loadedKey = key
      const saved = loadPersisted("bz-split", key) as Prefs | undefined
      if (!saved || typeof saved !== "object") return
      untrack(() => {
        if (typeof saved.size === "number" && Number.isFinite(saved.size) && saved.size > 0)
          props.size.set(Math.round(Math.max(props.min.peek(), props.max.peek() ? Math.min(props.max.peek(), saved.size) : saved.size)))
        if (typeof saved.collapsed === "boolean" && props.collapsible.peek()) props.collapsed.set(saved.collapsed)
      })
    })
    effect(() => {
      const prefs: Prefs = { size: props.size(), collapsed: props.collapsed() }
      const key = props.persist()
      if (key && key === loadedKey) savePersisted("bz-split", key, prefs)
    })

    // ------------------------------------------------------------------ size
    const apply = (size = props.size.peek()) => host.style.setProperty("--bz-split-size", `${Math.max(0, Math.round(size))}px`)
    effect(() => apply(props.size()))

    const describe = (size = extent(primaryPane())) => {
      if (!separator) return
      const { min, max } = bounds()
      separator.setAttribute("aria-valuenow", String(Math.round(size)))
      separator.setAttribute("aria-valuemin", String(min))
      if (Number.isFinite(max)) separator.setAttribute("aria-valuemax", String(Math.round(max)))
      else separator.removeAttribute("aria-valuemax")
    }
    const commit = (size: number) => {
      const value = Math.round(size)
      if (value === props.size.peek()) return apply()
      props.size.set(value)
      ctx.emit("resize", { size: value }, { bubbles: false })
      queueMicrotask(() => describe())
    }
    const setCollapsed = (collapsed: boolean) => {
      if (collapsed === props.collapsed.peek()) return
      props.collapsed.set(collapsed)
      ctx.emit("toggle", { collapsed }, { bubbles: false })
    }
    // The collapsed pane leaves the tab order and the accessibility tree.
    ctx.onMount(() =>
      effect(() => {
        const collapsed = props.collapsed() && props.collapsible()
        host.toggleAttribute("data-collapsed", collapsed)
        startPane.inert = collapsed && props.primary() === "start"
        endPane.inert = collapsed && props.primary() === "end"
        if (props.collapsible()) separator.setAttribute("aria-expanded", String(!collapsed))
        else separator.removeAttribute("aria-expanded")
      })
    )

    const onPointerdown = (e: PointerEvent) => {
      if (e.button !== 0) return
      e.preventDefault()
      separator.setPointerCapture?.(e.pointerId)
      separator.focus({ preventScroll: true })
      const origin = horizontal() ? e.clientX : e.clientY
      const wasCollapsed = props.collapsed.peek() && props.collapsible.peek()
      const startSize = wasCollapsed ? 0 : extent(primaryPane())
      const sign = direction()
      const { min } = bounds()
      let size = startSize
      let collapse = wasCollapsed
      host.setAttribute("data-resizing", "")
      const move = (ev: PointerEvent) => {
        const raw = startSize + ((horizontal() ? ev.clientX : ev.clientY) - origin) * sign
        collapse = props.collapsible.peek() && raw < min / 2
        host.toggleAttribute("data-resize-collapse", collapse)
        if (props.collapsed.peek() && !collapse) setCollapsed(false)
        size = clamp(raw)
        apply(size)
        describe(size)
      }
      const up = () => {
        separator.removeEventListener("pointermove", move)
        separator.removeEventListener("pointerup", up)
        separator.removeEventListener("pointercancel", up)
        host.removeAttribute("data-resizing")
        host.removeAttribute("data-resize-collapse")
        if (collapse) {
          apply()
          setCollapsed(true)
        } else if (Math.round(size) !== Math.round(startSize)) commit(size)
        else apply()
      }
      separator.addEventListener("pointermove", move)
      separator.addEventListener("pointerup", up)
      separator.addEventListener("pointercancel", up)
    }

    const onKeydown = (e: KeyboardEvent) => {
      const keys = horizontal() ? ["ArrowLeft", "ArrowRight"] : ["ArrowUp", "ArrowDown"]
      const { min, max } = bounds()
      const current = props.collapsed.peek() && props.collapsible.peek() ? 0 : extent(primaryPane()) || props.size.peek()
      let next: number | null = null
      if (keys.includes(e.key)) next = current + (e.key === keys[1] ? 1 : -1) * direction() * (e.shiftKey ? 64 : 16)
      else if (e.key === "Home") next = min
      else if (e.key === "End" && Number.isFinite(max)) next = max
      else if (e.key === "Enter" && props.collapsible.peek()) {
        e.preventDefault()
        setCollapsed(!props.collapsed.peek())
        return
      } else return
      e.preventDefault()
      if (props.collapsed.peek()) setCollapsed(false)
      commit(clamp(next))
    }

    ctx.onMount(() => queueMicrotask(() => describe()))

    return html`
      <div data-part="pane" data-pane="start" id=${`${id}-start`} ref=${(el: HTMLElement) => (startPane = el)}>${first ?? null}</div>
      <div
        data-part="separator"
        role="separator"
        tabindex="0"
        aria-orientation=${() => (props.orientation() === "vertical" ? "horizontal" : "vertical")}
        aria-controls=${() => `${id}-${props.primary()}`}
        aria-label=${props.label}
        aria-keyshortcuts=${() => (props.orientation() === "vertical" ? "ArrowUp ArrowDown Home End Enter" : "ArrowLeft ArrowRight Home End Enter")}
        ref=${(el: HTMLElement) => (separator = el)}
        @pointerdown=${onPointerdown}
        @dblclick=${() => {
          if (props.collapsed.peek()) setCollapsed(false)
          commit(clamp(initialSize))
        }}
        @keydown=${onKeydown}
        @focus=${() => describe()}
        @pointerenter=${() => describe()}
      ></div>
      <div data-part="pane" data-pane="end" id=${`${id}-end`} ref=${(el: HTMLElement) => (endPane = el)}>${rest}</div>
    `
  },
})

export type SplitElement = InstanceType<typeof Split>
