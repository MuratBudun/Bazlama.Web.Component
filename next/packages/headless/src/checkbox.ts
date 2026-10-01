import { computed, define, effect, html, onCleanup, prop, signal, uid } from "@bazlama/core"
import { observeOptions } from "./shared"

/*
 * Choice controls on native inputs: the inner <input> carries `name`, `value`, `required`,
 * so forms, validation, reset, autofill and (for radios) arrow-key movement and the single
 * tab stop are the browser's. The components add label/hint/error anatomy, styling hooks
 * and a `change` CustomEvent with a detail (the native one is stopped at the host).
 */

const choiceProps = {
  checked: prop.boolean(),
  value: prop.string("on"),
  name: prop.string(),
  label: prop.string(),
  hint: prop.string(),
  required: prop.boolean(),
  disabled: prop.boolean(false, { reflect: true }),
  /** Keeps the state; clicks and Space do nothing (native checkboxes have no readonly). */
  readonly: prop.boolean(false, { reflect: true }),
  /** Custom error message; non-empty makes the field invalid. */
  error: prop.string(),
}

function choice(tag: string, kind: "checkbox" | "switch") {
  return define(tag, {
    props: {
      ...choiceProps,
      ...(kind === "checkbox" ? { indeterminate: prop.boolean(false, { reflect: true }) } : {}),
    },
    setup(props, ctx) {
      const { host } = ctx
      const id = uid(tag)
      let input!: HTMLInputElement
      const touched = signal(false)
      const message = signal("")
      const showError = computed(() => touched() && message() !== "")
      const indeterminate = (props as { indeterminate?: typeof props.checked }).indeterminate

      effect(() => {
        host.toggleAttribute("data-invalid", showError())
        host.toggleAttribute("data-checked", props.checked())
      })

      ctx.onMount(() => {
        input.defaultChecked = props.checked.peek()
        effect(() => {
          props.checked()
          props.required()
          const error = props.error()
          queueMicrotask(() => {
            input.setCustomValidity(error)
            message.set(input.validationMessage)
          })
        })
        if (indeterminate) effect(() => (input.indeterminate = indeterminate()))
        if (input.form) {
          ctx.on(input.form, "reset", () =>
            setTimeout(() => {
              props.checked.set(input.defaultChecked)
              indeterminate?.set(false)
              touched.set(false)
            })
          )
        }
      })

      ctx.on<MouseEvent>(host, "click", (e) => {
        if (e.target === input && props.readonly.peek()) e.preventDefault()
      })
      // Capture phase: the native change must not reach listeners on the host either.
      ctx.on(
        host,
        "change",
        (e) => {
          if (e.target !== input) return
          e.stopPropagation()
          props.checked.set(input.checked)
          indeterminate?.set(false)
          touched.set(true)
          ctx.emit("change", { checked: input.checked, value: props.value.peek() })
        },
        { capture: true }
      )

      const describedBy = () =>
        [props.hint() && `${id}-hint`, showError() && `${id}-error`].filter(Boolean).join(" ") || null
      const label = () => (props.label() ? props.label() : ctx.slot())

      return html`
        <label data-part="field" for=${id}>
          <input
            data-part="input"
            id=${id}
            type="checkbox"
            role=${kind === "switch" ? "switch" : null}
            name=${() => props.name() || null}
            value=${props.value}
            .checked=${props.checked}
            ?required=${props.required}
            ?disabled=${props.disabled}
            aria-readonly=${() => (props.readonly() ? "true" : null)}
            aria-invalid=${() => (showError() ? "true" : null)}
            aria-describedby=${describedBy}
            @invalid=${() => touched.set(true)}
            ref=${(el: HTMLInputElement) => (input = el)}
          />
          <span data-part="label">${label}</span>
        </label>
        <div data-part="hint" id=${`${id}-hint`} ?hidden=${() => !props.hint()}>${props.hint}</div>
        <div data-part="error" id=${`${id}-error`} ?hidden=${() => !showError()}>${message}</div>
      `
    },
  })
}

/**
 * <bz-checkbox checked indeterminate name value label required readonly> — native checkbox
 * with label (the `label` prop or the content), hint and error.
 *
 * `change` { checked, value } (bubbles, like a native form field). Clicking clears
 * `indeterminate`, as natively.
 *
 * Anatomy: [data-part=field|input|label|hint|error].
 * Styling hooks: [data-checked], [indeterminate], [disabled], [readonly], [data-invalid].
 */
export const Checkbox = choice("bz-checkbox", "checkbox")

/**
 * <bz-switch checked name label> — an on/off setting that applies at once
 * (native checkbox with role="switch"). Same API as <bz-checkbox> without `indeterminate`.
 */
export const Switch = choice("bz-switch", "switch")

/**
 * <bz-radio value label disabled> — one option of a <bz-radio-group>; the group sets
 * its name and checked state.
 *
 * Anatomy: [data-part=field|input|label|hint]. Styling hooks: [data-checked], [disabled].
 */
