import { computed, define, effect, flush, html, onCleanup, prop, render, repeat, root, signal, TemplateResult, uid, untrack } from "@bazlama/core"
import { hasIcon, icon } from "../icon"
import { openMenu, type MenuItemData } from "../menu"
import { loadPersisted, savePersisted } from "../shared"
import { compareValues, type Row, type Sort } from "../table"
import {
  clampWidth,
  moveColumn,
  patchColumn,
  resolveColumns,
  toState,
  type ColumnState,
  type GridColumn,
  type Pin,
  type ResolvedColumn,
} from "./columns"
import { scrollToRow, visibleRange, type RowRange } from "./virtual"

export interface DataGridLabels {
  selectAll: string
  selectRow: string
  columnMenu: (header: string) => string
  resize: (header: string) => string
  sortAsc: string
  sortDesc: string
  clearSort: string
  pin: string
  pinStart: string
  pinEnd: string
  unpin: string
  moveLeft: string
  moveRight: string
  autosize: string
  hide: string
  columns: string
  reset: string
  empty: string
}

export const DATA_GRID_LABELS: DataGridLabels = {
  selectAll: "Select all rows",
  selectRow: "Select row",
  columnMenu: (h) => `Column menu: ${h}`,
  resize: (h) => `Resize ${h}`,
  sortAsc: "Sort ascending",
  sortDesc: "Sort descending",
  clearSort: "Clear sort",
  pin: "Pin",
  pinStart: "Pin to start",
  pinEnd: "Pin to end",
  unpin: "Not pinned",
  moveLeft: "Move left",
  moveRight: "Move right",
  autosize: "Autosize",
  hide: "Hide column",
  columns: "Columns",
  reset: "Reset columns",
  empty: "No data",
}

/** Where a menu opens: an element or a viewport point. */
export type Anchor = Element | { x: number; y: number }

export type ColumnsChangeReason = "resize" | "hide" | "show" | "pin" | "reorder" | "reset" | "restore"

