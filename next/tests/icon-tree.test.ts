import { beforeAll, describe, expect, it, vi } from "vitest"
import { flush } from "@bazlama/core"
import type { TreeItem } from "@bazlama/headless"

let headless: typeof import("@bazlama/headless")

beforeAll(async () => {
  Element.prototype.scrollIntoView ??= () => {}
  headless = await import("@bazlama/headless")
  headless.defineIcons({ folder: { body: '<path d="M3 7h18"/>' }, starFill: { body: '<path d="M1 1"/>', mode: "fill" } })
})

const settle = async () => {
  for (let i = 0; i < 4; i++) {
    await new Promise<void>((r) => setTimeout(r))
    flush()
  }
}
const key = (el: Element, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }))

describe("icons", () => {
  it("renders <use> pointing at a lazily created sprite symbol", () => {
    document.body.replaceChildren()
    const svg = headless.icon("folder")
    document.body.append(svg)
    expect(svg.getAttribute("aria-hidden")).toBe("true")
    expect(svg.getAttribute("width")).toBe("1em")
    expect(svg.querySelector("use")!.getAttribute("href")).toBe("#bz-icon-folder")
    const symbol = document.getElementById("bz-icon-folder")!
    expect(symbol.localName).toBe("symbol")
    expect(symbol.getAttribute("stroke")).toBe("currentColor")
    expect(symbol.innerHTML).toContain("M3 7h18")
  })

  it("maps camelCase keys to kebab names and supports fill mode, labels and sizes", () => {
    const svg = headless.icon("star-fill", { label: "Favori", size: 20 })
    document.body.append(svg)
    expect(document.getElementById("bz-icon-star-fill")!.getAttribute("fill")).toBe("currentColor")
    expect(svg.getAttribute("role")).toBe("img")
    expect(svg.getAttribute("aria-label")).toBe("Favori")
    expect(svg.getAttribute("width")).toBe("20px")
  })

  it("renders icons used before they are defined, and warns once", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const svg = headless.icon("late")
    document.body.append(svg)
    await settle()
    expect(warn).toHaveBeenCalledOnce()
    headless.defineIcons({ late: { body: '<circle r="1"/>' } })
    expect(document.getElementById("bz-icon-late")).not.toBeNull()
    warn.mockRestore()
  })

  it("imports an SVG string and inlines shapes when asked", () => {
    headless.defineIconFromSvg("figma", '<svg viewBox="0 0 16 16" fill="none" stroke="black"><path d="M1 1h14"/></svg>')
    const svg = headless.icon("figma", { inline: true })
    expect(svg.getAttribute("viewBox")).toBe("0 0 16 16")
    expect(svg.getAttribute("stroke")).toBe("currentColor")
    expect(svg.querySelector("path")).not.toBeNull()
    expect(() => headless.defineIconFromSvg("bad", "<div>not svg</div>")).toThrow(/invalid SVG/)
  })

  it("<bz-icon> renders and follows its name", () => {
    document.body.innerHTML = `<bz-icon name="folder" label="Klasör"></bz-icon>`
    const el = document.querySelector("bz-icon")!
    expect(el.querySelector("svg")!.getAttribute("aria-label")).toBe("Klasör")
    el.name = "star-fill"
    flush()
    expect(el.querySelector("svg")!.getAttribute("data-icon")).toBe("star-fill")
  })
})

const items: TreeItem[] = [
  {
    id: "a",
    label: "Satış",
    icon: "folder",
    children: [
      { id: "a1", label: "Siparişler" },
      { id: "a2", label: "Faturalar", badge: 3 },
    ],
  },
  { id: "b", label: "Stok", children: [{ id: "b1", label: "Ürünler" }] },
  { id: "c", label: "Raporlar", disabled: true },
]

function mountTree(setup: (tree: HTMLElementTagNameMap["bz-tree"]) => void = () => {}) {
  document.body.replaceChildren()
  const tree = document.createElement("bz-tree")
  tree.items = items
  setup(tree)
  document.body.append(tree)
  const rows = () =>
    Array.from(tree.querySelectorAll<HTMLElement>("[role=treeitem]")).map(
      (r) => `${r.getAttribute("aria-level")}:${r.textContent!.replace(/\s+/g, " ").trim()}`
    )
  const row = (id: string) => tree.querySelector<HTMLElement>(`[data-id="${id}"]`)!
  return { tree, rows, row }
}

