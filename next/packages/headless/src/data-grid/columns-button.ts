import { define, html, prop } from "@bazlama/core"
import { hasIcon, icon } from "../icon"
import type { DataGridElement } from "./grid"

/**
 * <bz-data-grid-columns for="grid-id"> — a "Columns" button (e.g. in a toolbar) that opens the
 * grid's show/hide columns menu. The content is the button label (default: the grid's
 * `labels.columns`). Without `for`, the nearest bz-data-grid around it or in its parent is used.
 *
 * Anatomy: [data-part=button]. Pass button attributes through CSS (it is a bz-button).
 */
export const DataGridColumns = define("bz-data-grid-columns", {
  props: {
    for: prop.string(),
    size: prop.string("sm"),
    variant: prop.string("ghost"),
  },
  setup(props, ctx) {
    const { host } = ctx
    const grid = (): DataGridElement | null => {
      const id = props.for.peek()
      if (id) return (host.ownerDocument.getElementById(id) as DataGridElement | null) ?? null
      return (host.closest("bz-data-grid") ?? host.parentElement?.querySelector("bz-data-grid") ?? null) as DataGridElement | null
    }
    const label = () =>
      ctx.hasSlot() ? ctx.slot() : ((grid()?.labels as { columns?: string } | undefined)?.columns ?? "Columns")
    return html`<bz-button
      data-part="button"
      size=${props.size}
      variant=${props.variant}
      aria-haspopup="menu"
      @click=${(e: MouseEvent) => void grid()?.openColumnsMenu(e.currentTarget as HTMLElement)}
    >${hasIcon("layers") ? icon("layers") : null} ${label}</bz-button>`
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "bz-data-grid-columns": InstanceType<typeof DataGridColumns>
  }
}
