import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { flush, render, root } from "@bazlama/core"

// Guards the playground's core documentation: every source excerpt must still exist in the
// core files, and every "Kendin dene" example must run without errors.

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

let dispose: (() => void) | undefined
afterEach(() => {
  dispose?.()
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

describe.each([
  ["core-signals", 5],
  ["core-template", 6],
  ["core-component", 6],
])("%s page", (id, runners) => {
  it("renders, finds every excerpt and runs every example without errors", async () => {
    const errors: unknown[] = []
    vi.spyOn(console, "error").mockImplementation((...args) => errors.push(args))
    const page = (await import(`../playground/src/pages/${id}.ts`)).default
    const container = document.body.appendChild(document.createElement("div"))
    dispose = root((d) => {
      render(page.render(), container)
      return d
    })
    await settle()

    expect(container.querySelectorAll(".runner")).toHaveLength(runners)
    expect(container.textContent).not.toContain("bulunamadı")
    const runnerErrors = Array.from(container.querySelectorAll<HTMLElement>(".runner-error"))
      .filter((el) => !el.hidden)
      .map((el) => el.textContent)
    expect(runnerErrors).toEqual([])
    expect(errors).toEqual([])
    // every example produced visible output or log lines
    for (const runner of container.querySelectorAll(".runner")) {
      const output = runner.querySelector(".runner-output")!
      const logs = runner.querySelectorAll(".runner-log li")
      expect(output.childNodes.length + logs.length).toBeGreaterThan(0)
    }
  })
})
