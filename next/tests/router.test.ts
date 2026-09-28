import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { flush, html, prop, define } from "@bazlama/core"
import { compilePath, createRouter, definePage, fillPath, matchPath, type Router, type RouteRecord } from "@bazlama/router"
import { installFakeNavigation, type FakeNavigation } from "./fake-navigation"

const settle = async () => {
  for (let i = 0; i < 6; i++) {
    await new Promise<void>((r) => setTimeout(r))
    flush()
  }
}

describe("path matching", () => {
  it("matches params, optional segments and rest", () => {
    expect(matchPath(compilePath("/customers/:id"), "/customers/42")).toEqual({ id: "42" })
    expect(matchPath(compilePath("/customers/:id"), "/customers/42/")).toEqual({ id: "42" })
    expect(matchPath(compilePath("/customers/:id"), "/customers")).toBeNull()
    expect(matchPath(compilePath("/c/:id/:tab?"), "/c/1")).toEqual({ id: "1" })
    expect(matchPath(compilePath("/c/:id/:tab?"), "/c/1/orders")).toEqual({ id: "1", tab: "orders" })
    expect(matchPath(compilePath("/files/*path"), "/files/a/b%20c")).toEqual({ path: "a/b c" })
    expect(matchPath(compilePath("*"), "/anything/at/all")).toEqual({ "*": "anything/at/all" })
    expect(matchPath(compilePath("/"), "/")).toEqual({})
    expect(fillPath("/customers/:id/:tab?", { id: 7 })).toBe("/customers/7")
  })
})

// ---------------------------------------------------------------------------------------

let nav: FakeNavigation
let router: Router | null = null

beforeEach(() => {
  history.replaceState(null, "", "/")
  nav = installFakeNavigation()
  document.body.replaceChildren()
})
afterEach(() => {
  router?.stop()
  router = null
})

async function start(routes: RouteRecord[], extra: Partial<Parameters<typeof createRouter>[0]> = {}) {
  router = createRouter({ routes, ...extra })
  document.body.innerHTML = `<main><bz-outlet></bz-outlet></main>`
  await router.start()
  await settle()
  return router
}
const text = () => document.querySelector("bz-outlet")!.textContent!.replace(/\s+/g, " ").trim()

