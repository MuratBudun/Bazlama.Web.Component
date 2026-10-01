import { computed, define, effect, html, prop, render, repeat, signal, TemplateResult } from "@bazlama/core"

export type Row = Record<string, unknown>

export interface Column<R = Row> {
  key: string
  header: string
  sortable?: boolean
  align?: "start" | "center" | "end"
  width?: string
  /** Cell content: text, a node or an html`` template. */
  format?: (value: unknown, row: R) => unknown
  compare?: (a: R, b: R) => number
}

export type Sort = { key: string; dir: "asc" | "desc" } | null

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" })
/** Numbers numerically, everything else as text (locale-aware, numeric, case-insensitive). */
export const compareValues = (a: unknown, b: unknown) =>
  typeof a === "number" && typeof b === "number" ? a - b : collator.compare(String(a ?? ""), String(b ?? ""))

/**
 * <bz-table> — data table from `.columns` and `.rows` (properties).
 *
 * Rows are keyed by `row-key` (default "id"): replace a row object to update it, keep the
 * object to keep its DOM. Sorting: click sortable headers (sort-mode="manual" only fires
 * `sort` so data can be sorted elsewhere). `selectable` adds checkboxes; `.selection` holds
 * the selected keys and `selection-change` fires. `row-click` fires with the row.
 *
 * Opening a row: `row-activate` { row, key, via: "dblclick" | "keyboard" } fires on double
 * click, and with `activatable` on Enter: rows then take focus (one tab stop), ↑/↓, Home/End
 * and PageUp/PageDown move between them, Space toggles the selection (with `selectable`).
 *
 * Anatomy: [data-part=table|caption|head|body|row|cell|header-cell|sort|sort-indicator|select|empty].
 * `striped` (ui CSS): alternate rows get a faint band (`--bz-row-stripe-bg`).
 *
 * Styling hooks: th[aria-sort], tr[aria-selected="true"], tr:focus-visible, [activatable], [striped], [data-align].
 */
