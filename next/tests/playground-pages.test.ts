import { afterEach, beforeAll, expect, it, vi } from "vitest"
import { flush, render, root } from "@bazlama/core"

// Smoke test for the component pages that are not covered by docs.test.ts.

beforeAll(async () => {
  const proto = ElementInternals.prototype as unknown as Record<string, unknown>
  proto.setFormValue ??= () => {}
  proto.setValidity ??= () => {}
  Element.prototype.scrollIntoView ??= () => {}
  const { defineIcons } = await import("@bazlama/headless")
  defineIcons(await import("@bazlama/icons"))
})

let dispose: (() => void) | undefined
afterEach(() => {
  dispose?.()
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

const mount = async (id: string) => {
  const errors: unknown[] = []
  vi.spyOn(console, "error").mockImplementation((...args) => errors.push(args))
  vi.spyOn(console, "warn").mockImplementation((...args) => errors.push(args))
  const page = (await import(`../playground/src/pages/${id}.ts`)).default
  const container = document.body.appendChild(document.createElement("div"))
  dispose = root((d) => {
    render(page.render(), container)
    return d
  })
  for (let i = 0; i < 3; i++) {
    await new Promise<void>((r) => setTimeout(r))
    flush()
  }
  return { container, errors }
}

it("icon page renders the full gallery without missing icons", async () => {
  const { container, errors } = await mount("icon")
  const icons = await import("@bazlama/icons")
  const exported = Object.keys(icons).length
  expect(container.querySelectorAll(".icon-tile")).toHaveLength(exported)
  expect(errors).toEqual([])
})

it("tree page renders every demo tree", async () => {
  const { container, errors } = await mount("tree")
  const trees = Array.from(container.querySelectorAll("section.demo:not(.usage) bz-tree"))
  expect(trees).toHaveLength(5)
  for (const tree of trees) expect(tree.querySelectorAll("[role=treeitem]").length).toBeGreaterThan(0)
  // menu: "Satış" expanded and "Siparişler" selected
  expect(trees[0].querySelector('[data-id="orders"]')!.getAttribute("aria-selected")).toBe("true")
  // permissions: two leaves checked → parents mixed
  expect(trees[2].querySelector('[data-id="p-sales"]')!.getAttribute("aria-checked")).toBe("mixed")
  expect(errors).toEqual([])
})
