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

  it("a computed that keeps its value does not re-run its effects", () => {
    const list = signal([1, 2])
    const any = computed(() => list().length > 0)
    const runs = vi.fn(() => any())
    root(() => effect(runs))
    expect(runs).toHaveBeenCalledTimes(1)
    list.set([1, 2, 3])
    flush()
    expect(runs).toHaveBeenCalledTimes(1)
    list.set([])
    flush()
    expect(runs).toHaveBeenCalledTimes(2)
    expect(runs).toHaveLastReturnedWith(false)
  })

  it("the cut-off works through chains of computeds and mixed dependencies", () => {
    const n = signal(1)
    const other = signal("a")
    const parity = computed(() => n() % 2)
    const label = computed(() => (parity() ? "tek" : "çift"))
    const runs = vi.fn(() => `${label()} ${other()}`)
    root(() => effect(runs))
    n.set(3)
    flush()
    expect(runs).toHaveBeenCalledTimes(1)
    // A direct signal change still runs the effect, even with an unchanged computed beside it.
    n.set(5)
    other.set("b")
    flush()
    expect(runs).toHaveBeenCalledTimes(2)
    expect(runs).toHaveLastReturnedWith("tek b")
    n.set(6)
    flush()
    expect(runs).toHaveLastReturnedWith("çift b")
    expect(runs).toHaveBeenCalledTimes(3)
  })

  it("an effect reading a stale computed for the first time runs once", () => {
    const a = signal(1)
    const double = computed(() => a() * 2)
    expect(double()).toBe(2)
    a.set(2)
    const runs = vi.fn(() => double())
    root(() => effect(runs))
    flush()
    expect(runs).toHaveBeenCalledTimes(1)
    expect(runs).toHaveLastReturnedWith(4)
  })

  it("a computed is not recomputed by a check when nothing it reads changed", () => {
    const a = signal(1)
    const b = signal(1)
    const fromB = vi.fn(() => b() + 1)
    const cb = computed(fromB)
    const sum = computed(() => a() + cb())
    const runs = vi.fn(() => sum())
    root(() => effect(runs))
    a.set(2)
    flush()
    expect(runs).toHaveBeenCalledTimes(2)
    expect(fromB).toHaveBeenCalledTimes(1)
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

  it("keyed repeat moves only the rows that changed place, and inserts new neighbours together", () => {
    const host = document.createElement("ul")
    const make = (n: number, from = 0) => Array.from({ length: n }, (_, i) => ({ id: from + i }))
    const items = signal(make(100))
    root(() => render(repeat(items, (i) => i.id, (i) => html`<li>${i.id}</li>`), host))
    const ids = () => Array.from(host.children, (li) => Number(li.textContent))
    const insertions = vi.spyOn(host, "insertBefore")
    const apply = (next: { id: number }[]) => {
      insertions.mockClear()
      items.set(next)
      flush()
      expect(ids()).toEqual(next.map((i) => i.id))
      return insertions.mock.calls.length
    }

    // Two rows swapped: two moves, the other 98 stay.
    const swapped = [...items.peek()]
    ;[swapped[1], swapped[98]] = [swapped[98], swapped[1]]
    const rows = Array.from(host.children)
    expect(apply(swapped)).toBe(2)
    expect(host.children[1]).toBe(rows[98])
    expect(host.children[50]).toBe(rows[50])

    // Fifty rows appended: one insertion (a fragment).
    expect(apply([...swapped, ...make(50, 100)])).toBe(1)
    // A row moved to the front, one removed, two new ones in the middle.
    const mixed = [...items.peek()]
    mixed.unshift(mixed.splice(120, 1)[0])
    mixed.splice(30, 1)
    mixed.splice(60, 0, { id: 500 }, { id: 501 })
    expect(apply(mixed)).toBe(2)
    // Everything replaced: one insertion. Reversed: one row stays, the other 39 are neighbours
    // again and go in together.
    expect(apply(make(40, 1000))).toBe(1)
    const kept = host.children[39]
    expect(apply([...items.peek()].reverse())).toBe(1)
    expect(host.children[0]).toBe(kept)

    // Any reordering ends in the right order with the same nodes.
    let seed = 7
    const random = (n: number) => (seed = (seed * 16807) % 2147483647) % n
    for (let round = 0; round < 30; round++) {
      const next = [...items.peek()].filter(() => random(5) > 0)
      for (let i = next.length - 1; i > 0; i--) {
        const j = random(i + 1)
        if (random(3) === 0) [next[i], next[j]] = [next[j], next[i]]
      }
      for (let k = random(4); k > 0; k--) next.splice(random(next.length + 1), 0, { id: 2000 + round * 10 + k })
      const before = new Map(Array.from(host.children, (li) => [Number(li.textContent), li]))
      apply(next)
      for (const li of Array.from(host.children)) {
        const was = before.get(Number(li.textContent))
        if (was) expect(li).toBe(was)
      }
    }
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
