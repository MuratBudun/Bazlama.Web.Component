import { beforeAll, expect, it } from "vitest"
import { flush, render, root } from "@bazlama/core"

beforeAll(async () => {
  const proto = ElementInternals.prototype as unknown as Record<string, unknown>
  proto.setFormValue ??= () => {}
  proto.setValidity ??= () => {}
  Element.prototype.scrollIntoView ??= () => {}
  await import("@bazlama/headless")
})

const settle = async () => {
  for (let i = 0; i < 5; i++) {
    await new Promise<void>((r) => setTimeout(r))
    flush()
  }
}

it("debug page runs the sandbox, inspects components, records events and cleans up", async () => {
  localStorage.clear()
  const originalDispatch = EventTarget.prototype.dispatchEvent
  const originalError = console.error
  const page = (await import("../playground/src/pages/debug.ts")).default
  const container = document.body.appendChild(document.createElement("div"))
  const dispose = root((d) => {
    render(page.render(), container)
    return d
  })
  await settle()

  // sandbox ran without errors and the tree lists the components
  const runError = container.querySelector<HTMLElement>(".runner-error")!
  expect(runError.hidden, runError.textContent!).toBe(true)
  const treeItems = Array.from(container.querySelectorAll(".debug-tree li")).map((li) => li.textContent!.trim())
  expect(treeItems.some((t) => t.startsWith("<bz-input"))).toBe(true)
  expect(treeItems.some((t) => t.startsWith("<x-counter"))).toBe(true)
  expect((window as unknown as { bz: unknown }).bz).toBeDefined()

  // select the counter and change its label through the inspector
  const counterItem = Array.from(container.querySelectorAll<HTMLElement>(".debug-tree li")).find((li) =>
    li.textContent!.includes("x-counter")
  )!
  counterItem.click()
  await settle()
  const labelRow = Array.from(container.querySelectorAll(".debug-table tr")).find((tr) => tr.querySelector("th")?.textContent === "label")!
  const labelInput = labelRow.querySelector("input")!
  expect(labelInput.value).toBe("Tıkla")
  labelInput.value = "Yeni etiket"
  labelInput.dispatchEvent(new Event("input", { bubbles: true }))
  await settle()
  expect(container.querySelector(".debug-output")!.textContent).toContain("Yeni etiket")

  // clicking the counter emits a component event that the monitor records
  const counterButton = Array.from(container.querySelectorAll<HTMLElement>(".debug-output bz-button")).find((b) =>
    b.textContent!.includes("Yeni etiket")
  )!
  counterButton.click()
  await settle()
  const eventTypes = Array.from(container.querySelectorAll(".debug-events li b")).map((b) => b.textContent)
  expect(eventTypes).toContain("count-change")
  expect(eventTypes).toContain("click")

  // leaving the page restores the patched globals
  dispose()
  expect(EventTarget.prototype.dispatchEvent).toBe(originalDispatch)
  expect(console.error).toBe(originalError)
  expect((window as unknown as { bz?: unknown }).bz).toBeUndefined()
  expect(document.querySelector(".debug-overlay")).toBeNull()
})