describe("bz-tree", () => {
  it("renders flat rows with ARIA levels and expands on toggle click", () => {
    const { tree, rows, row } = mountTree()
    expect(rows()).toEqual(["1:Satış", "1:Stok", "1:Raporlar"])
    expect(row("a").getAttribute("aria-expanded")).toBe("false")
    expect(row("a").getAttribute("aria-setsize")).toBe("3")
    expect(row("c").hasAttribute("aria-expanded")).toBe(false)
    const stok = row("b")
    row("a").querySelector<HTMLElement>("[data-part=toggle]")!.click()
    flush()
    expect(rows()).toEqual(["1:Satış", "2:Siparişler", "2:Faturalar 3", "1:Stok", "1:Raporlar"])
    expect(tree.expanded).toEqual(["a"])
    expect(row("b")).toBe(stok) // existing rows are kept
  })

  it("supports the WAI-ARIA keyboard model", async () => {
    const { tree, rows, row } = mountTree()
    const root = tree.querySelector("[role=tree]")!
    expect(row("a").tabIndex).toBe(0)
    key(root, "ArrowRight") // expand Satış
    flush()
    expect(rows()).toHaveLength(5)
    key(root, "ArrowRight") // into first child
    flush()
    expect(row("a1").tabIndex).toBe(0)
    key(root, "ArrowDown")
    key(root, "Enter") // select Faturalar
    flush()
    expect(tree.value).toBe("a2")
    expect(row("a2").getAttribute("aria-selected")).toBe("true")
    key(root, "ArrowLeft") // to parent
    key(root, "ArrowLeft") // collapse
    flush()
    expect(rows()).toHaveLength(3)
    key(root, "r") // typeahead → Raporlar
    flush()
    expect(row("c").tabIndex).toBe(0)
    key(root, "*") // expand all siblings
    flush()
    expect(rows()).toHaveLength(6)
  })

  it("leaf selection: parents only toggle; disabled items do nothing", () => {
    const { tree, row } = mountTree((t) => (t.selection = "leaf"))
    row("a").click()
    flush()
    expect(tree.value).toBe("")
    expect(row("a").getAttribute("aria-expanded")).toBe("true")
    const activate = vi.fn()
    tree.addEventListener("activate", activate)
    row("c").click()
    expect(activate).not.toHaveBeenCalled()
    row("a1").click()
    flush()
    expect(tree.value).toBe("a1")
    expect(activate).toHaveBeenCalledOnce()
  })

  it("filters with ancestors (accent/case-insensitive)", () => {
    const { tree, rows, row } = mountTree()
    tree.filter = "SIPARIS"
    flush()
    expect(rows()).toEqual(["1:Satış", "2:Siparişler"])
    expect(row("a1").hasAttribute("data-match")).toBe(true)
    tree.filter = ""
    flush()
    expect(rows()).toHaveLength(3)
  })

  it("checkboxes cascade to leaves and show mixed parents", () => {
    const { tree, row } = mountTree((t) => {
      t.checkable = true
      t.expanded = ["a"]
    })
    row("a1").querySelector<HTMLElement>("[data-part=checkbox]")!.click()
    flush()
    expect(tree.checked).toEqual(["a1"])
    expect(row("a").getAttribute("aria-checked")).toBe("mixed")
    row("a").querySelector<HTMLElement>("[data-part=checkbox]")!.click()
    flush()
    expect([...tree.checked].sort()).toEqual(["a1", "a2"])
    expect(row("a").getAttribute("aria-checked")).toBe("true")
    key(tree.querySelector("[role=tree]")!, " ") // Space on the active row (Satış) unchecks all
    flush()
    expect(tree.checked).toEqual([])
  })

  it("loads lazy children on expand", async () => {
    const loadChildren = vi.fn(async (item: TreeItem) => [{ id: `${item.id}-x`, label: "Yüklendi" }])
    const { rows, row } = mountTree((t) => {
      t.items = [{ id: "lazy", label: "Uzak klasör", lazy: true }]
      t.loadChildren = loadChildren
    })
    expect(row("lazy").getAttribute("aria-expanded")).toBe("false")
    row("lazy").querySelector<HTMLElement>("[data-part=toggle]")!.click()
    flush()
    expect(row("lazy").hasAttribute("aria-busy")).toBe(true)
    await settle()
    expect(loadChildren).toHaveBeenCalledOnce()
    expect(rows()).toEqual(["1:Uzak klasör", "2:Yüklendi"])
    expect(row("lazy").hasAttribute("aria-busy")).toBe(false)
  })

  it("renders links for href items and marks the current one", () => {
    const { tree, row } = mountTree((t) => {
      t.items = [{ id: "home", label: "Ana sayfa", href: "#home" }]
      t.value = "home"
    })
    expect(row("home").localName).toBe("a")
    expect(row("home").getAttribute("aria-current")).toBe("page")
    expect(tree.querySelector("[data-part=icon]")).toBeNull()
  })
})
