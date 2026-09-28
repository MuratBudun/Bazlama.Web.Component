import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { flush, html } from "@bazlama/core"

let h: typeof import("@bazlama/headless")

beforeAll(async () => {
  Element.prototype.scrollIntoView ??= () => {}
  h = await import("@bazlama/headless")
})

const settle = async () => {
  for (let i = 0; i < 4; i++) {
    await new Promise<void>((r) => setTimeout(r))
    flush()
  }
}
const key = (el: Element, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }))

// ---------------------------------------------------------------------------------------

describe("bz-tabs", () => {
  afterEach(() => document.body.replaceChildren())

  const mount = (attrs = "") => {
    document.body.innerHTML = `
      <bz-tabs ${attrs}>
        <bz-tab-list>
          <bz-tab value="a">A</bz-tab>
          <bz-tab value="b" disabled>B</bz-tab>
          <bz-tab value="c">C</bz-tab>
        </bz-tab-list>
        <bz-tab-panel value="a">Panel A</bz-tab-panel>
        <bz-tab-panel value="b">Panel B</bz-tab-panel>
        <bz-tab-panel value="c">Panel C</bz-tab-panel>
      </bz-tabs>`
    flush()
    const tabs = document.querySelector("bz-tabs")!
    const tab = (v: string) => tabs.querySelector<HTMLElement>(`bz-tab[value="${v}"]`)!
    const panel = (v: string) => tabs.querySelector<HTMLElement>(`bz-tab-panel[value="${v}"]`)!
    return { tabs, tab, panel }
  }

  it("selects the first enabled tab and wires ARIA", () => {
    const { tabs, tab, panel } = mount()
    expect(tabs.value).toBe("a")
    expect(tabs.querySelector("bz-tab-list")!.getAttribute("role")).toBe("tablist")
    expect(tab("a").getAttribute("aria-selected")).toBe("true")
    expect(tab("a").tabIndex).toBe(0)
    expect(tab("c").tabIndex).toBe(-1)
    expect(tab("a").getAttribute("aria-controls")).toBe(panel("a").id)
    expect(panel("a").getAttribute("aria-labelledby")).toBe(tab("a").id)
    expect(panel("a").hidden).toBe(false)
    expect(panel("c").hidden).toBe(true)
    expect(tab("b").getAttribute("aria-disabled")).toBe("true")
  })

  it("arrow keys skip disabled tabs and select (automatic activation)", () => {
    const { tabs, tab, panel } = mount()
    const change = vi.fn()
    tabs.addEventListener("change", change)
    tab("a").focus()
    key(tab("a"), "ArrowRight")
    flush()
    expect(document.activeElement).toBe(tab("c"))
    expect(tabs.value).toBe("c")
    expect(panel("c").hidden).toBe(false)
    expect(change).toHaveBeenCalledOnce()
    key(tab("c"), "ArrowRight") // wraps
    flush()
    expect(tabs.value).toBe("a")
    key(tab("a"), "End")
    flush()
    expect(tabs.value).toBe("c")
  })

  it("manual activation: arrows move focus, Enter selects", () => {
    const { tabs, tab } = mount('activation="manual"')
    tab("a").focus()
    key(tab("a"), "ArrowRight")
    flush()
    expect(document.activeElement).toBe(tab("c"))
    expect(tabs.value).toBe("a")
    key(tab("c"), "Enter")
    flush()
    expect(tabs.value).toBe("c")
  })

  it("clicks select; disabled tabs are ignored; value can be set", () => {
    const { tabs, tab, panel } = mount()
    tab("b").click()
    flush()
    expect(tabs.value).toBe("a")
    tab("c").click()
    flush()
    expect(tabs.value).toBe("c")
    tabs.value = "a"
    flush()
    expect(panel("a").hidden).toBe(false)
  })

  it("a value for a tab that renders later is kept and then selected", async () => {
    const { tabs } = mount()
    tabs.value = "d"
    flush()
    expect(tabs.value).toBe("d") // not reset to the first tab
    const tab = Object.assign(document.createElement("bz-tab"), { textContent: "D" })
    tab.setAttribute("value", "d")
    tabs.querySelector("bz-tab-list")!.append(tab)
    const panel = document.createElement("bz-tab-panel")
    panel.setAttribute("value", "d")
    tabs.append(panel)
    await settle()
    expect(tab.getAttribute("aria-selected")).toBe("true")
    expect(panel.hidden).toBe(false)
  })

  it("change does not bubble: nested tabs do not reach the outer listener", () => {
    document.body.innerHTML = `
      <bz-tabs id="outer">
        <bz-tab-list><bz-tab value="a">A</bz-tab><bz-tab value="b">B</bz-tab></bz-tab-list>
        <bz-tab-panel value="a">
          <bz-tabs id="inner">
            <bz-tab-list><bz-tab value="x">X</bz-tab><bz-tab value="y">Y</bz-tab></bz-tab-list>
            <bz-tab-panel value="x">X</bz-tab-panel><bz-tab-panel value="y">Y</bz-tab-panel>
          </bz-tabs>
        </bz-tab-panel>
        <bz-tab-panel value="b">B</bz-tab-panel>
      </bz-tabs>`
    flush()
    const outer = document.getElementById("outer") as HTMLElementTagNameMap["bz-tabs"]
    const seen: unknown[] = []
    outer.addEventListener("change", (e) => seen.push((e as CustomEvent).detail))
    ;(document.querySelector('#inner bz-tab[value="y"]') as HTMLElement).click()
    flush()
    expect(seen).toEqual([])
    expect(outer.value).toBe("a")
    ;(document.querySelector('#outer > bz-tab-list > bz-tab[value="b"]') as HTMLElement).click()
    expect(seen).toEqual([{ value: "b" }])
  })

  it("vertical orientation uses up/down", () => {
    const { tabs, tab } = mount('orientation="vertical"')
    expect(tabs.querySelector("bz-tab-list")!.getAttribute("aria-orientation")).toBe("vertical")
    tab("a").focus()
    key(tab("a"), "ArrowRight")
    flush()
    expect(tabs.value).toBe("a")
    key(tab("a"), "ArrowDown")
    flush()
    expect(tabs.value).toBe("c")
  })

  it("follows added tabs and matches by position without values; nested tabs are independent", async () => {
    document.body.innerHTML = `
      <bz-tabs id="outer">
        <div class="strip"><bz-tab>Bir</bz-tab><bz-tab>İki</bz-tab></div>
        <bz-tab-panel>1
          <bz-tabs id="inner">
            <div><bz-tab>x</bz-tab><bz-tab>y</bz-tab></div>
            <bz-tab-panel>X</bz-tab-panel><bz-tab-panel>Y</bz-tab-panel>
          </bz-tabs>
        </bz-tab-panel>
        <bz-tab-panel>2</bz-tab-panel>
      </bz-tabs>`
    flush()
    const outer = document.getElementById("outer") as HTMLElementTagNameMap["bz-tabs"]
    const inner = document.getElementById("inner") as HTMLElementTagNameMap["bz-tabs"]
    expect(outer.value).toBe("0")
    expect(inner.value).toBe("0")
    expect(outer.querySelector(".strip")!.getAttribute("role")).toBe("tablist")

    inner.querySelectorAll("bz-tab")[1].dispatchEvent(new MouseEvent("click", { bubbles: true }))
    flush()
    expect(inner.value).toBe("1")
    expect(outer.value).toBe("0")

    const strip = outer.querySelector(".strip")!
    strip.append(Object.assign(document.createElement("bz-tab"), { textContent: "Üç" }))
    const p3 = document.createElement("bz-tab-panel")
    p3.textContent = "3"
    outer.append(p3)
    await settle()
    strip.querySelectorAll("bz-tab")[2].dispatchEvent(new MouseEvent("click", { bubbles: true }))
    flush()
    expect(outer.value).toBe("2")
    expect(p3.hidden).toBe(false)
  })
})

