import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { flush, html } from "@bazlama/core"

let h: typeof import("@bazlama/headless")

beforeAll(async () => {
  Element.prototype.scrollIntoView ??= () => {}
  globalThis.requestAnimationFrame ??= (fn: FrameRequestCallback) => setTimeout(() => fn(0), 0) as unknown as number
  h = await import("@bazlama/headless")
})

afterEach(async () => {
  await h.dialogs.closeAll()
  document.body.replaceChildren()
})

const settle = async () => {
  for (let i = 0; i < 4; i++) {
    await new Promise<void>((r) => setTimeout(r))
    flush()
  }
}
const key = (k: string, target: Element = document.activeElement!) =>
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }))
const popupOf = (menu: Element) => menu.querySelector<HTMLElement>(":scope > [data-part=popup]")!
const label = (el: Element | null) => el?.querySelector("[data-part=label]")?.textContent?.trim()

function mount() {
  document.body.innerHTML = `
    <bz-menu id="root">
      <bz-button slot="trigger">İşlemler</bz-button>
      <bz-menu-item value="edit" icon="edit" shortcut="F2">Düzenle</bz-menu-item>
      <bz-menu-item value="copy">Kopyala</bz-menu-item>
      <bz-menu-item value="archive" disabled>Arşivle</bz-menu-item>
      <bz-menu-separator></bz-menu-separator>
      <bz-menu id="export">
        <bz-menu-item slot="trigger">Dışa aktar</bz-menu-item>
        <bz-menu-item value="xlsx">Excel</bz-menu-item>
        <bz-menu-item value="pdf">PDF</bz-menu-item>
      </bz-menu>
      <bz-menu-group label="Görünüm">
        <bz-menu-item type="checkbox" value="grid" checked>Izgara çizgileri</bz-menu-item>
        <bz-menu-item type="radio" name="density" value="compact">Sıkı</bz-menu-item>
        <bz-menu-item type="radio" name="density" value="normal" checked>Normal</bz-menu-item>
      </bz-menu-group>
      <bz-menu-item value="delete" variant="danger">Sil</bz-menu-item>
    </bz-menu>`
  flush()
  const root = document.getElementById("root") as HTMLElementTagNameMap["bz-menu"]
  const sub = document.getElementById("export") as HTMLElementTagNameMap["bz-menu"]
  const trigger = root.querySelector<HTMLElement>("bz-button")!
  return { root, sub, trigger }
}

