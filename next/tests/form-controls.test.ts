import { afterEach, beforeAll, describe, expect, it } from "vitest"
import { flush } from "@bazlama/core"

// jsdom has attachInternals() but no form APIs (bz-lookup's form value is checked in Chrome).
beforeAll(async () => {
  const proto = ElementInternals.prototype as unknown as Record<string, unknown>
  proto.setFormValue ??= () => {}
  proto.setValidity ??= () => {}
  Element.prototype.scrollIntoView ??= () => {}
  const h = await import("@bazlama/headless")
  h.defineIcons(await import("@bazlama/icons"))
})
afterEach(() => document.body.replaceChildren())
const key = (el: Element, k: string, init: KeyboardEventInit = {}) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }))
const tick = () => new Promise((r) => setTimeout(r, 0))

describe("bz-checkbox / bz-switch", () => {
  it("wraps a native checkbox: name/value in the form, change with detail, indeterminate, reset", async () => {
    document.body.innerHTML = `<form>
      <bz-checkbox name="agree" value="yes" checked indeterminate>Kabul</bz-checkbox>
      <bz-switch name="notify" label="Bildirim"></bz-switch>
    </form>`
    flush()
    const form = document.querySelector("form")!
    const cb = document.querySelector("bz-checkbox")!
    const sw = document.querySelector("bz-switch")!
    const cbInput = cb.querySelector("input")!
    expect(cbInput.checked).toBe(true)
    expect(cbInput.indeterminate).toBe(true)
    expect(cb.querySelector("[data-part=label]")!.textContent).toBe("Kabul")
    expect(sw.querySelector("input")!.getAttribute("role")).toBe("switch")
    expect(sw.querySelector("[data-part=label]")!.textContent).toBe("Bildirim")
    expect([...new FormData(form)]).toEqual([["agree", "yes"]])

    const events: unknown[] = []
    form.addEventListener("change", (e) => events.push((e as CustomEvent).detail))
    cbInput.click()
    flush()
    expect(cb.checked).toBe(false)
    expect(cb.indeterminate).toBe(false)
    expect(cb.hasAttribute("data-checked")).toBe(false)
    sw.querySelector("input")!.click()
    flush()
    expect(sw.checked).toBe(true)
    expect(events).toEqual([{ checked: false, value: "yes" }, { checked: true, value: "on" }])
    expect([...new FormData(form)]).toEqual([["notify", "on"]])

    form.reset()
    await tick()
    flush()
    expect(cb.checked).toBe(true)
    expect(sw.checked).toBe(false)
  })

  it("readonly keeps the state; required shows the error after an attempt", async () => {
    document.body.innerHTML = `<form><bz-checkbox readonly checked>Kilitli</bz-checkbox><bz-checkbox required error="">Şart</bz-checkbox></form>`
    flush()
    const [ro, req] = document.querySelectorAll("bz-checkbox")
    ro.querySelector("input")!.click()
    flush()
    expect(ro.checked).toBe(true)
    await tick()
    const form = document.querySelector("form")!
    expect(form.checkValidity()).toBe(false)
    flush()
    expect(req.hasAttribute("data-invalid")).toBe(true)
    expect(req.querySelector<HTMLElement>("[data-part=error]")!.hidden).toBe(false)
  })
})

describe("bz-radio-group", () => {
  it("shares a name, reflects value, emits change { value }, submits and resets", async () => {
    document.body.innerHTML = `<form><bz-radio-group name="kind" label="Tür" value="form">
      <bz-radio value="form">Form</bz-radio>
      <bz-radio value="proc" label="Prosedür"></bz-radio>
      <bz-radio value="inst" disabled>Talimat</bz-radio>
    </bz-radio-group></form>`
    flush()
    await tick()
    const group = document.querySelector("bz-radio-group")!
    const inputs = [...group.querySelectorAll("input")]
    expect(group.getAttribute("role")).toBe("radiogroup")
    expect(group.getAttribute("aria-labelledby")).toBe(group.querySelector("[data-part=label]")!.id)
    expect(inputs.map((i) => i.name)).toEqual(["kind", "kind", "kind"])
    expect(inputs.map((i) => i.checked)).toEqual([true, false, false])
    expect(inputs[2].disabled).toBe(true)
    expect(group.querySelectorAll("[data-part=label]")[2].textContent).toBe("Prosedür")

    const events: unknown[] = []
    group.addEventListener("change", (e) => events.push((e as CustomEvent).detail))
    inputs[1].click()
    flush()
    expect(group.value).toBe("proc")
    expect(events).toEqual([{ value: "proc" }])
    expect([...new FormData(document.querySelector("form")!)]).toEqual([["kind", "proc"]])

    group.value = "form"
    flush()
    expect(inputs[0].checked).toBe(true)
    group.disabled = true
    flush()
    expect(inputs.every((i) => i.disabled)).toBe(true)

    group.disabled = false
    group.value = "proc"
    flush()
    document.querySelector("form")!.reset()
    await tick()
    flush()
    expect(group.value).toBe("form")
  })

  it("required: invalid until a choice", async () => {
    document.body.innerHTML = `<form><bz-radio-group required><bz-radio value="a">A</bz-radio><bz-radio value="b">B</bz-radio></bz-radio-group></form>`
    flush()
    await tick()
    const group = document.querySelector("bz-radio-group")!
    expect(document.querySelector("form")!.checkValidity()).toBe(false)
    await tick()
    flush()
    expect(group.hasAttribute("data-invalid")).toBe(true)
    expect(group.getAttribute("aria-required")).toBe("true")
    group.querySelectorAll("input")[0].click()
    flush()
    expect(document.querySelector("form")!.checkValidity()).toBe(true)
  })
})

