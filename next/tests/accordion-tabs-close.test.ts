import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { flush, html, render, repeat, root, signal } from "@bazlama/core"

beforeAll(async () => {
  Element.prototype.scrollIntoView ??= () => {}
  await import("@bazlama/headless")
})
afterEach(() => {
  document.body.replaceChildren()
})
const settle = async () => {
  for (let i = 0; i < 4; i++) {
    await new Promise<void>((r) => setTimeout(r))
    flush()
  }
}
const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }))

// ---------------------------------------------------------------------------------------

describe("bz-accordion", () => {
  const mount = (attrs = "") => {
    document.body.innerHTML = `
      <bz-accordion ${attrs}>
        <bz-accordion-item value="a" heading="Birinci" open>A içerik</bz-accordion-item>
        <bz-accordion-item value="b" heading="İkinci">B içerik</bz-accordion-item>
        <bz-accordion-item value="c" heading="Üçüncü" disabled>C içerik</bz-accordion-item>
      </bz-accordion>`
    flush()
    const acc = document.querySelector("bz-accordion")!
    const item = (v: string) => acc.querySelector<HTMLElement & { open: boolean }>(`bz-accordion-item[value="${v}"]`)!
    const trigger = (v: string) => item(v).querySelector<HTMLElement>("[data-part=trigger]")!
    const content = (v: string) => item(v).querySelector<HTMLElement>("[data-part=content]")!
    return { acc, item, trigger, content }
  }

  it("wires ARIA and takes the initial value from open items", () => {
    const { acc, trigger, content } = mount()
    expect(acc.value).toBe("a")
    expect(trigger("a").getAttribute("aria-expanded")).toBe("true")
    expect(trigger("a").getAttribute("aria-controls")).toBe(content("a").id)
    expect(content("a").getAttribute("role")).toBe("region")
    expect(content("a").getAttribute("aria-labelledby")).toBe(trigger("a").id)
    expect(content("a").hidden).toBe(false)
    expect(content("b").hasAttribute("hidden")).toBe(true)
    expect(trigger("a").closest("[role=heading]")!.getAttribute("aria-level")).toBe("3")
  })

  it("single mode opens one at a time and fires change (not bubbling)", () => {
    const { acc, item, trigger } = mount()
    const changes: unknown[] = []
    acc.addEventListener("change", (e) => changes.push((e as CustomEvent).detail))
    const bubbled = vi.fn()
    document.body.addEventListener("change", bubbled)
    trigger("b").click()
    flush()
    expect(item("a").open).toBe(false)
    expect(item("b").open).toBe(true)
    expect(changes).toEqual([{ value: "b", open: ["b"] }])
    expect(bubbled).not.toHaveBeenCalled()
    trigger("b").click() // close it: nothing open
    flush()
    expect(acc.value).toBe("")
    trigger("c").click() // disabled
    flush()
    expect(item("c").open).toBe(false)
  })

  it("always-open keeps one item open; multiple opens independently", () => {
    const one = mount("always-open")
    one.trigger("a").click()
    flush()
    expect(one.item("a").open).toBe(true)

    const many = mount("multiple")
    many.trigger("b").click()
    flush()
    expect(many.acc.value).toBe("a,b")
    expect(many.item("a").open && many.item("b").open).toBe(true)
    many.trigger("a").click()
    flush()
    expect(many.acc.value).toBe("b")
  })

  it("keyboard moves between headers; value from outside opens items", () => {
    const { acc, item, trigger } = mount()
    trigger("a").focus()
    key(trigger("a"), "ArrowDown")
    expect(document.activeElement).toBe(trigger("b"))
    key(trigger("b"), "End")
    expect(document.activeElement).toBe(trigger("c"))
    key(trigger("c"), "ArrowDown")
    expect(document.activeElement).toBe(trigger("a"))
    acc.value = "b"
    flush()
    expect(item("b").open).toBe(true)
    expect(item("a").open).toBe(false)
  })

  it("find-in-page (beforematch) opens the item; standalone items toggle themselves", () => {
    const { item, content } = mount()
    content("b").dispatchEvent(new Event("beforematch"))
    flush()
    expect(item("b").open).toBe(true)

    document.body.innerHTML = `<bz-accordion-item heading="Tek">x</bz-accordion-item>`
    flush()
    const solo = document.querySelector<HTMLElement & { open: boolean }>("bz-accordion-item")!
    solo.querySelector<HTMLElement>("[data-part=trigger]")!.click()
    flush()
    expect(solo.open).toBe(true)
  })
})

// ---------------------------------------------------------------------------------------

