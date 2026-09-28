import { define, effect, html, onCleanup, prop, uid } from "@bazlama/core"

/** Children that span: data-span="2" | "full". */
const SPANNED = ":scope > [data-span], :scope > bz-form-section > [data-span]"

/**
 * <bz-form-layout columns min-column-width label-position label-width> — a field grid.
 *
 * Up to `columns` equal columns; fewer when a column would be narrower than
 * `min-column-width` (down to one on a phone). The count is measured, so spans shrink with it:
 * `data-span="2"` spans two columns (one when only one fits), `data-span="full"` the whole row.
 * `label-position="start"` puts labels beside the fields (`label-width`); it applies to
 * bz-input, bz-textarea, bz-combobox, bz-lookup and bz-radio-group inside.
 *
 * Children: fields, <bz-form-section heading> (a labelled group on the same grid),
 * <bz-form-actions> (buttons row), anything with data-span.
 *
 * Styling hooks: [label-position], [data-columns] (current count), --bz-form-gap,
 * --bz-form-row-gap.
 */
export const FormLayout = define("bz-form-layout", {
  props: {
    columns: prop.number(2),
    minColumnWidth: prop.string("14rem"),
    labelPosition: prop.string<"top" | "start">("top", { reflect: true }),
    labelWidth: prop.string("10rem"),
  },
  setup(props, ctx) {
    const { host } = ctx
    let count = 0

    effect(() => {
      host.style.setProperty("--bz-form-columns", String(Math.max(1, Math.round(props.columns()) || 1)))
      host.style.setProperty("--bz-form-min", props.minColumnWidth())
      host.style.setProperty("--bz-form-label-width", props.labelWidth())
      queueMicrotask(measure)
    })

    /**
     * Columns the grid actually has (auto-fill resolves them; jsdom has no layout). A span wider
     * than the grid adds implicit tracks that are counted too, so measure again after clamping.
     */
    function measure() {
      for (let i = 0; i < 4; i++) {
        const tracks = getComputedStyle(host).gridTemplateColumns
        const measured = /px/.test(tracks) ? tracks.trim().split(/\s+/).length : 0
        const next = measured || Math.max(1, Math.round(props.columns.peek()) || 1)
        const changed = next !== count
        if (changed) {
          count = next
          host.setAttribute("data-columns", String(next))
        }
        spans()
        if (!changed) break
      }
    }
    function spans() {
      for (const el of host.querySelectorAll<HTMLElement>(SPANNED)) {
        const span = el.dataset.span
        const n = span === "full" ? count : Math.min(count, Math.max(1, Number.parseInt(span ?? "1", 10) || 1))
        const value = span === "full" || n >= count ? "1 / -1" : `span ${n}`
        if (el.style.gridColumn !== value) el.style.gridColumn = value
      }
    }

    ctx.onMount(() => {
      measure()
      if (typeof ResizeObserver !== "undefined") {
        const resize = new ResizeObserver(measure)
        resize.observe(host)
        onCleanup(() => resize.disconnect())
      }
      const mutations = new MutationObserver(spans)
      mutations.observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-span"] })
      onCleanup(() => mutations.disconnect())
    })
  },
})

/**
 * <bz-form-section heading description level> — a titled group of fields on the parent
 * layout's columns (CSS subgrid). role="group", named by the heading.
 *
 * Anatomy: [data-part=header|heading|description].
 */
export const FormSection = define("bz-form-section", {
  props: {
    heading: prop.string(),
    description: prop.string(),
    level: prop.number(3),
  },
  setup(props, ctx) {
    const { host } = ctx
    const id = uid("bz-form-section")
    host.setAttribute("role", "group")
    effect(() => {
      if (props.heading()) host.setAttribute("aria-labelledby", `${id}-heading`)
      else host.removeAttribute("aria-labelledby")
      if (props.description()) host.setAttribute("aria-describedby", `${id}-description`)
      else host.removeAttribute("aria-describedby")
    })
    return html`
      <div data-part="header" ?hidden=${() => !props.heading() && !props.description() && !ctx.hasSlot("actions")}>
        <div data-part="heading" id=${`${id}-heading`} role="heading" aria-level=${props.level}
          ?hidden=${() => !props.heading()}>${props.heading}</div>
        <div data-part="description" id=${`${id}-description`} ?hidden=${() => !props.description()}>${props.description}</div>
        ${ctx.slot("actions")}
      </div>
      ${ctx.slot()}
    `
  },
})

/** <bz-form-actions align="end|start|between"> — the buttons row of a form (full width). */
export const FormActions = define("bz-form-actions", {
  props: {
    align: prop.string<"start" | "end" | "between">("end", { reflect: true }),
  },
  setup() {},
})

declare global {
  interface HTMLElementTagNameMap {
    "bz-form-layout": InstanceType<typeof FormLayout>
    "bz-form-section": InstanceType<typeof FormSection>
    "bz-form-actions": InstanceType<typeof FormActions>
  }
}