// ---------------------------------------------------------------------------------------

describe("toast", () => {
  afterEach(async () => {
    h.toast.dismiss()
    vi.useRealTimers()
    await settle()
  })
  const toasts = () => Array.from(document.querySelectorAll<HTMLElement>("[data-bz-toaster] > [data-part=toast]:not([data-leaving])"))

  it("shows a status toast and closes it after its duration", async () => {
    vi.useFakeTimers()
    const ref = h.toast.success("Kaydedildi", { title: "Başarılı", duration: 1000 })
    expect(ref.element.getAttribute("role")).toBe("status")
    expect(ref.element.getAttribute("data-variant")).toBe("success")
    expect(ref.element.querySelector("[data-part=title]")!.textContent).toBe("Başarılı")
    expect(ref.element.querySelector("[data-part=message]")!.textContent).toBe("Kaydedildi")
    expect(ref.element.closest("[data-bz-toaster]")!.getAttribute("data-placement")).toBe("bottom-right")
    vi.advanceTimersByTime(999)
    expect(toasts()).toHaveLength(1)
    vi.advanceTimersByTime(2)
    expect(toasts()).toHaveLength(0)
  })

  it("errors are alerts and stay twice as long by default", () => {
    vi.useFakeTimers()
    const ref = h.toast.error("Bağlantı hatası")
    expect(ref.element.getAttribute("role")).toBe("alert")
    vi.advanceTimersByTime(h.toast.defaults.duration + 1)
    expect(toasts()).toHaveLength(1)
    vi.advanceTimersByTime(h.toast.defaults.duration)
    expect(toasts()).toHaveLength(0)
  })

  it("pauses while hovered", () => {
    vi.useFakeTimers()
    const ref = h.toast({ message: "Bekle", duration: 1000 })
    const toaster = ref.element.parentElement!
    vi.advanceTimersByTime(600)
    toaster.dispatchEvent(new PointerEvent("pointerenter"))
    vi.advanceTimersByTime(5000)
    expect(toasts()).toHaveLength(1)
    expect(ref.element.hasAttribute("data-paused")).toBe(true)
    toaster.dispatchEvent(new PointerEvent("pointerleave"))
    vi.advanceTimersByTime(399)
    expect(toasts()).toHaveLength(1)
    vi.advanceTimersByTime(2)
    expect(toasts()).toHaveLength(0)
  })

  it("same id updates in place; action and close buttons work", async () => {
    const first = h.toast({ id: "sync", message: "Eşitleniyor", duration: 0 })
    const again = h.toast({ id: "sync", message: "Eşitlendi", variant: "success", duration: 0 })
    expect(again).toBe(first)
    expect(toasts()).toHaveLength(1)
    flush()
    expect(first.element.querySelector("[data-part=message]")!.textContent).toBe("Eşitlendi")

    const undo = vi.fn()
    const ref = h.toast({ message: "Silindi", duration: 0, action: { label: "Geri al", onClick: (r) => (undo(), r.close()) } })
    ref.element.querySelector<HTMLElement>("[data-part=action]")!.click()
    expect(undo).toHaveBeenCalledOnce()
    first.element.querySelector<HTMLElement>("[data-part=close]")!.click()
    expect(toasts()).toHaveLength(0)
  })

  it("promise: loading then success", async () => {
    let resolve!: (v: number) => void
    const p = new Promise<number>((r) => (resolve = r))
    h.toast.promise(p, { loading: "Yükleniyor…", success: (n) => `${n} kayıt`, error: "Hata" })
    flush()
    const el = toasts()[0]
    expect(el.hasAttribute("data-loading")).toBe(true)
    expect(el.querySelector<HTMLElement>("[data-part=close]")!.hidden).toBe(true)
    resolve(3)
    await settle()
    expect(el.hasAttribute("data-loading")).toBe(false)
    expect(el.getAttribute("data-variant")).toBe("success")
    expect(el.querySelector("[data-part=message]")!.textContent).toBe("3 kayıt")
  })

  it("keeps at most `max` toasts per placement and supports placements", () => {
    for (let i = 0; i < 7; i++) h.toast({ message: `#${i}`, duration: 0 })
    expect(toasts()).toHaveLength(h.toast.defaults.max)
    expect(toasts()[0].textContent).toContain("#2")
    const top = h.toast({ message: "üstte", placement: "top-center", duration: 0 })
    expect(top.element.parentElement!.getAttribute("data-placement")).toBe("top-center")
  })

  it("moves into the top modal dialog so it stays interactive", async () => {
    const ref = h.dialogs.open({ heading: "Modal" })
    const t = h.toast({ message: "Dialog içinden", duration: 0 })
    await settle()
    expect(ref.element.querySelector("dialog")!.contains(t.element)).toBe(true)
    await ref.close()
    await settle()
    expect(t.element.parentElement!.parentElement).toBe(document.body)
  })
})

