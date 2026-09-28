export interface RowRange {
  /** First rendered row index. */
  start: number
  /** One past the last rendered row index. */
  end: number
}

/**
 * Rows to render for a fixed row height: the ones intersecting the viewport (below the sticky
 * header) plus `overscan` on each side.
 */
export function visibleRange(o: {
  scrollTop: number
  viewport: number
  header: number
  rowHeight: number
  count: number
  overscan: number
}): RowRange {
  const h = Math.max(1, o.rowHeight)
  const top = Math.max(0, o.scrollTop)
  const first = Math.floor(top / h)
  const last = Math.ceil((top + Math.max(0, o.viewport - o.header)) / h)
  return {
    start: Math.max(0, Math.min(o.count, first - o.overscan)),
    end: Math.max(0, Math.min(o.count, last + o.overscan)),
  }
}

/**
 * scrollTop that shows row `index` (nearest edge), or null when it is already fully visible.
 * Row tops are measured from the end of the header (the header is sticky, it covers the top).
 */
export function scrollToRow(o: { index: number; scrollTop: number; viewport: number; header: number; rowHeight: number }): number | null {
  const top = o.index * o.rowHeight
  const bottom = top + o.rowHeight
  const visible = Math.max(0, o.viewport - o.header)
  if (top < o.scrollTop) return top
  if (bottom > o.scrollTop + visible) return bottom - visible
  return null
}