describe("closable tabs", () => {
  function mountRepeat() {
    const docs = signal(["a", "b", "c"])
    const value = signal("b")
    const container = document.body.appendChild(document.createElement("div"))
    const closed: string[] = []
    const dispose = root((d) => {
      render(
        html`<bz-tabs .value=${value} @change.self=${(e: CustomEvent<{ value: string }>) => value.set(e.detail.value)}
          @close=${(e: CustomEvent<{ value: string }>) => {
            closed.push(e.detail.value)
            docs.update((l) => l.filter((d) => d !== e.detail.value))
          }}>
          <bz-tab-list>${repeat(docs, (d) => d, (d) => html`<bz-tab value=${d} closable>${d.toUpperCase()}</bz-tab>`)}</bz-tab-list>
          ${repeat(docs, (d) => d, (d) => html`<bz-tab-panel value=${d}>${d} panel</bz-tab-panel>`)}
        </bz-tabs>`,
        container
      )
      return d
    })
    flush()
    const tabs = container.querySelector("bz-tabs")!
    const tab = (v: string) => tabs.querySelector<HTMLElement>(`bz-tab[value="${v}"]`)
    return { tabs, tab, docs, value, closed, dispose }
  }

  it("closable tabs get a close mark and Delete shortcut", () => {
    const { tab } = mountRepeat()
    expect(tab("a")!.querySelector("[data-part=close]")).not.toBeNull()
    expect(tab("a")!.getAttribute("aria-keyshortcuts")).toBe("Delete")
  })

  it("closing the selected tab selects the next one; the app removes it on close", async () => {
    const { tab, closed, value } = mountRepeat()
    tab("b")!.querySelector<HTMLElement>("[data-part=close]")!.click()
    await settle()
    expect(closed).toEqual(["b"])
    expect(value()).toBe("c")
    expect(tab("b")).toBeNull()
    expect(tab("c")!.getAttribute("aria-selected")).toBe("true")
    // The last one closes to the previous.
    tab("c")!.focus()
    key(tab("c")!, "Delete")
    await settle()
    expect(value()).toBe("a")
    expect(document.activeElement).toBe(tab("a"))
  })

  it("before-close can cancel; beforeClose may be async (unsaved form)", async () => {
    const { tabs, tab, closed } = mountRepeat()
    tabs.addEventListener("before-close", (e) => {
      if ((e as CustomEvent).detail.value === "a") e.preventDefault()
    })
    let answer: (ok: boolean) => void = () => {}
    tabs.beforeClose = (value) => (value === "c" ? new Promise<boolean>((r) => (answer = r)) : true)

    expect(await tabs.close("a")).toBe(false)
    const pending = tabs.close("c")
    await settle()
    expect(tab("c")).not.toBeNull() // still asking
    answer(false)
    expect(await pending).toBe(false)
    const again = tabs.close("c")
    await settle()
    answer(true)
    expect(await again).toBe(true)
    await settle()
    expect(closed).toEqual(["c"])
  })

  it("middle click closes; remove-on-close removes tab and panel", async () => {
    document.body.innerHTML = `
      <bz-tabs remove-on-close>
        <bz-tab-list><bz-tab value="x" closable>X</bz-tab><bz-tab value="y" closable>Y</bz-tab></bz-tab-list>
        <bz-tab-panel value="x">X</bz-tab-panel><bz-tab-panel value="y">Y</bz-tab-panel>
      </bz-tabs>`
    flush()
    const tabs = document.querySelector("bz-tabs")!
    tabs.querySelector('bz-tab[value="x"]')!.dispatchEvent(new MouseEvent("auxclick", { bubbles: true, cancelable: true, button: 1 }))
    await settle()
    expect(tabs.querySelector('[value="x"]')).toBeNull()
    expect(tabs.value).toBe("y")
  })

  it("tab list keeps its scroll buttons at both ends", async () => {
    const { tabs, docs } = mountRepeat()
    const list = tabs.querySelector("bz-tab-list")!
    expect(list.firstElementChild!.getAttribute("data-part")).toBe("scroll-prev")
    expect(list.lastElementChild!.getAttribute("data-part")).toBe("scroll-next")
    docs.update((l) => [...l, "d", "e"])
    await settle()
    expect(list.lastElementChild!.getAttribute("data-part")).toBe("scroll-next")
    expect(list.querySelectorAll("bz-tab")).toHaveLength(5)
    // No layout in jsdom: nothing overflows, both buttons hidden.
    expect((list.firstElementChild as HTMLElement).hidden).toBe(true)
  })
})
