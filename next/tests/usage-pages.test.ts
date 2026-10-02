import { afterEach, beforeAll, expect, it, vi } from "vitest"
import { flush, render, root } from "@bazlama/core"

// Every component page has a "Kullanım" section whose preview renders and whose JS example runs.

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

const settle = async () => {
  for (let i = 0; i < 3; i++) {
    await new Promise<void>((r) => setTimeout(r))
    flush()
  }
}

it.each(["button", "input", "password", "file-upload", "login", "panel", "list", "combobox", "table", "icon", "tree", "dialog", "tabs", "accordion", "alert", "badge", "checkbox", "switch", "radio", "textarea", "lookup", "pagination", "toolbar", "form-layout", "data-grid", "card", "menu", "context-menu", "toast", "tooltip", "shell", "split", "avatar"])("%s: usage section", async (id) => {
  vi.spyOn(console, "warn").mockImplementation(() => {})
  const page = (await import(`../playground/src/pages/${id}.ts`)).default
  const container = document.body.appendChild(document.createElement("div"))
  dispose = root((d) => {
    render(page.render(), container)
    return d
  })
  await settle()
  const section = container.querySelector("section.usage")!
  expect(section).not.toBeNull()
  expect(section.querySelectorAll(".usage-tabs [role=tab]")).toHaveLength(3)
  // live preview contains the component
  const preview = section.querySelector(".usage-preview > div")!
  expect(preview.children.length).toBeGreaterThan(0)
  // the JavaScript example ran without error and produced output
  const runner = section.querySelector(".runner")!
  expect(runner.querySelector<HTMLElement>(".runner-error")!.hidden).toBe(true)
  expect(runner.querySelector(".runner-output")!.children.length).toBeGreaterThan(0)
  expect(section.querySelectorAll("table.api tbody tr").length).toBeGreaterThan(0)
})
