import { computed, define, effect, html, onCleanup, prop, signal, uid } from "@bazlama/core"
import "./button"
import "./checkbox"
import "./input"
import "./password"

/**
 * <bz-login> — the sign-in card: identifier + password, "remember me", a forgot link and an
 * optional second step for a verification code (2FA / OTP).
 *
 * It is UI only: nothing is sent anywhere. The app listens for `submit`, sets `loading`, then
 * either sets `error`, or moves the card on with `step="code"`:
 *
 *   el.addEventListener("submit", async (e) => {
 *     el.loading = true
 *     const result = await api.signIn(e.detail)
 *     el.loading = false
 *     if (result.needsCode) el.step = "code"
 *     else if (!result.ok) el.error = "Wrong email or password."
 *   })
 *
 * The fields are real <bz-input>/<bz-password>/<bz-checkbox> inside a real <form>, so Enter
 * submits, `required` is validated natively and password managers see a normal login form.
 *
 * Anatomy: [data-part=card|header|logo|heading|description|error|form|identifier|password|
 * row|remember|forgot|code|code-note|resend|back|submit|providers|divider|footer].
 * Styling hooks: [step], [loading].
 */

export interface LoginLabels {
  identifier: string
  password: string
  remember: string
  forgot: string
  submit: string
  code: string
  /** `{n}` becomes the code length, `{destination}` the `code-destination` value. */
  codeNote: string
  verify: string
  resend: string
  /** `{s}` becomes the remaining seconds. */
  resendIn: string
  back: string
  or: string
}

export const LOGIN_LABELS: LoginLabels = {
  identifier: "Email",
  password: "Password",
  remember: "Remember me",
  forgot: "Forgot password?",
  submit: "Sign in",
  code: "Verification code",
  codeNote: "Enter the {n}-digit code sent to {destination}.",
  verify: "Verify",
  resend: "Resend code",
  resendIn: "Resend in {s} s",
  back: "Back",
  or: "or",
}

const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (all, key: string) => values[key] ?? all)

