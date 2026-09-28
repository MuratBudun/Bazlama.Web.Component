import { computed, define, effect, onCleanup, prop, uid, untrack } from "@bazlama/core"
import { isDisabled, listNavigation, observeOptions, optionValue, toggleAria } from "./shared"

/**
 * <bz-option value="..." label="..." disabled> — an item of <bz-list> / <bz-combobox>.
 * Value and label default to the text content. Use attributes (not properties) for them.
 */
export const Option = define("bz-option", {
  props: { disabled: prop.boolean(false, { reflect: true }) },
  setup(props, { host }) {
    if (!host.id) host.id = uid("bz-option")
    host.setAttribute("role", "option")
    effect(() => toggleAria(host, "aria-disabled", props.disabled()))
  },
})

/**
 * <bz-list> — listbox (single or multiple selection), enhancer over <bz-option> children.
 *
 * Focus stays on the list; the active option is referenced with aria-activedescendant.
 * Keyboard: arrows, Home/End, PageUp/PageDown, typeahead, Enter/Space selects.
 * `value` is the selected value; with `multiple` it is a comma separated list.
 * Form-associated: submits the value(s) under the list's `name` attribute. Fires `change`.
 * Styling hooks on options: [aria-selected="true"], [data-active], [aria-disabled="true"].
 */
export const List = define("bz-list", {
  form: true,
  props: {
    value: prop.string(),
    multiple: prop.boolean(),
    disabled: prop.boolean(false, { reflect: true }),
    label: prop.string(),
  },
  setup(props, ctx) {
    const { host, internals } = ctx
    const { version, disconnect } = observeOptions(host)
    onCleanup(disconnect)

    const options = () => {
      version()
      return Array.from(host.querySelectorAll<HTMLElement>("bz-option"))
    }
    const selected = computed(
      () => new Set(props.value().split(props.multiple() ? "," : "\u0000").filter(Boolean))
    )
    const nav = listNavigation({ items: () => untrack(options), typeahead: true })

    host.setAttribute("role", "listbox")
    effect(() => {
      host.tabIndex = props.disabled() ? -1 : 0
      toggleAria(host, "aria-disabled", props.disabled())
      toggleAria(host, "aria-multiselectable", props.multiple())
      const label = props.label()
      if (label) host.setAttribute("aria-label", label)
      else host.removeAttribute("aria-label")
    })
    effect(() => {
      const sel = selected()
      for (const o of options()) o.setAttribute("aria-selected", String(sel.has(optionValue(o))))
    })
    effect(() => {
      const active = nav.active()
      for (const o of options()) o.toggleAttribute("data-active", o === active)
      if (active) {
        host.setAttribute("aria-activedescendant", active.id)
        active.scrollIntoView?.({ block: "nearest" })
      } else {
        host.removeAttribute("aria-activedescendant")
      }
    })
    effect(() => {
      const values = [...selected()]
      const name = host.getAttribute("name")
      if (props.multiple() && name) {
        const data = new FormData()
        for (const v of values) data.append(name, v)
        internals?.setFormValue(data)
      } else {
        internals?.setFormValue(values[0] ?? null)
      }
    })

    const select = (option: HTMLElement) => {
      if (props.disabled.peek() || isDisabled(option)) return
      const v = optionValue(option)
      if (props.multiple.peek()) {
        const next = new Set(selected.peek())
        if (next.has(v)) next.delete(v)
        else next.add(v)
        props.value.set([...next].join(","))
      } else {
        props.value.set(v)
      }
      ctx.emit("change", { value: props.value.peek() })
    }
    const optionFrom = (e: Event) => {
      const o = (e.target as Element).closest?.("bz-option") as HTMLElement | null
      return o && host.contains(o) && !isDisabled(o) ? o : null
    }

    ctx.on(host, "click", (e) => {
      const o = optionFrom(e)
      if (!o) return
      nav.active.set(o)
      select(o)
    })
    ctx.on(host, "pointermove", (e) => {
      const o = optionFrom(e)
      if (o && o !== nav.active.peek()) nav.active.set(o)
    })
    ctx.on(host, "focus", () => {
      if (nav.active.peek()) return
      const current = options().find((o) => selected.peek().has(optionValue(o)))
      if (current) nav.active.set(current)
      else nav.first()
    })
    ctx.on<KeyboardEvent>(host, "keydown", (e) => {
      if (props.disabled.peek()) return
      if (e.key === "Enter" || e.key === " ") {
        const active = nav.active.peek()
        if (active) {
          e.preventDefault()
          select(active)
        }
        return
      }
      nav.handleKey(e)
    })
    ctx.onFormReset(() => props.value.set(host.getAttribute("value") ?? ""))
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "bz-option": InstanceType<typeof Option>
    "bz-list": InstanceType<typeof List>
  }
}
