import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { flush } from "@bazlama/core"

let h: typeof import("@bazlama/headless")

beforeAll(async () => {
  Element.prototype.scrollIntoView ??= () => {}
  h = await import("@bazlama/headless")
})
afterEach(() => {
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

const tick = async () => {
  await new Promise((r) => setTimeout(r))
  flush()
}

function mount(width: number, inner?: string) {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    return { width: this.localName === "bz-shell" ? width : 0, height: 0, top: 0, left: 0, right: width, bottom: 0, x: 0, y: 0 } as DOMRect
  })
  document.body.innerHTML = `
    <bz-shell skip-label="İçeriğe geç">
      ${
        inner ??
        `<bz-header slot="header" title="Uygulama"><button id="end-btn" data-shell-toggle="end">Detay</button></bz-header>
         <nav slot="start"><a href="/a" id="link-a">A</a><a href="/b" id="link-b" aria-current="page">B</a></nav>
         <p id="content">içerik</p>
         <aside slot="end"><button id="in-end">x</button></aside>
         <bz-footer slot="footer">alt</bz-footer>`
      }
    </bz-shell>`
  flush()
  const shell = document.querySelector("bz-shell")!
  const part = (name: string) => shell.querySelector<HTMLElement>(`:scope > [data-part=${name}]`)!
  const menu = () => shell.querySelector<HTMLElement>("bz-header [data-part=menu]")!
  return { shell, part, menu }
}

describe("bz-shell", () => {
  it("places the regions; content is a <main>; only present regions are rendered", () => {
    const { shell, part } = mount(1400)
    expect(shell.getAttribute("variant")).toBe("classic")
    expect(part("content").localName).toBe("main")
    expect(part("content").querySelector("#content")).not.toBeNull()
    expect(part("header").querySelector("bz-header")).not.toBeNull()
    expect(part("start").querySelector("[data-part=start-panel] nav")).not.toBeNull()
    expect(part("end").querySelector("aside")).not.toBeNull()
    expect(part("footer").querySelector("bz-footer")).not.toBeNull()
    for (const r of ["header", "footer", "start", "end"]) expect(shell.hasAttribute(`data-has-${r}`)).toBe(true)

    const bare = mount(1400, `<p>yalnız içerik</p>`)
    expect(bare.part("header")).toBeNull()
    expect(bare.part("start")).toBeNull()
    expect(bare.shell.hasAttribute("data-has-start")).toBe(false)
    expect(bare.part("content").textContent!.trim()).toBe("yalnız içerik")
  })

  it("wide: data-shell-toggle buttons collapse the sides and get ARIA", () => {
    const { shell, part, menu } = mount(1400)
    const end = document.getElementById("end-btn")!
    expect(menu().getAttribute("data-shell-toggle")).toBe("start")
    expect(menu().getAttribute("aria-controls")).toBe(part("start").id)
    expect(menu().getAttribute("aria-expanded")).toBe("true")
    const events: unknown[] = []
    shell.addEventListener("toggle", (e) => events.push((e as unknown as CustomEvent).detail))

    menu().click()
    end.click()
    flush()
    expect(shell.hasAttribute("start-collapsed")).toBe(true)
    expect(shell.hasAttribute("end-collapsed")).toBe(true)
    expect(menu().getAttribute("aria-expanded")).toBe("false")
    expect(end.getAttribute("aria-expanded")).toBe("false")
    expect(events).toEqual([
      { side: "start", open: false, compact: false },
      { side: "end", open: false, compact: false },
    ])
    shell.toggle("start")
    flush()
    expect(shell.hasAttribute("start-collapsed")).toBe(false)
  })

  it("compact: drawers, one at a time, inert background, focus in and back", async () => {
    const { shell, part, menu } = mount(600)
    expect(shell.hasAttribute("data-compact")).toBe(true)
    menu().focus()
    menu().click()
    await tick()
    expect(shell.hasAttribute("start-open")).toBe(true)
    expect(shell.getAttribute("data-drawer")).toBe("start")
    expect(part("content").inert).toBe(true)
    expect(part("header").inert).toBe(true)
    expect(part("end").inert).toBe(true)
    expect(document.activeElement!.id).toBe("link-b") // current page first

    // Escape closes and returns focus to the opener.
    part("start").dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }))
    flush()
    expect(shell.hasAttribute("start-open")).toBe(false)
    expect(part("content").inert).toBe(false)
    expect(document.activeElement).toBe(menu())

    // Opening the end drawer closes the start one.
    shell.open("start")
    flush()
    shell.open("end")
    await tick()
    expect(shell.hasAttribute("start-open")).toBe(false)
    expect(shell.getAttribute("data-drawer")).toBe("end")
    expect(document.activeElement!.id).toBe("in-end")

    part("backdrop").click()
    flush()
    expect(shell.hasAttribute("data-drawer")).toBe(false)

    shell.open("start")
    flush()
    document.getElementById("link-a")!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }))
    flush()
    expect(shell.hasAttribute("start-open")).toBe(false)
  })

  it("variant and breakpoint are live", () => {
    const { shell } = mount(1200)
    expect(shell.hasAttribute("data-compact")).toBe(false)
    shell.breakpoint = 1300
    flush()
    expect(shell.hasAttribute("data-compact")).toBe(true)
    shell.variant = "sidebar"
    flush()
    expect(shell.getAttribute("variant")).toBe("sidebar")
  })

  it("a nested shell's toggles are its own", () => {
    const { shell } = mount(
      1400,
      `<nav slot="start">menü</nav>
       <bz-shell id="inner"><nav slot="start">iç</nav><button id="inner-btn" data-shell-toggle="start">iç</button></bz-shell>`
    )
    flush()
    document.getElementById("inner-btn")!.click()
    flush()
    expect(document.getElementById("inner")!.hasAttribute("start-collapsed")).toBe(true)
    expect(shell.hasAttribute("start-collapsed")).toBe(false)
  })
})

