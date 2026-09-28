import { computed, define, effect, html, prop, uid, untrack } from "@bazlama/core"
import { hasIcon, icon } from "./icon"

export interface PaginationLabels {
  nav: string
  first: string
  previous: string
  next: string
  last: string
  /** Accessible name of a page button. */
  page: (page: number) => string
  /** "Page" before the input (compact). */
  pageInput: string
  /** "of 12" after the input (compact). */
  of: (pages: number) => string
  pageSize: string
  /** Range text: (from, to, total). */
  info: (from: number, to: number, total: number) => string
  empty: string
}

export const PAGINATION_LABELS: PaginationLabels = {
  nav: "Pagination",
  first: "First page",
  previous: "Previous page",
  next: "Next page",
  last: "Last page",
  page: (p) => `Page ${p}`,
  pageInput: "Page",
  of: (n) => `of ${n}`,
  pageSize: "Per page",
  info: (a, b, t) => `${a}–${b} of ${t}`,
  empty: "No items",
}

type Item = number | "gap" | null

/** Page items: 1 … 4 5 [6] 7 8 … 20 (MUI's algorithm; a fixed number of slots). */
export function pageItems(page: number, count: number, siblings = 1, boundaries = 1): Item[] {
  const range = (a: number, b: number) => (b < a ? [] : Array.from({ length: b - a + 1 }, (_, i) => a + i))
  const start = range(1, Math.min(boundaries, count))
  const end = range(Math.max(count - boundaries + 1, boundaries + 1), count)
  const sibStart = Math.max(Math.min(page - siblings, count - boundaries - siblings * 2 - 1), boundaries + 2)
  const sibEnd = Math.min(Math.max(page + siblings, boundaries + siblings * 2 + 2), end.length ? end[0] - 2 : count - 1)
  const items: Item[] = [
    ...start,
    ...(sibStart > boundaries + 2 ? ["gap" as const] : boundaries + 1 < count - boundaries ? [boundaries + 1] : []),
    ...range(sibStart, sibEnd),
    ...(sibEnd < count - boundaries - 1 ? ["gap" as const] : count - boundaries > boundaries ? [count - boundaries] : []),
    ...end,
  ]
  return items
}

/**
 * <bz-pagination page total page-size variant="numbers|compact">
 *
 * - numbers: ‹ 1 … 4 [5] 6 … 20 › (`siblings`, `boundaries`).
 * - compact: « ‹ Page [5] of 20 › » (the ExtJS-style paging toolbar).
 * `page-sizes` (e.g. [10, 25, 50]) adds a native select; `show-info` the "21–30 of 195" text.
 * The default slot goes between the controls and the info (e.g. a refresh button).
 *
 * `change` { page, pageSize } when the user moves (does not bubble). A `page` beyond the
 * last page (e.g. after filtering) is clamped, also with a `change`.
 *
 * Anatomy: [data-part=nav|first|previous|pages|page|gap|next|last|page-input|of|size|info].
 * Styling hooks: [variant], [disabled], [aria-current="page"] on the current page.
 */
