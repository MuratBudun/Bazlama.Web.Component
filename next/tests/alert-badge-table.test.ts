import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { flush } from "@bazlama/core"

beforeAll(async () => {
  Element.prototype.scrollIntoView ??= () => {}
  const h = await import("@bazlama/headless")
  h.defineIcons(await import("@bazlama/icons"))
})
afterEach(() => document.body.replaceChildren())
const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }))

describe("bz-alert", () => {
  it("is a note by default, a live region with `live`; icon by variant", () => {
    document.body.innerHTML = `<bz-alert variant="warning" heading="Dikkat">7 günden uzun bekleyen işler var.</bz-alert>`
    flush()
    const a = document.querySelector("bz-alert")!
    expect(a.getAttribute("role")).toBe("note")
    expect(a.querySelector("[data-part=heading]")!.textContent).toBe("Dikkat")
    expect(a.querySelector("[data-part=message]")!.textContent).toContain("7 günden")
    expect(a.querySelector("[data-part=icon] svg")!.getAttribute("data-icon")).toBe("alert")
    expect(a.querySelector<HTMLElement>("[data-part=close]")!.hidden).toBe(true)
    a.live = "assertive"
    flush()
    expect(a.getAttribute("role")).toBe("alert")
    a.live = "polite"
    flush()
    expect(a.getAttribute("role")).toBe("status")
    a.icon = "none"
    flush()
    expect(a.querySelector<HTMLElement>("[data-part=icon]")!.hidden).toBe(true)
  })

  it("dismiss hides it unless prevented", () => {
    document.body.innerHTML = `<bz-alert dismissible>Kaydedildi</bz-alert>`
    flush()
    const a = document.querySelector("bz-alert")!
    let prevent = true
    const events: string[] = []
    a.addEventListener("dismiss", (e) => (events.push("dismiss"), prevent && e.preventDefault()))
    const close = a.querySelector<HTMLElement>("[data-part=close]")!
    expect(close.getAttribute("aria-label")).toBe("Close")
    close.click()
    expect(a.hidden).toBe(false)
    prevent = false
    close.click()
    expect(a.hidden).toBe(true)
    expect(events).toEqual(["dismiss", "dismiss"])
  })
})

describe("bz-badge / bz-chip", () => {
  it("badge shows text, counts with max, dot with a label", () => {
    document.body.innerHTML = `
      <bz-badge id="t" variant="success">Yürürlükte</bz-badge>
      <bz-badge id="c" count="128" max="99" label="128 bildirim"></bz-badge>
      <bz-badge id="z" count="0" hide-zero></bz-badge>
      <bz-badge id="d" dot label="Çevrimiçi"></bz-badge>`
    flush()
    const b = (id: string) => document.getElementById(id)!
    expect(b("t").textContent!.trim()).toBe("Yürürlükte")
    expect(b("c").textContent!.trim()).toBe("99+")
    expect(b("c").getAttribute("role")).toBe("img")
    expect(b("c").getAttribute("aria-label")).toBe("128 bildirim")
    expect(b("z").hasAttribute("data-empty")).toBe(true)
    expect(b("d").textContent!.trim()).toBe("")
    expect(b("d").getAttribute("aria-label")).toBe("Çevrimiçi")
  })

  it("selectable chip toggles with click and keyboard; removable fires remove", () => {
    document.body.innerHTML = `
      <bz-chip id="f" selectable>Doküman Formu</bz-chip>
      <bz-chip id="r" removable icon="tag">Kalite</bz-chip>
      <bz-chip id="x" selectable disabled>Pasif</bz-chip>`
    flush()
    const f = document.getElementById("f") as HTMLElement & { selected: boolean }
    const changes: unknown[] = []
    f.addEventListener("change", (e) => changes.push((e as CustomEvent).detail))
    expect(f.getAttribute("role")).toBe("button")
    expect(f.getAttribute("aria-pressed")).toBe("false")
    expect(f.tabIndex).toBe(0)
    f.click()
    flush()
    expect(f.selected).toBe(true)
    expect(f.getAttribute("aria-pressed")).toBe("true")
    key(f, " ")
    flush()
    expect(f.selected).toBe(false)
    expect(changes).toEqual([{ selected: true }, { selected: false }])

    const r = document.getElementById("r")!
    const removed = vi.fn()
    r.addEventListener("remove", removed)
    expect(r.hasAttribute("role")).toBe(false)
    const btn = r.querySelector<HTMLElement>("[data-part=remove]")!
    expect(btn.getAttribute("aria-label")).toBe("Remove: Kalite")
    btn.click()
    expect(removed).toHaveBeenCalledOnce()

    const x = document.getElementById("x") as HTMLElement & { selected: boolean }
    x.click()
    flush()
    expect(x.selected).toBe(false)
    expect(x.tabIndex).toBe(-1)
  })
})

describe("bz-table row activation", () => {
  const mount = (activatable: boolean) => {
    document.body.innerHTML = ""
    const table = document.createElement("bz-table")
    table.columns = [{ key: "name", header: "Ad" }]
    table.rows = [{ id: 1, name: "Ada" }, { id: 2, name: "Can" }, { id: 3, name: "Ece" }]
    table.selectable = true
    table.activatable = activatable
    document.body.append(table)
    flush()
    const rows = () => Array.from(table.querySelectorAll<HTMLElement>("tbody tr"))
    const activated: unknown[] = []
    table.addEventListener("row-activate", (e) => {
      const d = (e as CustomEvent).detail
      activated.push([d.key, d.via])
    })
    return { table, rows, activated }
  }

  it("double click fires row-activate (always)", () => {
    const { rows, activated } = mount(false)
    rows()[1].dispatchEvent(new MouseEvent("dblclick", { bubbles: true }))
    expect(activated).toEqual([[2, "dblclick"]])
    expect(rows()[0].hasAttribute("tabindex")).toBe(false)
  })

  it("activatable: one tab stop, arrows move, Enter activates, Space selects", () => {
    const { table, rows, activated } = mount(true)
    expect(rows().map((r) => r.tabIndex)).toEqual([0, -1, -1])
    rows()[0].focus()
    key(rows()[0], "ArrowDown")
    flush()
    expect(document.activeElement).toBe(rows()[1])
    expect(rows().map((r) => r.tabIndex)).toEqual([-1, 0, -1])
    key(rows()[1], "End")
    flush()
    expect(document.activeElement).toBe(rows()[2])
    key(rows()[2], "Enter")
    expect(activated).toEqual([[3, "keyboard"]])
    key(rows()[2], " ")
    flush()
    expect(table.selection).toEqual([3])
    // Removing the focused row moves the tab stop to the first row.
    table.rows = table.rows.slice(0, 2)
    flush()
    expect(rows().map((r) => r.tabIndex)).toEqual([0, -1])
  })
})