/** Width of the selection column. */
const SELECT_WIDTH = 40
const cssEscape = (s: string) =>
  typeof CSS !== "undefined" && CSS.escape ? CSS.escape(s) : s.replace(/["\\]/g, "\\$&")
const HEADER_KEYS = "Enter Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight Shift+ArrowLeft Shift+ArrowRight"

const defsIds = new WeakMap<object, number>()
let nextDefsId = 0
const idOf = (o: object) => {
  let id = defsIds.get(o)
  if (id === undefined) defsIds.set(o, (id = ++nextDefsId))
  return id
}

const setAttr = (el: Element, name: string, value: string | null) => {
  if (el.getAttribute(name) === value) return
  if (value === null) el.removeAttribute(name)
  else el.setAttribute(name, value)
}
const setHiddenIf = (el: HTMLElement, hidden: boolean) => {
  if (el.hidden !== hidden) el.hidden = hidden
}
const setHeight = (el: HTMLElement, px: number) => {
  const value = `${px}px`
  if (el.style.height !== value) el.style.height = value
}
const setTabIndex = (el: HTMLElement, value: number) => {
  if (el.tabIndex !== value) el.tabIndex = value
}

interface RowEntry {
  tr: HTMLTableRowElement
  row: Row
  key: unknown
  structure: string
  checkbox: HTMLInputElement | null
  dispose: () => void
}

interface Controller {
  openColumnsMenu(anchor: Anchor): Promise<void>
  resetColumns(): void
  autosizeColumn(key: string): void
  scrollToIndex(index: number): void
  columnState(): ColumnState[]
  rowFromElement(el: Element): Row | undefined
}

/**
 * <bz-data-grid> — a data table for large data and user-arranged columns.
 *
 * - Columns (`.columns`: GridColumn[]): widths in px (`flex` takes the rest), `pinned`
 *   ("start" | "end", sticky while scrolling sideways), `hidden`. The user resizes (drag the
 *   header edge, Shift+←/→, double click = autosize), hides, pins and reorders (drag a header,
 *   Alt+←/→) them; the column menu (⋮, Alt+↓) has it all. Changes go to `.columnState` and fire
 *   `columns-change` { state, reason, key } — save and restore that state in the app.
 * - Narrow grids: when the pinned columns would take more than `pin-limit` (default 0.6) of
 *   the visible width, pinning is suspended ([data-pins-suspended]); the column state keeps
 *   the pins and they return when the grid is wide enough.
 * - Rows: fixed height: `row-height` (px), or when it is 0 (default) the CSS token
 *   `--bz-data-grid-row-height` (theme, data-density; measured again when rows resize).
 *   Vertical virtual scrolling (`virtual`: "auto" above
 *   `virtual-threshold` rows | "on" | "off") renders only what is on screen.
 * - Sorting, selection (`selectable`, `.selection`), `row-click`, `row-activate` (double click,
 *   Enter) as in bz-table. Rows are one tab stop: ↑/↓, PageUp/PageDown, Home/End, Space.
 *
 * - `persist="key"` (opt-in): the column state and the sort are saved in localStorage under
 *   `bz-data-grid:<key>` and restored on load (then `columns-change` fires with reason
 *   "restore" and `sort` fires, so bound app state can follow).
 *
 * Methods: openColumnsMenu(anchor), resetColumns(), autosizeColumn(key), scrollToIndex(i),
 * getColumnState(), rowFromElement(el).
 * Events (own state, not bubbling): sort, selection-change, columns-change. Bubbling: row-click,
 * row-activate.
 *
 * Anatomy: [data-part=scroller|table|head|header-cell|header|sort-indicator|menu|resize|body|
 * row|cell|select|spacer|empty]. Styling hooks: [loading], [data-scrolled-start],
 * [data-scrolled-end], [data-virtual], th[aria-sort], tr[aria-selected], [data-pinned],
 * [data-dragging], [data-resizing], [highlight-pinned], [data-pins-suspended], [striped], tr[data-stripe],
 * --bz-row-stripe-bg, --bz-data-grid-row-height,
 * --bz-data-grid-max-height, --bz-data-grid-pinned-bg.
 */
const DataGridBase = define("bz-data-grid", {
  props: {
    columns: prop.object<GridColumn[]>([]),
    columnState: prop.object<ColumnState[]>([]),
    rows: prop.object<Row[]>([]),
    rowKey: prop.string("id"),
    selectable: prop.boolean(),
    selection: prop.object<unknown[]>([]),
    sort: prop.object<Sort>(null),
    sortMode: prop.string<"client" | "manual">("client"),
    label: prop.string(),
    virtual: prop.string<"auto" | "on" | "off">("auto"),
    virtualThreshold: prop.number(200),
    /** px; 0 = from CSS (--bz-data-grid-row-height, set by the theme or data-density). */
    rowHeight: prop.number(0),
    overscan: prop.number(6),
    loading: prop.boolean(false, { reflect: true }),
    labels: prop.object<Partial<DataGridLabels>>({}),
    /** Storage key: save and restore the column state and sort (localStorage `bz-data-grid:<key>`). */
    persist: prop.string(),
    /** Tints the pinned columns (`--bz-data-grid-pinned-bg`). */
    highlightPinned: prop.boolean(false, { reflect: true }),
    /**
     * Largest share of the visible width the pinned columns may take (0–1). Above it (a phone,
     * a narrow panel) pinning is suspended until the grid is wide enough again; 0 = never.
     */
    pinLimit: prop.number(0.6),
    /**
     * Zebra rows: every second row (by its position in the sorted rows, so the bands stay put
     * while virtual scrolling) gets [data-stripe] and a faint band (`--bz-row-stripe-bg`).
     */
    striped: prop.boolean(false, { reflect: true }),
  },
  setup(props, ctx) {
    const { host } = ctx
    const gridId = uid("bz-grid")
    host.setAttribute("data-grid-id", gridId)
    const text = computed(() => ({ ...DATA_GRID_LABELS, ...props.labels() }))
    const keyOf = (row: Row) => row[props.rowKey.peek()]

    let scroller!: HTMLElement
    let table!: HTMLTableElement
    let colgroup!: HTMLElement
    let headRow!: HTMLTableRowElement
    let body!: HTMLTableSectionElement
    let topSpacer!: HTMLTableRowElement
    let bottomSpacer!: HTMLTableRowElement
    let styleEl!: HTMLStyleElement

    // ------------------------------------------------------------------ columns
    const resolved = computed(() => resolveColumns(props.columns(), props.columnState()))
    const byKey = computed(() => new Map(resolved().map((c) => [c.key, c])))
    const visible = computed(() => resolved().filter((c) => !c.hidden))
    /** What the row DOM depends on (not widths): rebuild rows only when this changes. */
    const structure = computed(
      () => `${idOf(props.columns())}|${props.selectable() ? 1 : 0}|${visible().map((c) => c.key).join("\u0000")}`
    )

    const commit = (state: ColumnState[], reason: ColumnsChangeReason, key?: string) => {
      props.columnState.set(state)
      ctx.emit("columns-change", { state, reason, key }, { bubbles: false })
    }
    const setWidth = (key: string, width: number) => {
      const c = byKey.peek().get(key)
      if (!c) return
      const w = clampWidth(c, width)
      if (w === c.width && !c.flex) return
      commit(patchColumn(resolved.peek(), key, { width: w }), "resize", key)
    }
    const setHidden = (key: string, hidden: boolean) => {
      if (hidden && visible.peek().length <= 1) return
      commit(patchColumn(resolved.peek(), key, { hidden }), hidden ? "hide" : "show", key)
    }
    const setPinned = (key: string, pinned: Pin | null) => {
      const list = patchColumn(resolved.peek(), key, { pinned })
      // Re-resolve for the zone order, then renumber.
      commit(toState(resolveColumns(props.columns.peek(), list)), "pin", key)
    }
    const moveTo = (key: string, beforeKey: string | null) => {
      const rest = resolved.peek().filter((c) => c.key !== key)
      const to = beforeKey === null ? rest.length : rest.findIndex((c) => c.key === beforeKey)
      if (to === -1) return
      const next = moveColumn(resolved.peek(), key, to)
      // Same order and pins = dropped where it was (order numbers alone may differ).
      const shape = (list: { key: string; pinned?: Pin | null }[]) => list.map((c) => `${c.key}:${c.pinned ?? ""}`).join("|")
      if (shape(next) !== shape(resolved.peek())) commit(next, "reorder", key)
    }
    /** Keyboard / menu move: past the next visible column in that direction. */
    const moveBy = (key: string, delta: -1 | 1) => {
      const vis = visible.peek()
      const i = vis.findIndex((c) => c.key === key)
      const j = i + delta
      if (i === -1 || j < 0 || j >= vis.length) return false
      moveTo(key, delta < 0 ? vis[j].key : (vis[j + 1]?.key ?? null))
      return true
    }
    const resetColumns = () => commit(toState(resolveColumns(props.columns.peek(), [])), "reset")

    // ------------------------------------------------------------------ persistence (opt-in)
    /** Key whose saved state has been loaded; saving waits for it (no overwriting a new key). */
    let loadedKey = ""
    const validState = (s: unknown): s is ColumnState =>
      !!s &&
      typeof s === "object" &&
      typeof (s as ColumnState).key === "string" &&
      ["width", "order"].every((k) => {
        const v = (s as unknown as Record<string, unknown>)[k]
        return v === undefined || (typeof v === "number" && Number.isFinite(v))
      })
    const validSort = (s: unknown): s is Sort =>
      s === null || (!!s && typeof s === "object" && typeof (s as { key: unknown }).key === "string" && ["asc", "desc"].includes((s as { dir: string }).dir))
    effect(() => {
      const key = props.persist()
      if (!key || key === loadedKey) return
      loadedKey = key
      const saved = loadPersisted("bz-data-grid", key) as { columns?: unknown; sort?: unknown } | undefined
      if (!saved || typeof saved !== "object") return
      untrack(() => {
        if (Array.isArray(saved.columns)) {
          const state = saved.columns.filter(validState)
          props.columnState.set(state)
          ctx.emit("columns-change", { state, reason: "restore" }, { bubbles: false })
        }
        if ("sort" in saved && validSort(saved.sort)) {
          props.sort.set(saved.sort)
          ctx.emit("sort", { sort: saved.sort }, { bubbles: false })
        }
      })
    })
    effect(() => {
      const columns = props.columnState()
      const sort = props.sort()
      const key = props.persist()
      if (key && key === loadedKey) savePersisted("bz-data-grid", key, { columns, sort })
    })

    // ------------------------------------------------------------------ rows
    const selected = computed(() => new Set(props.selection()))
    const sorted = computed(() => {
      const rows = props.rows()
      const sort = props.sort()
      if (!sort || props.sortMode() === "manual") return rows
      const column = props.columns().find((c) => c.key === sort.key)
      const compare = column?.compare ?? ((a: Row, b: Row) => compareValues(a[sort.key], b[sort.key]))
      const dir = sort.dir === "asc" ? 1 : -1
      return rows.slice().sort((a, b) => dir * compare(a, b))
    })
    const indexOfKey = computed(() => {
      const map = new Map<unknown, number>()
      const key = props.rowKey()
      sorted().forEach((r, i) => map.set(r[key], i))
      return map
    })
    const allState = computed(() => {
      const rows = props.rows()
      const sel = selected()
      let count = 0
      for (const row of rows) if (sel.has(keyOf(row))) count++
      return count === 0 ? "none" : count === rows.length ? "all" : "some"
    })
    const isVirtual = computed(() => {
      const mode = props.virtual()
      return mode === "on" || (mode === "auto" && props.rows().length > props.virtualThreshold())
    })
    /** Row height from CSS when no row-height is given (the virtual range needs it in px). */
    const cssRowHeight = signal(36)
    const readRowHeight = () => {
      const px = parseFloat(getComputedStyle(host).getPropertyValue("--_row-h"))
      if (px > 0 && px !== cssRowHeight.peek()) cssRowHeight.set(px)
    }
    const rowHeight = computed(() => Math.max(16, props.rowHeight() > 0 ? props.rowHeight() : cssRowHeight()))
    const range = signal<RowRange>({ start: 0, end: 0 })
    /** Key of the row holding the tab stop. */
    const activeKey = signal<unknown>(undefined)

    effect(() => {
      // An explicit row-height wins over the theme; otherwise the CSS token decides.
      if (props.rowHeight() > 0) host.style.setProperty("--bz-data-grid-row-height", `${rowHeight()}px`)
      else host.style.removeProperty("--bz-data-grid-row-height")
      host.toggleAttribute("data-virtual", isVirtual())
    })

    const setSelection = (keys: unknown[]) => {
      props.selection.set(keys)
      ctx.emit("selection-change", { selection: keys }, { bubbles: false })
    }
    const toggleRow = (row: Row) => {
      const next = new Set(selected.peek())
      const key = keyOf(row)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      setSelection([...next])
    }
    const toggleAll = () => setSelection(allState.peek() === "all" ? [] : props.rows.peek().map(keyOf))
    const setSort = (next: Sort) => {
      props.sort.set(next)
      ctx.emit("sort", { sort: next }, { bubbles: false })
    }
    const toggleSort = (c: ResolvedColumn) => {
      if (!c.def.sortable) return
      const s = props.sort.peek()
      setSort(s?.key !== c.key ? { key: c.key, dir: "asc" } : s.dir === "asc" ? { key: c.key, dir: "desc" } : null)
    }

    // ------------------------------------------------------------------ layout (widths, pins)
    const headerHeight = () => headRow?.offsetHeight ?? 0
    /** Live widths while dragging a resize handle (not committed yet). */
    let liveWidths: Map<string, number> | null = null

    /** Rendered width of each visible column (flex columns share the space left over). */
    let layoutWidths = new Map<string, number>()
    let hasFlex = false
    let hasPins = false

    const applyLayout = () => {
      if (!colgroup) return
      const cols = visible.peek()
      const selectable = props.selectable.peek()
      const base = (c: ResolvedColumn) => liveWidths?.get(c.key) ?? c.width
      const flexible = cols.filter((c) => c.flex && !liveWidths?.has(c.key))
      hasFlex = flexible.length > 0

      // Fixed layout gives extra table width to every column: size flex columns here instead.
      let sum = (selectable ? SELECT_WIDTH : 0) + cols.reduce((n, c) => n + base(c), 0)
      const extra = Math.max(0, (scroller?.clientWidth ?? 0) - sum)
      const widths = new Map<string, number>()
      let given = 0
      for (const c of cols) {
        let w = base(c)
        if (extra && flexible.includes(c)) {
          const share = c === flexible[flexible.length - 1] ? extra - given : Math.floor(extra / flexible.length)
          given += share
          w += share
        }
        widths.set(c.key, w)
      }
      sum += given
      layoutWidths = widths

      const colEls: HTMLElement[] = []
      if (selectable) {
        const col = document.createElement("col")
        col.style.width = `${SELECT_WIDTH}px`
        colEls.push(col)
      }
      for (const c of cols) {
        const col = document.createElement("col")
        col.style.width = `${widths.get(c.key)}px`
        colEls.push(col)
      }
      colgroup.replaceChildren(...colEls)
      host.style.setProperty("--bz-data-grid-width", `${sum}px`)

      // Sticky offsets by position (pinned columns are first / last in the row). Header and body
      // get separate selectors so the header's higher z-index is not outranked.
      const cells: { pinned: Pin | null; width: number }[] = [
        ...(selectable ? [{ pinned: "start" as const, width: SELECT_WIDTH }] : []),
        ...cols.map((c) => ({ pinned: c.pinned, width: widths.get(c.key)! })),
      ]
      // Pinned columns that would cover most of a narrow grid leave nothing to scroll: suspended.
      const pinnedWidth = cells.reduce((n, c) => n + (c.pinned ? c.width : 0), 0)
      hasPins = cols.some((c) => c.pinned)
      const view = scroller?.clientWidth ?? 0
      const limit = props.pinLimit.peek()
      const suspended = limit > 0 && view > 0 && pinnedWidth > view * limit
      host.toggleAttribute("data-pins-suspended", suspended)
      if (suspended) for (const c of cells) c.pinned = null

      const scope = `bz-data-grid[data-grid-id="${gridId}"]`
      const head = (n: string, flag = "") => `${scope}${flag} thead tr > :${n}`
      const bodyCell = (n: string, flag = "") => `${scope}${flag} tbody tr[data-part="row"] > :${n}`
      const rules: string[] = []
      let offset = 0
      let lastStart = 0
      cells.forEach((cell, i) => {
        if (cell.pinned !== "start") return
        const n = `nth-child(${i + 1})`
        rules.push(`${head(n)}, ${bodyCell(n)} { position: sticky; inset-inline-start: ${offset}px; }`)
        rules.push(`${head(n)} { z-index: 3; }`, `${bodyCell(n)} { z-index: 1; background-color: var(--_row-bg, var(--_pin-bg, var(--_bg))); }`)
        offset += cell.width
        lastStart = i + 1
      })
      if (lastStart) {
        const n = `nth-child(${lastStart})`
        rules.push(`${head(n, "[data-scrolled-start]")}, ${bodyCell(n, "[data-scrolled-start]")} { box-shadow: var(--bz-data-grid-pin-shadow-start); }`)
      }
      offset = 0
      let firstEnd = 0
      for (let i = cells.length - 1, k = 1; i >= 0; i--, k++) {
        if (cells[i].pinned !== "end") break
        const n = `nth-last-child(${k})`
        rules.push(`${head(n)}, ${bodyCell(n)} { position: sticky; inset-inline-end: ${offset}px; }`)
        rules.push(`${head(n)} { z-index: 3; }`, `${bodyCell(n)} { z-index: 1; background-color: var(--_row-bg, var(--_pin-bg, var(--_bg))); }`)
        offset += cells[i].width
        firstEnd = k
      }
      if (firstEnd) {
        const n = `nth-last-child(${firstEnd})`
        rules.push(`${head(n, "[data-scrolled-end]")}, ${bodyCell(n, "[data-scrolled-end]")} { box-shadow: var(--bz-data-grid-pin-shadow-end); }`)
      }
      styleEl.textContent = rules.join("\n")
      updateScrollFlags()
    }

    const updateScrollFlags = () => {
      if (!scroller) return
      const x = Math.abs(scroller.scrollLeft)
      const max = scroller.scrollWidth - scroller.clientWidth
      host.toggleAttribute("data-scrolled-start", x > 0)
      host.toggleAttribute("data-scrolled-end", max > 0 && x < max - 1)
    }

    // ------------------------------------------------------------------ virtual range
    const updateRange = () => {
      if (!scroller) return
      const count = sorted.peek().length
      let next: RowRange
      if (!isVirtual.peek()) next = { start: 0, end: count }
      else {
        const header = headerHeight()
        const rh = rowHeight.peek()
        // jsdom (and a not yet laid out grid) has no height: assume a screenful.
        const viewport = scroller.clientHeight || header + 20 * rh
        next = visibleRange({ scrollTop: scroller.scrollTop, viewport, header, rowHeight: rh, count, overscan: Math.max(0, props.overscan.peek()) })
      }
      const cur = range.peek()
      if (cur.start !== next.start || cur.end !== next.end) range.set(next)
    }
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        updateRange()
        updateScrollFlags()
      })
    }
    onCleanup(() => frame && cancelAnimationFrame(frame))

    // ------------------------------------------------------------------ row DOM (hot path)
    const cache = new Map<unknown, RowEntry>()
    const rowOf = new WeakMap<Element, RowEntry>()

    const cell = (c: ResolvedColumn, row: Row) => {
      const td = document.createElement("td")
      td.dataset.part = "cell"
      if (c.def.align) td.dataset.align = c.def.align
      const raw = row[c.key]
      const value = c.def.format ? c.def.format(raw, row) : raw
      if (value instanceof TemplateResult || value instanceof Node || typeof value === "function") render(value, td)
      else if (value != null) {
        const s = String(value)
        td.textContent = s
        td.title = s
      }
      return td
    }
    const createRow = (row: Row, key: unknown, structureKey: string): RowEntry => {
      const tr = document.createElement("tr")
      tr.dataset.part = "row"
      tr.tabIndex = -1
      let checkbox: HTMLInputElement | null = null
      const dispose = root((d) => {
        if (props.selectable.peek()) {
          const td = document.createElement("td")
          td.dataset.part = "select"
          checkbox = document.createElement("input")
          checkbox.type = "checkbox"
          checkbox.tabIndex = -1
          checkbox.setAttribute("aria-label", text.peek().selectRow)
          td.append(checkbox)
          tr.append(td)
        }
        for (const c of visible.peek()) tr.append(cell(c, row))
        return d
      })
      const entry: RowEntry = { tr, row, key, structure: structureKey, checkbox, dispose }
      rowOf.set(tr, entry)
      paintRow(entry, selected.peek(), activeKey.peek())
      return entry
    }
    const paintRow = (e: RowEntry, sel: Set<unknown>, active: unknown) => {
      if (props.selectable.peek()) {
        const on = sel.has(e.key)
        if (e.tr.getAttribute("aria-selected") !== String(on)) e.tr.setAttribute("aria-selected", String(on))
        if (e.checkbox && e.checkbox.checked !== on) e.checkbox.checked = on
      } else if (e.tr.hasAttribute("aria-selected")) e.tr.removeAttribute("aria-selected")
      const tab = e.key === active ? 0 : -1
      if (e.tr.tabIndex !== tab) e.tr.tabIndex = tab
    }
    const removeEntry = (key: unknown, e: RowEntry) => {
      if (e.tr.contains(document.activeElement)) scroller.focus({ preventScroll: true })
      e.dispose()
      e.tr.remove()
      cache.delete(key)
    }

    const renderRows = () => {
      const rows = sorted()
      const { start, end } = range()
      const structureKey = structure()
      const virtual = isVirtual()
      const striped = props.striped()
      untrack(() => {
        const rh = rowHeight.peek()
        // Every write below is skipped when unchanged: attribute writes invalidate style even
        // with the same value, and this runs on every scroll step.
        setHiddenIf(topSpacer, !virtual || start === 0)
        setHiddenIf(bottomSpacer, !virtual || end >= rows.length)
        setHeight(topSpacer, start * rh)
        setHeight(bottomSpacer, Math.max(0, rows.length - end) * rh)
        setAttr(table, "aria-rowcount", virtual ? String(rows.length + 1) : null)

        const keyName = props.rowKey.peek()
        const wanted = new Set<unknown>()
        let prev: Element = topSpacer
        for (let i = start; i < end; i++) {
          const row = rows[i]
          const key = row[keyName]
          wanted.add(key)
          let e = cache.get(key)
          if (e && (e.row !== row || e.structure !== structureKey)) {
            removeEntry(key, e)
            e = undefined
          }
          if (!e) {
            e = createRow(row, key, structureKey)
            cache.set(key, e)
          }
          setAttr(e.tr, "aria-rowindex", virtual ? String(i + 2) : null)
          setAttr(e.tr, "data-stripe", striped && i % 2 === 1 ? "" : null)
          if (prev.nextSibling !== e.tr) body.insertBefore(e.tr, prev.nextSibling)
          prev = e.tr
        }
        for (const [key, e] of cache) if (!wanted.has(key)) removeEntry(key, e)
        setTabIndex(scroller, cache.has(activeKey.peek()) ? -1 : 0)
      })
    }

    // ------------------------------------------------------------------ keyboard (rows)
    const focusIndex = (index: number) => {
      const rows = sorted.peek()
      if (!rows.length) return
      const i = Math.max(0, Math.min(rows.length - 1, index))
      const key = keyOf(rows[i])
      activeKey.set(key)
      const top = scrollToRow({ index: i, scrollTop: scroller.scrollTop, viewport: scroller.clientHeight || headerHeight() + 20 * rowHeight.peek(), header: headerHeight(), rowHeight: rowHeight.peek() })
      if (top !== null) scroller.scrollTop = top
      updateRange()
      flush()
      cache.get(key)?.tr.focus({ preventScroll: true })
    }
    const pageRows = () => Math.max(1, Math.floor(((scroller.clientHeight || 0) - headerHeight()) / rowHeight.peek()) || 10)
    const onKeydown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target !== scroller && !(target.dataset.part === "row" && body.contains(target))) return
      const rows = sorted.peek()
      if (!rows.length) return
      const current = indexOfKey.peek().get(activeKey.peek()) ?? 0
      const row = rows[current]
      switch (e.key) {
        case "ArrowDown": focusIndex(target === scroller ? current : current + 1); break
        case "ArrowUp": focusIndex(target === scroller ? current : current - 1); break
        case "PageDown": focusIndex(current + pageRows()); break
        case "PageUp": focusIndex(current - pageRows()); break
        case "Home": focusIndex(0); break
        case "End": focusIndex(rows.length - 1); break
        case "Enter":
          if (target === scroller) return focusIndex(current)
          ctx.emit("row-activate", { row, key: keyOf(row), via: "keyboard" })
          break
        case " ":
          if (!props.selectable.peek() || target === scroller) return
          toggleRow(row)
          break
        default:
          return
      }
      e.preventDefault()
    }

    // Row events, delegated.
    const entryFrom = (e: Event) => {
      const tr = (e.target as Element).closest?.("tr[data-part=row]")
      return tr ? rowOf.get(tr) : undefined
    }
    const onBodyClick = (e: MouseEvent) => {
      const entry = entryFrom(e)
      if (!entry) return
      if ((e.target as Element).closest("[data-part=select]")) {
        if (e.target === entry.checkbox) {
          e.stopPropagation()
          toggleRow(entry.row)
        } else if ((e.target as Element).matches("td")) toggleRow(entry.row)
        return
      }
      ctx.emit("row-click", { row: entry.row, key: entry.key })
    }
    const onBodyDblclick = (e: MouseEvent) => {
      const entry = entryFrom(e)
      if (entry && !(e.target as Element).closest("[data-part=select]"))
        ctx.emit("row-activate", { row: entry.row, key: entry.key, via: "dblclick" })
    }
    const onBodyFocusin = (e: FocusEvent) => {
      const entry = entryFrom(e)
      if (entry && activeKey.peek() !== entry.key) activeKey.set(entry.key)
    }

    // ------------------------------------------------------------------ resize
    const headerCellOf = (key: string) =>
      headRow.querySelector<HTMLElement>(`th[data-key="${cssEscape(key)}"]`)
    const startResize = (e: PointerEvent, key: string) => {
      const c = byKey.peek().get(key)
      if (!c || e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      const handle = e.currentTarget as HTMLElement
      handle.setPointerCapture?.(e.pointerId)
      const startX = e.clientX
      const startWidth = layoutWidths.get(key) ?? c.width
      const rtl = getComputedStyle(host).direction === "rtl"
      liveWidths = new Map()
      host.setAttribute("data-resizing", "")
      const move = (ev: PointerEvent) => {
        const w = clampWidth(c, startWidth + (ev.clientX - startX) * (rtl ? -1 : 1))
        liveWidths!.set(key, w)
        handle.setAttribute("aria-valuenow", String(w))
        applyLayout()
      }
      const up = () => {
        handle.removeEventListener("pointermove", move)
        handle.removeEventListener("pointerup", up)
        handle.removeEventListener("pointercancel", up)
        const w = liveWidths?.get(key)
        liveWidths = null
        host.removeAttribute("data-resizing")
        if (w !== undefined) setWidth(key, w)
        else applyLayout()
      }
      handle.addEventListener("pointermove", move)
      handle.addEventListener("pointerup", up)
      handle.addEventListener("pointercancel", up)
    }
    /** Widest rendered content of the column (rows off screen are not measured). */
    const autosizeColumn = (key: string) => {
      const c = byKey.peek().get(key)
      const th = headerCellOf(key)
      if (!c || !th) return
      const position = Array.prototype.indexOf.call(headRow.children, th) as number
      const content = th.querySelector<HTMLElement>("[data-part=header-content]")
      const padding = (el: Element) => {
        const s = getComputedStyle(el)
        return (parseFloat(s.paddingLeft) || 0) + (parseFloat(s.paddingRight) || 0)
      }
      let width = (content?.scrollWidth ?? 0) + padding(th)
      for (const e of cache.values()) {
        const td = e.tr.children[position] as HTMLElement | undefined
        if (!td) continue
        // A text cell is clipped (ellipsis): measure its text in a probe.
        const probe = document.createElement("span")
        probe.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap"
        probe.append(...Array.from(td.childNodes, (n) => n.cloneNode(true)))
        td.append(probe)
        width = Math.max(width, probe.offsetWidth + padding(td))
        probe.remove()
      }
      if (width > 0) setWidth(key, Math.ceil(width) + 2)
    }

    // ------------------------------------------------------------------ reorder (drag headers)
    let suppressClick = false
    const dropIndicator = document.createElement("div")
    dropIndicator.dataset.part = "drop-indicator"
    dropIndicator.hidden = true
    const startDrag = (e: PointerEvent, key: string) => {
      const c = byKey.peek().get(key)
      if (!c || e.button !== 0 || c.def.reorderable === false) return
      if ((e.target as Element).closest("[data-part=resize], [data-part=menu]")) return
      const th = e.currentTarget as HTMLElement
      const startX = e.clientX
      const startY = e.clientY
      let dragging = false
      let before: string | null | undefined
      const rtl = getComputedStyle(host).direction === "rtl"
      const move = (ev: PointerEvent) => {
        if (!dragging) {
          if (Math.abs(ev.clientX - startX) < 5 && Math.abs(ev.clientY - startY) < 5) return
          dragging = true
          th.setPointerCapture?.(ev.pointerId)
          host.setAttribute("data-dragging", "")
          th.setAttribute("data-drag-source", "")
        }
        // Drop before the first header whose middle is past the pointer.
        const cells = Array.from(headRow.querySelectorAll<HTMLElement>("th[data-key]"))
        before = null
        let x: number | null = null
        for (const cellEl of cells) {
          const r = cellEl.getBoundingClientRect()
          const past = rtl ? ev.clientX > r.left + r.width / 2 : ev.clientX < r.left + r.width / 2
          if (past) {
            before = cellEl.dataset.key!
            x = rtl ? r.right : r.left
            break
          }
        }
        if (x === null && cells.length) {
          const r = cells[cells.length - 1].getBoundingClientRect()
          x = rtl ? r.left : r.right
        }
        const box = scroller.getBoundingClientRect()
        dropIndicator.hidden = x === null
        if (x !== null) dropIndicator.style.left = `${x - box.left + scroller.scrollLeft - 1}px`
      }
      const up = () => {
        th.removeEventListener("pointermove", move)
        th.removeEventListener("pointerup", up)
        th.removeEventListener("pointercancel", up)
        dropIndicator.hidden = true
        host.removeAttribute("data-dragging")
        th.removeAttribute("data-drag-source")
        if (!dragging) return
        suppressClick = true
        setTimeout(() => (suppressClick = false))
        if (before !== undefined && before !== key) moveTo(key, before)
      }
      th.addEventListener("pointermove", move)
      th.addEventListener("pointerup", up)
      th.addEventListener("pointercancel", up)
    }

    // ------------------------------------------------------------------ menus
    const focusHeader = (key: string) =>
      queueMicrotask(() => headerCellOf(key)?.querySelector<HTMLElement>("[data-part=header]")?.focus())

    const columnsItems = (): MenuItemData[] => {
      const onlyOne = visible.peek().length <= 1
      return resolved.peek()
        .filter((c) => c.def.hideable !== false)
        .map((c) => ({
          type: "checkbox" as const,
          label: c.def.header,
          value: `col:${c.key}`,
          checked: !c.hidden,
          disabled: !c.hidden && onlyOne,
          onSelect: ({ checked }: { checked: boolean }) => setHidden(c.key, !checked),
        }))
    }
    const openColumnsMenu = async (anchor: Anchor) => {
      const t = text.peek()
      const result = await openMenu({
        anchor,
        label: t.columns,
        items: [...columnsItems(), { type: "separator" }, { label: t.reset, value: "reset", icon: hasIcon("refresh") ? "refresh" : undefined }],
      })
      if (result === "reset") resetColumns()
    }
    const openColumnMenu = async (key: string, anchor: Anchor) => {
      const c = byKey.peek().get(key)
      if (!c) return
      const t = text.peek()
      const sort = props.sort.peek()
      const vis = visible.peek()
      const i = vis.findIndex((v) => v.key === key)
      const items: MenuItemData[] = []
      if (c.def.sortable) {
        items.push(
          { label: t.sortAsc, value: "sort-asc", type: "radio", name: "sort", checked: sort?.key === key && sort.dir === "asc" },
          { label: t.sortDesc, value: "sort-desc", type: "radio", name: "sort", checked: sort?.key === key && sort.dir === "desc" },
          { label: t.clearSort, value: "sort-clear", disabled: sort?.key !== key },
          { type: "separator" }
        )
      }
      items.push({
        label: t.pin,
        children: [
          { type: "radio", name: "pin", label: t.pinStart, value: "pin-start", checked: c.pinned === "start" },
          { type: "radio", name: "pin", label: t.unpin, value: "pin-none", checked: !c.pinned },
          { type: "radio", name: "pin", label: t.pinEnd, value: "pin-end", checked: c.pinned === "end" },
        ],
      })
      if (c.def.reorderable !== false) {
        items.push(
          { label: t.moveLeft, value: "move-left", disabled: i <= 0 },
          { label: t.moveRight, value: "move-right", disabled: i === -1 || i >= vis.length - 1 }
        )
      }
      if (c.def.resizable !== false) items.push({ label: t.autosize, value: "autosize" })
      if (c.def.hideable !== false) items.push({ label: t.hide, value: "hide", disabled: vis.length <= 1 })
      items.push({ type: "separator" }, { label: t.columns, children: columnsItems() }, { label: t.reset, value: "reset" })

      const result = await openMenu({ anchor, label: t.columnMenu(c.def.header), items })
      switch (result) {
        case "sort-asc": setSort({ key, dir: "asc" }); break
        case "sort-desc": setSort({ key, dir: "desc" }); break
        case "sort-clear": setSort(null); break
        case "pin-start": setPinned(key, "start"); break
        case "pin-none": setPinned(key, null); break
        case "pin-end": setPinned(key, "end"); break
        case "move-left": moveBy(key, -1); break
        case "move-right": moveBy(key, 1); break
        case "autosize": autosizeColumn(key); break
        case "hide": setHidden(key, true); return
        case "reset": resetColumns(); break
        default: break
      }
      if (result) focusHeader(key)
    }

    const onHeaderKeydown = (e: KeyboardEvent, key: string) => {
      const c = byKey.peek().get(key)
      if (!c) return
      const rtl = getComputedStyle(host).direction === "rtl"
      const dir = (k: string) => ((k === "ArrowRight") !== rtl ? 1 : -1) as 1 | -1
      if (e.altKey && e.key === "ArrowDown") {
        e.preventDefault()
        void openColumnMenu(key, e.currentTarget as HTMLElement)
      } else if (e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowRight") && c.def.reorderable !== false) {
        e.preventDefault()
        if (moveBy(key, dir(e.key))) focusHeader(key)
      } else if (e.shiftKey && (e.key === "ArrowLeft" || e.key === "ArrowRight") && c.def.resizable !== false) {
        e.preventDefault()
        setWidth(key, (layoutWidths.get(key) ?? c.width) + dir(e.key) * (e.ctrlKey ? 50 : 10))
      }
    }

    // ------------------------------------------------------------------ header
    const ariaSort = (key: string) => () => {
      const s = props.sort()
      if (s?.key === key) return s.dir === "asc" ? "ascending" : "descending"
      return byKey().get(key)?.def.sortable ? "none" : null
    }
    const headerCell = (first: ResolvedColumn) => {
      const key = first.key
      const col = () => byKey().get(key) ?? first
      const header = () => col().def.header
      return html`<th
        data-part="header-cell"
        scope="col"
        data-key=${key}
        data-align=${() => col().def.align ?? null}
        data-pinned=${() => col().pinned}
        aria-sort=${ariaSort(key)}
        @pointerdown=${(e: PointerEvent) => startDrag(e, key)}
      >
        <div data-part="header-content">
          <button
            type="button"
            data-part="header"
            aria-keyshortcuts=${HEADER_KEYS}
            @click=${() => !suppressClick && toggleSort(col())}
            @keydown=${(e: KeyboardEvent) => onHeaderKeydown(e, key)}
          ><span data-part="header-label">${header}</span><span data-part="sort-indicator" aria-hidden="true" ?hidden=${() => !col().def.sortable}></span></button>
          <button
            type="button"
            data-part="menu"
            tabindex="-1"
            aria-haspopup="menu"
            aria-label=${() => text().columnMenu(header())}
            @click=${(e: MouseEvent) => void openColumnMenu(key, e.currentTarget as HTMLElement)}
          >${hasIcon("more-horizontal") ? icon("more-horizontal") : "⋮"}</button>
        </div>
        <div
          data-part="resize"
          role="separator"
          aria-orientation="vertical"
          aria-label=${() => text().resize(header())}
          aria-valuenow=${() => col().width}
          aria-valuemin=${() => col().minWidth}
          aria-valuemax=${() => (Number.isFinite(col().maxWidth) ? col().maxWidth : null)}
          ?hidden=${() => col().def.resizable === false}
          @pointerdown=${(e: PointerEvent) => startResize(e, key)}
          @dblclick=${(e: MouseEvent) => (e.stopPropagation(), autosizeColumn(key))}
        ></div>
      </th>`
    }

    // ------------------------------------------------------------------ wiring
    ctx.onMount(() => {
      scroller.append(dropIndicator)
      effect(() => {
        visible()
        props.selectable()
        props.pinLimit()
        applyLayout()
      })
      effect(() => {
        sorted()
        isVirtual()
        rowHeight()
        props.overscan()
        queueMicrotask(updateRange)
      })
      effect(renderRows)
      effect(() => {
        const sel = selected()
        const active = activeKey()
        untrack(() => {
          for (const e of cache.values()) paintRow(e, sel, active)
          if (scroller) setTabIndex(scroller, cache.has(active) ? -1 : 0)
        })
      })
      // The tab stop stays on an existing row.
      effect(() => {
        const rows = sorted()
        const key = activeKey()
        if (!indexOfKey().has(key)) untrack(() => activeKey.set(rows.length ? keyOf(rows[0]) : undefined))
      })
      readRowHeight()
      if (typeof ResizeObserver !== "undefined") {
        let lastWidth = -1
        const ro = new ResizeObserver(() => {
          // Flex widths and pin suspension depend on the visible width.
          if ((hasFlex || hasPins) && scroller.clientWidth !== lastWidth) applyLayout()
          lastWidth = scroller.clientWidth
          updateRange()
          updateScrollFlags()
        })
        ro.observe(scroller)
        // A theme or density change resizes the rows (and so the table): read the token again.
        const rowsRo = new ResizeObserver(() => readRowHeight())
        rowsRo.observe(table)
        onCleanup(() => rowsRo.disconnect())
        onCleanup(() => ro.disconnect())
      }
      updateRange()
    })
    onCleanup(() => {
      for (const [key, e] of cache) removeEntry(key, e)
    })

    ;(host as HTMLElement & { _grid?: Controller })._grid = {
      openColumnsMenu,
      resetColumns,
      autosizeColumn,
      scrollToIndex: (i) => focusIndex(i),
      columnState: () => toState(resolved.peek()),
      rowFromElement: (el) => {
        const tr = el.closest("tr[data-part=row]")
        return tr ? rowOf.get(tr)?.row : undefined
      },
    }

    return html`
      <style ref=${(el: HTMLStyleElement) => (styleEl = el)}></style>
      <div
        data-part="scroller"
        tabindex="-1"
        @scroll=${onScroll}
        @keydown=${onKeydown}
        ref=${(el: HTMLElement) => (scroller = el)}
      >
        <table
          data-part="table"
          aria-label=${() => props.label() || null}
          aria-busy=${() => (props.loading() ? "true" : null)}
          aria-multiselectable=${() => (props.selectable() ? "true" : null)}
          ref=${(el: HTMLTableElement) => (table = el)}
        >
          <colgroup ref=${(el: HTMLElement) => (colgroup = el)}></colgroup>
          <thead data-part="head">
            <tr aria-rowindex=${() => (isVirtual() ? "1" : null)} ref=${(el: HTMLTableRowElement) => (headRow = el)}>
              ${() =>
                props.selectable()
                  ? html`<th data-part="select" scope="col" @click=${(e: Event) => e.target === e.currentTarget && toggleAll()}>
                      <input
                        type="checkbox"
                        aria-label=${() => text().selectAll}
                        .checked=${() => allState() === "all"}
                        .indeterminate=${() => allState() === "some"}
                        @change=${toggleAll}
                      />
                    </th>`
                  : null}
              ${repeat(visible, (c) => c.key, headerCell)}
            </tr>
          </thead>
          <tbody
            data-part="body"
            @click=${onBodyClick}
            @dblclick=${onBodyDblclick}
            @focusin=${onBodyFocusin}
            ref=${(el: HTMLTableSectionElement) => (body = el)}
          >
            <tr data-part="spacer" aria-hidden="true" hidden ref=${(el: HTMLTableRowElement) => (topSpacer = el)}><td colspan="1000"></td></tr>
            <tr data-part="spacer" aria-hidden="true" hidden ref=${(el: HTMLTableRowElement) => (bottomSpacer = el)}><td colspan="1000"></td></tr>
          </tbody>
        </table>
        <div data-part="empty" ?hidden=${() => props.rows().length > 0}>
          ${ctx.hasSlot("empty") ? ctx.slot("empty") : () => text().empty}
        </div>
      </div>
    `
  },
})

