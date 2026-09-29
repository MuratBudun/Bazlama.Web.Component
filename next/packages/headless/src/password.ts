import { computed, define, effect, html, prop, signal, uid } from "@bazlama/core"
import { hasIcon, icon } from "./icon"

/**
 * <bz-password> — a password field: reveal toggle, Caps Lock warning, optional strength meter.
 *
 * Like <bz-input> it renders a real <input name>, so the form, native validation, reset and
 * the password manager keep working; only `type` flips between "password" and "text".
 */

export interface PasswordLabels {
  show: string
  hide: string
  capsLock: string
  /** One per score, from 0 (weakest) to 4. */
  strength: readonly string[]
}

export const PASSWORD_LABELS: PasswordLabels = {
  show: "Show password",
  hide: "Hide password",
  capsLock: "Caps Lock is on",
  strength: ["Very weak", "Weak", "Fair", "Good", "Strong"],
}

const CLASSES = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/]

/**
 * Rough strength score 0-4 from length and character variety. A local heuristic, not a
 * policy: enforce real rules on the server (and `required`/`minlength`/`pattern` here).
 */
export function passwordStrength(value: string): number {
  if (!value) return 0
  const variety = CLASSES.filter((re) => re.test(value)).length
  let score = 0
  if (value.length >= 6) score++
  if (value.length >= 10) score++
  if (variety >= 2) score++
  if (variety >= 3 && value.length >= 8) score++
  // A single repeated character, or one character class in a short password, stays weak.
  if (/^(.)\1*$/.test(value) || (variety === 1 && value.length < 12)) score = Math.min(score, 1)
  return Math.min(4, score)
}

export const Password = define("bz-password", {
  props: {
    value: prop.string(),
    name: prop.string(),
    label: prop.string(),
    hint: prop.string(),
    placeholder: prop.string(),
    /** "current-password" (login) or "new-password" (sign-up / change). */
    autocomplete: prop.string("current-password"),
    pattern: prop.string(),
    minlength: prop.number(),
    maxlength: prop.number(),
    required: prop.boolean(),
    readonly: prop.boolean(),
    disabled: prop.boolean(false, { reflect: true }),
    /** Custom error message; non-empty makes the field invalid. */
    error: prop.string(),
    /** Hides the reveal button (shown by default). */
    hideToggle: prop.boolean(),
    /** Current visibility; reflected, so CSS can follow it. */
    revealed: prop.boolean(false, { reflect: true }),
    /** Turns off the Caps Lock warning (shown by default while the field has focus). */
    hideCapsWarning: prop.boolean(),
    /** Strength meter under the field (for new passwords). */
    strength: prop.boolean(false, { reflect: true }),
    labels: prop.object<Partial<PasswordLabels>>({}),
  },
  setup(props, ctx) {
    const id = uid("bz-password")
    const hintId = `${id}-hint`
    const errorId = `${id}-error`
    const capsId = `${id}-caps`
    const strengthId = `${id}-strength`
    let input!: HTMLInputElement
    const touched = signal(false)
    const message = signal("")
    const caps = signal(false)
    const focused = signal(false)
    const showError = computed(() => touched() && message() !== "")
    const showCaps = computed(() => !props.hideCapsWarning() && caps() && focused())
    const score = computed(() => passwordStrength(props.value()))
    const text = computed(() => ({ ...PASSWORD_LABELS, ...props.labels() }))

    effect(() => ctx.host.toggleAttribute("data-invalid", showError()))
    effect(() => ctx.host.toggleAttribute("data-caps-lock", showCaps()))

    ctx.onMount(() => {
      input.defaultValue = props.value.peek()
      effect(() => {
        props.value()
        props.required()
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
            props.revealed.set(false)
            touched.set(false)
          })
        )
      }
    })

    const trackCaps = (e: KeyboardEvent) => {
      // getModifierState is missing on synthetic events (and in jsdom): leave the state alone.
      if (typeof e.getModifierState === "function") caps.set(e.getModifierState("CapsLock"))
    }
    /** Keeps focus and the caret: the field is still the same element, only `type` changed. */
    const toggle = () => {
      const start = input.selectionStart
      const end = input.selectionEnd
      props.revealed.update((on) => !on)
      input.focus()
      // Changing `type` resets the selection in some browsers.
      try {
        input.setSelectionRange(start ?? input.value.length, end ?? input.value.length)
      } catch {
        /* selection is not supported on every type */
      }
    }

    const optional = (value: () => string | number) => () => value() || null
    const describedBy = () =>
      [props.hint() && hintId, showError() && errorId, showCaps() && capsId, props.strength() && strengthId]
        .filter(Boolean)
        .join(" ") || null

    return html`
      <label data-part="label" for=${id} ?hidden=${() => !props.label()}>${props.label}</label>
      <div data-part="control">
        ${ctx.slot("prefix")}
        <input
          data-part="input"
          id=${id}
          type=${() => (props.revealed() ? "text" : "password")}
          name=${optional(props.name)}
          placeholder=${optional(props.placeholder)}
          autocomplete=${optional(props.autocomplete)}
          pattern=${optional(props.pattern)}
          minlength=${optional(props.minlength)}
          maxlength=${optional(props.maxlength)}
          ?required=${props.required}
          ?readonly=${props.readonly}
          ?disabled=${props.disabled}
          spellcheck="false"
          autocapitalize="off"
          aria-invalid=${() => (showError() ? "true" : null)}
          aria-describedby=${describedBy}
          .value=${props.value}
          @input=${(e: Event) => props.value.set((e.target as HTMLInputElement).value)}
          @keydown=${trackCaps}
          @keyup=${trackCaps}
          @focus=${(e: FocusEvent) => (focused.set(true), trackCaps(e as unknown as KeyboardEvent))}
          @blur=${() => (focused.set(false), touched.set(true))}
          @invalid=${() => touched.set(true)}
          ref=${(el: HTMLInputElement) => (input = el)}
        />
        ${ctx.slot("suffix")}
        <button
          type="button"
          data-part="toggle"
          tabindex="-1"
          ?hidden=${props.hideToggle}
          ?disabled=${() => props.disabled() || props.readonly()}
          aria-controls=${id}
          aria-pressed=${() => (props.revealed() ? "true" : "false")}
          aria-label=${() => (props.revealed() ? text().hide : text().show)}
          @click=${toggle}
        >
          ${() => {
            const name = props.revealed() ? "eye-off" : "eye"
            return hasIcon(name) ? icon(name) : props.revealed() ? "🙈" : "👁"
          }}
        </button>
      </div>
      <div data-part="caps" id=${capsId} role="status" ?hidden=${() => !showCaps()}>${() => text().capsLock}</div>
      <div data-part="strength" id=${strengthId} ?hidden=${() => !props.strength()} data-score=${() => String(score())}>
        <div data-part="meter" aria-hidden="true">
          ${[0, 1, 2, 3].map((i) => html`<span data-part="bar" data-on=${() => (score() > i ? "" : null)}></span>`)}
        </div>
        <span data-part="strength-label">${() => (props.value() ? (text().strength[score()] ?? "") : "")}</span>
      </div>
      <div data-part="hint" id=${hintId} ?hidden=${() => !props.hint()}>${props.hint}</div>
      <div data-part="error" id=${errorId} ?hidden=${() => !showError()}>${message}</div>
    `
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "bz-password": InstanceType<typeof Password>
  }
}