export const Radio = define("bz-radio", {
  props: {
    value: prop.string(),
    label: prop.string(),
    hint: prop.string(),
    disabled: prop.boolean(false, { reflect: true }),
  },
  setup(props, ctx) {
    const id = uid("bz-radio")
    return html`
      <label data-part="field" for=${id}>
        <input data-part="input" id=${id} type="radio" value=${props.value} ?disabled=${props.disabled}
          aria-describedby=${() => (props.hint() ? `${id}-hint` : null)} />
        <span data-part="label">${() => props.label() || ctx.slot()}</span>
      </label>
      <div data-part="hint" id=${`${id}-hint`} ?hidden=${() => !props.hint()}>${props.hint}</div>
    `
  },
})

/**
 * <bz-radio-group label name value orientation required> — a set of <bz-radio>.
 *
 * Native radios with one shared name: arrow keys move and select, the group is one tab stop,
 * `required` validates natively. `change` { value } (bubbles). `name` defaults to a unique id
 * (set it to submit the value with a form).
 *
 * Anatomy: [data-part=label|items|hint|error].
 * Styling hooks: [orientation="horizontal"], [disabled], [data-invalid].
 */
export const RadioGroup = define("bz-radio-group", {
  props: {
    value: prop.string(),
    name: prop.string(),
    label: prop.string(),
    hint: prop.string(),
    orientation: prop.string<"vertical" | "horizontal">("vertical", { reflect: true }),
    required: prop.boolean(),
    disabled: prop.boolean(false, { reflect: true }),
    error: prop.string(),
  },
  setup(props, ctx) {
    const { host } = ctx
    const id = uid("bz-radio-group")
    const fallbackName = id
    const touched = signal(false)
    const message = signal("")
    const showError = computed(() => touched() && message() !== "")
    const { version, disconnect } = observeOptions(host, "bz-radio")
    onCleanup(disconnect)

    host.setAttribute("role", "radiogroup")
    effect(() => {
      host.setAttribute("aria-labelledby", `${id}-label`)
      host.toggleAttribute("data-invalid", showError())
      const describedBy = [props.hint() && `${id}-hint`, showError() && `${id}-error`].filter(Boolean).join(" ")
      if (describedBy) host.setAttribute("aria-describedby", describedBy)
      else host.removeAttribute("aria-describedby")
      if (props.required()) host.setAttribute("aria-required", "true")
      else host.removeAttribute("aria-required")
    })

    const inputs = () => Array.from(host.querySelectorAll<HTMLInputElement>("bz-radio input[type=radio]"))

    ctx.onMount(() => {
      // Radios render after the group mounts: the default is taken when an input first shows up.
      const seen = new WeakSet<HTMLInputElement>()
      effect(() => {
        version()
        const name = props.name() || fallbackName
        const value = props.value()
        const required = props.required()
        const disabled = props.disabled()
        const error = props.error()
        for (const radio of host.querySelectorAll("bz-radio")) {
          radio.toggleAttribute("data-checked", radio.getAttribute("value") === value && !!value)
        }
        // Assign only on change: attribute writes are observed (version) and would loop.
        for (const input of inputs()) {
          if (input.name !== name) input.name = name
          input.checked = !!value && input.value === value
          if (!seen.has(input)) {
            seen.add(input)
            input.defaultChecked = input.checked
          }
          if (input.required !== required) input.required = required
          const off = disabled || !!input.closest("bz-radio")?.hasAttribute("disabled")
          if (input.disabled !== off) input.disabled = off
          input.setCustomValidity(error)
        }
        queueMicrotask(() => message.set(inputs()[0]?.validationMessage ?? ""))
      })
      const form = host.closest("form")
      if (form) {
        ctx.on(form, "reset", () =>
          setTimeout(() => {
            props.value.set(inputs().find((i) => i.defaultChecked)?.value ?? "")
            touched.set(false)
          })
        )
      }
    })

    ctx.on(
      host,
      "change",
      (e) => {
        const input = e.target as HTMLInputElement
        if (input === (host as unknown) || input.type !== "radio") return
        e.stopPropagation()
        props.value.set(input.value)
        touched.set(true)
        ctx.emit("change", { value: input.value })
      },
      { capture: true }
    )
    // `invalid` does not bubble: listen in the capture phase.
    ctx.on(host, "invalid", () => touched.set(true), { capture: true })

    return html`
      <div data-part="label" id=${`${id}-label`} ?hidden=${() => !props.label()}>${props.label}</div>
      <div data-part="items">${ctx.slot()}</div>
      <div data-part="hint" id=${`${id}-hint`} ?hidden=${() => !props.hint()}>${props.hint}</div>
      <div data-part="error" id=${`${id}-error`} ?hidden=${() => !showError()}>${message}</div>
    `
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "bz-checkbox": InstanceType<typeof Checkbox>
    "bz-switch": InstanceType<typeof Switch>
    "bz-radio": InstanceType<typeof Radio>
    "bz-radio-group": InstanceType<typeof RadioGroup>
  }
}
