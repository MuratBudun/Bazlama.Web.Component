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
  it("Posta: sidebar shell, folder list, reading pane", async () => {
    await mount("mail", "/apps/mail/#/gelen/1")
    const shell = document.querySelector("bz-shell")!
    expect(shell.variant).toBe("sidebar")
    expect(document.title).toBe("Gelen kutusu · Posta")
    expect(document.querySelectorAll(".mail-list bz-option").length).toBeGreaterThan(10)
    expect(document.querySelector(".mail-read h2")!.textContent).toBe("Q3 bütçe taslağı")
    expect(document.querySelector("bz-tree")!.value).toBe("gelen")
  })

})
