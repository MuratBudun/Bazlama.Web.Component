import { beforeAll, describe, expect, it, vi } from "vitest"
import { flush } from "@bazlama/core"

// jsdom has attachInternals() but no form APIs; real form behavior is checked in the browser.
beforeAll(async () => {
  const proto = ElementInternals.prototype as unknown as Record<string, unknown>
  proto.setFormValue ??= () => {}
  proto.setValidity ??= () => {}
  Element.prototype.scrollIntoView ??= () => {}
  await import("@bazlama/headless")
})

const tick = () => new Promise<void>((r) => setTimeout(r))
const key = (el: Element, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }))
const mount = (markup: string) => {
  document.body.innerHTML = markup
  return document.body.firstElementChild as HTMLElement
}

describe("bz-button", () => {
  it("sets role/tabindex and swallows clicks while disabled", () => {
    const button = mount(`<bz-button disabled>Save</bz-button>`)
    const onClick = vi.fn()
    button.addEventListener("click", onClick)
    button.click()
    expect(button.getAttribute("role")).toBe("button")
    expect(button.getAttribute("aria-disabled")).toBe("true")
    expect(button.tabIndex).toBe(-1)
    expect(onClick).not.toHaveBeenCalled()
  })

  it("activates with Enter and toggles aria-pressed", () => {
    const button = mount(`<bz-button pressed="false">Bold</bz-button>`)
    key(button, "Enter")
    flush()
    expect(button.getAttribute("aria-pressed")).toBe("true")
  })
})

describe("bz-panel", () => {
  it("projects slots and toggles content", () => {
    const panel = mount(
      `<bz-panel heading="Title" collapsible><button slot="actions">A</button><p>Body</p></bz-panel>`
    )
    const trigger = panel.querySelector<HTMLButtonElement>("[data-part=trigger]")!
    const content = panel.querySelector<HTMLElement>("[data-part=content]")!
    expect(trigger.textContent!.trim()).toBe("Title")
    expect(panel.querySelector("[data-part=actions] > button")).not.toBeNull()
    expect(content.hidden).toBe(true)
    trigger.click()
    flush()
    expect(content.hidden).toBe(false)
    expect(trigger.getAttribute("aria-expanded")).toBe("true")
    expect(panel.hasAttribute("open")).toBe(true)
  })
})

describe("bz-input", () => {
  it("renders a labelled native input and syncs value both ways", () => {
    const field = mount(`<bz-input label="Name" name="name" value="Ada"></bz-input>`) as HTMLElement & {
      value: string
    }
    const input = field.querySelector("input")!
    expect(field.querySelector("label")!.htmlFor).toBe(input.id)
    expect(input.name).toBe("name")
    expect(input.value).toBe("Ada")
    input.value = "Bob"
    input.dispatchEvent(new Event("input", { bubbles: true }))
    expect(field.value).toBe("Bob")
    field.value = "Cem"
    flush()
    expect(input.value).toBe("Cem")
  })
})

describe("bz-list", () => {
  it("navigates with the keyboard and selects", () => {
    const list = mount(`<bz-list>
      <bz-option value="a">Alpha</bz-option>
      <bz-option value="b" disabled>Beta</bz-option>
      <bz-option value="c">Gamma</bz-option>
    </bz-list>`) as HTMLElement & { value: string }
    const onChange = vi.fn()
    list.addEventListener("change", onChange)
    list.dispatchEvent(new FocusEvent("focus"))
    key(list, "ArrowDown") // skips the disabled option
    flush()
    const active = list.querySelector("[data-active]")!
    expect(active.textContent).toBe("Gamma")
    expect(list.getAttribute("aria-activedescendant")).toBe(active.id)
    key(list, "Enter")
    flush()
    expect(list.value).toBe("c")
    expect(active.getAttribute("aria-selected")).toBe("true")
    expect(onChange).toHaveBeenCalledOnce()
  })

  it("supports multiple selection and typeahead", () => {
    const list = mount(`<bz-list multiple>
      <bz-option value="a">Apple</bz-option>
      <bz-option value="b">Banana</bz-option>
      <bz-option value="c">Cherry</bz-option>
    </bz-list>`) as HTMLElement & { value: string }
    key(list, "c") // typeahead → Cherry
    key(list, " ")
    key(list, "ArrowUp") // → Banana
    key(list, "Enter")
    flush()
    expect(list.value.split(",").sort()).toEqual(["b", "c"])
  })
})

describe("bz-combobox", () => {
  it("filters, navigates and commits", async () => {
    const box = mount(`<bz-combobox>
      <bz-option value="ist">İstanbul</bz-option>
      <bz-option value="izm">İzmir</bz-option>
      <bz-option value="ank">Ankara</bz-option>
    </bz-combobox>`) as HTMLElement & { value: string; open: boolean }
    const input = box.querySelector("input")!
    // options were projected into the popup listbox
    expect(box.querySelectorAll("[data-part=listbox] bz-option")).toHaveLength(3)

    input.value = "an" // matches "istANbul" and "ANkara"
    input.dispatchEvent(new Event("input", { bubbles: true }))
    await tick()
    flush()
    expect(box.open).toBe(true)
    const visible = Array.from(box.querySelectorAll<HTMLElement>("bz-option")).filter((o) => !o.hidden)
    expect(visible.map((o) => o.textContent)).toEqual(["İstanbul", "Ankara"])
    expect(input.getAttribute("aria-activedescendant")).toBe(visible[0].id)

    key(input, "ArrowDown")
    key(input, "Enter")
    flush()
    expect(box.value).toBe("ank")
    expect(box.open).toBe(false)
    expect(input.value).toBe("Ankara")
  })
})

describe("matching", () => {
  it("is case and accent insensitive (Turkish İ)", async () => {
    const box = mount(`<bz-combobox><bz-option>İstanbul</bz-option><bz-option>Çanakkale</bz-option></bz-combobox>`)
    const input = box.querySelector("input")!
    for (const [text, expected] of [["is", "İstanbul"], ["can", "Çanakkale"]]) {
      input.value = text
      input.dispatchEvent(new Event("input", { bubbles: true }))
      await tick()
      flush()
      const visible = Array.from(box.querySelectorAll<HTMLElement>("bz-option")).filter((o) => !o.hidden)
      expect(visible.map((o) => o.textContent)).toEqual([expected])
    }
  })
})

describe("bz-table", () => {
  it("renders rows, sorts by header click and keeps row nodes", () => {
    // Typed through HTMLElementTagNameMap: .columns / .rows are checked.
    const table = document.createElement("bz-table")
    table.columns = [
      { key: "id", header: "#" },
      { key: "name", header: "Name", sortable: true },
    ]
    table.rows = [
      { id: 1, name: "Cem" },
      { id: 2, name: "Ada" },
      { id: 3, name: "Bora" },
    ]
    document.body.replaceChildren(table)
    const names = () => Array.from(table.querySelectorAll("tbody tr td:nth-child(2)")).map((td) => td.textContent)
    expect(names()).toEqual(["Cem", "Ada", "Bora"])
    const firstRow = table.querySelector("tbody tr")
    table.querySelector<HTMLButtonElement>("[data-part=sort]")!.click()
    flush()
    expect(names()).toEqual(["Ada", "Bora", "Cem"])
    expect(table.querySelector("th[aria-sort=ascending]")).not.toBeNull()
    expect(table.querySelector("tbody tr:last-child")).toBe(firstRow)
  })
})
