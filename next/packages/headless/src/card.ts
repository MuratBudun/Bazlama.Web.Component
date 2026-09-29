import { computed, define, effect, html, onCleanup, prop, signal, uid } from "@bazlama/core"
import { hueOf } from "./avatar"
import { hasIcon, icon } from "./icon"
import { fold } from "./shared"

type Variant = "" | "neutral" | "primary" | "info" | "success" | "warning" | "danger"

/**
 * <bz-card heading description icon href meta indicator> — a tile for a module, a record, a
 * shortcut (e.g. an application launcher).
 *
 * - Media: `icon` (a name) on a soft tile tinted by `hue` (0–360; default derived from the
 *   heading, so every card gets its own stable color), or `slot="media"`.
 * - Text: `heading` (a heading, `level` 3), `description`, `meta` (a status line, colored by
 *   `meta-variant`, e.g. "18 bekleyen iş").
 * - `indicator` ("danger", "info"…): a dot in the corner (give `indicator-label` for screen readers).
 * - `href`: the whole card is a link (stretched from the heading, so its name is the heading);
 *   `clickable`: the card itself is a button. Both fire `activate` (bubbles) — the link still
 *   navigates. Buttons in `slot="actions"` (favorite, menu…) stay separate, above the link.
 * - `layout`: "row" (media beside the text) | "column" (media on top).
 * - `keywords`: extra words a <bz-card-list> filter matches.
 *
 * Anatomy: [data-part=media|body|heading|link|description|meta|indicator|actions|footer].
 * Slots: media, default (more body content), actions, footer.
 * Styling hooks: [layout], [meta-variant], [indicator], [clickable], [disabled], [hidden],
 * --bz-card-hue, --bz-card-bg, --bz-card-media-size.
 */
export const Card = define("bz-card", {
  props: {
    heading: prop.string(),
    description: prop.string(),
    icon: prop.string(),
    hue: prop.number(Number.NaN),
    href: prop.string(),
    target: prop.string(),
    meta: prop.string(),
    metaVariant: prop.string<Variant>("", { reflect: true }),
    indicator: prop.string<Variant>("", { reflect: true }),
    indicatorLabel: prop.string(),
    layout: prop.string<"row" | "column">("row", { reflect: true }),
    level: prop.number(3),
    clickable: prop.boolean(false, { reflect: true }),
    disabled: prop.boolean(false, { reflect: true }),
    keywords: prop.string(),
  },
  setup(props, ctx) {
    const { host } = ctx
    const id = uid("bz-card")

    effect(() => {
      const hue = Number.isFinite(props.hue()) ? props.hue() : hueOf(props.heading() || props.icon())
      host.style.setProperty("--bz-card-hue", String(Math.round(hue) % 360))
    })
    // A clickable card (no link) is a button; a link card's tab stop is its link.
    let wasButton = false
    effect(() => {
      const button = props.clickable() && !props.href()
      if (button) {
        host.setAttribute("role", "button")
        host.setAttribute("aria-labelledby", `${id}-heading`)
        host.tabIndex = props.disabled() ? -1 : 0
      } else if (wasButton) {
        host.removeAttribute("role")
        host.removeAttribute("aria-labelledby")
        host.removeAttribute("tabindex")
      }
      wasButton = button
      if (props.disabled()) host.setAttribute("aria-disabled", "true")
      else host.removeAttribute("aria-disabled")
    })

    const inActions = (e: Event) => !!(e.target as Element).closest?.("[data-part=actions]")
    ctx.on<MouseEvent>(host, "click", (e) => {
      if (inActions(e)) return
      if (props.disabled.peek()) {
        e.preventDefault()
        return
      }
      if (props.href.peek() || props.clickable.peek()) ctx.emit("activate", { card: host })
    })
    ctx.on<KeyboardEvent>(host, "keydown", (e) => {
      if (e.target !== host || !props.clickable.peek() || props.href.peek() || props.disabled.peek()) return
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        ctx.emit("activate", { card: host })
      }
    })

    const media = () =>
      ctx.hasSlot("media") ? ctx.slot("media") : props.icon() && hasIcon(props.icon()) ? icon(props.icon()) : null

    return html`
      <div data-part="media" aria-hidden="true" ?hidden=${() => !ctx.hasSlot("media") && !props.icon()}>${media}</div>
      <div data-part="body">
        <div data-part="heading" id=${`${id}-heading`} role="heading" aria-level=${props.level}>
          ${() =>
            props.href()
              ? html`<a data-part="link" href=${props.href} target=${() => props.target() || null}
                  rel=${() => (props.target() === "_blank" ? "noopener" : null)}
                  aria-disabled=${() => (props.disabled() ? "true" : null)}
                  aria-describedby=${() => [props.description() && `${id}-description`, props.meta() && `${id}-meta`].filter(Boolean).join(" ") || null}
                >${props.heading}</a>`
              : props.heading()}
        </div>
        <div data-part="description" id=${`${id}-description`} ?hidden=${() => !props.description()}>${props.description}</div>
        <div data-part="meta" id=${`${id}-meta`} ?hidden=${() => !props.meta()}>${props.meta}</div>
        ${ctx.slot()}
      </div>
      <span data-part="indicator" role=${() => (props.indicatorLabel() ? "img" : null)}
        aria-label=${() => props.indicatorLabel() || null} aria-hidden=${() => (props.indicatorLabel() ? null : "true")}
        ?hidden=${() => !props.indicator()}></span>
      <div data-part="actions" ?hidden=${!ctx.hasSlot("actions")}>${ctx.slot("actions")}</div>
      <div data-part="footer" ?hidden=${!ctx.hasSlot("footer")}>${ctx.slot("footer")}</div>
    `
  },
})

