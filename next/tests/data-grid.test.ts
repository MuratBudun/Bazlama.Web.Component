import { afterEach, beforeAll, describe, expect, it } from "vitest"
import { flush } from "@bazlama/core"
import type { DataGridElement, GridColumn } from "@bazlama/headless"

beforeAll(async () => {
  Element.prototype.scrollIntoView ??= () => {}
  globalThis.requestAnimationFrame ??= (fn: FrameRequestCallback) => setTimeout(() => fn(0), 0) as unknown as number
  const h = await import("@bazlama/headless")
  h.defineIcons(await import("@bazlama/icons"))
})
afterEach(() => document.body.replaceChildren())
const tick = () => new Promise((r) => setTimeout(r, 0))
/** Scroll handling waits for an animation frame (jsdom: ~16 ms). */
const frame = () => new Promise((r) => setTimeout(r, 40))
const key = (el: Element, k: string, init: KeyboardEventInit = {}) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }))

const COLUMNS: GridColumn[] = [
  { key: "no", header: "No", width: 100, pinned: "start", sortable: true },
  { key: "name", header: "Adı", flex: true, width: 200, sortable: true },
  { key: "dept", header: "Bölüm", width: 160 },
  { key: "status", header: "Durum", width: 120, pinned: "end" },
]
const rows = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: i + 1, no: `FRM-${String(i + 1).padStart(4, "0")}`, name: `Form ${n - i}`, dept: `D${i % 5}`, status: i % 2 ? "Yürürlükte" : "Taslak" }))

async function mount(n: number, attrs = "") {
  document.body.innerHTML = `<bz-data-grid id="g" label="Formlar" ${attrs}></bz-data-grid>`
  const grid = document.getElementById("g") as DataGridElement
  grid.columns = COLUMNS
  grid.rows = rows(n)
  flush()
  await tick()
  flush()
  const scroller = grid.querySelector<HTMLElement>("[data-part=scroller]")!
  return { grid, scroller }
}
const bodyRows = (grid: Element) => [...grid.querySelectorAll<HTMLElement>("tbody tr[data-part=row]")]
const headers = (grid: Element) => [...grid.querySelectorAll<HTMLElement>("thead th[data-key]")].map((th) => th.dataset.key)

describe("columns model", () => {
  it("resolves order by pin zone, merges state, moves across zones", async () => {
    const { resolveColumns, moveColumn } = await import("@bazlama/headless")
    const r = resolveColumns(COLUMNS, [{ key: "dept", width: 300, order: -1 }])
    expect(r.map((c) => c.key)).toEqual(["no", "dept", "name", "status"])
    expect(r.find((c) => c.key === "dept")!.width).toBe(300)
    expect(r.find((c) => c.key === "name")!.flex).toBe(true)
    // Resized flex column becomes fixed.
    expect(resolveColumns(COLUMNS, [{ key: "name", width: 250 }]).find((c) => c.key === "name")!.flex).toBe(false)
    // Move "dept" before "no" (inside the start zone) → pinned start.
    const moved = moveColumn(r, "dept", 0)
    expect(moved.map((s) => [s.key, s.pinned])).toEqual([["dept", "start"], ["no", "start"], ["name", null], ["status", "end"]])
    // Move "no" to the end → pinned end.
    const toEnd = moveColumn(r, "no", 3)
    expect(toEnd.at(-1)).toMatchObject({ key: "no", pinned: "end" })
    // Between start and middle keeps its zone.
    expect(moveColumn(r, "name", 1).find((s) => s.key === "name")!.pinned).toBe(null)
  })

  it("visibleRange / scrollToRow", async () => {
    const { visibleRange } = await import("@bazlama/headless")
    expect(visibleRange({ scrollTop: 0, viewport: 400, header: 40, rowHeight: 36, count: 1000, overscan: 2 })).toEqual({ start: 0, end: 12 })
    expect(visibleRange({ scrollTop: 3600, viewport: 400, header: 40, rowHeight: 36, count: 1000, overscan: 2 })).toEqual({ start: 98, end: 112 })
    expect(visibleRange({ scrollTop: 99999, viewport: 400, header: 40, rowHeight: 36, count: 50, overscan: 2 }).end).toBe(50)
  })
})