describe("bz-textarea", () => {
  it("native textarea with name, count, rows var, validation", async () => {
    document.body.innerHTML = `<form><bz-textarea name="note" label="Not" rows="4" maxlength="20" show-count required></bz-textarea></form>`
    flush()
    const t = document.querySelector("bz-textarea")!
    const area = t.querySelector("textarea")!
    expect(area.name).toBe("note")
    expect(area.rows).toBe(4)
    expect(t.style.getPropertyValue("--bz-textarea-rows")).toBe("4")
    expect(t.querySelector("[data-part=count]")!.textContent).toBe("0 / 20")
    area.value = "Merhaba"
    area.dispatchEvent(new Event("input", { bubbles: true }))
    flush()
    expect(t.value).toBe("Merhaba")
    expect(t.querySelector("[data-part=count]")!.textContent).toBe("7 / 20")
    expect([...new FormData(document.querySelector("form")!)]).toEqual([["note", "Merhaba"]])
    expect(t.querySelector<HTMLElement>("[data-part=expand]")!.hidden).toBe(true)
  })

  it("expandable: opens a dialog editor, Apply writes back and fires input/change", async () => {
    document.body.innerHTML = `<bz-textarea label="Açıklama" expandable value="ilk"></bz-textarea>`
    flush()
    const t = document.querySelector("bz-textarea")!
    const area = t.querySelector("textarea")!
    const events: string[] = []
    t.addEventListener("input", () => events.push("input"))
    t.addEventListener("change", () => events.push("change"))
    const expand = t.querySelector<HTMLButtonElement>("[data-part=expand]")!
    expect(expand.hidden).toBe(false)
    expand.click()
    await tick()
    flush()
    const dialog = document.querySelector("bz-dialog[data-textarea-editor]")!
    expect(dialog).toBeTruthy()
    expect(dialog.getAttribute("heading") ?? (dialog as unknown as { heading: string }).heading).toBe("Açıklama")
    const editor = dialog.querySelector<HTMLTextAreaElement>("[data-part=editor]")!
    expect(editor.value).toBe("ilk")
    editor.value = "uzun metin"
    editor.dispatchEvent(new Event("input", { bubbles: true }))
    key(editor, "Enter", { ctrlKey: true })
    await tick()
    await tick()
    flush()
    expect(t.value).toBe("uzun metin")
    expect(area.value).toBe("uzun metin")
    expect(events).toEqual(["input", "change"])
  })
})

