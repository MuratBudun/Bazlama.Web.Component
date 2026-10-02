import { define, effect, flush, html, onCleanup, prop, signal, uid, untrack } from "@bazlama/core"
import { loadPersisted, savePersisted } from "./shared"

/**
 * <bz-shell> — application layout: header, footer, start and end sides around the content.
 * Every region except the content is optional; what goes into a region is up to the app
 * (<bz-header>, <bz-footer>, a <nav>, a <bz-tree>…).
 *
 *   <bz-shell variant="classic" breakpoint="960">
 *     <bz-header slot="header" title="Uygulama"></bz-header>
 *     <nav slot="start">…</nav>
 *     <bz-outlet></bz-outlet>                      ← default slot: content (<main>)
 *     <aside slot="end">…</aside>
 *     <bz-footer slot="footer">…</bz-footer>
 *   </bz-shell>
 *
 * The shell does the layout work:
 * - `scroll-mode`: "content" (default, an app frame): the shell is as tall as the viewport
 *   (`--bz-shell-height`, e.g. 100% inside a box); header and footer stay put and only the
 *   content and the side panels scroll, each on its own. The content is a
 *   `[data-scroll-container]`, which the router uses to restore scroll positions. Put
 *   `data-shell-fill` on an element inside the content to give it the remaining height
 *   (e.g. a data grid). "page": the document scrolls; header and side panels are sticky.
 * - `variant`: "classic" (header and footer span the width) or "sidebar" (the sides take the
 *   full height); `--bz-shell-areas` accepts any grid-template-areas.
 * - Wide (shell ≥ `breakpoint` px): the start side collapses to a narrow rail
 *   (`start-collapsed`), or hides entirely with `start-collapse="hidden"` (more room for a
 *   workspace; the menu button brings it back); the end side hides (`end-collapsed`). The side panels stick below
 *   the header and scroll on their own.
 * - `compact-footer` (narrow screens): "sticky" (default) keeps the footer at the bottom,
 *   "scroll" puts it after the content (the shell scrolls and becomes the
 *   [data-scroll-container]; the header stays; a data-shell-fill element gets the viewport
 *   height below the header), "hidden" hides it.
 * - Compact: both sides become drawers (`start-open`, `end-open`, one at a time). While one
 *   is open the rest is inert, focus moves in (current item first); Escape, the backdrop or a
 *   link inside close it and focus returns to the button that opened it.
 * - Any element with `data-shell-toggle="start|end"` inside the shell toggles that side; the
 *   shell keeps its aria-expanded / aria-controls up to date. Methods: toggle(side),
 *   open(side), close(side). Fires `toggle` { side, open, compact }.
 * - `busy` shows a progress bar; a "skip to content" button is the first tab stop.
 * - `persist="key"` (opt-in): the side widths and collapsed states are saved in localStorage
 *   under `bz-shell:<key>` and restored on load (saved values win over the initial
 *   attributes; widths are clamped to min/max). Without it nothing is stored; `resize` and
 *   `toggle` fire either way, e.g. to save per user on a server.
 * - `resizable`: a separator on each side's inner edge (wide mode). Drag it, or focus it and
 *   use ←/→ (Shift: bigger steps), Home/End (min/max), Enter or double click (default width).
 *   Dragging far below `min-side-width` collapses the side (start: rail, end: hidden). Widths
 *   live in `start-width` / `end-width` (px, 0 = CSS default) and `resize` { side, width }
 *   fires when the user changes one (width null = back to default); save them in the app.
 *
 * Anatomy: [data-part=skip|header|start|start-panel|start-resizer|content|end|end-panel|
 * end-resizer|footer|backdrop|progress].
 * Styling hooks: [variant], [data-compact], [data-drawer="start|end"], [start-open], [end-open],
 * [start-collapsed], [start-collapse="rail|hidden"], [end-collapsed], [busy], [resizable], [data-resizing="start|end"],
 * [data-resize-collapse], [data-has-header|footer|start|end].
 */

export type ShellSide = "start" | "end"

interface Controller {
  toggle(side: ShellSide): void
  open(side: ShellSide): void
  close(side: ShellSide): void
}