// ---------------------------------------------------------------------------------------

describe("tooltip", () => {
  afterEach(() => {
    vi.useRealTimers()
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }))
    document.body.replaceChildren()
  })
  const bubble = () => document.getElementById("bz-tooltip")
  const over = (el: Element) => el.dispatchEvent(new PointerEvent("pointerover", { bubbles: true, pointerType: "mouse" }))
  const out = (el: Element, to: Element | null = document.body) =>
    el.dispatchEvent(new PointerEvent("pointerout", { bubbles: true, pointerType: "mouse", relatedTarget: to }))

  it("shows data-tooltip after the delay and describes the trigger", () => {
    vi.useFakeTimers()
    document.body.innerHTML = `<button data-tooltip="Kaydet (Ctrl+S)"><span>ikon</span></button>`
    const button = document.querySelector("button")!
    over(button.querySelector("span")!)
    vi.advanceTimersByTime(h.tooltipDefaults.delay - 1)
    expect(h.activeTooltip()).toBeNull()
    vi.advanceTimersByTime(2)
    expect(h.activeTooltip()).toBe(button)
    expect(bubble()!.textContent).toBe("Kaydet (Ctrl+S)")
    expect(bubble()!.getAttribute("role")).toBe("tooltip")
    expect(button.getAttribute("aria-describedby")).toBe("bz-tooltip")

    out(button)
    vi.advanceTimersByTime(h.tooltipDefaults.hideDelay + 1)
    expect(h.activeTooltip()).toBeNull()
    expect(button.hasAttribute("aria-describedby")).toBe(false)
  })

  it("is warm right after another tooltip, and hoverable", () => {
    vi.useFakeTimers()
    document.body.innerHTML = `<button id="a" data-tooltip="A">a</button><button id="b" data-tooltip="B">b</button>`
    const a = document.getElementById("a")!
    const b = document.getElementById("b")!
    over(a)
    vi.advanceTimersByTime(h.tooltipDefaults.delay)
    out(a, bubble())
    vi.advanceTimersByTime(1000)
    expect(h.activeTooltip()).toBe(a) // pointer moved onto the bubble
    over(b)
    expect(h.activeTooltip()).toBe(b) // immediately (warm)
  })

  it("Escape hides it and does not close the dialog around it", async () => {
    const ref = h.dialogs.open({ content: html`<button id="t" data-tooltip="İpucu">x</button>` })
    const t = document.getElementById("t")!
    h.tooltip(t, "İpucu") // programmatic show path: focus
    t.focus()
    t.dispatchEvent(new FocusEvent("focusin", { bubbles: true }))
    expect(h.activeTooltip()).toBe(t)
    key(t, "Escape")
    await settle()
    expect(h.activeTooltip()).toBeNull()
    expect(ref.element.open).toBe(true)
    key(t, "Escape")
    await settle()
    expect(ref.element.open).toBe(false)
  })

  it("programmatic tooltip with rich content and placement; touch is ignored", () => {
    vi.useFakeTimers()
    document.body.innerHTML = `<span id="s">?</span>`
    const s = document.getElementById("s")!
    const remove = h.tooltip(s, html`<b>Zengin</b> içerik`, { placement: "bottom" })
    s.dispatchEvent(new PointerEvent("pointerover", { bubbles: true, pointerType: "touch" }))
    vi.advanceTimersByTime(1000)
    expect(h.activeTooltip()).toBeNull()
    over(s)
    vi.advanceTimersByTime(1000)
    expect(bubble()!.querySelector("b")!.textContent).toBe("Zengin")
    expect(bubble()!.getAttribute("data-placement")).toBe("bottom")
    remove()
    expect(h.activeTooltip()).toBeNull()
  })
})
