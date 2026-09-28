import { afterEach, beforeAll, expect, it, vi } from "vitest"
import { flush, render, root } from "@bazlama/core"

// Smoke test of the QMEX mockup: menu → list → FRM-008 form → edit → guarded close.

beforeAll(async () => {
  const proto = ElementInternals.prototype as unknown as Record<string, unknown>
  proto.setFormValue ??= () => {}
  proto.setValidity ??= () => {}
  Element.prototype.scrollIntoView ??= () => {}
  globalThis.requestAnimationFrame ??= (fn: FrameRequestCallback) => setTimeout(() => fn(0), 0) as unknown as number
  const h = await import("@bazlama/headless")
  h.defineIcons(await import("@bazlama/icons"))
})
let dispose: (() => void) | undefined
afterEach(async () => {
  const h = await import("@bazlama/headless")
  await h.dialogs.closeAll()
  h.toast.dismiss()
  dispose?.()
  document.body.replaceChildren()
  vi.restoreAllMocks()
})
const settle = async () => {
  for (let i = 0; i < 5; i++) {
    await new Promise<void>((r) => setTimeout(r))
    flush()
  }
}

it("opens Doküman No from the menu, then FRM-008 by double click, edits and guards closing", { timeout: 20_000 }, async () => {
  vi.spyOn(console, "warn").mockImplementation(() => {})
  const page = (await import("../playground/src/pages/qmex/index.ts")).default
  const container = document.body.appendChild(document.createElement("div"))
  dispose = root((d) => (render(page.render(), container), d))
  await settle()
  const h = await import("@bazlama/headless")

  // Home: work list
  expect(container.querySelectorAll(".qx-work > li").length).toBe(12)

  // Menu: Taslaklar › Doküman No
  const item = container.querySelector<HTMLElement>('bz-tree [data-id="taslaklar:Doküman No"]')!
  item.click()
  await settle()
  const mdi = container.querySelector<HTMLElement & { value: string }>(".qx-mdi")!
  expect(mdi.value).toBe("taslaklar:Doküman No")
  const rows = container.querySelectorAll(".qx-grid bz-data-grid tbody tr[data-part=row]")
  expect(rows.length).toBe(10)
  expect(rows[2].textContent).toContain("FRM-008")

  // Double click FRM-008
  ;(rows[2] as HTMLElement).click()
  rows[2].dispatchEvent(new MouseEvent("dblclick", { bubbles: true }))
  await settle()
  const inner = container.querySelector<HTMLElement & { value: string }>(".qx-inner-tabs")!
  expect(inner.value).toBe("FRM-008")
  const form = container.querySelector(".qx-form")!
  expect(form.querySelector("h2")!.textContent).toBe("Doküman Formu")
  const value = (label: string) =>
    Array.from(form.querySelectorAll<HTMLElement & { label: string }>("bz-input, bz-lookup"))
      .find((i) => i.label === label)!
      .querySelector<HTMLInputElement>("[data-part=input]")!.value
  expect(value("Doküman Numarası")).toBe("FRM-008")
  expect(value("Dokümanın Adı")).toBe("test deneme - audit gozlem")
  expect(value("Doküman Sahibi Bölüm")).toBe("Kalite Kontrol Müdürlüğü")
  expect(Array.from(form.querySelectorAll("bz-panel")).map((p) => (p as HTMLElement & { heading: string }).heading)).toContain("Elektronik Dağıtım Listesi")

  // Switching the form's and the list's inner tabs keeps the top (MDI) tab.
  const formTabs = form.querySelector<HTMLElement & { value: string }>(".qx-form-tabs")!
  ;(formTabs.querySelector('bz-tab[value="notes"]') as HTMLElement).click()
  await settle()
  expect(formTabs.value).toBe("notes")
  expect(inner.value).toBe("FRM-008")
  expect(mdi.value).toBe("taslaklar:Doküman No")
  ;(inner.querySelector('bz-tab[value="list"]') as HTMLElement).click()
  await settle()
  expect(inner.value).toBe("list")
  expect(mdi.value).toBe("taslaklar:Doküman No")
  // Görüntüle (selected row) reopens the same form tab
  Array.from(container.querySelectorAll<HTMLElement>(".qx-inner-tabs bz-button")).find((b) => b.textContent!.includes("Görüntüle"))!.click()
  await settle()
  expect(inner.value).toBe("FRM-008")
  expect(mdi.value).toBe("taslaklar:Doküman No")
  ;(formTabs.querySelector('bz-tab[value="general"]') as HTMLElement).click()
  await settle()

  // Güncelle → edit, change the name → dirty
  Array.from(form.querySelectorAll<HTMLElement>("bz-button")).find((b) => b.textContent!.includes("Güncelle"))!.click()
  await settle()
  const nameInput = Array.from(form.querySelectorAll<HTMLElement & { label: string }>("bz-input")).find((i) => i.label === "Dokümanın Adı")!.querySelector("input")!
  expect(nameInput.readOnly).toBe(false)
  nameInput.value = "değişti"
  nameInput.dispatchEvent(new Event("input", { bubbles: true }))
  await settle()
  expect(form.querySelector(".qx-dirty")).not.toBeNull()

  // Kapat asks; "Forma dön" keeps it open
  Array.from(form.querySelectorAll<HTMLElement>("bz-button")).find((b) => b.textContent!.includes("Kapat"))!.click()
  await settle()
  expect(h.dialogs.stack().length).toBe(1)
  Array.from(h.dialogs.top!.querySelectorAll<HTMLElement>("bz-button"))[0].click()
  await settle()
  expect(inner.value).toBe("FRM-008")
})