describe("bz-menu", () => {
  it("wires the trigger and opens on click with focus on the first item", () => {
    const { root, trigger } = mount()
    const popup = popupOf(root)
    expect(popup.getAttribute("role")).toBe("menu")
    expect(trigger.getAttribute("aria-haspopup")).toBe("menu")
    expect(trigger.getAttribute("aria-controls")).toBe(popup.id)
    expect(popup.hidden).toBe(true)

    trigger.click()
    flush()
    expect(root.open).toBe(true)
    expect(popup.hidden).toBe(false)
    expect(trigger.getAttribute("aria-expanded")).toBe("true")
    expect(label(document.activeElement)).toBe("Düzenle")
    expect(popup.getAttribute("aria-label")).toBe("İşlemler")
  })

  it("keyboard: arrows (disabled items focusable), typeahead, Escape returns focus", () => {
    const { root, trigger } = mount()
    trigger.focus()
    key("ArrowUp", trigger)
    flush()
    expect(label(document.activeElement)).toBe("Sil")
    key("ArrowDown") // wraps
    expect(label(document.activeElement)).toBe("Düzenle")
    key("ArrowDown")
    key("ArrowDown")
    expect(label(document.activeElement)).toBe("Arşivle")
    key("d") // typeahead → Dışa aktar
    expect(label(document.activeElement)).toBe("Dışa aktar")
    key("Escape")
    flush()
    expect(root.open).toBe(false)
    expect(document.activeElement).toBe(trigger)
  })

  it("select event, closes and focuses the trigger; disabled items do nothing", () => {
    const { root, trigger } = mount()
    const select = vi.fn()
    root.addEventListener("select", (e) => select((e as CustomEvent).detail.value))
    trigger.click()
    const archive = root.querySelector<HTMLElement>('[value="archive"]')!
    archive.click()
    expect(select).not.toHaveBeenCalled()
    expect(root.open).toBe(true)
    key("Enter", root.querySelector('[value="copy"]')!)
    flush()
    expect(select).toHaveBeenCalledWith("copy")
    expect(root.open).toBe(false)
    expect(document.activeElement).toBe(trigger)
  })

  it("submenu: → opens and focuses, ← closes and returns, select bubbles and closes all", () => {
    const { root, sub, trigger } = mount()
    const values: string[] = []
    root.addEventListener("select", (e) => values.push((e as CustomEvent).detail.value))
    trigger.click()
    const subTrigger = sub.querySelector<HTMLElement>(":scope > bz-menu-item")!
    expect(subTrigger.getAttribute("aria-haspopup")).toBe("menu")
    subTrigger.focus()
    key("ArrowRight")
    flush()
    expect(sub.open).toBe(true)
    expect(subTrigger.getAttribute("aria-expanded")).toBe("true")
    expect(label(document.activeElement)).toBe("Excel")
    key("ArrowLeft")
    flush()
    expect(sub.open).toBe(false)
    expect(document.activeElement).toBe(subTrigger)
    expect(root.open).toBe(true)

    key("Enter")
    flush()
    key("ArrowDown") // PDF
    key("Enter")
    flush()
    expect(values).toEqual(["pdf"])
    expect(sub.open).toBe(false)
    expect(root.open).toBe(false)
    expect(document.activeElement).toBe(trigger)
  })

  it("checkbox and radio items toggle and keep the menu open", () => {
    const { root, trigger } = mount()
    trigger.click()
    const grid = root.querySelector<HTMLElement & { checked: boolean }>('[value="grid"]')!
    const compact = root.querySelector<HTMLElement & { checked: boolean }>('[value="compact"]')!
    const normal = root.querySelector<HTMLElement & { checked: boolean }>('[value="normal"]')!
    expect(grid.getAttribute("role")).toBe("menuitemcheckbox")
    expect(grid.getAttribute("aria-checked")).toBe("true")
    grid.click()
    compact.click()
    flush()
    expect(grid.checked).toBe(false)
    expect(compact.checked).toBe(true)
    expect(normal.checked).toBe(false)
    expect(normal.getAttribute("aria-checked")).toBe("false")
    expect(root.open).toBe(true)
  })

  it("preventDefault on select keeps it open; Tab closes to the trigger", () => {
    const { root, trigger } = mount()
    root.addEventListener("select", (e) => e.preventDefault())
    trigger.click()
    root.querySelector<HTMLElement>('[value="copy"]')!.click()
    flush()
    expect(root.open).toBe(true)
    key("Tab")
    flush()
    expect(root.open).toBe(false)
    expect(document.activeElement).toBe(trigger)
  })

  it("Escape in a menu inside a dialog does not close the dialog", async () => {
    const ref = h.dialogs.open({
      content: html`<bz-menu><bz-button slot="trigger" id="t">Menü</bz-button><bz-menu-item>Bir</bz-menu-item></bz-menu>`,
    })
    const t = document.getElementById("t")!
    t.click()
    flush()
    key("Escape")
    await settle()
    expect(ref.element.open).toBe(true)
    expect(document.activeElement).toBe(t)
  })

  it("closes on an outside pointerdown (fallback without the Popover API)", () => {
    const { root, trigger } = mount()
    trigger.click()
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }))
    flush()
    expect(root.open).toBe(false)
  })
})

