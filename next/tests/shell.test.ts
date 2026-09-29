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

describe("shell demo source (playground)", () => {
  it("writes only non-default attributes and the generated HTML builds the same shell", async () => {
    const { shellHtml, shellJs, shellTemplate } = await import("../playground/src/pages/shell-code")
    const base = { variant: "classic" as const, scrollMode: "content" as const, resizable: false, persist: false, stickyFooter: false, fill: false, regions: { header: true, start: true, end: true, footer: true } }
    const plain = shellHtml(base)
    const firstLine = (code: string) => code.split("\n")[0]
    expect(firstLine(plain)).toBe('<bz-shell breakpoint="720">')
    expect(plain).not.toContain("<script>")

    const custom = { ...base, variant: "sidebar" as const, resizable: true, persist: true, fill: true, regions: { ...base.regions, footer: false } }
    const src = shellHtml(custom)
    expect(firstLine(src)).toBe('<bz-shell variant="sidebar" breakpoint="720" resizable persist="erp-shell">')
    expect(src).toContain("data-shell-fill")
    expect(src).not.toContain("bz-footer")
    // persist replaces the hand-written storage script
    expect(src).not.toContain("<script>")
    expect(shellJs({ ...custom, persist: false })).toContain('shell.addEventListener("resize"')
    // sticky-footer and fill depend on the scroll mode.
    const page = shellHtml({ ...custom, scrollMode: "page", stickyFooter: true })
    expect(firstLine(page)).toContain('scroll-mode="page" sticky-footer')
    expect(page).not.toContain("data-shell-fill")

    document.body.innerHTML = src.split("<script>")[0]
    flush()
    const shell = document.querySelector("bz-shell")!
    expect(shell.variant).toBe("sidebar")
    expect(shell.resizable).toBe(true)
    expect(shell.querySelector("[data-part=start-resizer]")).not.toBeNull()
    expect(shell.querySelector(":scope > [data-part=footer]")).toBeNull()
    expect(shell.querySelector(":scope > main bz-data-grid[data-shell-fill]")).not.toBeNull()

    expect(shellJs(custom)).toContain('shell.variant = "sidebar"')
    expect(shellJs(custom)).toContain("shell.breakpoint = 720")
    expect(shellJs(custom)).toContain("shell.resizable = true")
    expect(shellTemplate(custom)).toContain('persist="erp-shell"')
    expect(shellTemplate({ ...custom, persist: false })).toContain("@resize=${saveWidth}")
  })
})

describe("bz-shell persist", () => {
  it("opt-in: saves widths and collapsed states under bz-shell:<key>, restores (clamped) on load", () => {
    localStorage.clear()
    document.body.innerHTML = `<bz-shell resizable><nav slot="start">m</nav><p>x</p></bz-shell>`
    flush()
    const plain = document.querySelector("bz-shell")!
    plain.startWidth = 300
    flush()
    expect(localStorage.length).toBe(0)

    document.body.innerHTML = `<bz-shell resizable persist="erp"><nav slot="start">m</nav><p>x</p><aside slot="end">d</aside></bz-shell>`
    flush()
    const shell = document.querySelector("bz-shell")!
    shell.startWidth = 320
    shell.endCollapsed = true
    flush()
    expect(JSON.parse(localStorage.getItem("bz-shell:erp")!)).toEqual({ startWidth: 320, endWidth: 0, startCollapsed: false, endCollapsed: true })

    // A new page load: saved values win over the initial attributes; widths are clamped.
    localStorage.setItem("bz-shell:erp", JSON.stringify({ startWidth: 9999, endWidth: "bad", startCollapsed: true }))
    document.body.innerHTML = `<bz-shell resizable persist="erp" start-width="200" end-width="250"><nav slot="start">m</nav><p>x</p><aside slot="end">d</aside></bz-shell>`
    flush()
    const again = document.querySelector("bz-shell")!
    expect(again.startWidth).toBe(640)
    expect(again.endWidth).toBe(250)
    expect(again.startCollapsed).toBe(true)
    expect(again.style.getPropertyValue("--bz-shell-start-width")).toBe("640px")

    // Broken JSON is ignored.
    localStorage.setItem("bz-shell:broken", "{nope")
    document.body.innerHTML = `<bz-shell persist="broken" start-width="210"><nav slot="start">m</nav><p>x</p></bz-shell>`
    flush()
    expect(document.querySelector("bz-shell")!.startWidth).toBe(210)
  })
})

describe("bz-shell scroll", () => {
  it("content (default): the main is the scroll container; page: the document scrolls", () => {
    document.body.innerHTML = `<bz-shell><p>içerik</p></bz-shell><bz-shell scroll-mode="page"><p>sayfa</p></bz-shell>`
    flush()
    const [app, page] = document.querySelectorAll("bz-shell")
    expect(app.getAttribute("scroll-mode")).toBe("content")
    expect(app.querySelector(":scope > main")!.hasAttribute("data-scroll-container")).toBe(true)
    expect(page.querySelector(":scope > main")!.hasAttribute("data-scroll-container")).toBe(false)
    app.scrollMode = "page"
    flush()
    expect(app.querySelector(":scope > main")!.hasAttribute("data-scroll-container")).toBe(false)
  })
})

