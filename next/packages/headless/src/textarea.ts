import { computed, define, effect, html, prop, signal, uid } from "@bazlama/core"
import { dialogs } from "./dialog"
import { hasIcon, icon } from "./icon"

const supportsFieldSizing = () =>
  typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("field-sizing", "content")

/**
 * <bz-textarea> — label + native <textarea> + hint + error (the textarea carries `name`).
 *
 * - `autosize`: grows with the content between `rows` and `max-rows` (CSS `field-sizing:
 *   content` where supported, measured scrollHeight otherwise).
 * - `show-count`: "n / maxlength" (or "n") under the field.
 * - `expandable`: a button (and Ctrl+Shift+Enter) opens the text in a large dialog editor;
 *   "Apply" writes it back and fires `input` and `change` from the textarea, like typing.
 *   Read-only fields open read-only.
 *
 * Anatomy: [data-part=label|control|input|expand|footer|hint|count|error].
 * Styling hooks: [data-invalid], [disabled], [readonly], [autosize], [resize="none|vertical|both"] (CSS).
 */
export const Textarea = define("bz-textarea", {
  props: {
    value: prop.string(),
    name: prop.string(),
    label: prop.string(),
    hint: prop.string(),
    placeholder: prop.string(),
    rows: prop.number(3),
    maxRows: prop.number(0),
    minlength: prop.number(),
    maxlength: prop.number(),
    required: prop.boolean(),
    readonly: prop.boolean(false, { reflect: true }),
    disabled: prop.boolean(false, { reflect: true }),
    autosize: prop.boolean(false, { reflect: true }),
    showCount: prop.boolean(),
    expandable: prop.boolean(false, { reflect: true }),
    /** Heading of the expanded editor (default: the label). */
    expandHeading: prop.string(),
    labels: prop.object<Partial<TextareaLabels>>({}),
    error: prop.string(),
  },
  setup(props, ctx) {
    const { host } = ctx
    const id = uid("bz-textarea")
    let input!: HTMLTextAreaElement
    const touched = signal(false)
    const message = signal("")
    const showError = computed(() => touched() && message() !== "")
    const text = computed(() => ({ ...TEXTAREA_LABELS, ...props.labels() }))

    effect(() => host.toggleAttribute("data-invalid", showError()))
    effect(() => {
      host.style.setProperty("--bz-textarea-rows", String(Math.max(1, props.rows())))
      const max = props.maxRows()
      if (max > 0) host.style.setProperty("--bz-textarea-max-rows", String(max))
      else host.style.removeProperty("--bz-textarea-max-rows")
    })

    /** Fallback autosize: height from scrollHeight, capped by the CSS max-height. */
    const fit = () => {
      if (!props.autosize.peek() || supportsFieldSizing() || !input) return
      input.style.height = "auto"
      input.style.height = `${input.scrollHeight + input.offsetHeight - input.clientHeight}px`
    }

    ctx.onMount(() => {
      input.defaultValue = props.value.peek()
      effect(() => {
        props.value()
        props.required()
        props.minlength()
        props.maxlength()
        const error = props.error()
        queueMicrotask(() => {
          input.setCustomValidity(error)
          message.set(input.validationMessage)
          fit()
        })
      })
      effect(() => {
        if (!props.autosize()) input.style.removeProperty("height")
        else queueMicrotask(fit)
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

    const expand = async () => {
      if (props.disabled.peek()) return
      const readonly = props.readonly.peek()
      const draft = signal(input.value)
      const result = await dialogs.open<string>({
        heading: props.expandHeading.peek() || props.label.peek() || text.peek().expand,
        size: "lg",
        attrs: { "data-textarea-editor": "" },
        content: (ref) => html`<textarea
          data-part="editor"
          aria-label=${props.label.peek() || text.peek().expand}
          placeholder=${props.placeholder.peek() || null}
          maxlength=${props.maxlength.peek() || null}
          ?readonly=${readonly}
          autofocus
          .value=${draft}
          @input=${(e: Event) => draft.set((e.target as HTMLTextAreaElement).value)}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !readonly) {
              e.preventDefault()
              void ref.close(draft.peek())
            }
          }}
        ></textarea>`,
        footer: (ref) =>
          readonly
            ? html`<bz-button @click=${() => void ref.close()}>${text.peek().close}</bz-button>`
            : html`<bz-button @click=${() => void ref.close()}>${text.peek().cancel}</bz-button>
                <bz-button variant="primary" @click=${() => void ref.close(draft.peek())}>${text.peek().apply}</bz-button>`,
      })
      input.focus()
      if (result === undefined || result === input.value) return
      input.value = result
      props.value.set(result)
      touched.set(true)
      input.dispatchEvent(new Event("input", { bubbles: true }))
      input.dispatchEvent(new Event("change", { bubbles: true }))
    }

    const count = () => {
      const n = props.value().length
      const max = props.maxlength()
      return max > 0 ? `${n} / ${max}` : String(n)
    }
    const optional = (value: () => string | number) => () => value() || null

    return html`
      <label data-part="label" for=${id} ?hidden=${() => !props.label()}>${props.label}</label>
      <div data-part="control">
        <textarea
          data-part="input"
          id=${id}
          name=${optional(props.name)}
          rows=${props.rows}
          placeholder=${optional(props.placeholder)}
          minlength=${optional(props.minlength)}
          maxlength=${optional(props.maxlength)}
          ?required=${props.required}
          ?readonly=${props.readonly}
          ?disabled=${props.disabled}
          aria-invalid=${() => (showError() ? "true" : null)}
          aria-describedby=${() =>
            [props.hint() && `${id}-hint`, props.showCount() && `${id}-count`, showError() && `${id}-error`]
              .filter(Boolean)
              .join(" ") || null}
          aria-keyshortcuts=${() => (props.expandable() ? "Control+Shift+Enter" : null)}
          .value=${props.value}
          @input=${(e: Event) => {
            props.value.set((e.target as HTMLTextAreaElement).value)
            fit()
          }}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === "Enter" && e.shiftKey && (e.ctrlKey || e.metaKey) && props.expandable.peek()) {
              e.preventDefault()
              void expand()
            }
          }}
          @blur=${() => touched.set(true)}
          @invalid=${() => touched.set(true)}
          ref=${(el: HTMLTextAreaElement) => (input = el)}
        ></textarea>
        <button
          type="button"
          data-part="expand"
          ?hidden=${() => !props.expandable()}
          ?disabled=${props.disabled}
          aria-label=${() => text().expand}
          aria-haspopup="dialog"
          title=${() => `${text().expand} (Ctrl+Shift+Enter)`}
          @click=${() => void expand()}
        >${hasIcon("maximize") ? icon("maximize") : "⤢"}</button>
      </div>
      <div data-part="footer" ?hidden=${() => !props.hint() && !props.showCount()}>
        <div data-part="hint" id=${`${id}-hint`} ?hidden=${() => !props.hint()}>${props.hint}</div>
        <div data-part="count" id=${`${id}-count`} ?hidden=${() => !props.showCount()}>${count}</div>
      </div>
      <div data-part="error" id=${`${id}-error`} ?hidden=${() => !showError()}>${message}</div>
    `
  },
})

export interface TextareaLabels {
  expand: string
  apply: string
  cancel: string
  close: string
}

const TEXTAREA_LABELS: TextareaLabels = { expand: "Expand", apply: "Apply", cancel: "Cancel", close: "Close" }

declare global {
  interface HTMLElementTagNameMap {
    "bz-textarea": InstanceType<typeof Textarea>
  }
}