describe("bz-context-menu", () => {
  const rightClick = (el: Element, x = 40, y = 50) => {
    const e = new MouseEvent("contextmenu", { bubbles: true, cancelable: true, button: 2, clientX: x, clientY: y })
    el.dispatchEvent(e)
    return e
  }
  const mountGrid = () => {
    document.body.innerHTML = `
      <table id="grid"><thead><tr><th>Ad</th></tr></thead>
        <tbody><tr data-id="1"><td>Ada</td></tr><tr data-id="2"><td>Can</td></tr></tbody></table>
      <bz-context-menu for="grid" selector="tbody tr">
        <bz-menu-item value="open">Aç</bz-menu-item>
        <bz-menu-item value="delete" variant="danger">Sil</bz-menu-item>
      </bz-context-menu>`
    flush()
    const cm = document.querySelector("bz-context-menu")!
    const menu = cm.querySelector("bz-menu")!
    return { cm, menu, rows: document.querySelectorAll<HTMLElement>("tbody tr"), header: document.querySelector("th")! }
  }

  it("opens on matching rows only and exposes the row as contextTarget", () => {
    const { cm, menu, rows, header } = mountGrid()
    const outside = rightClick(header)
    expect(outside.defaultPrevented).toBe(false) // browser menu on the header
    expect(menu.open).toBe(false)

    const e = rightClick(rows[1].querySelector("td")!)
    flush()
    expect(e.defaultPrevented).toBe(true)
    expect(menu.open).toBe(true)
    expect(cm.contextTarget).toBe(rows[1])
    expect(label(document.activeElement)).toBe("Aç")
  })

  it("select reports the value; the row is read from contextTarget", () => {
    const { cm, rows } = mountGrid()
    const got: string[] = []
    cm.addEventListener("select", (e) => got.push(`${(e as CustomEvent).detail.value}:${(cm.contextTarget as HTMLElement).dataset.id}`))
    rightClick(rows[0])
    flush()
    key("ArrowDown")
    key("Enter")
    expect(got).toEqual(["delete:1"])
  })

  it("before-open can cancel (browser menu) and disable items per row", () => {
    const { cm, menu, rows } = mountGrid()
    cm.addEventListener("before-open", (e) => {
      const row = (e as CustomEvent).detail.target as HTMLElement
      if (row.dataset.id === "2") return e.preventDefault()
      cm.querySelector<HTMLElement & { disabled: boolean }>('[value="delete"]')!.disabled = true
    })
    const e2 = rightClick(rows[1])
    expect(e2.defaultPrevented).toBe(false)
    expect(menu.open).toBe(false)
    rightClick(rows[0])
    flush()
    expect(menu.open).toBe(true)
    expect(cm.querySelector('[value="delete"]')!.getAttribute("aria-disabled")).toBe("true")
  })

  it("a second right click moves the open menu", () => {
    // jsdom has no layout: give the viewport a size so positions are not clamped.
    Object.defineProperty(document.documentElement, "clientWidth", { value: 1000, configurable: true })
    Object.defineProperty(document.documentElement, "clientHeight", { value: 800, configurable: true })
    const { menu, rows } = mountGrid()
    rightClick(rows[0], 40, 50)
    flush()
    const popup = popupOf(menu)
    rightClick(rows[1], 300, 200)
    flush()
    expect(menu.open).toBe(true)
    expect(popup.style.left).toBe("300px")
  })

  it("keyboard requests (Chrome: button -1) open next to the matched row", () => {
    const { cm, menu, rows } = mountGrid()
    const e = new MouseEvent("contextmenu", { bubbles: true, cancelable: true, button: -1, clientX: 12, clientY: 8 })
    rows[1].querySelector("td")!.dispatchEvent(e)
    flush()
    expect(menu.open).toBe(true)
    expect(cm.contextTarget).toBe(rows[1])
  })

  it("long press on touch opens it and swallows the following click", async () => {
    vi.useFakeTimers()
    try {
      const { menu, rows } = mountGrid()
      const clicked = vi.fn()
      rows[0].addEventListener("click", clicked)
      rows[0].dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch", clientX: 30, clientY: 40 }))
      vi.advanceTimersByTime(600)
      flush()
      expect(menu.open).toBe(true)
      rows[0].dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerType: "touch" }))
      rows[0].dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }))
      expect(clicked).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it("right press-drag-release selects the item under the pointer", async () => {
    const { cm, rows } = mountGrid()
    const got: string[] = []
    cm.addEventListener("select", (e) => got.push((e as CustomEvent).detail.value))
    rightClick(rows[0])
    flush()
    const del = cm.querySelector('[value="delete"]')!
    del.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 2 }))
    expect(got).toEqual([]) // too early: the release of the opening click
    await new Promise((r) => setTimeout(r, 300))
    del.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 2 }))
    expect(got).toEqual(["delete"])
  })
})