export interface DataGridElement extends InstanceType<typeof DataGridBase> {
  /** Opens the show/hide columns menu at an element or point. */
  openColumnsMenu(anchor: Anchor): Promise<void>
  /** Back to the columns' definitions (fires columns-change with reason "reset"). */
  resetColumns(): void
  /** Fits a column to its widest rendered content. */
  autosizeColumn(key: string): void
  /** Scrolls to row `index` (in display order) and focuses it. */
  scrollToIndex(index: number): void
  /** Current state of every column (to save). */
  getColumnState(): ColumnState[]
  /** The row object of a rendered row element (or an element inside it), e.g. for a context menu. */
  rowFromElement(el: Element): Row | undefined
}

type WithGrid = HTMLElement & { _grid?: Controller }
Object.defineProperties(DataGridBase.prototype, {
  openColumnsMenu: {
    configurable: true,
    value(this: WithGrid, anchor: Anchor) {
      return this._grid?.openColumnsMenu(anchor) ?? Promise.resolve()
    },
  },
  resetColumns: {
    configurable: true,
    value(this: WithGrid) {
      this._grid?.resetColumns()
    },
  },
  autosizeColumn: {
    configurable: true,
    value(this: WithGrid, key: string) {
      this._grid?.autosizeColumn(key)
    },
  },
  scrollToIndex: {
    configurable: true,
    value(this: WithGrid, index: number) {
      this._grid?.scrollToIndex(index)
    },
  },
  getColumnState: {
    configurable: true,
    value(this: WithGrid) {
      return this._grid?.columnState() ?? []
    },
  },
  rowFromElement: {
    configurable: true,
    value(this: WithGrid, el: Element) {
      return this._grid?.rowFromElement(el)
    },
  },
})

export const DataGrid = DataGridBase as unknown as { new (): DataGridElement; prototype: DataGridElement }

declare global {
  interface HTMLElementTagNameMap {
    "bz-data-grid": DataGridElement
  }
}

