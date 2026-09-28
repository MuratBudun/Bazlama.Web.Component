import { define, effect, html, prop } from "@bazlama/core"
import { hasIcon, icon } from "./icon"
import { toggleAria } from "./shared"

/**
 * <bz-badge variant="neutral|primary|success|warning|danger|info" count max dot label>
 *
 * A small, non-interactive label: text (its content) or a number (`count`, shown as "99+"
 * above `max`). `dot` shows only a dot (e.g. on an icon); give it a `label` then, since there
 * is no visible text. A badge with `label` gets role="img" with that name.
 *
 * Styling hooks: [variant], [dot], [data-empty] (count 0 with hide-zero).
 */
export const Badge = define("bz-badge", {
  props: {
    variant: prop.string<"neutral" | "primary" | "success" | "warning" | "danger" | "info">("neutral", { reflect: true }),
    count: prop.number(NaN),
    max: prop.number(99),
    dot: prop.boolean(false, { reflect: true }),
    /** Accessible name (needed for `dot` or a bare number). */
    label: prop.string(),
    hideZero: prop.boolean(),
  },
  setup(props, ctx) {
    const { host } = ctx
    const hasCount = () => !Number.isNaN(props.count())
    const text = () => {
      const n = props.count()
      return n > props.max() ? `${props.max()}+` : String(n)
    }
    effect(() => {
      host.toggleAttribute("data-empty", hasCount() && props.hideZero() && props.count() === 0)
      const label = props.label()
      if (label) {
        host.setAttribute("role", "img")
        host.setAttribute("aria-label", label)
      } else {
        host.removeAttribute("role")
        host.removeAttribute("aria-label")
      }
    })
    return html`${() => (props.dot() ? null : hasCount() ? text() : ctx.slot())}`
  },
})

/**
 * <bz-chip selectable selected removable icon="…" variant="…">
 *
 * A compact label that can be interactive:
 * - `selectable`: a toggle button (role="button", aria-pressed); click, Enter or Space
 *   flip `selected` and fire `change` { selected } (does not bubble). For filter chips.
 * - `removable`: a remove button (×); click, or Delete/Backspace on the chip, fires
 *   the cancelable `remove` event (does not bubble). The app removes the chip (from its data).
 * - Neither: a static tag.
 *
 * Anatomy: [data-part=icon|label|remove]. Styling hooks: [variant], [selectable], [selected],
 * [disabled], [removable].
 */
export const Chip = define("bz-chip", {
  props: {
    variant: prop.string<"neutral" | "primary" | "success" | "warning" | "danger" | "info">("neutral", { reflect: true }),
    icon: prop.string(),
    selectable: prop.boolean(false, { reflect: true }),
    selected: prop.boolean(false, { reflect: true }),
    removable: prop.boolean(false, { reflect: true }),
    disabled: prop.boolean(false, { reflect: true }),
    removeLabel: prop.string("Remove"),
  },
  setup(props, ctx) {
    const { host } = ctx
    effect(() => {
      const interactive = props.selectable() && !props.disabled()
      if (props.selectable()) {
        host.setAttribute("role", "button")
        host.setAttribute("aria-pressed", String(props.selected()))
        host.tabIndex = props.disabled() ? -1 : 0
      } else {
        host.removeAttribute("role")
        host.removeAttribute("aria-pressed")
        if (!props.removable()) host.removeAttribute("tabindex")
      }
      toggleAria(host, "aria-disabled", props.disabled())
      host.toggleAttribute("data-interactive", interactive)
    })

    const toggle = () => {
      if (!props.selectable.peek() || props.disabled.peek()) return
      props.selected.set(!props.selected.peek())
      ctx.emit("change", { selected: props.selected.peek() }, { bubbles: false })
    }
    const labelText = () => ctx.slot().map((n) => n.textContent ?? "").join("").trim()
    const remove = () => {
      if (props.disabled.peek()) return
      ctx.emit("remove", undefined, { cancelable: true, bubbles: false })
    }

    ctx.on<MouseEvent>(host, "click", (e) => {
      if ((e.target as Element).closest("[data-part=remove]")) {
        e.stopPropagation()
        remove()
        return
      }
      toggle()
    })
    ctx.on<KeyboardEvent>(host, "keydown", (e) => {
      if (e.target !== host) return
      if (e.key === "Enter" || e.key === " ") {
        if (!props.selectable.peek()) return
        e.preventDefault()
        toggle()
      } else if ((e.key === "Delete" || e.key === "Backspace") && props.removable.peek()) {
        e.preventDefault()
        remove()
      }
    })

    return html`
      <span data-part="icon" aria-hidden="true" ?hidden=${() => !props.icon()}>${() =>
        props.icon() && hasIcon(props.icon()) ? icon(props.icon()) : null}</span>
      <span data-part="label">${ctx.slot()}</span>
      <button
        type="button"
        data-part="remove"
        aria-label=${() => `${props.removeLabel()}: ${labelText()}`}
        ?hidden=${() => !props.removable()}
        ?disabled=${props.disabled}
      >${hasIcon("x") ? icon("x") : "×"}</button>
    `
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "bz-badge": InstanceType<typeof Badge>
    "bz-chip": InstanceType<typeof Chip>
  }
}