export const Pagination = define("bz-pagination", {
  props: {
    page: prop.number(1),
    total: prop.number(0),
    pageSize: prop.number(10),
    variant: prop.string<"numbers" | "compact">("numbers", { reflect: true }),
    siblings: prop.number(1),
    boundaries: prop.number(1),
    /** First/last buttons (numbers variant; compact always has them). */
    edges: prop.boolean(),
    pageSizes: prop.object<number[]>([]),
    showInfo: prop.boolean(),
    disabled: prop.boolean(false, { reflect: true }),
    labels: prop.object<Partial<PaginationLabels>>({}),
  },
  setup(props, ctx) {
    const { host } = ctx
    const id = uid("bz-pagination")
    const text = computed(() => ({ ...PAGINATION_LABELS, ...props.labels() }))
    const size = computed(() => Math.max(1, props.pageSize() || 10))
    const pages = computed(() => Math.max(1, Math.ceil(Math.max(0, props.total()) / size())))
    const current = computed(() => Math.min(pages(), Math.max(1, Math.round(props.page()) || 1)))
    const items = computed(() => pageItems(current(), pages(), Math.max(0, props.siblings()), Math.max(1, props.boundaries())))
    /** Fixed number of slots so buttons are reused (focus stays) while the window moves. */
    const slotCount = computed(() => 2 * Math.max(1, props.boundaries()) + 2 * Math.max(0, props.siblings()) + 3)

    host.setAttribute("role", "navigation")
    effect(() => host.setAttribute("aria-label", text().nav))

    const go = (page: number, pageSize = size.peek()) => {
      const count = Math.max(1, Math.ceil(Math.max(0, props.total.peek()) / pageSize))
      const next = Math.min(count, Math.max(1, page))
      if (next === props.page.peek() && pageSize === props.pageSize.peek()) return
      props.page.set(next)
      props.pageSize.set(pageSize)
      ctx.emit("change", { page: next, pageSize }, { bubbles: false })
    }
    // Clamp when the total shrinks below the current page.
    effect(() => {
      const count = pages()
      const page = props.page()
      if (page > count && props.total() >= 0) untrack(() => queueMicrotask(() => go(count)))
    })

    const off = (cond: () => boolean) => () => props.disabled() || cond()
    const glyph = (name: string, fallback: string) => (hasIcon(name) ? icon(name) : fallback)
    const button = (part: string, label: () => string, disabled: () => boolean, target: () => number, content: unknown) =>
      html`<button type="button" data-part=${part} aria-label=${label} title=${label} ?disabled=${off(disabled)}
        @click=${() => go(target())}>${content}</button>`

    const first = button("first", () => text().first, () => current() <= 1, () => 1, glyph("chevrons-left", "«"))
    const previous = button("previous", () => text().previous, () => current() <= 1, () => current() - 1, glyph("chevron-left", "‹"))
    const next = button("next", () => text().next, () => current() >= pages(), () => current() + 1, glyph("chevron-right", "›"))
    const last = button("last", () => text().last, () => current() >= pages(), () => pages(), glyph("chevrons-right", "»"))

    const slots = () =>
      Array.from({ length: slotCount() }, (_, i) => {
        const item = () => items()[i] ?? null
        const num = () => (typeof item() === "number" ? (item() as number) : 0)
        return html`<button
            type="button"
            data-part="page"
            ?hidden=${() => typeof item() !== "number"}
            ?disabled=${props.disabled}
            aria-label=${() => text().page(num())}
            aria-current=${() => (num() === current() ? "page" : null)}
            @click=${() => go(num())}
          >${num}</button><span data-part="gap" aria-hidden="true" ?hidden=${() => item() !== "gap"}>…</span>`
      })

    const numbers = html`${() => (props.edges() ? first : null)}${previous}
      <span data-part="pages">${slots}</span>
      ${next}${() => (props.edges() ? last : null)}`

    const compact = html`${first}${previous}
      <label data-part="page-label" for=${`${id}-page`}>${() => text().pageInput}</label>
      <input
        data-part="page-input"
        id=${`${id}-page`}
        type="text"
        inputmode="numeric"
        autocomplete="off"
        ?disabled=${props.disabled}
        .value=${() => String(current())}
        size=${() => Math.max(2, String(pages()).length)}
        @change=${(e: Event) => {
          const input = e.target as HTMLInputElement
          const n = Number.parseInt(input.value, 10)
          if (Number.isNaN(n)) input.value = String(current.peek())
          else go(n)
          input.value = String(current.peek())
        }}
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === "ArrowUp") (e.preventDefault(), go(current.peek() + 1))
          else if (e.key === "ArrowDown") (e.preventDefault(), go(current.peek() - 1))
        }}
      />
      <span data-part="of">${() => text().of(pages())}</span>
      ${next}${last}`

    const info = () => {
      const total = props.total()
      if (total <= 0) return text().empty
      const from = (current() - 1) * size() + 1
      return text().info(from, Math.min(total, from + size() - 1), total)
    }

    return html`
      ${() => (props.variant() === "compact" ? compact : numbers)}
      ${() =>
        props.pageSizes().length
          ? html`<label data-part="size">
              <span>${() => text().pageSize}</span>
              <select ?disabled=${props.disabled} @change=${(e: Event) => {
                const pageSize = Number((e.target as HTMLSelectElement).value)
                // Keep the first visible row on screen.
                const firstRow = (current.peek() - 1) * size.peek()
                go(Math.floor(firstRow / pageSize) + 1, pageSize)
              }}>
                ${props.pageSizes().map((n) => html`<option value=${n} .selected=${() => n === size()}>${n}</option>`)}
              </select>
            </label>`
          : null}
      ${ctx.slot()}
      <span data-part="info" aria-live="polite" ?hidden=${() => !props.showInfo()}>${info}</span>
    `
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "bz-pagination": InstanceType<typeof Pagination>
  }
}
