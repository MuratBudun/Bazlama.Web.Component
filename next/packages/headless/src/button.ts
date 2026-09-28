import { computed, define, effect, prop, signal } from "@bazlama/core"
import { toggleAria } from "./shared"

/**
 * <bz-button> — enhancer (no template): children are the label.
 *
 * Styling hooks: [aria-disabled="true"], [aria-busy="true"], [aria-pressed], [disabled], [loading].
 * Toggle button: set pressed="false" (or "true"); every click flips it.
 * Form: type="submit" | "reset" acts on the owning <form>.
 */
export const Button = define("bz-button", {
  form: true,
  props: {
    disabled: prop.boolean(false, { reflect: true }),
    loading: prop.boolean(false, { reflect: true }),
    type: prop.string<"button" | "submit" | "reset">("button"),
    pressed: prop.string<"" | "true" | "false">("", { reflect: true }),
  },
  setup(props, ctx) {
    const { host, internals } = ctx
    const formDisabled = signal(false)
    const blocked = computed(() => props.disabled() || formDisabled())
    const inactive = computed(() => blocked() || props.loading())

    host.setAttribute("role", "button")
    effect(() => {
      host.tabIndex = blocked() ? -1 : 0
      toggleAria(host, "aria-disabled", inactive())
      toggleAria(host, "aria-busy", props.loading())
      const pressed = props.pressed()
      if (pressed) host.setAttribute("aria-pressed", pressed)
      else host.removeAttribute("aria-pressed")
    })
    ctx.onFormDisabled((disabled) => formDisabled.set(disabled))

    // Capture phase on the host runs before any other click listener, even for clicks on children.
    ctx.on(
      host,
      "click",
      (e) => {
        if (!inactive.peek()) return
        e.preventDefault()
        e.stopImmediatePropagation()
      },
      { capture: true }
    )
    ctx.on(host, "click", (e) => {
      if (e.defaultPrevented) return
      const pressed = props.pressed.peek()
      if (pressed) props.pressed.set(pressed === "true" ? "false" : "true")
      const form = internals?.form
      if (!form) return
      if (props.type.peek() === "submit") form.requestSubmit()
      else if (props.type.peek() === "reset") form.reset()
    })
    ctx.on<KeyboardEvent>(host, "keydown", (e) => {
      if (e.target !== host) return
      if (e.key === "Enter") {
        e.preventDefault()
        host.click()
      } else if (e.key === " ") {
        e.preventDefault()
      }
    })
    ctx.on<KeyboardEvent>(host, "keyup", (e) => {
      if (e.target === host && e.key === " ") host.click()
    })
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "bz-button": InstanceType<typeof Button>
  }
}
