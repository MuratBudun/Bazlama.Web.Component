import { define, effect, html, prop } from "@bazlama/core"
import { hasIcon, icon } from "./icon"

/**
 * <bz-alert variant="info|success|warning|danger" heading="…" dismissible live="polite|assertive">
 *
 * A callout for a message in the page (not a toast). Default slot: the message; slot
 * "actions": buttons below it; slot "icon" replaces the variant icon (`icon="none"` hides it).
 *
 * - Static by default (role="note"): read in the flow of the page. With `live` it becomes a
 *   live region (role="status" for "polite", role="alert" for "assertive"), for messages that
 *   appear later, e.g. a failed save.
 * - `dismissible` adds a close button: the cancelable `dismiss` event fires (does not bubble);
 *   unless prevented the alert hides itself (`hidden`). Set `hidden = false` to show it again.
 *
 * Anatomy: [data-part=icon|body|heading|message|actions|close]. Styling hooks: [variant].
 */

const VARIANT_ICONS: Record<string, string> = { info: "info", success: "circle-check", warning: "alert", danger: "alert" }

export const Alert = define("bz-alert", {
  props: {
    variant: prop.string<"info" | "success" | "warning" | "danger">("info", { reflect: true }),
    heading: prop.string(),
    /** Icon name; "none" hides it. Default: by variant. */
    icon: prop.string(),
    dismissible: prop.boolean(),
    closeLabel: prop.string("Close"),
    live: prop.string<"" | "polite" | "assertive">(""),
  },
  setup(props, ctx) {
    const { host } = ctx
    const role = () => (props.live() === "assertive" ? "alert" : props.live() === "polite" ? "status" : "note")
    effect(() => host.setAttribute("role", role()))
    const iconName = () => (props.icon() === "none" ? "" : props.icon() || VARIANT_ICONS[props.variant()] || "info")
    const dismiss = () => {
      if (ctx.emit("dismiss", undefined, { cancelable: true, bubbles: false })) host.hidden = true
    }

    return html`
      ${ctx.hasSlot("icon")
        ? html`<span data-part="icon" aria-hidden="true">${ctx.slot("icon")}</span>`
        : html`<span data-part="icon" aria-hidden="true" ?hidden=${() => !iconName()}>${() =>
            iconName() && hasIcon(iconName()) ? icon(iconName()) : null}</span>`}
      <div data-part="body">
        <div data-part="heading" ?hidden=${() => !props.heading()}>${props.heading}</div>
        <div data-part="message">${ctx.slot()}</div>
        ${ctx.hasSlot("actions") ? html`<div data-part="actions">${ctx.slot("actions")}</div>` : null}
      </div>
      <button type="button" data-part="close" aria-label=${props.closeLabel} ?hidden=${() => !props.dismissible()} @click=${dismiss}>
        ${hasIcon("x") ? icon("x") : "×"}
      </button>
    `
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "bz-alert": InstanceType<typeof Alert>
  }
}
