import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { flush } from "@bazlama/core"

beforeAll(async () => {
  const proto = ElementInternals.prototype as unknown as Record<string, unknown>
  proto.setFormValue ??= () => {}
  proto.setValidity ??= () => {}
  const h = await import("@bazlama/headless")
  h.defineIcons(await import("@bazlama/icons"))
})
afterEach(() => document.body.replaceChildren())

const tick = () => new Promise((r) => setTimeout(r, 0))
const settle = async () => {
  for (let i = 0; i < 3; i++) {
    await tick()
    flush()
  }
}
/** Types into a field's native input the way a user would (the component listens for `input`). */
const type = (host: Element, value: string) => {
  const input = host.querySelector("input")!
  input.value = value
  input.dispatchEvent(new Event("input", { bubbles: true }))
  flush()
}

describe("bz-password", () => {
  it("renders a native password input and reveals it without losing the value", async () => {
    document.body.innerHTML = `<bz-password label="Parola" name="pw"></bz-password>`
    flush()
    const el = document.querySelector("bz-password")!
    const input = el.querySelector("input")!
    expect(el.querySelector("[data-part=label]")!.textContent).toBe("Parola")
    expect(input.type).toBe("password")
    expect(input.name).toBe("pw")

    type(el, "gizli")
    expect((el as unknown as { value: string }).value).toBe("gizli")

    const toggle = el.querySelector<HTMLButtonElement>("[data-part=toggle]")!
    expect(toggle.getAttribute("aria-pressed")).toBe("false")
    toggle.click()
    flush()
    expect(input.type).toBe("text")
    expect(input.value).toBe("gizli")
    expect(toggle.getAttribute("aria-pressed")).toBe("true")
    expect(el.hasAttribute("revealed")).toBe(true)

    toggle.click()
    flush()
    expect(input.type).toBe("password")
    expect(el.hasAttribute("revealed")).toBe(false)
  })

  it("the reveal button can be hidden and is skipped by Tab", () => {
    document.body.innerHTML = `<bz-password hide-toggle></bz-password><bz-password></bz-password>`
    flush()
    const [off, on] = document.querySelectorAll("bz-password")
    expect(off.querySelector<HTMLElement>("[data-part=toggle]")!.hidden).toBe(true)
    expect(on.querySelector<HTMLElement>("[data-part=toggle]")!.hidden).toBe(false)
    // The field itself is the tab stop; the reveal button is reachable by click/AT only.
    expect(on.querySelector("[data-part=toggle]")!.getAttribute("tabindex")).toBe("-1")
  })

  it("warns while Caps Lock is on and the field has focus", () => {
    document.body.innerHTML = `<bz-password></bz-password>`
    flush()
    const el = document.querySelector("bz-password")!
    const input = el.querySelector("input")!
    const caps = el.querySelector<HTMLElement>("[data-part=caps]")!
    expect(caps.hidden).toBe(true)

    const press = (on: boolean) => {
      const e = new KeyboardEvent("keydown", { key: "a", bubbles: true })
      Object.defineProperty(e, "getModifierState", { value: () => on })
      input.dispatchEvent(e)
      flush()
    }
    input.dispatchEvent(new FocusEvent("focus"))
    flush()
    press(true)
    expect(caps.hidden).toBe(false)
    expect(el.hasAttribute("data-caps-lock")).toBe(true)
    press(false)
    expect(caps.hidden).toBe(true)

    press(true)
    input.dispatchEvent(new FocusEvent("blur"))
    flush()
    expect(caps.hidden).toBe(true)
  })

  it("scores strength and shows the meter only when asked", async () => {
    const { passwordStrength } = await import("@bazlama/headless")
    expect(passwordStrength("")).toBe(0)
    expect(passwordStrength("aaaaaaaa")).toBe(1)
    expect(passwordStrength("abcdef")).toBe(1)
    expect(passwordStrength("Abcdef1")).toBe(2)
    expect(passwordStrength("Abcdef1!xyz")).toBe(4)

    document.body.innerHTML = `<bz-password strength></bz-password>`
    flush()
    const el = document.querySelector("bz-password")!
    const meter = el.querySelector<HTMLElement>("[data-part=strength]")!
    expect(meter.hidden).toBe(false)
    type(el, "Abcdef1!xyz")
    expect(meter.dataset.score).toBe("4")
    expect(meter.querySelectorAll("[data-part=bar][data-on]")).toHaveLength(4)
    type(el, "abc")
    expect(meter.dataset.score).toBe("0")
  })

  it("shows the required error after a blur and resets with the form", async () => {
    document.body.innerHTML = `<form><bz-password required label="Parola"></bz-password></form>`
    flush()
    const el = document.querySelector("bz-password")!
    const input = el.querySelector("input")!
    await settle()
    expect(el.hasAttribute("data-invalid")).toBe(false)

    input.dispatchEvent(new FocusEvent("blur"))
    await settle()
    expect(el.hasAttribute("data-invalid")).toBe(true)
    expect(el.querySelector<HTMLElement>("[data-part=error]")!.hidden).toBe(false)

    type(el, "gizli")
    await settle()
    expect(el.hasAttribute("data-invalid")).toBe(false)

    el.querySelector<HTMLButtonElement>("[data-part=toggle]")!.click()
    flush()
    expect(el.hasAttribute("revealed")).toBe(true)
    document.querySelector("form")!.reset()
    await settle()
    expect((el as unknown as { value: string }).value).toBe("")
    expect(el.hasAttribute("revealed")).toBe(false)
  })
})