export const Table = define("bz-table", {
  props: {
    columns: prop.object<Column[]>([]),
    rows: prop.object<Row[]>([]),
    rowKey: prop.string("id"),
    selectable: prop.boolean(),
    selection: prop.object<unknown[]>([]),
    sort: prop.object<Sort>(null),
    sortMode: prop.string<"client" | "manual">("client"),
    label: prop.string(),
    /** Rows are focusable: arrow keys move, Enter fires row-activate. */
    activatable: prop.boolean(false, { reflect: true }),
    /** Zebra rows (ui CSS): every second row gets a faint band. */
    striped: prop.boolean(false, { reflect: true }),
  },
  setup(props, ctx) {
    const keyOf = (row: Row) => row[props.rowKey.peek()]
    const selected = computed(() => new Set(props.selection()))
    let body!: HTMLElement
    /** Key of the row holding the tab stop (activatable). */
    const activeKey = signal<unknown>(undefined)

    const sorted = computed(() => {
      const rows = props.rows()
      const sort = props.sort()
      if (!sort || props.sortMode() === "manual") return rows
      const column = props.columns().find((c) => c.key === sort.key)
      const compare = column?.compare ?? ((a: Row, b: Row) => compareValues(a[sort.key], b[sort.key]))
      const dir = sort.dir === "asc" ? 1 : -1
      return rows.slice().sort((a, b) => dir * compare(a, b))
    })
    const allState = computed(() => {
      const rows = props.rows()
      const sel = selected()
      let count = 0
      for (const row of rows) if (sel.has(keyOf(row))) count++
      return count === 0 ? "none" : count === rows.length ? "all" : "some"
    })

    const toggleSort = (column: Column) => {
      const s = props.sort.peek()
      const next: Sort =
        s?.key !== column.key ? { key: column.key, dir: "asc" } : s.dir === "asc" ? { key: column.key, dir: "desc" } : null
      props.sort.set(next)
      ctx.emit("sort", { sort: next })
    }
    const setSelection = (keys: unknown[]) => {
      props.selection.set(keys)
      ctx.emit("selection-change", { selection: keys })
    }
    const toggleRow = (row: Row) => {
      const next = new Set(selected.peek())
      const key = keyOf(row)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      setSelection([...next])
    }
    const activate = (row: Row, via: "dblclick" | "keyboard") => ctx.emit("row-activate", { row, key: keyOf(row), via })

    // The tab stop stays on an existing row (the first one when its row went away).
    effect(() => {
      const rows = sorted()
      const key = activeKey()
      if (!rows.some((r) => keyOf(r) === key)) activeKey.set(rows.length ? keyOf(rows[0]) : undefined)
    })
    const rowElements = () => Array.from(body.children).filter((el): el is HTMLElement => el.getAttribute("data-part") === "row")
    const onBodyKeydown = (e: KeyboardEvent) => {
      if (!props.activatable.peek()) return
      const tr = (e.target as Element).closest?.("tr[data-part=row]") as HTMLElement | null
      if (!tr || e.target !== tr) return
      const list = rowElements()
      const rows = sorted.peek()
      const i = list.indexOf(tr)
      const row = rows[i]
      if (!row) return
      const move = (to: number) => {
        const target = list[Math.max(0, Math.min(list.length - 1, to))]
        target?.focus()
        target?.scrollIntoView?.({ block: "nearest" })
      }
      switch (e.key) {
        case "ArrowDown": move(i + 1); break
        case "ArrowUp": move(i - 1); break
        case "Home": move(0); break
        case "End": move(list.length - 1); break
        case "PageDown": move(i + 10); break
        case "PageUp": move(i - 10); break
        case "Enter": activate(row, "keyboard"); break
        case " ":
          if (!props.selectable.peek()) return
          toggleRow(row)
          break
        default: return
      }
      e.preventDefault()
    }

    const toggleAll = () => setSelection(allState.peek() === "all" ? [] : props.rows.peek().map(keyOf))
    const ariaSort = (column: Column) => () => {
      const s = props.sort()
      if (s?.key === column.key) return s.dir === "asc" ? "ascending" : "descending"
      return column.sortable ? "none" : null
    }

    // Cells are built with plain DOM calls: they are the hot path for large tables.
    const cell = (column: Column, row: Row) => {
      const td = document.createElement("td")
      td.dataset.part = "cell"
      if (column.align) td.dataset.align = column.align
      const value = column.format ? column.format(row[column.key], row) : row[column.key]
      if (value instanceof TemplateResult || value instanceof Node || typeof value === "function") render(value, td)
      else if (value != null) td.textContent = String(value)
      return td
    }
    const rowTemplate = (columns: Column[], selectable: boolean) => (row: Row) => {
      const key = keyOf(row)
      const isSelected = () => selected().has(key)
      return html`<tr
        data-part="row"
        aria-selected=${selectable ? () => String(isSelected()) : null}
        tabindex=${() => (props.activatable() ? (activeKey() === key ? "0" : "-1") : null)}
        @click=${() => ctx.emit("row-click", { row })}
        @dblclick=${() => activate(row, "dblclick")}
        @focus=${() => activeKey.set(key)}
      >
        ${selectable
          ? html`<td
              data-part="select"
              @click=${(e: Event) => {
                // The whole cell is the target (the checkbox alone is too small to tap).
                e.stopPropagation()
                if (e.target === e.currentTarget) toggleRow(row)
              }}
            >
              <input
                type="checkbox"
                aria-label="Select row"
                .checked=${isSelected}
                @click=${(e: Event) => e.stopPropagation()}
                @change=${() => toggleRow(row)}
              />
            </td>`
          : null}
        ${columns.map((column) => cell(column, row))}
      </tr>`
    }

    return html`
      <table data-part="table">
        <caption data-part="caption" ?hidden=${() => !props.label()}>${props.label}</caption>
        <thead data-part="head">
          ${() => html`<tr>
            ${props.selectable()
              ? html`<th data-part="select" scope="col" @click=${(e: Event) => e.target === e.currentTarget && toggleAll()}>
                  <input
                    type="checkbox"
                    aria-label="Select all rows"
                    .checked=${() => allState() === "all"}
                    .indeterminate=${() => allState() === "some"}
                    @change=${toggleAll}
                  />
                </th>`
              : null}
            ${props.columns().map(
              (column) => html`<th
                data-part="header-cell"
                scope="col"
                data-align=${column.align ?? null}
                style=${column.width ? `width:${column.width}` : null}
                aria-sort=${ariaSort(column)}
              >
                ${column.sortable
                  ? html`<button type="button" data-part="sort" @click=${() => toggleSort(column)}>
                      ${column.header}<span data-part="sort-indicator" aria-hidden="true"></span>
                    </button>`
                  : column.header}
              </th>`
            )}
          </tr>`}
        </thead>
        <tbody data-part="body" @keydown=${onBodyKeydown} ref=${(el: HTMLElement) => (body = el)}>
          ${() => repeat(sorted, keyOf, rowTemplate(props.columns(), props.selectable()))}
        </tbody>
      </table>
      <div data-part="empty" ?hidden=${() => props.rows().length > 0}>
        ${ctx.hasSlot("empty") ? ctx.slot("empty") : "No data"}
      </div>
    `
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "bz-table": InstanceType<typeof Table>
  }
}
