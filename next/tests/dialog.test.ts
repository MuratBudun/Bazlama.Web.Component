import { afterEach, beforeAll, describe, expect, it } from "vitest"
import { flush, html } from "@bazlama/core"

let h: typeof import("@bazlama/headless")

beforeAll(async () => {
  Element.prototype.scrollIntoView ??= () => {}
  h = await import("@bazlama/headless")
})

afterEach(async () => {
  await h.dialogs.closeAll()
  await settle()
  document.body.replaceChildren()
})

const settle = async () => {
  for (let i = 0; i < 4; i++) {
    await new Promise<void>((r) => setTimeout(r))
    flush()
  }
}
const escape = (target: Element = document.activeElement ?? document.body) =>
  target.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }))
const nativeDialog = (el: Element) => el.querySelector("dialog")!
const top = () => h.dialogs.top

describe("<bz-dialog>", () => {
  it("opens with show(), resolves with the close result and fires events", async () => {
    document.body.innerHTML = `<bz-dialog heading="Başlık"><p>Gövde</p><bz-button slot="footer">Tamam</bz-button></bz-dialog>`
    const el = document.querySelector("bz-dialog")!
    const events: string[] = []
    for (const type of ["open", "before-close", "close"]) el.addEventListener(type, () => events.push(type))

    const result = el.show()
    flush()
    expect(el.hasAttribute("open")).toBe(true)
    expect(nativeDialog(el).hasAttribute("open")).toBe(true)
    expect(nativeDialog(el).getAttribute("aria-labelledby")).toBe(el.querySelector("[data-part=title]")!.id)
    expect(el.querySelector("[data-part=body] p")).not.toBeNull()
    expect(el.querySelector("[data-part=footer] bz-button")).not.toBeNull()

    expect(await el.close("ok")).toBe(true)
    expect(await result).toBe("ok")
    flush()
    expect(el.hasAttribute("open")).toBe(false)
    expect(nativeDialog(el).hasAttribute("open")).toBe(false)
    expect(events).toEqual(["open", "before-close", "close"])
  })

  it("opens from the open attribute and closes with the close button", async () => {
    document.body.innerHTML = `<bz-dialog heading="Açık" open></bz-dialog>`
    const el = document.querySelector("bz-dialog")!
    flush()
    expect(h.dialogs.stack()).toEqual([el])
    el.querySelector<HTMLElement>("[data-part=close]")!.click()
    await settle()
    expect(el.open).toBe(false)
    expect(h.dialogs.stack()).toEqual([])
  })

  it("cancelable before-close event keeps it open", async () => {
    document.body.innerHTML = `<bz-dialog heading="X"></bz-dialog>`
    const el = document.querySelector("bz-dialog")!
    el.addEventListener("before-close", (e) => e.preventDefault())
    void el.show()
    expect(await el.close()).toBe(false)
    expect(el.open).toBe(true)
  })

  it("persistent: Escape and backdrop do not close", async () => {
    document.body.innerHTML = `<bz-dialog heading="Kalıcı" persistent></bz-dialog>`
    const el = document.querySelector("bz-dialog")!
    void el.show()
    escape()
    const dialog = nativeDialog(el)
    dialog.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }))
    dialog.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    await settle()
    expect(el.open).toBe(true)
    expect(el.hasAttribute("data-refused")).toBe(true)
  })
})