describe("bz-login", () => {
  const mount = (attrs = "") => {
    document.body.innerHTML = `<bz-login heading="Giriş" ${attrs}></bz-login>`
    flush()
    return document.querySelector("bz-login")! as unknown as HTMLElement & Record<string, unknown>
  }

  it("collects the credentials and emits submit with them", async () => {
    const el = mount(`description="Devam etmek için giriş yapın"`)
    await settle()
    expect(el.querySelector("[data-part=heading]")!.textContent).toBe("Giriş")
    expect(el.querySelector("[data-part=description]")!.textContent).toBe("Devam etmek için giriş yapın")

    const details: unknown[] = []
    el.addEventListener("submit", (e) => details.push((e as unknown as CustomEvent).detail))

    type(el.querySelector("[data-part=identifier]")!, "ali@example.com")
    type(el.querySelector("[data-part=password]")!, "s3cret")
    el.querySelector<HTMLElement>("[data-part=remember] input")!.click()
    flush()

    el.querySelector<HTMLFormElement>("[data-part=form]")!.requestSubmit()
    await settle()
    expect(details).toEqual([
      { step: "credentials", identifier: "ali@example.com", password: "s3cret", remember: true },
    ])
  })

  it("Enter in either field submits (the form has two fields and no native submit button)", async () => {
    const el = mount()
    await settle()
    const details: unknown[] = []
    el.addEventListener("submit", (e) => details.push((e as unknown as CustomEvent).detail))
    type(el.querySelector("[data-part=identifier]")!, "ali@example.com")
    type(el.querySelector("[data-part=password]")!, "s3cret")

    const enter = (field: string) => {
      const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true })
      el.querySelector(`[data-part=${field}] input`)!.dispatchEvent(event)
      return event
    }
    expect(enter("password").defaultPrevented).toBe(true)
    expect(enter("identifier").defaultPrevented).toBe(true)
    await settle()
    expect(details).toHaveLength(2)
    expect(details[0]).toMatchObject({ step: "credentials", identifier: "ali@example.com", password: "s3cret" })

    // Shift+Enter (and IME composition) is left alone.
    const shifted = new KeyboardEvent("keydown", { key: "Enter", shiftKey: true, bubbles: true, cancelable: true })
    el.querySelector("[data-part=password] input")!.dispatchEvent(shifted)
    await settle()
    expect(shifted.defaultPrevented).toBe(false)
    expect(details).toHaveLength(2)
  })

  it("does not let the inner form's native submit escape the component", async () => {
    const el = mount()
    await settle()
    const outer: unknown[] = []
    document.addEventListener("submit", (e) => outer.push(e), { once: false })
    type(el.querySelector("[data-part=identifier]")!, "a@b.c")
    type(el.querySelector("[data-part=password]")!, "x")
    el.querySelector<HTMLFormElement>("[data-part=form]")!.requestSubmit()
    await settle()
    // Only our CustomEvent reaches the document, never a raw form submit.
    expect(outer.every((e) => e instanceof CustomEvent)).toBe(true)
  })

  it("shows the error banner and hides it again", async () => {
    const el = mount()
    await settle()
    const banner = el.querySelector<HTMLElement>("[data-part=error]")!
    expect(banner.hidden).toBe(true)
    el.error = "E-posta veya parola hatalı."
    flush()
    expect(banner.hidden).toBe(false)
    expect(banner.getAttribute("role")).toBe("alert")
    expect(banner.textContent).toContain("hatalı")
    el.error = ""
    flush()
    expect(banner.hidden).toBe(true)
  })

  it("forgot is a button that emits, or a link when forgot-href is set", async () => {
    const el = mount()
    await settle()
    const events: unknown[] = []
    el.addEventListener("forgot", (e) => events.push((e as CustomEvent).detail))
    type(el.querySelector("[data-part=identifier]")!, "ali@example.com")
    el.querySelector<HTMLButtonElement>("[data-part=forgot]")!.click()
    expect(events).toEqual([{ identifier: "ali@example.com" }])

    el.forgotHref = "/sifremi-unuttum"
    flush()
    const link = el.querySelector("[data-part=forgot]")!
    expect(link.tagName).toBe("A")
    expect(link.getAttribute("href")).toBe("/sifremi-unuttum")
  })

  it("second step: code field, auto-submit when complete, resend countdown and back", async () => {
    vi.useFakeTimers()
    try {
      const el = mount(`code-length="4" resend-seconds="3" code-destination="+90 ••• 42"`)
      flush()
      el.identifier = "ali@example.com"
      el.step = "code"
      flush()
      await Promise.resolve()

      expect(el.querySelector("[data-part=code-note]")!.textContent).toContain("+90 ••• 42")
      expect(el.querySelector("[data-part=code-note]")!.textContent).toContain("4")
      expect(el.querySelector("[data-part=identifier]")).toBeNull()
      expect(el.querySelector("[data-part=submit]")!.textContent!.trim()).toBe("Verify")

      const resend = el.querySelector<HTMLButtonElement>("[data-part=resend]")!
      expect(resend.disabled).toBe(true)
      expect(resend.textContent).toContain("3")
      vi.advanceTimersByTime(3000)
      flush()
      expect(resend.disabled).toBe(false)

      const resends: unknown[] = []
      el.addEventListener("resend", (e) => resends.push((e as CustomEvent).detail))
      resend.click()
      flush()
      expect(resends).toEqual([{ identifier: "ali@example.com" }])
      expect(resend.disabled).toBe(true)

      // Non-digits are dropped; the form submits itself once the code is complete.
      const submits: unknown[] = []
      el.addEventListener("submit", (e) => submits.push((e as unknown as CustomEvent).detail))
      type(el.querySelector("[data-part=code]")!, "12a")
      expect(el.code).toBe("12")
      expect(submits).toHaveLength(0)
      type(el.querySelector("[data-part=code]")!, "1234")
      await vi.advanceTimersByTimeAsync(0)
      flush()
      expect(submits).toEqual([{ step: "code", code: "1234", identifier: "ali@example.com" }])

      const backs: unknown[] = []
      el.addEventListener("back", () => backs.push(true))
      el.querySelector<HTMLButtonElement>("[data-part=back]")!.click()
      flush()
      expect(el.step).toBe("credentials")
      expect(el.code).toBe("")
      expect(backs).toHaveLength(1)
      expect(el.querySelector("[data-part=identifier]")).not.toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it("loading disables the fields and busies the submit button", async () => {
    const el = mount()
    await settle()
    el.loading = true
    flush()
    expect(el.hasAttribute("loading")).toBe(true)
    expect(el.querySelector("[data-part=identifier]")!.hasAttribute("disabled")).toBe(true)
    expect(el.querySelector("[data-part=password]")!.hasAttribute("disabled")).toBe(true)
    expect(el.querySelector("[data-part=submit]")!.getAttribute("aria-busy")).toBe("true")

    // A submit while loading is ignored.
    const submits: unknown[] = []
    el.addEventListener("submit", (e) => submits.push((e as unknown as CustomEvent).detail))
    el.querySelector<HTMLFormElement>("[data-part=form]")!.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true })
    )
    await settle()
    expect(submits).toHaveLength(0)
  })

  it("labels can be overridden per instance", async () => {
    const el = mount()
    el.labels = { identifier: "Kullanıcı adı", password: "Parola", remember: "Beni hatırla", submit: "Giriş yap" }
    await settle()
    expect(el.querySelector("[data-part=identifier]")!.getAttribute("label")).toBe("Kullanıcı adı")
    expect(el.querySelector("[data-part=password]")!.getAttribute("label")).toBe("Parola")
    expect(el.querySelector("[data-part=remember]")!.getAttribute("label")).toBe("Beni hatırla")
    expect(el.querySelector("[data-part=submit]")!.textContent!.trim()).toBe("Giriş yap")
  })
})
