import type { Column, Row } from "../table"

export type Pin = "start" | "end"

/** A data grid column: a table column plus layout (sizes in px). */
export interface GridColumn<R = Row> extends Omit<Column<R>, "width"> {
  /** Width in px (default 150). */
  width?: number
  minWidth?: number
  maxWidth?: number
  /** Takes the remaining space (at least its width). Ignored when pinned. */
  flex?: boolean
  pinned?: Pin | null
  hidden?: boolean
  /** Default true. */
  resizable?: boolean
  /** Default true. */
  hideable?: boolean
  /** Default true. */
  reorderable?: boolean
}

/** The user's changes, per column; what an app saves and restores. */
export interface ColumnState {
  key: string
  width?: number
  hidden?: boolean
  pinned?: Pin | null
  order?: number
}

export interface ResolvedColumn<R = Row> {
  def: GridColumn<R>
  key: string
  width: number
  minWidth: number
  maxWidth: number
  flex: boolean
  pinned: Pin | null
  hidden: boolean
  order: number
}

export const DEFAULT_WIDTH = 150
export const DEFAULT_MIN_WIDTH = 48

export const clampWidth = (c: Pick<ResolvedColumn, "minWidth" | "maxWidth">, width: number) =>
  Math.round(Math.min(c.maxWidth, Math.max(c.minWidth, width)))

const zone = (pin: Pin | null) => (pin === "start" ? 0 : pin === "end" ? 2 : 1)

/**
 * Definitions merged with the state, in display order: pinned-start, unpinned, pinned-end
 * (each by `order`, then definition order). Hidden columns are included (flagged).
 */
export function resolveColumns<R>(defs: readonly GridColumn<R>[], state: readonly ColumnState[]): ResolvedColumn<R>[] {
  const byKey = new Map(state.map((s) => [s.key, s]))
  const list = defs.map((def, index) => {
    const s = byKey.get(def.key)
    const minWidth = def.minWidth ?? DEFAULT_MIN_WIDTH
    const maxWidth = def.maxWidth ?? Number.POSITIVE_INFINITY
    const pinned = s && "pinned" in s ? (s.pinned ?? null) : (def.pinned ?? null)
    const resolved: ResolvedColumn<R> = {
      def,
      key: def.key,
      width: clampWidth({ minWidth, maxWidth }, s?.width ?? def.width ?? DEFAULT_WIDTH),
      minWidth,
      maxWidth,
      // A resized column has a fixed width; pinned columns need a known width for offsets.
      flex: !!def.flex && s?.width === undefined && !pinned,
      pinned,
      hidden: s?.hidden ?? !!def.hidden,
      order: s?.order ?? index,
    }
    return resolved
  })
  return list.sort((a, b) => zone(a.pinned) - zone(b.pinned) || a.order - b.order)
}

/** Full state of every column (order renumbered in display order). */
export function toState<R>(columns: readonly ResolvedColumn<R>[]): ColumnState[] {
  return columns.map((c, order) => ({ key: c.key, width: c.width, hidden: c.hidden, pinned: c.pinned, order }))
}

/** Updates one column in a state list (created from the resolved columns). */
export function patchColumn<R>(
  columns: readonly ResolvedColumn<R>[],
  key: string,
  patch: Partial<Omit<ColumnState, "key">>
): ColumnState[] {
  return toState(columns).map((s) => (s.key === key ? { ...s, ...patch } : s))
}

/**
 * Moves `key` to display index `to` (among all columns). The column takes the pin zone of its
 * new neighbours: dropped among pinned-start columns it becomes pinned-start, etc.
 */
export function moveColumn<R>(columns: readonly ResolvedColumn<R>[], key: string, to: number): ColumnState[] {
  const list = columns.slice()
  const from = list.findIndex((c) => c.key === key)
  if (from === -1) return toState(columns)
  const [moved] = list.splice(from, 1)
  const index = Math.max(0, Math.min(list.length, to))
  // Zones stay contiguous: the new place allows the zones between its neighbours' zones.
  // The column keeps its zone when allowed, else takes the nearest allowed one.
  const low = list[index - 1] ? zone(list[index - 1].pinned) : 0
  const high = list[index] ? zone(list[index].pinned) : 2
  const z = Math.min(high, Math.max(low, zone(moved.pinned)))
  const pinned: Pin | null = z === 0 ? "start" : z === 2 ? "end" : null
  list.splice(index, 0, { ...moved, pinned })
  return list.map((c, order) => ({ key: c.key, width: c.width, hidden: c.hidden, pinned: c.pinned, order }))
}

/** Visible columns of the same pin zone next to `key` (for keyboard moves). */
export function neighbourIndex<R>(columns: readonly ResolvedColumn<R>[], key: string, delta: -1 | 1): number {
  const i = columns.findIndex((c) => c.key === key)
  if (i === -1) return -1
  for (let j = i + delta; j >= 0 && j < columns.length; j += delta) {
    if (!columns[j].hidden) return j
  }
  return -1
}