describe("bz-data-grid", () => {
  it("renders colgroup widths, pinned offsets and all rows below the threshold", async () => {
    const { grid } = await mount(20)
    expect(headers(grid)).toEqual(["no", "name", "dept", "status"])
    expect(bodyRows(grid).length).toBe(20)
    expect(grid.hasAttribute("data-virtual")).toBe(false)
    const cols = [...grid.querySelectorAll("col")].map((c) => (c as HTMLElement).style.width)
    // jsdom has no width: the flex column keeps its own width.
    expect(cols).toEqual(["100px", "200px", "160px", "120px"])
    expect(grid.style.getPropertyValue("--bz-data-grid-width")).toBe("580px")
    const css = grid.querySelector("style")!.textContent!
    expect(css).toContain('tbody tr[data-part="row"] > :nth-child(1) { position: sticky; inset-inline-start: 0px')
    expect(css).toContain('tbody tr[data-part="row"] > :nth-last-child(1) { position: sticky; inset-inline-end: 0px')
    expect(bodyRows(grid)[0].querySelectorAll("td")[1].textContent).toBe("Form 20")
    expect(bodyRows(grid)[0].querySelectorAll("td")[1].title).toBe("Form 20")
  })

  it("sorts from the header and keeps row DOM on re-sort", async () => {
    const { grid } = await mount(5)
    const events: unknown[] = []
    grid.addEventListener("sort", (e) => events.push((e as CustomEvent).detail.sort))
    const first = bodyRows(grid)[0]
    grid.querySelector<HTMLElement>('th[data-key="name"] [data-part=header]')!.click()
    flush()
    expect(bodyRows(grid).map((tr) => tr.children[1].textContent)).toEqual(["Form 1", "Form 2", "Form 3", "Form 4", "Form 5"])
    expect(bodyRows(grid).includes(first)).toBe(true)
    expect(grid.querySelector('th[data-key="name"]')!.getAttribute("aria-sort")).toBe("ascending")
    expect(events).toEqual([{ key: "name", dir: "asc" }])
  })

  it("virtualizes above the threshold: renders a window, spacers, aria-rowcount/rowindex", async () => {
    const { grid, scroller } = await mount(10_000)
    Object.defineProperty(scroller, "clientHeight", { configurable: true, value: 400 })
    expect(grid.hasAttribute("data-virtual")).toBe(true)
    const count = bodyRows(grid).length
    expect(count).toBeGreaterThan(10)
    expect(count).toBeLessThan(40)
    expect(grid.querySelector("table")!.getAttribute("aria-rowcount")).toBe("10001")
    expect(bodyRows(grid)[0].getAttribute("aria-rowindex")).toBe("2")
    const [top, bottom] = grid.querySelectorAll<HTMLElement>("tr[data-part=spacer]")
    expect(top.hidden).toBe(true)
    expect(bottom.hidden).toBe(false)
    scroller.scrollTop = 36 * 5000
    scroller.dispatchEvent(new Event("scroll"))
    await frame()
    flush()
    const rowsNow = bodyRows(grid)
    expect(rowsNow.length).toBeLessThan(40)
    expect(Number(rowsNow[0].getAttribute("aria-rowindex"))).toBeGreaterThan(4900)
    expect(top.hidden).toBe(false)
    expect(parseInt(top.style.height)).toBe((Number(rowsNow[0].getAttribute("aria-rowindex")) - 2) * 36)
  })

  it("keyboard: one tab stop, arrows/End move and scroll, Enter activates, Space selects", async () => {
    const { grid, scroller } = await mount(1000, "selectable")
    Object.defineProperty(scroller, "clientHeight", { configurable: true, value: 400 })
    const first = bodyRows(grid)[0]
    expect(first.tabIndex).toBe(0)
    expect(bodyRows(grid)[1].tabIndex).toBe(-1)
    first.focus()
    key(first, "ArrowDown")
    expect((document.activeElement as HTMLElement).getAttribute("aria-rowindex")).toBe("3")
    key(document.activeElement!, "End")
    expect((document.activeElement as HTMLElement).getAttribute("aria-rowindex")).toBe("1001")
    expect(scroller.scrollTop).toBeGreaterThan(30_000)
    const events: unknown[] = []
    grid.addEventListener("row-activate", (e) => events.push((e as CustomEvent).detail.key))
    grid.addEventListener("selection-change", (e) => events.push((e as CustomEvent).detail.selection))
    key(document.activeElement!, "Enter")
    key(document.activeElement!, " ")
    flush()
    expect(events).toEqual([1000, [1000]])
    expect((document.activeElement as HTMLElement).getAttribute("aria-selected")).toBe("true")
  })

  it("focus leaves a row that scrolls away for the scroller, which brings it back", async () => {
    const { grid, scroller } = await mount(1000)
    Object.defineProperty(scroller, "clientHeight", { configurable: true, value: 400 })
    bodyRows(grid)[0].focus()
    scroller.scrollTop = 36 * 500
    scroller.dispatchEvent(new Event("scroll"))
    await frame()
    flush()
    expect(document.activeElement).toBe(scroller)
    expect(scroller.tabIndex).toBe(0)
    key(scroller, "ArrowDown")
    expect((document.activeElement as HTMLElement).getAttribute("aria-rowindex")).toBe("2")
  })

  it("resize, hide, pin and reorder change columnState and fire columns-change", async () => {
    const { grid } = await mount(5)
    const events: { reason: string; key?: string }[] = []
    grid.addEventListener("columns-change", (e) => events.push((e as CustomEvent).detail))

    // Keyboard resize on the header button
    const dept = () => grid.querySelector<HTMLElement>('th[data-key="dept"] [data-part=header]')!
    key(dept(), "ArrowRight", { shiftKey: true })
    flush()
    expect(grid.getColumnState().find((s) => s.key === "dept")!.width).toBe(170)
    expect(grid.querySelector('th[data-key="dept"] [data-part=resize]')!.getAttribute("aria-valuenow")).toBe("170")

    // Reorder: Alt+← moves dept before name; header DOM follows, focus stays on it
    key(dept(), "ArrowLeft", { altKey: true })
    flush()
    await tick()
    expect(headers(grid)).toEqual(["no", "dept", "name", "status"])
    expect(bodyRows(grid)[0].children[1].textContent).toBe("D0")
    expect(document.activeElement).toBe(dept())

    // Restoring a saved state (hidden column)
    grid.columnState = grid.getColumnState().map((s) => (s.key === "dept" ? { ...s, hidden: true } : s))
    flush()
    expect(headers(grid)).toEqual(["no", "name", "status"])
    expect(bodyRows(grid)[0].children.length).toBe(3)

    // Reset
    grid.resetColumns()
    flush()
    expect(headers(grid)).toEqual(["no", "name", "dept", "status"])
    expect(events.map((e) => e.reason)).toEqual(["resize", "reorder", "reset"])
  })

  it("selection column is pinned first; select all; row-click", async () => {
    const { grid } = await mount(3, "selectable")
    const css = grid.querySelector("style")!.textContent!
    // select (40) + "no" (100) pinned at start
    expect(css).toContain('tbody tr[data-part="row"] > :nth-child(2) { position: sticky; inset-inline-start: 40px')
    const all = grid.querySelector<HTMLInputElement>('thead [data-part=select] input')!
    all.click()
    flush()
    expect(grid.selection).toEqual([1, 2, 3])
    expect(bodyRows(grid).every((tr) => tr.getAttribute("aria-selected") === "true")).toBe(true)
    const clicks: unknown[] = []
    grid.addEventListener("row-click", (e) => clicks.push((e as CustomEvent).detail.key))
    ;(bodyRows(grid)[1].children[2] as HTMLElement).click()
    expect(clicks).toEqual([2])
  })

  it("rowFromElement maps a rendered cell to its row; unchanged drops are not reorders", async () => {
    const { grid } = await mount(5)
    const td = bodyRows(grid)[3].children[2]
    expect(grid.rowFromElement(td)).toMatchObject({ id: 4 })
    expect(grid.rowFromElement(grid.querySelector("thead th")!)).toBeUndefined()
    const events: unknown[] = []
    grid.addEventListener("columns-change", (e) => events.push(e))
    // Moving the last column right: nowhere to go.
    key(grid.querySelector<HTMLElement>('th[data-key="status"] [data-part=header]')!, "ArrowRight", { altKey: true })
    flush()
    expect(events).toEqual([])
  })

  it("persist: saves column state and sort under bz-data-grid:<key>, restores with events", async () => {
    localStorage.clear()
    const { grid } = await mount(5, 'persist="docs"')
    key(grid.querySelector<HTMLElement>('th[data-key="dept"] [data-part=header]')!, "ArrowRight", { shiftKey: true })
    grid.querySelector<HTMLElement>('th[data-key="name"] [data-part=header]')!.click()
    flush()
    const saved = JSON.parse(localStorage.getItem("bz-data-grid:docs")!)
    expect(saved.columns.find((c: { key: string }) => c.key === "dept").width).toBe(170)
    expect(saved.sort).toEqual({ key: "name", dir: "asc" })

    // Next load: restored before the first paint, events let bound app state follow.
    document.body.replaceChildren()
    const events: string[] = []
    const g = document.createElement("bz-data-grid") as DataGridElement
    g.setAttribute("persist", "docs")
    g.addEventListener("columns-change", (e) => events.push(`columns:${(e as CustomEvent).detail.reason}`))
    g.addEventListener("sort", (e) => events.push(`sort:${(e as CustomEvent).detail.sort.key}`))
    g.columns = COLUMNS
    g.rows = rows(5)
    document.body.append(g)
    flush()
    await tick()
    flush()
    expect(events).toEqual(["columns:restore", "sort:name"])
    expect(g.getColumnState().find((c) => c.key === "dept")!.width).toBe(170)
    expect(g.querySelector('th[data-key="name"]')!.getAttribute("aria-sort")).toBe("ascending")

    // Invalid entries are dropped.
    localStorage.setItem("bz-data-grid:bad", JSON.stringify({ columns: [{ key: 1 }, { key: "dept", width: "x" }, { key: "no", width: 90 }], sort: { key: "no", dir: "up" } }))
    document.body.replaceChildren()
    const b = document.createElement("bz-data-grid") as DataGridElement
    b.setAttribute("persist", "bad")
    b.columns = COLUMNS
    document.body.append(b)
    flush()
    expect(b.columnState).toEqual([{ key: "no", width: 90 }])
    expect(b.sort).toBe(null)
  })

  it("highlight-pinned: an optional tint on pinned cells, under hover/selection", async () => {
    const { grid } = await mount(3, "highlight-pinned")
    expect(grid.highlightPinned).toBe(true)
    const css = grid.querySelector("style")!.textContent!
    // Pinned body cells use the row state first, then the pinned tint.
    expect(css).toContain("background: var(--_row-bg, var(--_pin-bg, var(--_bg)))")
    grid.highlightPinned = false
    flush()
    expect(grid.hasAttribute("highlight-pinned")).toBe(false)
  })

  it("empty slot and labels", async () => {
    document.body.innerHTML = `<bz-data-grid><span slot="empty">Kayıt yok</span></bz-data-grid>`
    flush()
    const g = document.querySelector("bz-data-grid")!
    g.columns = COLUMNS
    flush()
    expect(g.querySelector<HTMLElement>("[data-part=empty]")!.hidden).toBe(false)
    expect(g.querySelector("[data-part=empty]")!.textContent!.trim()).toBe("Kayıt yok")
    g.labels = { columnMenu: (h: string) => `Sütun menüsü: ${h}` }
    flush()
    expect(g.querySelector('th[data-key="no"] [data-part=menu]')!.getAttribute("aria-label")).toBe("Sütun menüsü: No")
  })
})