describe("bz-pagination", () => {
  it("pageItems windows with gaps", async () => {
    const { pageItems } = await import("@bazlama/headless")
    expect(pageItems(1, 5)).toEqual([1, 2, 3, 4, 5])
    expect(pageItems(1, 20)).toEqual([1, 2, 3, 4, 5, "gap", 20])
    expect(pageItems(10, 20)).toEqual([1, "gap", 9, 10, 11, "gap", 20])
    expect(pageItems(20, 20)).toEqual([1, "gap", 16, 17, 18, 19, 20])
  })

  it("numbers: buttons, aria-current, change { page, pageSize }, clamp", async () => {
    document.body.innerHTML = `<bz-pagination total="195" page-size="10" page="10" show-info></bz-pagination>`
    flush()
    const p = document.querySelector("bz-pagination")!
    expect(p.getAttribute("role")).toBe("navigation")
    const visible = () => [...p.querySelectorAll<HTMLElement>("[data-part=page], [data-part=gap]")].filter((e) => !e.hidden).map((e) => e.textContent)
    expect(visible()).toEqual(["1", "…", "9", "10", "11", "…", "20"])
    expect(p.querySelector("[aria-current=page]")!.textContent).toBe("10")
    expect(p.querySelector("[data-part=info]")!.textContent).toBe("91–100 of 195")
    const events: unknown[] = []
    p.addEventListener("change", (e) => events.push((e as CustomEvent).detail))
    p.querySelector<HTMLButtonElement>("[data-part=next]")!.click()
    flush()
    expect(p.page).toBe(11)
    ;[...p.querySelectorAll<HTMLButtonElement>("[data-part=page]")].find((b) => b.textContent === "20")!.click()
    flush()
    expect(p.querySelector<HTMLButtonElement>("[data-part=next]")!.disabled).toBe(true)
    expect(events).toEqual([{ page: 11, pageSize: 10 }, { page: 20, pageSize: 10 }])
    p.total = 25
    flush()
    await tick()
    flush()
    expect(p.page).toBe(3)
    expect(events.at(-1)).toEqual({ page: 3, pageSize: 10 })
  })

  it("compact: page input and page sizes keep the first row", () => {
    document.body.innerHTML = `<bz-pagination variant="compact" total="95" page="3"></bz-pagination>`
    flush()
    const p = document.querySelector("bz-pagination")!
    p.pageSizes = [10, 25]
    p.labels = { of: (n: number) => `/ ${n}` }
    flush()
    const input = p.querySelector<HTMLInputElement>("[data-part=page-input]")!
    expect(input.value).toBe("3")
    expect(p.querySelector("[data-part=of]")!.textContent).toBe("/ 10")
    input.value = "99"
    input.dispatchEvent(new Event("change", { bubbles: true }))
    flush()
    expect(p.page).toBe(10)
    expect(input.value).toBe("10")
    key(input, "ArrowDown")
    flush()
    expect(p.page).toBe(9)
    const select = p.querySelector("select")!
    select.value = "25"
    select.dispatchEvent(new Event("change", { bubbles: true }))
    flush()
    // First row of page 9 at size 10 is row 81 → page 4 at size 25.
    expect([p.page, p.pageSize]).toEqual([4, 25])
  })
})

describe("bz-toolbar", () => {
  it("one tab stop, arrows move and wrap, skips disabled, text fields keep arrows", async () => {
    document.body.innerHTML = `<bz-toolbar label="Araçlar">
      <bz-button id="a">A</bz-button>
      <bz-button id="b" disabled>B</bz-button>
      <bz-toolbar-separator></bz-toolbar-separator>
      <button id="c">C</button>
      <bz-toolbar-spacer></bz-toolbar-spacer>
      <input id="d" />
    </bz-toolbar>`
    flush()
    await tick()
    const tb = document.querySelector("bz-toolbar")!
    const $ = (id: string) => document.getElementById(id)!
    expect(tb.getAttribute("role")).toBe("toolbar")
    expect(tb.getAttribute("aria-label")).toBe("Araçlar")
    expect(document.querySelector("bz-toolbar-separator")!.getAttribute("aria-orientation")).toBe("vertical")
    expect([$("a").tabIndex, $("c").tabIndex, $("d").tabIndex]).toEqual([0, -1, -1])
    $("a").focus()
    key($("a"), "ArrowRight")
    expect(document.activeElement).toBe($("c"))
    expect([$("a").tabIndex, $("c").tabIndex]).toEqual([-1, 0])
    key($("c"), "ArrowRight")
    expect(document.activeElement).toBe($("d"))
    key($("d"), "ArrowRight")
    expect(document.activeElement).toBe($("d"))
    key($("c"), "End")
    expect(document.activeElement).toBe($("d"))
    key($("d"), "ArrowLeft")
    expect(document.activeElement).toBe($("d"))
    $("c").focus()
    key($("c"), "Home")
    expect(document.activeElement).toBe($("a"))
    key($("a"), "ArrowLeft")
    expect(document.activeElement).toBe($("d"))

    // Re-enabled button resets its own tabIndex; the toolbar takes it back.
    ;($("b") as HTMLElement & { disabled: boolean }).disabled = false
    flush()
    await tick()
    await tick()
    expect($("b").tabIndex).toBe(-1)
  })
})

