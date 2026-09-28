import { define, html, prop, uid } from "@bazlama/core"

/**
 * <bz-panel> — card / disclosure.
 *
 * Anatomy: [data-part=header|title|trigger|actions|content|footer].
 * Slots: header (replaces `heading`), actions, default (content), footer.
 * With `collapsible`, the header becomes a button toggling `open` (reflected) and fires `toggle`.
 */
export const Panel = define("bz-panel", {
  props: {
    heading: prop.string(),
    collapsible: prop.boolean(),
    open: prop.boolean(false, { reflect: true }),
  },
  setup(props, ctx) {
    const id = uid("bz-panel")
    const title = () => (ctx.hasSlot("header") ? ctx.slot("header") : props.heading())
    const toggle = () => {
      props.open.set(!props.open.peek())
      ctx.emit("toggle", { open: props.open.peek() }, { bubbles: false })
    }

    return html`
      <div data-part="header">
        ${() =>
          props.collapsible()
            ? html`<button
                data-part="trigger"
                type="button"
                id=${`${id}-title`}
                aria-expanded=${() => String(props.open())}
                aria-controls=${`${id}-content`}
                @click=${toggle}
              >
                ${title}
              </button>`
            : html`<div data-part="title" id=${`${id}-title`}>${title}</div>`}
        <div data-part="actions" ?hidden=${!ctx.hasSlot("actions")}>${ctx.slot("actions")}</div>
      </div>
      <div
        data-part="content"
        id=${`${id}-content`}
        role="region"
        aria-labelledby=${`${id}-title`}
        ?hidden=${() => props.collapsible() && !props.open()}
      >
        ${ctx.slot()}
      </div>
      ${ctx.hasSlot("footer") ? html`<div data-part="footer">${ctx.slot("footer")}</div>` : null}
    `
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "bz-panel": InstanceType<typeof Panel>
  }
}
