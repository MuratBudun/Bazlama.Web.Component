import { afterEach, beforeAll, describe, expect, it } from "vitest"
import { flush } from "@bazlama/core"

beforeAll(async () => {
  Element.prototype.scrollIntoView ??= () => {}
  const h = await import("@bazlama/headless")
  h.defineIcons(await import("@bazlama/icons"))
})
afterEach(() => document.body.replaceChildren())
const tick = () => new Promise((r) => setTimeout(r, 0))
const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }))

describe("bz-card", () => {
  it("link card: heading link names it, meta and description describe it, hue from the heading", () => {
    document.body.innerHTML = `<bz-card heading="Doküman Yönetimi" icon="file-text" href="#dms" description="Formlar"
      meta="18 bekleyen iş" meta-variant="danger" indicator="danger" indicator-label="Bekleyen iş var"></bz-card>`
    flush()
    const card = document.querySelector("bz-card")!
    const link = card.querySelector<HTMLAnchorElement>("[data-part=link]")!
    expect(link.getAttribute("href")).toBe("#dms")
    expect(link.textContent).toBe("Doküman Yönetimi")
    const described = link.getAttribute("aria-describedby")!.split(" ").map((id) => document.getElementById(id)!.textContent)
    expect(described).toEqual(["Formlar", "18 bekleyen iş"])
    expect(card.querySelector("[data-part=heading]")!.getAttribute("aria-level")).toBe("3")
    expect(card.querySelector("[data-part=media] svg")).not.toBeNull()
    expect(card.style.getPropertyValue("--bz-card-hue")).not.toBe("")
    const dot = card.querySelector("[data-part=indicator]")!
    expect([dot.getAttribute("role"), dot.getAttribute("aria-label")]).toEqual(["img", "Bekleyen iş var"])
    card.hue = 12
    flush()
    expect(card.style.getPropertyValue("--bz-card-hue")).toBe("12")
  })

  it("clickable card is a button (Enter/Space); actions do not activate it; disabled does nothing", () => {
    document.body.innerHTML = `<bz-card heading="Yeni" clickable><button slot="actions" id="fav">★</button></bz-card>`
    flush()
    const card = document.querySelector("bz-card")!
    const events: string[] = []
    card.addEventListener("activate", () => events.push("activate"))
    expect(card.getAttribute("role")).toBe("button")
    expect(card.tabIndex).toBe(0)
    expect(document.getElementById(card.getAttribute("aria-labelledby")!)!.textContent!.trim()).toBe("Yeni")
    card.click()
    key(card, "Enter")
    key(card, " ")
    document.getElementById("fav")!.click()
    expect(events).toEqual(["activate", "activate", "activate"])
    card.disabled = true
    flush()
    card.click()
    expect(events.length).toBe(3)
    expect(card.getAttribute("aria-disabled")).toBe("true")
    card.clickable = false
    flush()
    expect(card.hasAttribute("role")).toBe(false)
  })
})

describe("bz-card-list", () => {
  const mount = async () => {
    document.body.innerHTML = `<bz-card-list label="Uygulamalar">
      <bz-card-group heading="Uygulamalar">
        <bz-card heading="Doküman Yönetimi" href="#1"></bz-card>
        <bz-card heading="Düzeltici ve Önleyici Faaliyetler" keywords="döf capa" href="#2"></bz-card>
        <bz-card heading="Eğitim Yönetimi" href="#3"></bz-card>
      </bz-card-group>
      <bz-card-group heading="Ayarlar">
        <bz-card heading="Genel Parametreler" href="#4"></bz-card>
      </bz-card-group>
      <div slot="empty">Yok</div>
    </bz-card-list>`
    flush()
    await tick()
    flush()
    const list = document.querySelector("bz-card-list")!
    const links = () => [...list.querySelectorAll<HTMLElement>("[data-part=link]")]
    const groups = [...list.querySelectorAll("bz-card-group")]
    const count = (g: HTMLElement) => g.querySelector("[data-part=count]")!.textContent
    return { list, links, groups, count }
  }

  it("filter hides cards and empty groups, counts follow, keywords match, empty slot", async () => {
    const { list, groups, count } = await mount()
    expect(count(groups[0])).toBe("(3)")
    const events: number[] = []
    list.addEventListener("filter", (e) => events.push((e as CustomEvent).detail.visible))
    list.filter = "DOF"
    flush()
    const visible = [...list.querySelectorAll("bz-card")].filter((c) => !c.hidden).map((c) => c.heading)
    expect(visible).toEqual(["Düzeltici ve Önleyici Faaliyetler"])
    expect(count(groups[0])).toBe("(1)")
    expect(groups[1].hidden).toBe(true)
    list.filter = "zzz"
    flush()
    expect(list.querySelector<HTMLElement>("[data-part=empty]")!.hidden).toBe(false)
    list.filter = ""
    flush()
    expect(groups[1].hidden).toBe(false)
    expect(events).toEqual([1, 0, 4])
  })

  it("one tab stop; arrows / Home / End move between cards; collapsed groups are skipped", async () => {
    const { links, groups } = await mount()
    await tick()
    expect(links().map((l) => l.tabIndex)).toEqual([0, -1, -1, -1])
    links()[0].focus()
    key(links()[0], "ArrowRight")
    expect(document.activeElement).toBe(links()[1])
    expect(links().map((l) => l.tabIndex)).toEqual([-1, 0, -1, -1])
    key(links()[1], "End")
    expect(document.activeElement).toBe(links()[3])
    key(links()[3], "Home")
    expect(document.activeElement).toBe(links()[0])
    // Collapse the first group: its cards leave the order.
    groups[0].querySelector<HTMLElement>("[data-part=toggle]")!.click()
    flush()
    expect(groups[0].open).toBe(false)
    expect(groups[0].querySelector<HTMLElement>("[data-part=toggle]")!.getAttribute("aria-expanded")).toBe("false")
    links()[3].focus()
    key(links()[3], "Home")
    expect(document.activeElement).toBe(links()[3])
  })
})