describe("bz-lookup", () => {
  const ITEMS = [
    { id: "gm", label: "Genel Müdürlük", children: [{ id: "kk", label: "Kalite Kontrol" }, { id: "ur", label: "Üretim" }] },
  ]

  it("shows text from items, required error after blur, clearable", async () => {
    document.body.innerHTML = `<bz-lookup name="dept" label="Bölüm" required clearable></bz-lookup>`
    flush()
    const l = document.querySelector("bz-lookup")!
    l.items = ITEMS
    flush()
    const input = l.querySelector("input")!
    input.dispatchEvent(new FocusEvent("blur"))
    flush()
    expect(l.hasAttribute("data-invalid")).toBe(true)
    expect(input.getAttribute("aria-required")).toBe("true")
    l.value = "kk"
    flush()
    expect(input.value).toBe("Kalite Kontrol")
    expect(l.hasAttribute("data-invalid")).toBe(false)
    const events: unknown[] = []
    l.addEventListener("change", (e) => events.push((e as CustomEvent).detail))
    key(l.querySelector("input")!, "Delete")
    flush()
    expect(l.value).toBe("")
    expect(events).toEqual([{ value: "", text: "", item: undefined }])
  })

  it("tree picker: Enter opens, activate picks", async () => {
    document.body.innerHTML = `<bz-lookup label="Bölüm"></bz-lookup>`
    flush()
    const l = document.querySelector("bz-lookup")!
    l.items = ITEMS
    flush()
    const events: unknown[] = []
    l.addEventListener("change", (e) => events.push((e as CustomEvent).detail))
    key(l.querySelector("input")!, "Enter")
    await tick()
    flush()
    const dialog = document.querySelector("bz-dialog[data-lookup-picker=tree]")!
    const tree = dialog.querySelector("bz-tree")!
    tree.dispatchEvent(new CustomEvent("activate", { detail: { item: ITEMS[0].children[1] } }))
    await tick()
    await tick()
    flush()
    expect(l.value).toBe("ur")
    expect(l.querySelector("input")!.value).toBe("Üretim")
    expect(events).toEqual([{ value: "ur", text: "Üretim", item: ITEMS[0].children[1] }])
  })

  it("table picker filters rows; custom pick wins", async () => {
    document.body.innerHTML = `<bz-lookup label="Doküman"></bz-lookup>`
    flush()
    const l = document.querySelector("bz-lookup")!
    l.columns = [{ key: "no", header: "No" }, { key: "name", header: "Ad" }]
    l.rows = [{ id: 1, no: "FRM-008", name: "Doküman Formu" }, { id: 2, no: "PRS-001", name: "Prosedür" }]
    l.displayKey = "name"
    flush()
    l.querySelector<HTMLButtonElement>("[data-part=trigger]")!.click()
    await tick()
    flush()
    const dialog = document.querySelector("bz-dialog[data-lookup-picker=table]")!
    const search = dialog.querySelector<HTMLInputElement>("[data-part=search]")!
    search.value = "prs"
    search.dispatchEvent(new Event("input", { bubbles: true }))
    flush()
    expect(dialog.querySelectorAll("tbody tr").length).toBe(1)
    key(search, "Enter")
    await tick()
    await tick()
    flush()
    expect([l.value, l.querySelector("input")!.value]).toEqual(["2", "Prosedür"])

    l.pick = async () => ({ value: "x", text: "Özel" })
    l.querySelector<HTMLButtonElement>("[data-part=trigger]")!.click()
    await tick()
    flush()
    expect([l.value, l.text]).toEqual(["x", "Özel"])
  })
})

describe("bz-form-layout", () => {
  it("sets column vars, clamps spans to the column count, section is a named group", async () => {
    document.body.innerHTML = `<bz-form-layout columns="3" label-position="start">
      <bz-input label="A"></bz-input>
      <bz-input label="B" data-span="2"></bz-input>
      <bz-form-section heading="Ek bilgiler" description="İsteğe bağlı">
        <bz-input label="C" data-span="full"></bz-input>
      </bz-form-section>
      <bz-form-actions><bz-button>Kaydet</bz-button></bz-form-actions>
    </bz-form-layout>`
    flush()
    await tick()
    const f = document.querySelector("bz-form-layout")!
    expect(f.style.getPropertyValue("--bz-form-columns")).toBe("3")
    expect(f.getAttribute("data-columns")).toBe("3")
    expect(f.getAttribute("label-position")).toBe("start")
    const [, b] = f.querySelectorAll<HTMLElement>("bz-input")
    expect(b.style.gridColumn).toBe("span 2")
    expect(f.querySelector<HTMLElement>("[data-span=full]")!.style.gridColumn).toBe("1 / -1")
    const section = f.querySelector("bz-form-section")!
    expect(section.getAttribute("role")).toBe("group")
    expect(document.getElementById(section.getAttribute("aria-labelledby")!)!.textContent).toBe("Ek bilgiler")
    expect(document.getElementById(section.getAttribute("aria-describedby")!)!.textContent).toBe("İsteğe bağlı")
    expect(document.querySelector("bz-form-actions")!.getAttribute("align")).toBe("end")
    f.columns = 1
    flush()
    await tick()
    expect(b.style.gridColumn).toBe("1 / -1")
  })
})