describe("bz-header / bz-footer", () => {
  it("renders brand, actions and a user menu", () => {
    document.body.innerHTML = `
      <bz-header title="Demo" subtitle="Alt" href="/" logo="/logo.svg" user-name="Ada Yılmaz" user-detail="Yönetici">
        <button id="act">Yardım</button>
        <bz-menu-item slot="user-menu" value="logout">Çıkış</bz-menu-item>
      </bz-header>`
    flush()
    const header = document.querySelector("bz-header")!
    const q = (p: string) => header.querySelector<HTMLElement>(`[data-part=${p}]`)!
    expect(q("bar").localName).toBe("header")
    expect(q("brand").localName).toBe("a")
    expect(q("brand").getAttribute("href")).toBe("/")
    expect(q("title").textContent).toBe("Demo")
    expect(q("subtitle").textContent).toBe("Alt")
    expect((q("logo") as HTMLImageElement).getAttribute("src")).toBe("/logo.svg")
    expect(q("actions").querySelector("#act")).not.toBeNull()
    expect(q("user-name").textContent).toBe("Ada Yılmaz")
    const menu = q("user").querySelector("bz-menu")!
    expect(menu.querySelector('bz-menu-item[value="logout"]')).not.toBeNull()
    expect(q("user-button").getAttribute("aria-label")).toBe("User menu: Ada Yılmaz")
    expect(header.querySelector("bz-avatar")!.getAttribute("aria-hidden")).toBe("true")
  })

  it("footer has start and end areas", () => {
    document.body.innerHTML = `<bz-footer>© 2026 <span slot="end">v1</span></bz-footer>`
    flush()
    const f = document.querySelector("bz-footer")!
    expect(f.querySelector("[data-part=bar]")!.localName).toBe("footer")
    expect(f.querySelector("[data-part=start]")!.textContent).toContain("© 2026")
    expect(f.querySelector("[data-part=end]")!.textContent).toBe("v1")
  })
})

describe("bz-avatar", () => {
  it("initials (Turkish), stable hue, accessible name and status", () => {
    expect(h.initials("ismail öztürk")).toBe("İÖ")
    expect(h.initials("  Ada  ")).toBe("A")
    expect(h.hueOf("Ada Yılmaz")).toBe(h.hueOf("Ada Yılmaz"))
    document.body.innerHTML = `<bz-avatar name="Ada Yılmaz" status="online"></bz-avatar>`
    flush()
    const a = document.querySelector("bz-avatar")!
    expect(a.getAttribute("role")).toBe("img")
    expect(a.getAttribute("aria-label")).toBe("Ada Yılmaz (online)")
    expect(a.querySelector("[data-part=initials]")!.textContent).toBe("AY")
    expect(a.hasAttribute("data-fallback")).toBe(true)
    expect(a.style.getPropertyValue("--bz-avatar-hue")).not.toBe("")
  })

  it("shows the image and falls back to initials when it fails", () => {
    document.body.innerHTML = `<bz-avatar name="Can Demir" src="/can.jpg"></bz-avatar>`
    flush()
    const a = document.querySelector("bz-avatar")!
    const img = a.querySelector("img")!
    expect(img.getAttribute("src")).toBe("/can.jpg")
    expect(a.hasAttribute("data-fallback")).toBe(false)
    img.dispatchEvent(new Event("error"))
    flush()
    expect(a.querySelector("img")).toBeNull()
    expect(a.querySelector("[data-part=initials]")!.textContent).toBe("CD")
  })
})