/** Where keyboard focus goes for a card: its link, or the card when it is a button. */
const focusTarget = (card: HTMLElement): HTMLElement | null =>
  card.querySelector<HTMLElement>(":scope > [data-part=body] [data-part=link]") ?? (card.getAttribute("role") === "button" ? card : null)
const cardText = (card: HTMLElement) =>
  fold(
    [card.getAttribute("heading"), card.getAttribute("description"), card.getAttribute("meta"), card.getAttribute("keywords"), card.textContent]
      .filter(Boolean)
      .join(" ")
  )

/**
 * <bz-card-group heading open> — a titled, collapsible set of cards in a <bz-card-list>. The
 * header shows how many of its cards are visible (after the list's filter).
 *
 * Anatomy: [data-part=header|toggle|heading|count|actions|cards]. Slots: default (cards), actions.
 * Fires `toggle` { open } (does not bubble). Styling hooks: [open].
 */
export const CardGroup = define("bz-card-group", {
  props: {
    heading: prop.string(),
    open: prop.boolean(true, { reflect: true }),
    collapsible: prop.boolean(true),
    level: prop.number(2),
  },
  setup(props, ctx) {
    const id = uid("bz-card-group")
    const count = signal(0)
    ;(ctx.host as HTMLElement & { _setCount?: (n: number) => void })._setCount = (n) => count.set(n)
    const toggle = () => {
      if (!props.collapsible.peek()) return
      props.open.set(!props.open.peek())
      ctx.emit("toggle", { open: props.open.peek() }, { bubbles: false })
    }
    ctx.host.setAttribute("role", "group")
    ctx.host.setAttribute("aria-labelledby", `${id}-heading`)
    return html`
      <div data-part="header">
        <div role="heading" aria-level=${props.level} data-part="heading-wrap">
          <button type="button" data-part="toggle" id=${`${id}-heading`} aria-expanded=${() => String(props.open())} aria-controls=${`${id}-cards`}
            ?disabled=${() => !props.collapsible()} @click=${toggle}>
            <span data-part="chevron" aria-hidden="true" ?hidden=${() => !props.collapsible()}></span>
            <span data-part="heading">${props.heading}</span>
            <span data-part="count">(${count})</span>
          </button>
        </div>
        <div data-part="actions" ?hidden=${!ctx.hasSlot("actions")}>${ctx.slot("actions")}</div>
      </div>
      <div data-part="cards" id=${`${id}-cards`} ?hidden=${() => !props.open()}>${ctx.slot()}</div>
    `
  },
})

/**
 * <bz-card-list view min-card-width filter> — a responsive grid (or list) of <bz-card>s,
 * optionally in <bz-card-group>s.
 *
 * - `view`: "grid" (as many columns as fit `min-card-width`) | "list" (one per row, compact).
 * - `filter`: text; cards whose heading, description, meta, keywords or content do not match
 *   are hidden (accent/case-insensitive), groups without a match too; `slot="empty"` shows when
 *   nothing matches. Fires `filter` { visible } (does not bubble).
 * - Keyboard: the list is one tab stop; ←/→ move to the previous/next card, ↑/↓ to the card
 *   above/below (by position, so it follows the wrapping), Home/End to the first/last.
 *
 * Anatomy: [data-part=empty]. Styling hooks: [view], --bz-card-min-width, --bz-card-gap.
 */
