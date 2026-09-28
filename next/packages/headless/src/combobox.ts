import { computed, define, effect, html, onCleanup, prop, signal, uid, untrack } from "@bazlama/core"
import "./list"
import { fold, isDisabled, listNavigation, observeOptions, optionLabel, optionValue } from "./shared"

/**
 * <bz-combobox> — text input with a filterable popup listbox of <bz-option> children.
 *
 * `value` is the selected option's value; the input shows its label. With `allow-custom`,
 * typed text becomes the value. Form-associated (ElementInternals), supports `required`.
 * Fires `change`. `filter`: contains | starts-with | none.
 *
 * Anatomy: [data-part=label|control|input|trigger|popup|listbox|empty].
 * Slots: default (options), trigger (icon), empty.
 * Styling hooks: [open] on the host; options as in <bz-list>.
 */
export const Combobox = define("bz-combobox", {
  form: true,
  props: {
    value: prop.string(),
    label: prop.string(),
    placeholder: prop.string(),
    open: prop.boolean(false, { reflect: true }),
    disabled: prop.boolean(false, { reflect: true }),
    required: prop.boolean(),
    allowCustom: prop.boolean(),
    filter: prop.string<"contains" | "starts-with" | "none">("contains"),
    emptyText: prop.string("No results"),
  },
  setup(props, ctx) {
    const { host, internals } = ctx
    const id = uid("bz-combobox")
    let input!: HTMLInputElement
    const { version, disconnect } = observeOptions(host)
    onCleanup(disconnect)

    const options = () => {
      version()
      return Array.from(host.querySelectorAll<HTMLElement>("bz-option"))
    }
    /** Text typed by the user; null while not filtering (all options visible). */
    const query = signal<string | null>(null)
    const text = signal("")
    const visibleCount = signal(0)
    const selectedOption = computed(() => options().find((o) => optionValue(o) === props.value()) ?? null)
    const nav = listNavigation({ items: () => untrack(options) })

    effect(() => {
      const q = fold(query()?.trim() ?? "")
      const mode = props.filter()
      let count = 0
      for (const o of options()) {
        const label = fold(optionLabel(o))
        const show =
          !q || mode === "none" || (mode === "starts-with" ? label.startsWith(q) : label.includes(q))
        o.toggleAttribute("hidden", !show)
        if (show) count++
      }
      visibleCount.set(count)
    })
    effect(() => {
      const o = selectedOption()
      if (query() !== null) return
      text.set(o ? optionLabel(o) : props.allowCustom() ? props.value() : "")
    })
    effect(() => {
      const sel = selectedOption()
      for (const o of options()) o.setAttribute("aria-selected", String(o === sel))
    })
    effect(() => {
      const active = nav.active()
      for (const o of options()) o.toggleAttribute("data-active", o === active)
      active?.scrollIntoView?.({ block: "nearest" })
    })

    const openList = (filter: string | null) => {
      if (props.disabled.peek()) return
      query.set(filter)
      props.open.set(true)
    }
    const close = () => {
      props.open.set(false)
      query.set(null)
      nav.active.set(null)
    }
    const commit = (option: HTMLElement) => {
      const changed = optionValue(option) !== props.value.peek()
      props.value.set(optionValue(option))
      close()
      if (changed) ctx.emit("change", { value: props.value.peek() })
    }
    const activateAfterRender = (fallback: 1 | -1) =>
      queueMicrotask(() => {
        const current = selectedOption.peek()
        if (current && !current.hidden && query.peek() === null) nav.active.set(current)
        else {
          nav.active.set(null)
          nav.move(fallback)
        }
      })

    const onInput = (e: Event) => {
      const value = (e.target as HTMLInputElement).value
      text.set(value)
      openList(value)
      if (props.allowCustom.peek()) props.value.set(value)
      activateAfterRender(1)
    }
    const onKeydown = (e: KeyboardEvent) => {
      const isOpen = props.open.peek()
      switch (e.key) {
        case "ArrowDown":
        case "ArrowUp":
          e.preventDefault()
          if (!isOpen) {
            openList(null)
            activateAfterRender(e.key === "ArrowDown" ? 1 : -1)
            return
          }
          break
        case "Enter": {
          const active = nav.active.peek()
          if (isOpen && active) {
            e.preventDefault()
            commit(active)
          }
          return
        }
        case "Escape":
          if (isOpen) {
            e.preventDefault()
            close()
          }
          return
        case "Tab":
          if (isOpen) close()
          return
      }
      if (isOpen) nav.handleKey(e)
    }
    const onBlur = (e: FocusEvent) => {
      if (host.contains(e.relatedTarget as Node)) return
      if (props.allowCustom.peek() && query.peek() !== null) ctx.emit("change", { value: props.value.peek() })
      close()
    }
    const toggle = () => {
      if (props.open.peek()) close()
      else {
        openList(null)
        activateAfterRender(1)
        input.focus()
      }
    }
    const optionFrom = (e: Event) => {
      const o = (e.target as Element).closest?.("bz-option") as HTMLElement | null
      return o && !isDisabled(o) ? o : null
    }

    ctx.onMount(() =>
      effect(() => {
        const value = props.value()
        internals?.setFormValue(value || null)
        if (props.required() && !value)
          internals?.setValidity({ valueMissing: true }, "Please select an option.", input)
        else internals?.setValidity({})
      })
    )
    ctx.onFormReset(() => {
      props.value.set(host.getAttribute("value") ?? "")
      query.set(null)
    })

    const expanded = () => String(props.open())
    return html`
      <label data-part="label" id=${`${id}-label`} for=${`${id}-input`} ?hidden=${() => !props.label()}>${props.label}</label>
      <div data-part="control">
        <input
          data-part="input"
          id=${`${id}-input`}
          type="text"
          role="combobox"
          autocomplete="off"
          aria-autocomplete="list"
          aria-controls=${`${id}-listbox`}
          aria-expanded=${expanded}
          aria-activedescendant=${() => nav.active()?.id ?? null}
          aria-required=${() => (props.required() ? "true" : null)}
          placeholder=${() => props.placeholder() || null}
          ?disabled=${props.disabled}
          .value=${text}
          @input=${onInput}
          @keydown=${onKeydown}
          @blur=${onBlur}
          @click=${() => !props.open.peek() && toggle()}
          ref=${(el: HTMLInputElement) => (input = el)}
        />
        <button
          data-part="trigger"
          type="button"
          tabindex="-1"
          aria-label="Show options"
          aria-controls=${`${id}-listbox`}
          aria-expanded=${expanded}
          ?disabled=${props.disabled}
          @pointerdown=${(e: Event) => e.preventDefault()}
          @click=${toggle}
        >
          ${ctx.slot("trigger")}
        </button>
      </div>
      <div
        data-part="popup"
        ?hidden=${() => !props.open()}
        @pointerdown=${(e: Event) => e.preventDefault()}
        @click=${(e: Event) => {
          const o = optionFrom(e)
          if (o) commit(o)
        }}
        @pointermove=${(e: Event) => {
          const o = optionFrom(e)
          if (o && o !== nav.active.peek()) nav.active.set(o)
        }}
      >
        <div data-part="listbox" id=${`${id}-listbox`} role="listbox" aria-labelledby=${`${id}-label`}>
          ${ctx.slot()}
        </div>
        <div data-part="empty" ?hidden=${() => visibleCount() > 0}>
          ${ctx.hasSlot("empty") ? ctx.slot("empty") : props.emptyText}
        </div>
      </div>
    `
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "bz-combobox": InstanceType<typeof Combobox>
  }
}
