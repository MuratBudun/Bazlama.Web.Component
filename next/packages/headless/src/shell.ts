import { define, effect, flush, html, onCleanup, prop, signal, uid } from "@bazlama/core"

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
 * - `variant`: "classic" (header and footer span the width) or "sidebar" (the sides take the
 *   full height); `--bz-shell-areas` accepts any grid-template-areas.
 * - Wide (shell ≥ `breakpoint` px): the start side collapses to a narrow rail
 *   (`start-collapsed`), the end side hides (`end-collapsed`). The side panels stick below
 *   the header and scroll on their own.
 * - Compact: both sides become drawers (`start-open`, `end-open`, one at a time). While one
 *   is open the rest is inert, focus moves in (current item first); Escape, the backdrop or a
 *   link inside close it and focus returns to the button that opened it.
 * - Any element with `data-shell-toggle="start|end"` inside the shell toggles that side; the
 *   shell keeps its aria-expanded / aria-controls up to date. Methods: toggle(side),
 *   open(side), close(side). Fires `toggle` { side, open, compact }.
 * - `busy` shows a progress bar; a "skip to content" button is the first tab stop.
 *
 * Anatomy: [data-part=skip|header|start|start-panel|content|end|end-panel|footer|backdrop|progress].
 * Styling hooks: [variant], [data-compact], [data-drawer="start|end"], [start-open], [end-open],
 * [start-collapsed], [end-collapsed], [busy], [data-has-header|footer|start|end].
 */

export type ShellSide = "start" | "end"

interface Controller {
  toggle(side: ShellSide): void
  open(side: ShellSide): void
  close(side: ShellSide): void
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

const ShellBase = define("bz-shell", {
  props: {
    variant: prop.string<"classic" | "sidebar">("classic", { reflect: true }),
    /** Width (px) of the shell below which the sides become drawers. */
    breakpoint: prop.number(960),
    startOpen: prop.boolean(false, { reflect: true }),
    endOpen: prop.boolean(false, { reflect: true }),
    startCollapsed: prop.boolean(false, { reflect: true }),
    endCollapsed: prop.boolean(false, { reflect: true }),
    busy: prop.boolean(false, { reflect: true }),
    skipLabel: prop.string("Skip to content"),
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
      </div>`
    }

    return html`
      <button type="button" data-part="skip" @click=${() => parts.content?.focus()}>${props.skipLabel}</button>
      ${region("header")} ${region("start")}
      <main data-part="content" id=${`${id}-content`} tabindex="-1" ref=${ref("content")}>${ctx.slot()}</main>
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
