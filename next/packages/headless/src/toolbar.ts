import { define, effect, onCleanup, prop } from "@bazlama/core"

const CANDIDATES =
  'bz-button, bz-chip[selectable], button, a[href], input:not([type="hidden"]), select, textarea, [tabindex]'
/** Where arrow keys belong to the control (caret movement, options). */
const OWNS_ARROWS = 'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]), textarea, select, [contenteditable=""], [contenteditable="true"]'
/** Marks elements the toolbar manages, so their tabindex -1 does not hide them next time. */
const ITEM = "data-toolbar-item"

/**
 * <bz-toolbar label orientation> — a row of controls with one tab stop (WAI-ARIA toolbar).
 *
 * ←/→ (↑/↓ when vertical) move between controls and wrap, Home/End jump; Tab leaves the
 * toolbar and comes back to the last used control. Text fields keep their arrow keys.
 * Controls inside popovers (menu items) and nested toolbars are not items; disabled and
 * hidden controls are skipped.
 *
 * Children: any controls, <bz-toolbar-separator>, <bz-toolbar-spacer> (pushes the rest
 * to the end), <div role="group" aria-label="…"> for groups.
 *
 * Styling hooks: [orientation="vertical"], [wrap] (CSS: wrap onto new lines).
 */
export const Toolbar = define("bz-toolbar", {
  props: {
    label: prop.string(),
    orientation: prop.string<"horizontal" | "vertical">("horizontal", { reflect: true }),
  },
  setup(props, ctx) {
    const { host } = ctx
    host.setAttribute("role", "toolbar")
    effect(() => {
      const label = props.label()
      if (label) host.setAttribute("aria-label", label)
      else host.removeAttribute("aria-label")
      if (props.orientation() === "vertical") host.setAttribute("aria-orientation", "vertical")
      else host.removeAttribute("aria-orientation")
    })

    let active: HTMLElement | null = null

    const usable = (el: HTMLElement) =>
      !el.hasAttribute("disabled") &&
      el.getAttribute("aria-disabled") !== "true" &&
      !el.closest("[hidden], [inert]")

    /** Managed controls in DOM order (disabled ones included). */
    const all = (): HTMLElement[] =>
      Array.from(host.querySelectorAll<HTMLElement>(CANDIDATES)).filter((el) => {
        if (el.closest("bz-toolbar") !== host) return false
        const owner = el.parentElement?.closest("[popover], [role=menu], [role=listbox], bz-dialog, dialog")
        if (owner && host.contains(owner)) return false
        // A control inside another candidate (e.g. a button in a chip) is part of it.
        const outer = el.parentElement?.closest(CANDIDATES)
        if (outer && outer !== host && host.contains(outer) && outer.hasAttribute(ITEM)) return false
        if (el.hasAttribute(ITEM)) return true
        if (el.tabIndex < 0 && !el.matches("bz-button")) return false
        el.setAttribute(ITEM, "")
        return true
      })
    const items = () => all().filter(usable)

    /** Writes only differences, so the observer's echo of our own writes settles at once. */
    const apply = () => {
      const list = all()
      const enabled = list.filter(usable)
      if (!active || !enabled.includes(active)) active = enabled[0] ?? null
      for (const el of list) {
        const want = el === active ? 0 : -1
        if (!usable(el)) continue
        if (el.tabIndex !== want) el.tabIndex = want
      }
    }

    let scheduled = false
    const schedule = () => {
      if (scheduled) return
      scheduled = true
      queueMicrotask(() => {
        scheduled = false
        apply()
      })
    }

    ctx.onMount(() => {
      apply()
      // Controls re-enable themselves (bz-button resets tabIndex), items come and go.
      const observer = new MutationObserver(schedule)
      observer.observe(host, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["tabindex", "disabled", "aria-disabled", "hidden"],
      })
      onCleanup(() => observer.disconnect())
    })

    ctx.on<FocusEvent>(host, "focusin", (e) => {
      const item = items().find((el) => el === e.target || el.contains(e.target as Node))
      if (item && item !== active) {
        active = item
        apply()
      }
    })

    ctx.on<KeyboardEvent>(host, "keydown", (e) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return
      const target = e.target as HTMLElement
      if (target.matches(OWNS_ARROWS)) return
      const vertical = props.orientation.peek() === "vertical"
      const rtl = getComputedStyle(host).direction === "rtl"
      let delta = 0
      switch (e.key) {
        case vertical ? "ArrowDown" : "ArrowRight":
          delta = !vertical && rtl ? -1 : 1
          break
        case vertical ? "ArrowUp" : "ArrowLeft":
          delta = !vertical && rtl ? 1 : -1
          break
        case "Home":
        case "End":
          break
        default:
          return
      }
      const list = items()
      if (!list.length) return
      const from = list.findIndex((el) => el === target || el.contains(target))
      if (from === -1) return
      const to =
        e.key === "Home" ? 0 : e.key === "End" ? list.length - 1 : (from + delta + list.length) % list.length
      e.preventDefault()
      active = list[to]
      apply()
      active.focus()
    })
  },
})

/** <bz-toolbar-separator> — a divider between groups of a toolbar. */
export const ToolbarSeparator = define("bz-toolbar-separator", {
  setup(_props, ctx) {
    ctx.host.setAttribute("role", "separator")
    const toolbar = ctx.host.closest("bz-toolbar")
    ctx.host.setAttribute("aria-orientation", toolbar?.getAttribute("orientation") === "vertical" ? "horizontal" : "vertical")
  },
})

/** <bz-toolbar-spacer> — flexible space: what follows is pushed to the end. */
export const ToolbarSpacer = define("bz-toolbar-spacer", {
  setup(_props, ctx) {
    ctx.host.setAttribute("aria-hidden", "true")
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "bz-toolbar": InstanceType<typeof Toolbar>
    "bz-toolbar-separator": InstanceType<typeof ToolbarSeparator>
    "bz-toolbar-spacer": InstanceType<typeof ToolbarSpacer>
  }
}
