import { afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest"
import { flush } from "@bazlama/core"
import { createRouter, type Router } from "@bazlama/router"
import { installFakeNavigation } from "./fake-navigation"

// The Page and Router playground pages are layout routes: run them on a real router.

let router: Router
const settle = async (ms = 0) => {
  await new Promise((r) => setTimeout(r, ms))
  for (let i = 0; i < 5; i++) {
    await new Promise<void>((r) => setTimeout(r))
    flush()
  }
}
const demo = () => document.querySelector(".router-demo bz-outlet")!.textContent!.replace(/\s+/g, " ")
const cell = (label: string) =>
  Array.from(document.querySelectorAll(".router-demo tr")).find((tr) => tr.firstElementChild!.textContent === label)!.lastElementChild!.textContent!

beforeAll(async () => {
  const proto = ElementInternals.prototype as unknown as Record<string, unknown>
  proto.setFormValue ??= () => {}
  proto.setValidity ??= () => {}
  Element.prototype.scrollIntoView ??= () => {}
  await import("@bazlama/headless")
})
beforeEach(async () => {
  vi.spyOn(console, "warn").mockImplementation(() => {})
  history.replaceState(null, "", "/page")
  installFakeNavigation()
  const { pageRoute } = await import("../playground/src/pages/page.ts")
  const { routerRoute } = await import("../playground/src/pages/router.ts")
  router = createRouter({ routes: [pageRoute, routerRoute] })
  document.body.innerHTML = `<bz-outlet></bz-outlet>`
  await router.start()
  await settle()
})
afterEach(() => {
  router.stop()
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

it("page: params keep the page, remount re-creates it", async () => {
  expect(document.querySelector("h1")!.textContent).toBe("Page")
  await router.navigate("/page/keep/1?sort=asc")
  await settle()
  expect(cell("ctx.params()")).toBe('{"id":"1"}')
  expect(cell("ctx.query.all()")).toBe('{"sort":"asc"}')
  const keepBefore = Number(cell("setup çalışma sayısı"))
  await router.navigate("/page/keep/2")
  await settle()
  expect(cell("ctx.params()")).toBe('{"id":"2"}')
  expect(Number(cell("setup çalışma sayısı"))).toBe(keepBefore)
  expect(document.title).toBe("Sayfa korunur · 2")

  await router.navigate("/page/remount/1")
  await settle()
  const remountBefore = Number(cell("setup çalışma sayısı"))
  await router.navigate("/page/remount/2")
  await settle()
  expect(Number(cell("setup çalışma sayısı"))).toBe(remountBefore + 1)
})

it("page: load() data, custom element page, onBeforeLeave", async () => {
  await router.navigate("/page/load/3")
  await settle()
  expect(demo()).toContain('"name":"Ürün 3"')
  expect(document.title).toBe("Ürün 3")

  await router.navigate("/page/element/42?tab=kalemler")
  await settle()
  expect(demo()).toContain("Sipariş #42 · sekme: kalemler")

  await router.navigate("/page/guard")
  await settle()
  const input = document.querySelector<HTMLInputElement>(".router-demo bz-input input")!
  input.value = "not"
  input.dispatchEvent(new Event("input", { bubbles: true }))
  flush()
  expect(await router.navigate("/page/keep/1")).toBe(false)
  expect(location.pathname).toBe("/page/guard")
})

it("router page: guard redirect and nested not-found", async () => {
  await router.navigate("/router/admin")
  await settle()
  expect(location.pathname + location.search).toBe("/router/login?next=%2Frouter%2Fadmin")
  await router.navigate("/router/nope")
  await settle()
  expect(demo()).toContain("/router/nope diye bir sayfa yok")
})
