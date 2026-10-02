import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { flush } from "@bazlama/core"

beforeAll(async () => {
  await import("@bazlama/headless")
})
afterEach(() => {
  document.body.replaceChildren()
  localStorage.clear()
  vi.restoreAllMocks()
})

const tick = async () => {
  await new Promise((r) => setTimeout(r))
  flush()
}

/** jsdom has no layout: the split is `total` px along its axis, the primary pane `size()` px. */
function mount(attrs = "", total = 1000) {
  document.body.innerHTML = `<bz-split ${attrs}><nav id="a">A</nav><main id="b">B</main><aside id="c">C</aside></bz-split>`
  flush()
  const split = document.querySelector("bz-split") as HTMLElement & { size: number; collapsed: boolean; persist: string }
  const separator = split.querySelector<HTMLElement>(":scope > [data-part=separator]")!
  const pane = (name: string) => split.querySelector<HTMLElement>(`:scope > [data-pane=${name}]`)!
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const vertical = split.getAttribute("orientation") === "vertical"
    const primary = split.getAttribute("primary") === "end" ? "end" : "start"
    const along = this === split ? total : this === separator ? 0 : this.dataset.pane === primary ? (split.collapsed ? 0 : split.size) : 0
    const r = { width: vertical ? 300 : along, height: vertical ? along : 300 }
    return { ...r, top: 0, left: 0, right: r.width, bottom: r.height, x: 0, y: 0 } as DOMRect
  })
  return { split, separator, pane }
}
const key = (el: HTMLElement, k: string, init: KeyboardEventInit = {}) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }))

