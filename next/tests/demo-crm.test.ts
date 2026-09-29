import { afterEach, beforeAll, describe, expect, it } from "vitest"
import { flush } from "@bazlama/core"
import { installFakeNavigation } from "./fake-navigation"

// Smoke test of a demo app (playground/apps/*). One app per file: each file gets its own
// module registry and custom element registry.

beforeAll(() => {
  const proto = ElementInternals.prototype as unknown as Record<string, unknown>
  proto.setFormValue ??= () => {}
  proto.setValidity ??= () => {}
  Element.prototype.scrollIntoView ??= () => {}
  globalThis.requestAnimationFrame ??= (fn: FrameRequestCallback) => setTimeout(() => fn(0), 0) as unknown as number
})
afterEach(() => {
  document.body.replaceChildren()
  localStorage.clear()
})
const settle = async () => {
  for (let i = 0; i < 8; i++) {
    await new Promise((r) => setTimeout(r, 0))
    flush()
  }
}
async function mount(app: string, url: string) {
  history.replaceState(null, "", url)
  const nav = installFakeNavigation()
  document.body.innerHTML = `<div id="app"></div>`
  await import(`../playground/apps/${app}/main.ts`)
  await settle()
  return nav
}

describe("demo app", { timeout: 20_000 }, () => {
  it("Ada CRM: classic shell, dashboard, customers grid, customer form", async () => {
    const nav = await mount("crm", "/apps/crm/#/pano")
    const shell = document.querySelector("bz-shell")!
    expect(shell.getAttribute("scroll-mode")).toBe("content")
    expect(shell.resizable).toBe(true)
    expect(shell.persist).toBe("ada-crm")
    expect(document.title).toBe("Gösterge paneli · Ada CRM")
    expect(document.querySelectorAll(".card.crm-stat").length).toBe(5)
    expect(document.querySelector("bz-accordion")).not.toBeNull()

    await nav.navigate("/apps/crm/#/musteriler").finished.catch(() => {})
    await settle()
    expect(document.title).toBe("Müşteriler · Ada CRM")
    const grid = document.querySelector("bz-data-grid")!
    expect(grid.hasAttribute("data-shell-fill")).toBe(true)
    expect(grid.persist).toBe("ada-crm-customers")
    expect(grid.querySelectorAll("tbody tr[data-part=row]").length).toBeGreaterThan(5)

    await nav.navigate("/apps/crm/#/musteriler/5").finished.catch(() => {})
    await settle()
    expect(document.querySelector("bz-tabs")).not.toBeNull()
    const labels = [...document.querySelectorAll("bz-form-layout :is(bz-input, bz-lookup, bz-combobox, bz-radio-group, bz-textarea)")].map((e) => (e as HTMLElement & { label: string }).label)
    expect(labels).toEqual(expect.arrayContaining(["Firma adı", "Sektör", "Şehir", "Segment", "Yetkili", "E-posta", "Açıklama"]))
    expect(document.querySelector("bz-tree")!.value).toBe("/musteriler")
    const company = document.querySelector(".crm-customer-head h1")!.textContent

    // Another customer on the same route: a new form (remount), not the previous one.
    await nav.navigate("/apps/crm/#/musteriler/6").finished.catch(() => {})
    await settle()
    expect(document.querySelector(".crm-customer-head h1")!.textContent).not.toBe(company)
  })

})
