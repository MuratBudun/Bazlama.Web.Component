import { define, effect, onCleanup, prop, render, root, signal, untrack, type Cleanup, type Signal } from "@bazlama/core"
import { createPageContext } from "./page"
import { createRouter, defaultRouter, type RouteRecord, type Router, type RouterState } from "./router"

/**
 * <bz-router> — declarative router. Routes come from the `routes` property (JavaScript
 * array) or from child <bz-route> elements:
 *
 *   <bz-router mode="path" base="/" title-template="{title} · Uygulama">
 *     <bz-route path="/" page="home-page"></bz-route>
 *     <bz-route path="/customers/:id" page="customer-page" title="Müşteri"></bz-route>
 *     <bz-route path="/settings" page="settings-layout">
 *       <bz-route path="profile" page="profile-page"></bz-route>
 *     </bz-route>
 *     <bz-route path="*" page="not-found-page"></bz-route>
 *     … <bz-outlet></bz-outlet> …
 *   </bz-router>
 *
 * `page` is a custom element tag; it receives the `params`, `query` (object), `data` and
 * `route` (page context) properties. Guards and load() need the JavaScript form.
 */

type RouterHost = HTMLElement & { router: Router | null }

export const RouteElement = define("bz-route", {
  setup(_, { host }) {
    host.hidden = true
  },
})

function readRoutes(parent: Element): RouteRecord[] {
  return Array.from(parent.children)
    .filter((el) => el.localName === "bz-route")
    .map((el) => ({
      path: el.getAttribute("path") ?? "",
      page: el.getAttribute("page") ?? undefined,
      title: el.getAttribute("title") ?? undefined,
      redirect: el.getAttribute("redirect") ?? undefined,
      remount: el.hasAttribute("remount"),
      children: readRoutes(el),
    }))
}

export const RouterElement = define("bz-router", {
  props: {
    routes: prop.object<RouteRecord[] | null>(null),
    mode: prop.string<"path" | "hash">("path"),
    base: prop.string("/"),
    titleTemplate: prop.string(),
    /** The running router (read-only). */
    router: prop.object<Router | null>(null),
  },
  setup(props, { host }) {
    const template = props.titleTemplate.peek()
    const router = createRouter({
      routes: props.routes.peek() ?? readRoutes(host),
      mode: props.mode.peek(),
      base: props.base.peek(),
      titleTemplate: template ? (t) => template.replace("{title}", t) : undefined,
    })
    props.router.set(router)
    void router.start()
    onCleanup(() => {
      router.stop()
      props.router.set(null)
    })
  },
})

/**
 * <bz-outlet> — renders the page matched at its depth: the first outlet shows the top-level
 * route, an outlet inside that page (a layout) shows the child route, and so on.
 */
export const Outlet = define("bz-outlet", {
  setup(_, { host }) {
    let depth = 0
    for (let el = host.parentElement?.closest("bz-outlet"); el; el = el.parentElement?.closest("bz-outlet")) depth++
    host.setAttribute("data-depth", String(depth))

    const routerOf = () => (host.closest("bz-router") as RouterHost | null)?.router ?? defaultRouter()
    let mounted: { record: RouteRecord; key: string; page: unknown; state: Signal<RouterState>; dispose: Cleanup } | null = null
    const unmount = () => {
      mounted?.dispose()
      mounted = null
      host.replaceChildren()
    }

    effect(() => {
      const router = routerOf()
      const state = router?.current()
      if (!router || !state) return
      const record = state.matched[depth]
      const page = record ? state.pages.get(record) : undefined
      const key = record?.remount ? JSON.stringify(state.params) : ""
      if (mounted && record === mounted.record && key === mounted.key && page === mounted.page) {
        mounted.state.set(state)
        return
      }
      untrack(() => {
        unmount()
        if (!record || !page) return
        const pageState = signal(state)
        const dispose = root((d) => {
          const ctx = createPageContext(router, pageState, record)
          host.setAttribute("data-route", record.path)
          if (typeof page === "string") {
            const el = document.createElement(page) as HTMLElement & Record<string, unknown>
            effect(() => {
              const s = pageState()
              el.params = s.params
              el.query = Object.fromEntries(s.query)
              el.data = s.data.get(record)
              el.route = ctx
            })
            host.append(el)
          } else {
            try {
              render(page.setup(ctx), host)
            } catch (error) {
              console.error(`bazlama router: page for "${record.path}" failed`, error)
            }
          }
          return d
        })
        mounted = { record, key, page, state: pageState, dispose }
      })
    })
    onCleanup(unmount)
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "bz-router": InstanceType<typeof RouterElement>
    "bz-route": InstanceType<typeof RouteElement>
    "bz-outlet": InstanceType<typeof Outlet>
  }
}