describe("bz-split", () => {
  it("puts the first element in the start pane and the rest in the end pane, with a separator between", () => {
    const { split, separator, pane } = mount()
    expect(pane("start").querySelector("#a")).not.toBeNull()
    expect(pane("end").querySelector("#b")).not.toBeNull()
    expect(pane("end").querySelector("#c")).not.toBeNull()
    expect([...split.children].map((c) => c.getAttribute("data-part"))).toEqual(["pane", "separator", "pane"])
    expect(separator.getAttribute("role")).toBe("separator")
    expect(separator.getAttribute("aria-orientation")).toBe("vertical")
    expect(separator.getAttribute("aria-controls")).toBe(pane("start").id)
    expect(split.style.getPropertyValue("--bz-split-size")).toBe("240px")
  })

  it("stacked: the separator is horizontal and moves with ↑/↓", () => {
    const { split, separator } = mount('orientation="vertical" size="200"')
    expect(separator.getAttribute("aria-orientation")).toBe("horizontal")
    const resize = vi.fn()
    split.addEventListener("resize", (e) => resize((e as unknown as CustomEvent).detail))
    key(separator, "ArrowRight")
    expect(resize).not.toHaveBeenCalled()
    key(separator, "ArrowDown")
    expect(split.size).toBe(216)
    expect(resize).toHaveBeenCalledWith({ size: 216 })
  })

  it("keyboard: arrows (Shift: bigger steps), Home/End within min and the room the other pane needs", () => {
    const { split, separator } = mount('size="300" min="150"')
    key(separator, "ArrowRight")
    expect(split.size).toBe(316)
    key(separator, "ArrowLeft", { shiftKey: true })
    expect(split.size).toBe(252)
    key(separator, "Home")
    expect(split.size).toBe(150)
    key(separator, "End")
    expect(split.size).toBe(850) // 1000 − the other pane's min (150)
    flush()
    expect(split.style.getPropertyValue("--bz-split-size")).toBe("850px")
  })

  it("primary=end: the end pane has the size, moving right shrinks it", () => {
    const { split, separator, pane } = mount('primary="end" size="300"')
    expect(separator.getAttribute("aria-controls")).toBe(pane("end").id)
    key(separator, "ArrowRight")
    expect(split.size).toBe(284)
  })

  it("max bounds the size; double click restores the first size", () => {
    const { split, separator } = mount('size="300" max="400"')
    key(separator, "End")
    expect(split.size).toBe(400)
    separator.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }))
    expect(split.size).toBe(300)
  })

  it("dragging the separator resizes on release; far below min collapses when collapsible", () => {
    const { split, separator } = mount('size="300" min="160" collapsible')
    const pointer = (type: string, x: number) => separator.dispatchEvent(Object.assign(new MouseEvent(type, { clientX: x, button: 0, bubbles: true }), { pointerId: 1 }))
    pointer("pointerdown", 300)
    expect(split.hasAttribute("data-resizing")).toBe(true)
    pointer("pointermove", 360)
    expect(split.style.getPropertyValue("--bz-split-size")).toBe("360px")
    expect(split.size).toBe(300)
    pointer("pointerup", 360)
    expect(split.size).toBe(360)
    expect(split.hasAttribute("data-resizing")).toBe(false)

    const toggled = vi.fn()
    split.addEventListener("toggle", (e) => toggled((e as unknown as CustomEvent).detail))
    pointer("pointerdown", 360)
    pointer("pointermove", 20)
    expect(split.hasAttribute("data-resize-collapse")).toBe(true)
    pointer("pointerup", 20)
    expect(split.collapsed).toBe(true)
    expect(split.size).toBe(360) // kept for restoring
    expect(toggled).toHaveBeenCalledWith({ collapsed: true })
  })

  it("collapsible: Enter collapses and restores; the collapsed pane is inert; aria-expanded follows", async () => {
    const { split, separator, pane } = mount("collapsible")
    await tick()
    expect(separator.getAttribute("aria-expanded")).toBe("true")
    key(separator, "Enter")
    flush()
    expect(split.collapsed).toBe(true)
    expect(split.hasAttribute("collapsed")).toBe(true)
    expect(pane("start").inert).toBe(true)
    expect(pane("end").inert).toBe(false)
    expect(separator.getAttribute("aria-expanded")).toBe("false")
    key(separator, "Enter")
    flush()
    expect(split.collapsed).toBe(false)
    expect(pane("start").inert).toBe(false)
  })

  it("not collapsible: Enter does nothing and there is no aria-expanded", async () => {
    const { split, separator } = mount()
    await tick()
    key(separator, "Enter")
    expect(split.collapsed).toBe(false)
    expect(separator.hasAttribute("aria-expanded")).toBe(false)
  })

  it("persist: restores the saved size and collapsed state, saves changes", async () => {
    localStorage.setItem("bz-split:ide", JSON.stringify({ size: 333, collapsed: true }))
    const { split, separator } = mount('persist="ide" collapsible')
    expect(split.size).toBe(333)
    expect(split.collapsed).toBe(true)
    key(separator, "Enter")
    key(separator, "ArrowRight")
    flush()
    expect(JSON.parse(localStorage.getItem("bz-split:ide")!)).toEqual({ size: 349, collapsed: false })
  })

  it("persist: ignores broken values", () => {
    localStorage.setItem("bz-split:x", JSON.stringify({ size: "wide", collapsed: 1 }))
    const { split } = mount('persist="x" size="210" collapsible')
    expect(split.size).toBe(210)
    expect(split.collapsed).toBe(false)
  })

  it("nested splits keep their own parts", () => {
    document.body.innerHTML = `<bz-split id="outer"><nav>A</nav><bz-split id="inner" orientation="vertical"><main>B</main><section>C</section></bz-split></bz-split>`
    flush()
    const outer = document.getElementById("outer")!
    const inner = document.getElementById("inner")!
    expect(outer.querySelectorAll(":scope > [data-part=separator]")).toHaveLength(1)
    expect(inner.querySelectorAll(":scope > [data-part=separator]")).toHaveLength(1)
    expect(inner.closest("[data-pane]")!.getAttribute("data-pane")).toBe("end")
  })
})
