import { computed, define, effect, html, prop, signal, uid } from "@bazlama/core"
import { submitOnEnter } from "./shared"

/**
 * <bz-input> — label + native <input> + hint + error.
 *
 * The inner native input carries `name`, so the form, validation, autofill and reset work
 * natively (no ElementInternals needed in light DOM).
 *
 * Anatomy: [data-part=label|control|input|hint|error]; slots: prefix, suffix.
 * Styling hooks: [data-invalid] (shown after blur / submit attempt), [disabled].
 */
export const Input = define("bz-input", {
  props: {
    value: prop.string(),
    name: prop.string(),
    type: prop.string("text"),
    label: prop.string(),
    hint: prop.string(),
    placeholder: prop.string(),
    autocomplete: prop.string(),
    pattern: prop.string(),
    minlength: prop.number(),
    maxlength: prop.number(),
    required: prop.boolean(),
    readonly: prop.boolean(),
    disabled: prop.boolean(false, { reflect: true }),
    /** Custom error message; non-empty makes the field invalid. */
    error: prop.string(),
  },
  setup(props, ctx) {
    const id = uid("bz-input")
    const hintId = `${id}-hint`
    const errorId = `${id}-error`
    let input!: HTMLInputElement
    const touched = signal(false)
    const message = signal("")
    const showError = computed(() => touched() && message() !== "")

    effect(() => {
      if (showError()) ctx.host.setAttribute("data-invalid", "")
      else ctx.host.removeAttribute("data-invalid")
    })

    ctx.onMount(() => {
      input.defaultValue = props.value.peek()
      // Validity is read after the bindings above have been applied (next microtask).
      effect(() => {
        props.value()
        props.required()
        props.type()
        props.pattern()
        props.minlength()
        props.maxlength()
        const error = props.error()
        queueMicrotask(() => {
          input.setCustomValidity(error)
          message.set(input.validationMessage)
        })
      })
      if (input.form) {
        ctx.on(input.form, "reset", () =>
          setTimeout(() => {
            props.value.set(input.value)
            touched.set(false)
          })
        )
      }
    })

    const optional = (value: () => string | number) => () => value() || null

    return html`
      <label data-part="label" for=${id} ?hidden=${() => !props.label()}>${props.label}</label>
      <div data-part="control">
        ${ctx.slot("prefix")}
        <input
          data-part="input"
          id=${id}
          type=${props.type}
          name=${optional(props.name)}
          placeholder=${optional(props.placeholder)}
          autocomplete=${optional(props.autocomplete)}
          pattern=${optional(props.pattern)}
          minlength=${optional(props.minlength)}
          maxlength=${optional(props.maxlength)}
          ?required=${props.required}
          ?readonly=${props.readonly}
          ?disabled=${props.disabled}
          aria-invalid=${() => (showError() ? "true" : null)}
          aria-describedby=${() =>
            [props.hint() && hintId, showError() && errorId].filter(Boolean).join(" ") || null}
          .value=${props.value}
          @input=${(e: Event) => props.value.set((e.target as HTMLInputElement).value)}
          @keydown=${submitOnEnter}
          @blur=${() => touched.set(true)}
          @invalid=${() => touched.set(true)}
          ref=${(el: HTMLInputElement) => (input = el)}
        />
        ${ctx.slot("suffix")}
      </div>
      <div data-part="hint" id=${hintId} ?hidden=${() => !props.hint()}>${props.hint}</div>
      <div data-part="error" id=${errorId} ?hidden=${() => !showError()}>${message}</div>
    `
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "bz-input": InstanceType<typeof Input>
  }
}