export const Login = define("bz-login", {
  props: {
    heading: prop.string(),
    description: prop.string(),
    /** "credentials" (default) or "code" (second factor). */
    step: prop.string<"credentials" | "code">("credentials", { reflect: true }),
    loading: prop.boolean(false, { reflect: true }),
    /** Message shown above the form (role="alert"); empty hides it. */
    error: prop.string(),

    identifier: prop.string(),
    identifierLabel: prop.string(),
    identifierName: prop.string("username"),
    identifierType: prop.string("email"),
    identifierAutocomplete: prop.string("username"),
    identifierPlaceholder: prop.string(),

    password: prop.string(),
    passwordLabel: prop.string(),
    passwordName: prop.string("password"),
    /** Strength meter on the password field (for a sign-up-shaped form). */
    passwordStrength: prop.boolean(),

    remember: prop.boolean(false, { reflect: true }),
    /** Hides the "remember me" checkbox (shown by default). */
    hideRemember: prop.boolean(),
    /** Hides the forgot-password control: a link when `forgotHref` is set, else a button. */
    hideForgot: prop.boolean(),
    forgotHref: prop.string(),

    code: prop.string(),
    codeLength: prop.number(6),
    /** Shown in the code step's note, e.g. a masked phone number. */
    codeDestination: prop.string(),
    /** Do not submit on its own once the code is complete. */
    noAutoSubmit: prop.boolean(),
    /** Seconds before "Resend code" becomes available; 0 hides it. */
    resendSeconds: prop.number(0),

    labels: prop.object<Partial<LoginLabels>>({}),
  },
  setup(props, ctx) {
    const { host } = ctx
    const id = uid("bz-login")
    const text = computed(() => ({ ...LOGIN_LABELS, ...props.labels() }))
    const onCode = computed(() => props.step() === "code")
    const remaining = signal(0)
    let form!: HTMLFormElement
    let timer: ReturnType<typeof setInterval> | undefined

    const clear = () => clearInterval(timer)
    onCleanup(clear)

    const startCountdown = () => {
      clear()
      const seconds = Math.max(0, Math.round(props.resendSeconds.peek()))
      remaining.set(seconds)
      if (!seconds) return
      timer = setInterval(() => {
        remaining.update((n) => {
          if (n <= 1) clear()
          return Math.max(0, n - 1)
        })
      }, 1000)
    }

    // Entering the code step starts the resend countdown and moves focus to the code field.
    effect(() => {
      if (!onCode()) {
        clear()
        remaining.set(0)
        return
      }
      startCountdown()
      queueMicrotask(() => host.querySelector<HTMLElement>("[data-part=code] input")?.focus())
    })

    const submit = (e: Event) => {
      e.preventDefault()
      // The native submit must not escape the component: `submit` below is ours.
      e.stopPropagation()
      if (props.loading.peek()) return
      ctx.emit(
        "submit",
        onCode.peek()
          ? { step: "code", code: props.code.peek(), identifier: props.identifier.peek() }
          : {
              step: "credentials",
              identifier: props.identifier.peek(),
              password: props.password.peek(),
              remember: props.remember.peek(),
            }
      )
    }

    const resend = () => {
      if (remaining.peek() > 0) return
      props.code.set("")
      ctx.emit("resend", { identifier: props.identifier.peek() })
      startCountdown()
    }

    const back = () => {
      props.code.set("")
      props.error.set("")
      props.step.set("credentials")
      ctx.emit("back", undefined)
    }

    const onCodeInput = (e: Event) => {
      const el = e.currentTarget as HTMLElement & { value: string }
      const digits = el.value.replace(/\D/g, "").slice(0, Math.max(1, props.codeLength.peek()))
      props.code.set(digits)
      if (digits.length !== props.codeLength.peek()) return
      if (!props.noAutoSubmit.peek() && !props.loading.peek()) queueMicrotask(() => form.requestSubmit())
    }

    const credentials = () => html`
      <bz-input
        data-part="identifier"
        label=${() => props.identifierLabel() || text().identifier}
        name=${props.identifierName}
        type=${props.identifierType}
        autocomplete=${props.identifierAutocomplete}
        placeholder=${() => props.identifierPlaceholder() || null}
        required
        ?disabled=${props.loading}
        .value=${props.identifier}
        @input=${(e: Event) => props.identifier.set((e.currentTarget as HTMLInputElement).value)}
      ></bz-input>
      <bz-password
        data-part="password"
        label=${() => props.passwordLabel() || text().password}
        name=${props.passwordName}
        autocomplete=${() => (props.passwordStrength() ? "new-password" : "current-password")}
        ?strength=${props.passwordStrength}
        required
        ?disabled=${props.loading}
        .value=${props.password}
        @input=${(e: Event) => props.password.set((e.currentTarget as HTMLInputElement).value)}
      ></bz-password>
      <div data-part="row" ?hidden=${() => props.hideRemember() && props.hideForgot()}>
        <bz-checkbox
          data-part="remember"
          ?hidden=${props.hideRemember}
          label=${() => text().remember}
          ?disabled=${props.loading}
          .checked=${props.remember}
          @change=${(e: Event) => props.remember.set(!!(e as CustomEvent<{ checked: boolean }>).detail.checked)}
        ></bz-checkbox>
        ${() =>
          props.hideForgot()
            ? null
            : props.forgotHref()
              ? html`<a data-part="forgot" href=${props.forgotHref}>${() => text().forgot}</a>`
              : html`<button type="button" data-part="forgot" @click=${() => ctx.emit("forgot", { identifier: props.identifier.peek() })}>
                  ${() => text().forgot}
                </button>`}
      </div>
    `

    const codeStep = () => html`
      <p data-part="code-note">
        ${() => fill(text().codeNote, { n: String(props.codeLength()), destination: props.codeDestination() || props.identifier() })}
      </p>
      <bz-input
        data-part="code"
        label=${() => text().code}
        name="code"
        inputmode="numeric"
        autocomplete="one-time-code"
        maxlength=${props.codeLength}
        required
        ?disabled=${props.loading}
        .value=${props.code}
        @input=${onCodeInput}
      ></bz-input>
      <div data-part="row">
        <button type="button" data-part="back" @click=${back}>${() => text().back}</button>
        <button
          type="button"
          data-part="resend"
          ?hidden=${() => !props.resendSeconds()}
          ?disabled=${() => remaining() > 0 || props.loading()}
          @click=${resend}
        >
          ${() => (remaining() > 0 ? fill(text().resendIn, { s: String(remaining()) }) : text().resend)}
        </button>
      </div>
    `

    return html`
      <div data-part="card">
        <div
          data-part="header"
          ?hidden=${() => !props.heading() && !props.description() && !ctx.hasSlot("logo") && !ctx.hasSlot("header")}
        >
          ${ctx.hasSlot("logo") ? html`<div data-part="logo">${ctx.slot("logo")}</div>` : null}
          ${ctx.hasSlot("header")
            ? ctx.slot("header")
            : html`
                <h1 data-part="heading" id=${`${id}-heading`} ?hidden=${() => !props.heading()}>${props.heading}</h1>
                <p data-part="description" ?hidden=${() => !props.description()}>${props.description}</p>
              `}
        </div>

        <div data-part="error" role="alert" ?hidden=${() => !props.error()}>${props.error}</div>

        <form
          data-part="form"
          aria-labelledby=${() => (props.heading() ? `${id}-heading` : null)}
          @submit=${submit}
          ref=${(el: HTMLFormElement) => (form = el)}
        >
          ${() => (onCode() ? codeStep() : credentials())}
          ${ctx.slot("extra")}
          <bz-button data-part="submit" type="submit" variant="primary" .loading=${props.loading}>
            ${() => (onCode() ? text().verify : text().submit)}
          </bz-button>
        </form>

        ${ctx.hasSlot("providers")
          ? html`
              <div data-part="divider" aria-hidden="true"><span>${() => text().or}</span></div>
              <div data-part="providers">${ctx.slot("providers")}</div>
            `
          : null}
        ${ctx.hasSlot("footer") ? html`<div data-part="footer">${ctx.slot("footer")}</div>` : null}
      </div>
    `
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "bz-login": InstanceType<typeof Login>
  }
}