describe("place()", () => {
  it("opens a point-anchored menu to the left of the cursor near the right edge", () => {
    const el = document.body.appendChild(document.createElement("div"))
    Object.defineProperty(el, "offsetWidth", { value: 200 })
    Object.defineProperty(el, "offsetHeight", { value: 100 })
    Object.defineProperty(document.documentElement, "clientWidth", { value: 1000, configurable: true })
    Object.defineProperty(document.documentElement, "clientHeight", { value: 800, configurable: true })
    const r = h.place({ x: 950, y: 100 }, el, { placement: "bottom-start", offset: 0 })
    expect(r.placement).toBe("bottom-end")
    expect(r.x).toBe(750)
    const down = h.place({ x: 100, y: 780 }, el, { placement: "bottom-start", offset: 0 })
    expect(down.placement).toBe("top-start")
    expect(down.y).toBe(680)
  })
})

describe("openMenu / contextMenu", () => {
  it("resolves with the selected value and removes the menu", async () => {
    const onPdf = vi.fn()
    const result = h.openMenu({
      anchor: { x: 100, y: 100 },
      items: [
        { label: "Aç", value: "open", icon: "folder" },
        { type: "separator" },
        { label: "Dışa aktar", children: [{ label: "PDF", value: "pdf", onSelect: onPdf }] },
      ],
    })
    await settle()
    const menu = document.querySelector("bz-menu[data-temporary]")!
    expect(label(document.activeElement)).toBe("Aç")
    key("ArrowDown")
    key("ArrowRight")
    flush()
    expect(label(document.activeElement)).toBe("PDF")
    key("Enter")
    expect(await result).toBe("pdf")
    expect(onPdf).toHaveBeenCalledWith({ value: "pdf", checked: false })
    await settle()
    expect(menu.isConnected).toBe(false)
  })

  it("a radio choice in a one-shot menu closes it with the value", async () => {
    const result = h.openMenu({
      anchor: { x: 10, y: 10 },
      items: [{ label: "Durum", children: [{ label: "aktif", value: "a", type: "radio", name: "s" }, { label: "pasif", value: "p", type: "radio", name: "s", checked: true }] }],
    })
    await settle()
    key("ArrowRight")
    flush()
    key("Enter")
    expect(await result).toBe("a")
  })

  it("resolves undefined on Escape and restores focus", async () => {
    const button = document.body.appendChild(document.createElement("button"))
    button.focus()
    const result = h.openMenu({ anchor: button, items: [{ label: "Bir", value: "1" }] })
    await settle()
    key("Escape")
    expect(await result).toBeUndefined()
    expect(document.activeElement).toBe(button)
  })

  it("contextMenu builds items from the event and reports the choice", async () => {
    const row = document.body.appendChild(document.createElement("div"))
    row.dataset.id = "42"
    const chosen = vi.fn()
    h.contextMenu(row, (e) => [{ label: `Kayıt ${(e.target as HTMLElement).dataset.id}`, value: "open" }], chosen)
    const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 50, clientY: 60 })
    row.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    await settle()
    expect(label(document.activeElement)).toBe("Kayıt 42")
    key("Enter")
    await settle()
    expect(chosen).toHaveBeenCalledWith("open", event)
  })
})
