import { afterEach, describe, expect, it, vi } from "vitest"
import {
  computed,
  define,
  effect,
  flush,
  html,
  prop,
  render,
  repeat,
  root,
  signal,
  type BazElement,
} from "@bazlama/core"

const tick = () => new Promise<void>((r) => setTimeout(r))

afterEach(() => {
  document.body.replaceChildren()
})

describe("signals", () => {
  it("batches effect re-runs into one microtask", async () => {
    const a = signal(1)
    const b = signal(2)
    const fn = vi.fn(() => a() + b())
    effect(fn)
    a.set(10)
    b.set(20)
    expect(fn).toHaveBeenCalledTimes(1)
    await tick()
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it("computeds are lazy, cached and synchronous", () => {
    const a = signal(2)
    const fn = vi.fn(() => a() * 2)
    const double = computed(fn)
    expect(fn).not.toHaveBeenCalled()
    expect(double()).toBe(4)
    expect(double()).toBe(4)
    expect(fn).toHaveBeenCalledTimes(1)
    a.set(5)
    expect(double()).toBe(10)
  })

  it("disposes nested effects before a re-run", () => {
    const outer = signal(0)
    const inner = signal(0)
    const innerRuns = vi.fn()
    root(() =>
      effect(() => {
        outer()
        effect(() => innerRuns(inner()))
      })
    )
    outer.set(1)
    flush()
    inner.set(1)
    flush()
    // 1 initial + 1 recreated after outer changed + 1 after inner changed (old copy is gone)
    expect(innerRuns).toHaveBeenCalledTimes(3)
  })

  it("root dispose stops effects", () => {
    const s = signal(0)
    const fn = vi.fn(() => s())
    const dispose = root((d) => {
      effect(fn)
      return d
    })
    dispose()
    s.set(1)
    flush()
    expect(fn).toHaveBeenCalledTimes(1)
  })
})

describe("html", () => {
  it("renders interpolated text as text (no HTML injection)", () => {
    const host = document.createElement("div")
    render(html`<p>${'<img src=x onerror="alert(1)">'}</p>`, host)
    expect(host.querySelector("img")).toBeNull()
    expect(host.querySelector("p")!.textContent).toBe('<img src=x onerror="alert(1)">')
  })

  it("binds attributes, booleans, properties and events", () => {
    const host = document.createElement("div")
    const clicked = vi.fn()
    render(
      html`<input
        class=${"a"}
        title="${"quoted"}"
        ?disabled=${true}
        .value=${"v"}
        data-x=${null}
      /><button @click=${clicked}></button>`,
      host
    )
    const input = host.querySelector("input")!
    expect(input.className).toBe("a")
    expect(input.title).toBe("quoted")
    expect(input.disabled).toBe(true)
    expect(input.value).toBe("v")
    expect(input.hasAttribute("data-x")).toBe(false)
    host.querySelector("button")!.click()
    expect(clicked).toHaveBeenCalled()
  })

  it("updates only the bound part when a signal changes", () => {
    const host = document.createElement("div")
    const count = signal(1)
    root(() => render(html`<span>${count}</span><b>${() => count() * 2}</b>`, host))
    const span = host.querySelector("span")!
    const textNode = span.lastChild
    count.set(2)
    flush()
    expect(span.textContent).toBe("2")
    expect(host.querySelector("b")!.textContent).toBe("4")
    expect(span.lastChild).toBe(textNode)
  })

  it("switches nested templates and cleans up the old one", () => {
    const host = document.createElement("div")
    const on = signal(true)
    const inner = signal("x")
    root(() => render(html`<div>${() => (on() ? html`<i>${inner}</i>` : "off")}</div>`, host))
    expect(host.textContent).toBe("x")
    on.set(false)
    flush()
    expect(host.textContent).toBe("off")
    inner.set("y")
    flush()
    expect(host.textContent).toBe("off")
  })

  it("keyed repeat keeps row nodes on reorder", () => {
    const host = document.createElement("ul")
    const items = signal([{ id: 1 }, { id: 2 }, { id: 3 }])
    root(() =>
      render(
        repeat(
          items,
          (i) => i.id,
          (i) => html`<li>${i.id}</li>`
        ),
        host
      )
    )
    const [a, b, c] = Array.from(host.children)
    items.set([items.peek()[2], items.peek()[0], items.peek()[1]])
    flush()
    expect(Array.from(host.children)).toEqual([c, a, b])
    expect(host.textContent).toBe("312")
    items.set([items.peek()[1]])
    flush()
    expect(Array.from(host.children)).toEqual([a])
  })

  it("event modifiers: .self ignores bubbled events, .prevent, .stop, .once", () => {
    const calls: string[] = []
    const host = document.createElement("div")
    document.body.append(host)
    render(
      html`<section id="outer" @change.self=${() => calls.push("self")} @click.once=${() => calls.push("once")}>
        <input id="inner" />
        <a id="link" href="#x" @click.prevent.stop=${(e: Event) => calls.push(`prevented:${e.defaultPrevented}`)}>x</a>
      </section>`,
      host
    )
    const outer = host.querySelector("#outer")!
    host.querySelector("#inner")!.dispatchEvent(new Event("change", { bubbles: true }))
    expect(calls).toEqual([]) // bubbled from the input: ignored
    outer.dispatchEvent(new Event("change"))
    expect(calls).toEqual(["self"])
    const bubbledToOuter = vi.fn()
    outer.addEventListener("click", bubbledToOuter)
    host.querySelector<HTMLElement>("#link")!.click()
    expect(calls).toEqual(["self", "prevented:true"])
    expect(bubbledToOuter).not.toHaveBeenCalled() // .stop
    ;(outer as HTMLElement).click()
    ;(outer as HTMLElement).click()
    expect(calls.filter((c) => c === "once")).toHaveLength(1)
    host.remove()
  })

  it("rejects partial attribute bindings with a clear error", () => {
    expect(() => render(html`<p class="a ${"b"}"></p>`, document.createElement("div"))).toThrow(
      /whole attribute values/
    )
  })
})

describe("define", () => {
  const Greeting = define("t-greeting", {
    props: { name: prop.string("World", { reflect: true }), count: prop.number(0), active: prop.boolean() },
    setup: (props) => html`<span>${() => `Hello ${props.name()} ${props.count()}`}</span>`,
  })
  type Greeting = InstanceType<typeof Greeting>

  it("uses attributes present in markup (old bug #1)", () => {
    document.body.innerHTML = `<t-greeting name="Developer" count="3"></t-greeting>`
    const el = document.querySelector("t-greeting") as Greeting
    expect(el.name).toBe("Developer")
    expect(el.count).toBe(3)
    expect(el.textContent).toBe("Hello Developer 3")
  })

  it("works with document.createElement (old bug #2)", () => {
    const el = document.createElement("t-greeting") as Greeting
    expect(el).toBeInstanceOf(Greeting)
    el.name = "Created"
    document.body.append(el)
    expect(el.textContent).toBe("Hello Created 0")
    expect(el.getAttribute("name")).toBe("Created")
  })

  it("keeps falsy defaults and parses attributes without silent rounding", () => {
    const el = document.createElement("t-greeting") as Greeting
    expect(el.count).toBe(0)
    expect(el.active).toBe(false)
    el.setAttribute("count", "1.23456789")
    expect(el.count).toBe(1.23456789)
    el.setAttribute("count", "abc")
    expect(el.count).toBe(0)
  })

  it("picks up properties assigned before the element was defined", () => {
    const el = document.createElement("t-late") as BazElement & { label: string }
    el.label = "early"
    document.body.append(el)
    define("t-late", { props: { label: prop.string() }, setup: (p) => html`${p.label}` })
    expect(el.textContent).toBe("early")
  })

  it("survives moves and disposes after removal", async () => {
    const el = document.createElement("t-greeting") as Greeting
    document.body.append(el)
    el.count = 5
    const div = document.body.appendChild(document.createElement("div"))
    div.append(el)
    await tick()
    flush()
    expect(el.textContent).toBe("Hello World 5")
    el.remove()
    await tick()
    el.count = 6
    flush()
    expect(el.textContent).toBe("Hello World 5")
    document.body.append(el)
    expect(el.textContent).toBe("Hello World 6")
  })

  it("subclass-like components do not share prop definitions", () => {
    const A = define("t-a", { props: { a: prop.string("a") }, setup: () => undefined })
    const B = define("t-b", { props: { b: prop.string("b") }, setup: () => undefined })
    expect(A.observedAttributes).toEqual(["a"])
    expect(B.observedAttributes).toEqual(["b"])
  })

  it("projects light-DOM children through ctx.slot", () => {
    define("t-card", {
      setup: (_p, ctx) => html`<header>${ctx.slot("title")}</header><main>${ctx.slot()}</main>`,
    })
    document.body.innerHTML = `<t-card><b slot="title">T</b><p>Body</p></t-card>`
    const card = document.querySelector("t-card")!
    expect(card.querySelector("header > b")!.textContent).toBe("T")
    expect(card.querySelector("main > p")!.textContent).toBe("Body")
  })
})