export const CardList = define("bz-card-list", {
  props: {
    view: prop.string<"grid" | "list">("grid", { reflect: true }),
    minCardWidth: prop.string("16rem"),
    filter: prop.string(),
    label: prop.string(),
  },
  setup(props, ctx) {
    const { host } = ctx
    const version = signal(0)
    const observer = new MutationObserver(() => version.update((n) => n + 1))
    observer.observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ["heading", "description", "meta", "keywords", "href", "clickable"] })
    onCleanup(() => observer.disconnect())
    const visibleCount = signal(0)
    let active: HTMLElement | null = null

    effect(() => host.style.setProperty("--bz-card-min-width", props.minCardWidth()))
    effect(() => {
      const label = props.label()
      if (label) host.setAttribute("aria-label", label)
      else host.removeAttribute("aria-label")
    })

    const cards = () => Array.from(host.querySelectorAll<HTMLElement>("bz-card")).filter((c) => c.closest("bz-card-list") === host)
    const targets = () =>
      cards()
        .filter((c) => !c.hidden && !c.closest("bz-card-group:not([open])"))
        .map(focusTarget)
        .filter((t): t is HTMLElement => !!t)

    /** One tab stop: the active card's target (the first one by default). */
    const rove = () => {
      const list = targets()
      if (!active || !list.includes(active)) active = list[0] ?? null
      for (const c of cards()) {
        const t = focusTarget(c)
        if (!t) continue
        const want = t === active ? 0 : -1
        if (t.tabIndex !== want) t.tabIndex = want
      }
    }

    const filterText = computed(() => fold(props.filter().trim()))
    ctx.onMount(() =>
      effect(() => {
        version()
        const q = filterText()
        let visible = 0
        for (const card of cards()) {
          const match = !q || cardText(card).includes(q)
          if (card.hidden === match) card.hidden = !match
          if (match) visible++
        }
        for (const group of host.querySelectorAll<HTMLElement & { _setCount?: (n: number) => void }>("bz-card-group")) {
          if (group.closest("bz-card-list") !== host) continue
          const own = Array.from(group.querySelectorAll<HTMLElement>("bz-card")).filter((c) => !c.hidden)
          group._setCount?.(own.length)
          const hide = own.length === 0 && !!q
          if (group.hidden !== hide) group.hidden = hide
        }
        if (visible !== visibleCount.peek()) {
          visibleCount.set(visible)
          ctx.emit("filter", { visible }, { bubbles: false })
        }
        queueMicrotask(rove)
      })
    )

    ctx.on<FocusEvent>(host, "focusin", (e) => {
      const t = targets().find((x) => x === e.target || x.contains(e.target as Node))
      if (t && t !== active) {
        active = t
        rove()
      }
    })
    ctx.on<KeyboardEvent>(host, "keydown", (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return
      const list = targets()
      const from = list.indexOf(e.target as HTMLElement)
      if (from === -1) return
      const rtl = getComputedStyle(host).direction === "rtl"
      let to = -1
      const center = (el: HTMLElement) => {
        const r = (el.closest("bz-card") as HTMLElement).getBoundingClientRect()
        return { x: r.left + r.width / 2, top: r.top, bottom: r.bottom }
      }
      /** The card in the nearest row below (down) / above (up), closest horizontally. */
      const vertical = (down: boolean) => {
        const here = center(list[from])
        let best = -1
        let bestRow = Infinity
        let bestDx = Infinity
        list.forEach((el, i) => {
          if (i === from) return
          const c = center(el)
          const dy = down ? c.top - here.bottom : here.top - c.bottom
          if (dy < -1) return
          const dx = Math.abs(c.x - here.x)
          if (dy < bestRow - 1 || (Math.abs(dy - bestRow) <= 1 && dx < bestDx)) {
            best = i
            bestRow = dy
            bestDx = dx
          }
        })
        return best
      }
      switch (e.key) {
        case "ArrowRight":
          to = from + (rtl ? -1 : 1)
          break
        case "ArrowLeft":
          to = from + (rtl ? 1 : -1)
          break
        case "ArrowDown":
          to = props.view.peek() === "list" ? from + 1 : vertical(true)
          break
        case "ArrowUp":
          to = props.view.peek() === "list" ? from - 1 : vertical(false)
          break
        case "Home":
          to = 0
          break
        case "End":
          to = list.length - 1
          break
        default:
          return
      }
      e.preventDefault()
      if (to < 0 || to >= list.length) return
      active = list[to]
      rove()
      active.focus()
      active.closest("bz-card")?.scrollIntoView?.({ block: "nearest" })
    })

    return html`${ctx.slot()}<div data-part="empty" ?hidden=${() => visibleCount() > 0}>${ctx.hasSlot("empty") ? ctx.slot("empty") : "No results"}</div>`
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "bz-card": InstanceType<typeof Card>
    "bz-card-group": InstanceType<typeof CardGroup>
    "bz-card-list": InstanceType<typeof CardList>
  }
}