describe("dialogs manager", () => {
  it("open() renders content, closes with a result and removes the element", async () => {
    const ref = h.dialogs.open<string>({
      heading: "Seç",
      content: (r: import("@bazlama/headless").DialogRef<string>) => html`<button id="pick" @click=${() => r.close("elma")}>Elma</button>`,
    })
    const el = ref.element
    expect(el.isConnected).toBe(true)
    document.getElementById("pick")!.click()
    expect(await ref).toBe("elma")
    await settle()
    expect(el.isConnected).toBe(false)
  })

  it("nested dialogs: Escape closes only the top, focus returns to the opener", async () => {
    const opener = document.body.appendChild(document.createElement("button"))
    opener.focus()
    const outer = h.dialogs.open({
      heading: "Form",
      content: html`<button id="open-inner">Müşteri seç</button>`,
    })
    const openInner = document.getElementById("open-inner")!
    openInner.focus()
    const inner = h.dialogs.open({ heading: "Müşteri seç" })

    expect(h.dialogs.stack()).toEqual([outer.element, inner.element])
    expect(outer.element.getAttribute("data-depth")).toBe("1")
    expect(inner.element.getAttribute("data-depth")).toBe("2")
    expect(outer.element.hasAttribute("data-covered")).toBe(true)
    expect(document.documentElement.style.overflow).toBe("hidden")

    escape(inner.element)
    await settle()
    expect(h.dialogs.stack()).toEqual([outer.element])
    expect(await inner).toBeUndefined()
    expect(outer.element.hasAttribute("data-covered")).toBe(false)
    expect(document.activeElement).toBe(openInner)

    escape()
    await settle()
    expect(h.dialogs.stack()).toEqual([])
    expect(document.activeElement).toBe(opener)
    expect(document.documentElement.style.overflow).toBe("")
  })

  it("an Escape handled inside the dialog (preventDefault) keeps it open", async () => {
    const ref = h.dialogs.open({ content: html`<input id="field" @keydown=${(e: KeyboardEvent) => e.preventDefault()} />` })
    escape(document.getElementById("field")!)
    await settle()
    expect(ref.element.open).toBe(true)
  })

  it("closing a parent closes its children first; a refusing child stops it", async () => {
    let allowChild = false
    const parent = h.dialogs.open({ heading: "Ana" })
    const child = h.dialogs.open({ heading: "Alt", beforeClose: () => allowChild })

    expect(await parent.close()).toBe(false)
    expect(h.dialogs.stack()).toHaveLength(2)

    allowChild = true
    expect(await parent.close("done")).toBe(true)
    expect(await child).toBeUndefined()
    expect(await parent).toBe("done")
    expect(h.dialogs.stack()).toEqual([])
  })

  it("async guard can ask with a nested confirm (unsaved changes)", async () => {
    const form = h.dialogs.open({
      heading: "Düzenle",
      beforeClose: () => h.dialogs.confirm({ message: "Değişiklikler kaybolsun mu?", variant: "danger" }),
    })
    escape()
    await settle()
    // The confirm is on top of the form.
    expect(h.dialogs.stack()).toHaveLength(2)
    const confirmEl = top()!
    expect(confirmEl.getAttribute("role")).toBe("alertdialog")
    const [cancel, ok] = Array.from(confirmEl.querySelectorAll("bz-button"))
    expect(ok.getAttribute("variant")).toBe("danger")

    cancel.click() // keep editing
    await settle()
    expect(h.dialogs.stack()).toEqual([form.element])

    escape()
    await settle()
    Array.from(top()!.querySelectorAll("bz-button"))[1].click() // discard
    await settle()
    expect(h.dialogs.stack()).toEqual([])
  })

  it("confirm resolves false when dismissed, alert resolves on OK", async () => {
    const answer = h.dialogs.confirm("Emin misiniz?")
    escape()
    expect(await answer).toBe(false)

    const done = h.dialogs.alert({ heading: "Bilgi", message: "Kaydedildi", okText: "Tamam" })
    const ok = top()!.querySelector("bz-button")!
    expect(ok.textContent).toBe("Tamam")
    ok.click()
    await expect(done).resolves.toBeUndefined()
  })

  it("focuses [autofocus], passing through wrappers such as <bz-input>", async () => {
    const ref = h.dialogs.open({ content: html`<button>ilk</button><bz-input label="Ad" autofocus></bz-input>` })
    expect(document.activeElement).toBe(ref.element.querySelector("bz-input input"))
    const plain = h.dialogs.open({ content: html`<p>metin</p><button id="first">ilk</button>` })
    expect(document.activeElement).toBe(document.getElementById("first"))
    void plain
  })

  it("dialog page: nested order scenario works end to end", async () => {
    const page = (await import("../playground/src/pages/dialog.ts")).default
    const { render, root } = await import("@bazlama/core")
    const container = document.body.appendChild(document.createElement("div"))
    const dispose = root((d) => {
      render(page.render(), container)
      return d
    })
    await settle()
    const start = Array.from(container.querySelectorAll("bz-button")).find((b) => b.textContent!.includes("Yeni sipariş"))!
    start.click()
    await settle()
    expect(h.dialogs.stack()).toHaveLength(1)
    Array.from(top()!.querySelectorAll("bz-button")).find((b) => b.textContent!.includes("Müşteri seç"))!.click()
    await settle()
    expect(h.dialogs.stack()).toHaveLength(2)
    top()!.querySelector<HTMLElement>("bz-table tbody tr")!.click() // pick first customer
    await settle()
    expect(h.dialogs.stack()).toHaveLength(1)
    expect(top()!.querySelector(".picker-field strong")!.textContent).not.toBe("Seçilmedi")
    // dirty form: Escape asks
    escape()
    await settle()
    expect(h.dialogs.stack()).toHaveLength(2)
    Array.from(top()!.querySelectorAll("bz-button"))[0].click() // keep editing
    await settle()
    expect(h.dialogs.stack()).toHaveLength(1)
    dispose()
  })

  it("closeAll closes the whole stack", async () => {
    h.dialogs.open({ heading: "1" })
    h.dialogs.open({ heading: "2" })
    h.dialogs.open({ heading: "3" })
    expect(await h.dialogs.closeAll()).toBe(true)
    expect(h.dialogs.stack()).toEqual([])
  })

  it("removing an open declarative dialog takes it off the stack", async () => {
    document.body.innerHTML = `<bz-dialog heading="X"></bz-dialog>`
    const el = document.querySelector("bz-dialog")!
    void el.show()
    el.remove()
    await settle()
    expect(h.dialogs.stack()).toEqual([])
  })
})
