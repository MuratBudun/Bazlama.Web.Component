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
  it("Rehber: page scroll mode, article with tabs and feedback", async () => {
    const nav = await mount("docs", "/apps/docs/#/makale/router")
    const shell = document.querySelector("bz-shell")!
    expect(shell.scrollMode).toBe("page")
    expect(document.documentElement.dataset.theme).toBe("forest")
    expect(document.querySelector(".docs-article h1")!.textContent).toBe("Router: sayfalar ve gezinme")
    expect(document.querySelectorAll(".docs-article-body section").length).toBe(4)
    expect(document.querySelector(".docs-code")).not.toBeNull()
    expect(document.querySelector(".docs-feedback bz-radio-group")).not.toBeNull()

    // Another article on the same route: the page is rebuilt for it (remount).
    await nav.navigate("/apps/docs/#/makale/persist").finished.catch(() => {})
    await settle()
    expect(document.querySelector(".docs-article h1")!.textContent).toBe("Kullanıcı düzenini saklama")
    expect(document.title).toBe("Kullanıcı düzenini saklama · Bazlama Rehberi")
  })

})