describe("router", () => {
  const Home = definePage({ title: "Ana sayfa", setup: () => html`<h1>Ana sayfa</h1>` })
  const Customer = definePage({
    title: (s) => `Müşteri ${s.params.id}`,
    setup: (ctx) => html`<h1>Müşteri ${() => ctx.params().id}</h1><p>sekme=${() => ctx.query.get("tab") ?? "-"}</p>`,
  })

  it("renders the matched page and updates on navigate(); URL, title, aria-current", async () => {
    await start([
      { path: "/", page: Home },
      { path: "/customers/:id", page: Customer },
    ], { titleTemplate: (t) => `${t} · Test` })
    expect(text()).toBe("Ana sayfa")
    expect(document.title).toBe("Ana sayfa · Test")

    const link = document.body.appendChild(Object.assign(document.createElement("a"), { href: "/customers/7" }))
    expect(await router!.navigate("/customers/7?tab=orders")).toBe(true)
    await settle()
    expect(location.pathname + location.search).toBe("/customers/7?tab=orders")
    expect(text()).toBe("Müşteri 7sekme=orders")
    expect(document.title).toBe("Müşteri 7 · Test")
    expect(link.getAttribute("aria-current")).toBe("page")
    expect(document.activeElement!.textContent).toBe("Müşteri 7") // focus moved to the heading
    // The first event was cancelled and re-issued with the prepared result.
    expect(nav.log.map((l) => [l.type, l.prevented, l.intercepted])).toEqual([
      ["push", true, false],
      ["push", false, true],
    ])
  })

  it("keeps the page when only params change (signals update), remounts with remount: true", async () => {
    let setups = 0
    const Counted = definePage({
      setup: (ctx) => {
        setups++
        return html`<p>${() => ctx.params().id}</p>`
      },
    })
    await start([{ path: "/c/:id", page: Counted }, { path: "/r/:id", page: Counted, remount: true }])
    await router!.navigate("/c/1")
    await router!.navigate("/c/2")
    await settle()
    expect(text()).toBe("2")
    expect(setups).toBe(1)
    await router!.navigate("/r/1")
    await router!.navigate("/r/2")
    await settle()
    expect(setups).toBe(3)
  })

  it("query helper: typed reads and set() replaces the entry", async () => {
    let q!: import("@bazlama/router").Query
    await start([{ path: "/list", page: definePage({ setup: (ctx) => ((q = ctx.query), html`<p>${() => q.number("page", 1)}</p>`) }) }])
    await router!.navigate("/list?page=3&debug=0")
    await settle()
    expect(q.number("page")).toBe(3)
    expect(q.boolean("debug", true)).toBe(false)
    expect(q.number("missing", 9)).toBe(9)
    const entries = nav.entries.length
    await q.set({ page: 4, sort: "name", debug: null })
    await settle()
    expect(location.search).toBe("?page=4&sort=name")
    expect(nav.entries.length).toBe(entries) // replaced, not pushed
    expect(text()).toBe("4")
  })

  it("nested layouts render children in the inner outlet; index routes", async () => {
    const Layout = definePage({ setup: () => html`<nav>Ayarlar</nav><bz-outlet></bz-outlet>` })
    await start([
      {
        path: "/settings",
        page: Layout,
        children: [
          { path: "", page: definePage({ setup: () => html`<p>genel</p>` }) },
          { path: "profile", page: definePage({ setup: () => html`<p>profil</p>` }) },
        ],
      },
    ])
    await router!.navigate("/settings")
    await settle()
    expect(text()).toBe("Ayarlargenel")
    const layoutNav = document.querySelector("bz-outlet nav")
    await router!.navigate("/settings/profile")
    await settle()
    expect(text()).toBe("Ayarlarprofil")
    expect(document.querySelector("bz-outlet nav")).toBe(layoutNav) // layout kept
    expect(document.querySelector("bz-outlet bz-outlet")!.getAttribute("data-depth")).toBe("1")
  })

  it("lazy pages, load() data, and aborting a stale navigation", async () => {
    const loads: string[] = []
    const Detail = definePage<{ name: string }>({
      load: async ({ params, signal }) => {
        loads.push(params.id)
        await new Promise((r) => setTimeout(r, params.id === "slow" ? 30 : 1))
        if (signal.aborted) throw new DOMException("aborted", "AbortError")
        return { name: `Kayıt ${params.id}` }
      },
      setup: (ctx) => html`<p>${() => ctx.data().name}</p>`,
    })
    await start([{ path: "/d/:id", page: async () => ({ default: Detail }) }])
    const slow = router!.navigate("/d/slow")
    const fast = router!.navigate("/d/fast")
    await Promise.all([slow, fast])
    await new Promise((r) => setTimeout(r, 50))
    await settle()
    expect(loads).toEqual(["slow", "fast"])
    expect(text()).toBe("Kayıt fast")
    expect(location.pathname).toBe("/d/fast")
  })

  it("beforeEnter: false cancels (URL unchanged), a string redirects", async () => {
    let allowed = false
    await start([
      { path: "/", page: Home },
      { path: "/login", page: definePage({ setup: () => html`<p>giriş</p>` }) },
      { path: "/admin", page: definePage({ setup: () => html`<p>admin</p>` }), beforeEnter: () => (allowed ? true : "/login") },
      { path: "/closed", page: Home, beforeEnter: () => false },
    ])
    expect(await router!.navigate("/closed")).toBe(false)
    expect(location.pathname).toBe("/")
    await router!.navigate("/admin")
    await settle()
    expect(location.pathname).toBe("/login")
    allowed = true
    await router!.navigate("/admin")
    await settle()
    expect(text()).toBe("admin")
  })

  it("leave guards: page onBeforeLeave can refuse (async), and are removed with the page", async () => {
    let dirty = true
    const Edit = definePage({
      setup: (ctx) => {
        ctx.onBeforeLeave(async () => !dirty)
        return html`<p>form</p>`
      },
    })
    await start([{ path: "/", page: Home }, { path: "/edit", page: Edit }])
    await router!.navigate("/edit")
    expect(await router!.navigate("/")).toBe(false)
    expect(location.pathname).toBe("/edit")
    dirty = false
    expect(await router!.navigate("/")).toBe(true)
    dirty = true
    expect(await router!.navigate("/edit")).toBe(true)
    expect(await router!.navigate("/")).toBe(false) // the new page instance guards again
  })

  it("back/forward: cancelable traversal is prepared then re-issued; refused non-cancelable goes back", async () => {
    let block = false
    router = createRouter({ routes: [{ path: "/", page: Home }, { path: "/c/:id", page: Customer }] })
    router.beforeLeave(() => !block)
    document.body.innerHTML = `<bz-outlet></bz-outlet>`
    await router.start()
    await router.navigate("/c/1")
    await router.navigate("/c/2")
    router.back()
    await settle()
    expect(location.pathname).toBe("/c/1")
    expect(text()).toBe("Müşteri 1sekme=-")

    nav.cancelableTraversals = false
    block = true
    router.back() // "/" → refused: return to /c/1
    await settle()
    expect(location.pathname).toBe("/c/1")
  })

  it("not found, error page, redirect route", async () => {
    await start(
      [
        { path: "/", redirect: "/home" },
        { path: "/home", page: Home },
        { path: "/broken", page: definePage({ load: () => Promise.reject(new Error("boom")), setup: () => html`x` }) },
      ],
      {
        notFound: definePage({ title: "Bulunamadı", setup: (ctx) => html`<p>404 ${() => ctx.path()}</p>` }),
        errorPage: definePage({ setup: (ctx) => html`<p>hata: ${() => String((ctx.error() as Error).message)}</p>` }),
      }
    )
    expect(location.pathname).toBe("/home")
    await router!.navigate("/nope")
    await settle()
    expect(text()).toBe("404 /nope")
    await router!.navigate("/broken")
    await settle()
    expect(text()).toBe("hata: boom")
  })

  it("custom element pages receive params, query and data", async () => {
    define("test-customer-page", {
      props: { params: prop.object<Record<string, string>>({}), query: prop.object<Record<string, string>>({}) },
      setup: (props) => html`<p>${() => props.params().id}/${() => props.query().tab ?? ""}</p>`,
    })
    await start([{ path: "/x/:id", page: "test-customer-page" }])
    await router!.navigate("/x/5?tab=info")
    await settle()
    expect(text()).toBe("5/info")
  })

  it("<bz-router> with <bz-route> children", async () => {
    define("test-home-page", { setup: () => html`<p>ev</p>` })
    define("test-about-page", { setup: () => html`<p>hakkında</p>` })
    document.body.innerHTML = `
      <bz-router title-template="{title} | HTML">
        <bz-route path="/" page="test-home-page" title="Ev"></bz-route>
        <bz-route path="/about" page="test-about-page" title="Hakkında"></bz-route>
        <bz-outlet></bz-outlet>
      </bz-router>`
    await settle()
    const el = document.querySelector("bz-router")!
    expect(text()).toBe("ev")
    expect(document.title).toBe("Ev | HTML")
    await el.router!.navigate("/about")
    await settle()
    expect(text()).toBe("hakkında")
    el.remove()
    await settle()
  })

  it("hash mode reads the route from the fragment", async () => {
    history.replaceState(null, "", "/app/#/customers/3?tab=a")
    nav = installFakeNavigation()
    await start([{ path: "/customers/:id", page: Customer }], { mode: "hash", base: "/app" })
    expect(text()).toBe("Müşteri 3sekme=a")
    expect(router!.href("/customers/4")).toBe("/app/#/customers/4")
    await router!.navigate("/customers/4")
    await settle()
    expect(location.hash).toBe("#/customers/4")
    expect(text()).toBe("Müşteri 4sekme=-")
  })

  it("isActive and href with base", async () => {
    history.replaceState(null, "", "/app/customers/1")
    nav = installFakeNavigation()
    await start([{ path: "/customers/:id", page: Customer }], { base: "/app" })
    expect(router!.href({ path: "/customers/2", query: { tab: "x", empty: "" } })).toBe("/app/customers/2?tab=x")
    expect(router!.isActive("/customers")).toBe(true)
    expect(router!.isActive("/customers", true)).toBe(false)
    expect(text()).toBe("Müşteri 1sekme=-")
  })

  it("errors clearly without the Navigation API", () => {
    delete (globalThis as { navigation?: unknown }).navigation
    const r = createRouter({ routes: [] })
    return expect(r.start()).rejects.toThrow(/Navigation API/)
  })
})

vi.setConfig({ testTimeout: 10000 })