/** Content keeps at least this much room when a side is dragged wider. */
const CONTENT_MIN_WIDTH = 320

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

const ShellBase = define("bz-shell", {
  props: {
    variant: prop.string<"classic" | "sidebar">("classic", { reflect: true }),
    scrollMode: prop.string<"content" | "page">("content", { reflect: true }),
    /**
     * The footer on narrow screens (compact): "sticky" stays at the bottom (default), "scroll"
     * comes after the content (the shell scrolls, the header stays), "hidden" is not shown.
     */
    compactFooter: prop.string<"sticky" | "scroll" | "hidden">("sticky", { reflect: true }),
    /** Width (px) of the shell below which the sides become drawers. */
    breakpoint: prop.number(960),
    startOpen: prop.boolean(false, { reflect: true }),
    endOpen: prop.boolean(false, { reflect: true }),
    startCollapsed: prop.boolean(false, { reflect: true }),
    /** How the collapsed start side looks in wide mode: an icon rail or nothing. */
    startCollapse: prop.string<"rail" | "hidden">("rail", { reflect: true }),
    endCollapsed: prop.boolean(false, { reflect: true }),
    busy: prop.boolean(false, { reflect: true }),
    skipLabel: prop.string("Skip to content"),
    resizable: prop.boolean(false, { reflect: true }),
    /** Width of the start side in px (0: `--bz-shell-start-width`, default 15rem). */
    startWidth: prop.number(0),
    /** Width of the end side in px (0: `--bz-shell-end-width`, default 20rem). */
    endWidth: prop.number(0),
    minSideWidth: prop.number(160),
    maxSideWidth: prop.number(640),
    resizeLabel: prop.string("Resize panel"),
    /** Storage key: save and restore widths and collapsed states (localStorage `bz-shell:<key>`). */
    persist: prop.string(),
  },
  setup(props, ctx) {
    const host = ctx.host as HTMLElement & { _shell?: Controller }
    const id = uid("bz-shell")
    const compact = signal(false)
    const has = {
      header: ctx.hasSlot("header"),
      footer: ctx.hasSlot("footer"),
      start: ctx.hasSlot("start"),
      end: ctx.hasSlot("end"),
    }
    for (const [region, present] of Object.entries(has)) host.toggleAttribute(`data-has-${region}`, present)
    const parts: Partial<Record<"header" | "footer" | "start" | "end" | "content", HTMLElement>> = {}
    const ref = (name: keyof typeof parts) => (el: HTMLElement) => (parts[name] = el)

    // ------------------------------------------------------------------ measuring
    const measure = () => {
      const width = host.getBoundingClientRect().width
      compact.set(width > 0 && width < props.breakpoint.peek())
      // Sticky side panels sit below the header (and above a sticky footer).
      host.style.setProperty("--bz-shell-header-h", `${parts.header?.offsetHeight ?? 0}px`)
      host.style.setProperty("--bz-shell-footer-h", `${parts.footer?.offsetHeight ?? 0}px`)
      // Keep the separators' values current (screen readers read them on focus).
      if (props.resizable.peek()) queueMicrotask(() => {
        describe("start")
        describe("end")
      })
    }
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(measure)
      ctx.onMount(() => {
        observer.observe(host)
        if (parts.header) observer.observe(parts.header)
        if (parts.footer) observer.observe(parts.footer)
      })
      onCleanup(() => observer.disconnect())
    }
    ctx.onMount(() =>
      effect(() => {
        props.breakpoint()
        measure()
      })
    )

    // ------------------------------------------------------------------ sides
    const openProp = (side: ShellSide) => (side === "start" ? props.startOpen : props.endOpen)
    const collapsedProp = (side: ShellSide) => (side === "start" ? props.startCollapsed : props.endCollapsed)
    const drawer = () => (!compact() ? null : props.startOpen() ? "start" : props.endOpen() ? "end" : null)
    /** compact-footer="scroll" on a narrow screen: the shell itself scrolls (content + footer). */
    const shellScrolls = () => compact() && props.compactFooter() === "scroll" && props.scrollMode() !== "page"
    effect(() => host.toggleAttribute("data-scroll-container", shellScrolls()))
    let opener: HTMLElement | null = null

    effect(() => {
      host.toggleAttribute("data-compact", compact())
      if (!compact()) {
        props.startOpen.set(false)
        props.endOpen.set(false)
      }
    })

    const setSide = (side: ShellSide, open: boolean, source: Element | null = null) => {
      if (!has[side]) return
      if (compact.peek()) {
        if (open) {
          opener = (source as HTMLElement | null) ?? (document.activeElement as HTMLElement | null)
          openProp(side === "start" ? "end" : "start").set(false)
          openProp(side).set(true)
        } else {
          if (!openProp(side).peek()) return
          openProp(side).set(false)
          // Remove `inert` before focusing: an inert element cannot take focus.
          flush()
          if (opener?.isConnected) opener.focus({ preventScroll: true })
          opener = null
        }
      } else collapsedProp(side).set(!open)
      ctx.emit("toggle", { side, open, compact: compact.peek() }, { bubbles: false })
    }
    const isExpanded = (side: ShellSide) => (compact.peek() ? openProp(side).peek() : !collapsedProp(side).peek())
    const toggle = (side: ShellSide, source: Element | null = null) => setSide(side, !isExpanded(side), source)
    host._shell = {
      toggle: (side) => toggle(side),
      open: (side) => setSide(side, true),
      close: (side) => setSide(side, false),
    }
    onCleanup(() => delete host._shell)

    // ------------------------------------------------------------------ persistence (opt-in)
    // Before the width effects: the first layout already uses the saved widths (no animation
    // from the default width on load).
    interface Prefs {
      startWidth?: number
      endWidth?: number
      startCollapsed?: boolean
      endCollapsed?: boolean
    }
    /** Key whose saved state has been loaded; saving waits for it (no overwriting a new key). */
    let loadedKey = ""
    effect(() => {
      const key = props.persist()
      if (!key || key === loadedKey) return
      loadedKey = key
      const saved = loadPersisted("bz-shell", key) as Prefs | undefined
      if (!saved || typeof saved !== "object") return
      untrack(() => {
        const min = Math.max(48, props.minSideWidth.peek())
        const max = props.maxSideWidth.peek() || Number.POSITIVE_INFINITY
        const width = (v: unknown) =>
          typeof v === "number" && Number.isFinite(v) && v >= 0 ? (v === 0 ? 0 : Math.round(Math.min(max, Math.max(min, v)))) : undefined
        const startWidth = width(saved.startWidth)
        const endWidth = width(saved.endWidth)
        if (startWidth !== undefined) props.startWidth.set(startWidth)
        if (endWidth !== undefined) props.endWidth.set(endWidth)
        if (typeof saved.startCollapsed === "boolean") props.startCollapsed.set(saved.startCollapsed)
        if (typeof saved.endCollapsed === "boolean") props.endCollapsed.set(saved.endCollapsed)
      })
    })
    effect(() => {
      const prefs: Prefs = {
        startWidth: props.startWidth(),
        endWidth: props.endWidth(),
        startCollapsed: props.startCollapsed(),
        endCollapsed: props.endCollapsed(),
      }
      const key = props.persist()
      if (key && key === loadedKey) savePersisted("bz-shell", key, prefs)
    })

    // ------------------------------------------------------------------ resizing
    const widthProp = (side: ShellSide) => (side === "start" ? props.startWidth : props.endWidth)
    const syncWidth = (side: ShellSide, width = widthProp(side).peek()) => {
      if (width > 0) host.style.setProperty(`--bz-shell-${side}-width`, `${Math.round(width)}px`)
      else host.style.removeProperty(`--bz-shell-${side}-width`)
    }
    effect(() => syncWidth("start", props.startWidth()))
    effect(() => syncWidth("end", props.endWidth()))

    const rendered = (side: ShellSide) => parts[side]?.getBoundingClientRect().width ?? 0
    const bounds = (side: ShellSide) => {
      const min = Math.max(48, props.minSideWidth.peek())
      const other: ShellSide = side === "start" ? "end" : "start"
      const hostWidth = host.getBoundingClientRect().width
      const room = hostWidth > 0 ? hostWidth - rendered(other) - CONTENT_MIN_WIDTH : Number.POSITIVE_INFINITY
      return { min, max: Math.max(min, Math.min(props.maxSideWidth.peek() || Number.POSITIVE_INFINITY, room)) }
    }
    const clamp = (side: ShellSide, width: number) => {
      const { min, max } = bounds(side)
      return Math.round(Math.min(max, Math.max(min, width)))
    }
    /** +1 when moving the separator to the right widens the side. */
    const direction = (side: ShellSide) => ((side === "start") !== (getComputedStyle(host).direction === "rtl") ? 1 : -1)
    const resizer = (side: ShellSide) => parts[side]?.querySelector<HTMLElement>(`[data-part="${side}-resizer"]`)
    const describe = (side: ShellSide, width = rendered(side)) => {
      const el = resizer(side)
      if (!el) return
      const { min, max } = bounds(side)
      el.setAttribute("aria-valuenow", String(Math.round(width)))
      el.setAttribute("aria-valuemin", String(min))
      if (Number.isFinite(max)) el.setAttribute("aria-valuemax", String(Math.round(max)))
      else el.removeAttribute("aria-valuemax")
    }
    const commitWidth = (side: ShellSide, width: number | null) => {
      const value = width === null ? 0 : Math.round(width)
      if (value === widthProp(side).peek()) return syncWidth(side)
      widthProp(side).set(value)
      ctx.emit("resize", { side, width: width === null ? null : value }, { bubbles: false })
      queueMicrotask(() => describe(side))
    }

    const startDrag = (e: PointerEvent, side: ShellSide) => {
      if (e.button !== 0 || compact.peek()) return
      e.preventDefault()
      const handle = e.currentTarget as HTMLElement
      handle.setPointerCapture?.(e.pointerId)
      handle.focus({ preventScroll: true })
      const startX = e.clientX
      const startWidth = rendered(side)
      const sign = direction(side)
      const { min } = bounds(side)
      let width = startWidth
      let collapse = false
      host.setAttribute("data-resizing", side)
      const move = (ev: PointerEvent) => {
        const raw = startWidth + (ev.clientX - startX) * sign
        // Far below the minimum: letting go collapses the side (as its toggle button would).
        collapse = raw < min / 2
        host.toggleAttribute("data-resize-collapse", collapse)
        width = clamp(side, raw)
        syncWidth(side, width)
        describe(side, width)
      }
      const up = () => {
        handle.removeEventListener("pointermove", move)
        handle.removeEventListener("pointerup", up)
        handle.removeEventListener("pointercancel", up)
        host.removeAttribute("data-resizing")
        host.removeAttribute("data-resize-collapse")
        if (collapse) {
          syncWidth(side)
          setSide(side, false)
        } else if (Math.round(width) !== Math.round(startWidth)) commitWidth(side, width)
        else syncWidth(side)
      }
      handle.addEventListener("pointermove", move)
      handle.addEventListener("pointerup", up)
      handle.addEventListener("pointercancel", up)
    }
    const onResizerKey = (e: KeyboardEvent, side: ShellSide) => {
      const current = rendered(side)
      const { min, max } = bounds(side)
      const step = e.shiftKey ? 64 : 16
      let next: number | null
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") next = current + (e.key === "ArrowRight" ? 1 : -1) * direction(side) * step
      else if (e.key === "Home") next = min
      else if (e.key === "End" && Number.isFinite(max)) next = max
      else if (e.key === "Enter") next = null
      else return
      e.preventDefault()
      commitWidth(side, next === null ? null : clamp(side, next))
    }

    // Drawer: inert background, focus in.
    ctx.onMount(() =>
      effect(() => {
        const side = drawer()
        host.toggleAttribute("data-drawer", !!side)
        if (side) host.setAttribute("data-drawer", side)
        for (const [name, el] of Object.entries(parts)) if (el) el.inert = !!side && name !== side
        if (!side) return
        const panel = parts[side]!
        queueMicrotask(() =>
          (panel.querySelector<HTMLElement>('[aria-current="page"], [aria-selected="true"]') ?? panel.querySelector<HTMLElement>(FOCUSABLE))?.focus()
        )
      })
    )

    // Toggle buttons anywhere inside (but not inside a nested shell): keep ARIA in sync.
    const version = signal(0)
    const mutations = new MutationObserver(() => version.update((n) => n + 1))
    mutations.observe(host, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-shell-toggle"] })
    onCleanup(() => mutations.disconnect())
    const ownToggles = () =>
      Array.from(host.querySelectorAll<HTMLElement>("[data-shell-toggle]")).filter((el) => el.closest("bz-shell") === host)
    ctx.onMount(() =>
      effect(() => {
        version()
        const expanded = {
          start: compact() ? props.startOpen() : !props.startCollapsed(),
          end: compact() ? props.endOpen() : !props.endCollapsed(),
        }
        for (const el of ownToggles()) {
          const side = el.getAttribute("data-shell-toggle") as ShellSide
          if (side !== "start" && side !== "end") continue
          el.setAttribute("aria-expanded", String(expanded[side]))
          el.setAttribute("aria-controls", `${id}-${side}`)
        }
      })
    )

    ctx.on<MouseEvent>(host, "click", (e) => {
      const target = e.target as Element
      const button = target.closest?.("[data-shell-toggle]")
      if (button && button.closest("bz-shell") === host) {
        const side = button.getAttribute("data-shell-toggle")
        if (side === "start" || side === "end") toggle(side, button)
        return
      }
      // Following a link in an open drawer closes it (the page changes behind).
      const side = drawer()
      if (side && target.closest?.("a[href]") && parts[side]?.contains(target)) setSide(side, false)
    })
    ctx.on<KeyboardEvent>(host, "keydown", (e) => {
      const side = drawer()
      if (e.key !== "Escape" || e.defaultPrevented || !side) return
      e.preventDefault()
      setSide(side, false)
    })

    const region = (name: "header" | "footer" | ShellSide) => {
      if (!has[name]) return null
      if (name === "header" || name === "footer") return html`<div data-part=${name} ref=${ref(name)}>${ctx.slot(name)}</div>`
      return html`<div data-part=${name} id=${`${id}-${name}`} ref=${ref(name)}>
        <div data-part=${`${name}-panel`}>${ctx.slot(name)}</div>
        ${() =>
          props.resizable()
            ? html`<div
                data-part=${`${name}-resizer`}
                role="separator"
                aria-orientation="vertical"
                aria-controls=${`${id}-${name}`}
                aria-label=${props.resizeLabel}
                aria-keyshortcuts="ArrowLeft ArrowRight Home End Enter"
                tabindex="0"
                @pointerdown=${(e: PointerEvent) => startDrag(e, name)}
                @dblclick=${() => commitWidth(name, null)}
                @keydown=${(e: KeyboardEvent) => onResizerKey(e, name)}
                @focus=${() => describe(name)}
                @pointerenter=${() => describe(name)}
              ></div>`
            : null}
      </div>`
    }

    return html`
      <button type="button" data-part="skip" @click=${() => parts.content?.focus()}>${props.skipLabel}</button>
      ${region("header")} ${region("start")}
      <main
        data-part="content"
        id=${`${id}-content`}
        tabindex="-1"
        ?data-scroll-container=${() => props.scrollMode() !== "page" && !shellScrolls()}
        ref=${ref("content")}
      >${ctx.slot()}</main>
      ${region("end")} ${region("footer")}
      <div data-part="backdrop" aria-hidden="true" @click=${() => drawer() && setSide(drawer()!, false)}></div>
      <div data-part="progress" role="progressbar" aria-label="Loading" ?hidden=${() => !props.busy()}></div>
    `
  },
})

export interface ShellElement extends InstanceType<typeof ShellBase> {
  toggle(side: ShellSide): void
  open(side: ShellSide): void
  close(side: ShellSide): void
}

for (const method of ["toggle", "open", "close"] as const) {
  Object.defineProperty(ShellBase.prototype, method, {
    value(this: HTMLElement & { _shell?: Controller }, side: ShellSide = "start") {
      this._shell?.[method](side)
    },
    configurable: true,
  })
}

export const Shell = ShellBase as unknown as { new (): ShellElement; prototype: ShellElement }

declare global {
  interface HTMLElementTagNameMap {
    "bz-shell": ShellElement
  }
}