describe("bz-shell resizing", () => {
  /** Shell 1200 px wide; sides as wide as their CSS variable says (default 240 / 320). */
  function mountSized(attrs = "resizable", width = 1200) {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      const shell = this.closest("bz-shell") as HTMLElement | null
      const side = this.dataset.part === "start" || this.dataset.part === "end" ? this.dataset.part : null
      let w = 0
      if (this.localName === "bz-shell") w = width
      else if (side && shell) {
        const collapsed = shell.hasAttribute(`${side}-collapsed`)
        const v = parseFloat(shell.style.getPropertyValue(`--bz-shell-${side}-width`))
        w = collapsed ? (side === "start" ? 60 : 0) : Number.isNaN(v) ? (side === "start" ? 240 : 320) : v
      }
      return { width: w, height: 0, top: 0, left: 0, right: w, bottom: 0, x: 0, y: 0 } as DOMRect
    })
    document.body.innerHTML = `<bz-shell ${attrs}>
      <nav slot="start">menü</nav><p>içerik</p><aside slot="end">detay</aside>
    </bz-shell>`
    flush()
    const shell = document.querySelector("bz-shell")!
    const handle = (side: string) => shell.querySelector<HTMLElement>(`[data-part=${side}-resizer]`)!
    const events: unknown[] = []
    shell.addEventListener("resize", (e) => events.push((e as unknown as CustomEvent).detail))
    const key = (el: Element, k: string, init: KeyboardEventInit = {}) =>
      el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }))
    return { shell, handle, events, key }
  }
  const pointer = (el: Element, type: string, x: number) =>
    el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, button: 0 }))

  it("separators only with `resizable`; they are labelled, focusable and describe the width", () => {
    const plain = mountSized("")
    expect(plain.handle("start")).toBeNull()
    const { shell, handle } = mountSized()
    const h = handle("start")
    expect(h.getAttribute("role")).toBe("separator")
    expect(h.getAttribute("aria-orientation")).toBe("vertical")
    expect(h.getAttribute("aria-controls")).toBe(shell.querySelector("[data-part=start]")!.id)
    expect(h.tabIndex).toBe(0)
    h.dispatchEvent(new FocusEvent("focus"))
    expect(h.getAttribute("aria-valuenow")).toBe("240")
    expect(h.getAttribute("aria-valuemin")).toBe("160")
    // Room for the content: 1200 − end (320) − 320 = 560 (below max-side-width 640).
    expect(h.getAttribute("aria-valuemax")).toBe("560")
  })

  it("keyboard: arrows (Shift: bigger), Home/End, Enter resets; end side moves the other way", () => {
    const { shell, handle, events, key } = mountSized()
    key(handle("start"), "ArrowRight")
    flush()
    expect(shell.startWidth).toBe(256)
    expect(shell.style.getPropertyValue("--bz-shell-start-width")).toBe("256px")
    key(handle("start"), "ArrowLeft", { shiftKey: true })
    key(handle("start"), "Home")
    flush()
    expect(shell.startWidth).toBe(160)
    key(handle("start"), "End")
    flush()
    expect(shell.startWidth).toBe(560)
    key(handle("start"), "Enter")
    flush()
    expect(shell.startWidth).toBe(0)
    expect(shell.style.getPropertyValue("--bz-shell-start-width")).toBe("")
    // End side: → moves the separator right, the panel gets narrower.
    key(handle("end"), "ArrowRight")
    flush()
    expect(shell.endWidth).toBe(304)
    expect(events).toEqual([
      { side: "start", width: 256 },
      { side: "start", width: 192 },
      { side: "start", width: 160 },
      { side: "start", width: 560 },
      { side: "start", width: null },
      { side: "end", width: 304 },
    ])
  })

  it("drag: live width, clamped, committed on release; far below the minimum collapses", () => {
    const { shell, handle, events } = mountSized()
    const h = handle("start")
    pointer(h, "pointerdown", 240)
    pointer(h, "pointermove", 300)
    expect(shell.getAttribute("data-resizing")).toBe("start")
    expect(shell.style.getPropertyValue("--bz-shell-start-width")).toBe("300px")
    expect(events).toEqual([])
    pointer(h, "pointermove", 2000)
    expect(shell.style.getPropertyValue("--bz-shell-start-width")).toBe("560px")
    pointer(h, "pointerup", 2000)
    flush()
    expect(shell.hasAttribute("data-resizing")).toBe(false)
    expect(shell.startWidth).toBe(560)
    expect(events).toEqual([{ side: "start", width: 560 }])

    const toggles: unknown[] = []
    shell.addEventListener("toggle", (e) => toggles.push((e as unknown as CustomEvent).detail))
    pointer(h, "pointerdown", 560)
    pointer(h, "pointermove", 20)
    expect(shell.hasAttribute("data-resize-collapse")).toBe(true)
    pointer(h, "pointerup", 20)
    flush()
    expect(shell.hasAttribute("start-collapsed")).toBe(true)
    // The saved width stays for when it is expanded again.
    expect(shell.startWidth).toBe(560)
    expect(shell.style.getPropertyValue("--bz-shell-start-width")).toBe("560px")
    expect(toggles).toEqual([{ side: "start", open: false, compact: false }])
  })

  it("restores saved widths from attributes; compact mode ignores drags", () => {
    const { shell, handle } = mountSized('resizable start-width="300" end-width="280" breakpoint="1600"')
    expect(shell.style.getPropertyValue("--bz-shell-start-width")).toBe("300px")
    expect(shell.style.getPropertyValue("--bz-shell-end-width")).toBe("280px")
    expect(shell.hasAttribute("data-compact")).toBe(true)
    pointer(handle("start"), "pointerdown", 300)
    expect(shell.hasAttribute("data-resizing")).toBe(false)
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
