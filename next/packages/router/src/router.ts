import { flush, signal, type ReadSignal } from "@bazlama/core"
import { compareScores, compilePath, joinPaths, matchPath, normalizePath, type CompiledPath, type Params } from "./match"
import type { PageDef } from "./page"

/**
 * Client-side router on the Navigation API.
 *
 * - Every same-origin navigation (links, forms without data, back/forward, navigate())
 *   arrives as one `navigate` event. The router cancels it, runs the leave guards, the
 *   enter guards, lazy imports and page `load()`s, and only then re-issues it with the
 *   prepared result: the URL changes when the new page is ready, a refused guard leaves
 *   everything untouched, and a newer navigation cancels an older one (AbortSignal).
 * - Back/forward (traversals) are not canceled: the URL changes at once and the page is
 *   prepared afterwards; a refusal goes back to the old entry. (Chrome rejects re-issuing a
 *   canceled traversal.)
 * - Scrolling: when the page scrolls inside an element (an app frame such as
 *   <bz-shell scroll-mode="content">, found as the outlet's `[data-scroll-container]` ancestor, or
 *   `scrollElement`), the router does what the browser does for the document: a new page
 *   starts at the top, back/forward and reload return to the saved position (per history
 *   entry, kept in sessionStorage), `#id` scrolls to the element, and a same-page replace
 *   (e.g. a query change) keeps the position. Otherwise the browser handles the document.
 * - Focus moves to the new page's heading and the title is announced.
 */

export type PageSource = PageDef<any> | string | (() => Promise<PageDef<any> | string | { default: PageDef<any> | string }>)

export interface RouteInfo {
  url: URL
  /** Route path (without base; in hash mode the part after "#"). */
  path: string
  params: Params
  query: URLSearchParams
  hash: string
  state: unknown
  matched: RouteRecord[]
}

type GuardResult = boolean | string | void | undefined
export type Guard = (to: RouteInfo, from: RouteInfo | null) => GuardResult | Promise<GuardResult>
export type LeaveGuard = (to: RouteInfo, from: RouteInfo) => boolean | void | Promise<boolean | void>

export interface RouteRecord {
  path: string
  /** A page definition, a custom element tag, or a lazy import of one. */
  page?: PageSource
  title?: string | ((to: RouteInfo) => string)
  children?: RouteRecord[]
  redirect?: string | ((to: RouteInfo) => string)
  /** Runs before entering; false cancels, a string redirects. */
  beforeEnter?: Guard
  /** Re-create the page when params change (default: keep it and update its signals). */
  remount?: boolean
  meta?: Record<string, unknown>
}

export interface RouterOptions {
  routes: RouteRecord[]
  /** "path" (default): /customers/1. "hash": #/customers/1 (no server configuration). */
  mode?: "path" | "hash"
  /** Base path of the application (path mode), e.g. "/app". */
  base?: string
  /** Formats document.title, e.g. (t) => `${t} · Bazlama`. */
  titleTemplate?: (title: string) => string
  /** Rendered when a page throws or its load() rejects. */
  errorPage?: PageSource
  /** Rendered when no route matches (a "*" route works too). */
  notFound?: PageSource
  /** Move focus to the new page's heading after navigation (default true). */
  focus?: boolean
  /**
   * The element the pages scroll in. Default: the top outlet's `[data-scroll-container]`
   * ancestor (e.g. <bz-shell scroll-mode="content">'s <main>); none → the document (browser).
   */
  scrollElement?: Element | (() => Element | null) | null
}

/** How the current page was reached ("initial": the router started on it). */
type NavigationKind = "push" | "replace" | "reload" | "traverse" | "initial"

export interface NavigateTarget {
  path?: string
  query?: Record<string, string | number | boolean | null | undefined> | URLSearchParams | string
  hash?: string
}

export interface NavigateOptions {
  replace?: boolean
  state?: unknown
}

export interface RouterState extends RouteInfo {
  pages: Map<RouteRecord, PageDef<any> | string>
  data: Map<RouteRecord, unknown>
  /** Error of a failed load/page, with the depth where it should be shown. */
  error: { error: unknown; depth: number } | null
}

interface Branch {
  chain: RouteRecord[]
  compiled: CompiledPath
}

interface Prepared {
  state: RouterState
  token: number
}

const PREPARED = Symbol("bz-router-prepared")

export interface Router {
  /** Current route (reactive). null until the first navigation finished. */
  current: ReadSignal<RouterState | null>
  /** True while a navigation is being prepared (guards, imports, loads). */
  pending: ReadSignal<boolean>
  navigate(to: string | NavigateTarget, options?: NavigateOptions): Promise<boolean>
  back(): void
  forward(): void
  reload(): Promise<boolean>
  /** URL for an in-app path (adds base or "#"). Use it for hrefs. */
  href(to: string | NavigateTarget): string
  /** Reactive: does the current path match `path` (exactly, or as a prefix)? */
  isActive(path: string, exact?: boolean): boolean
  /** Global guards; each returns a remover. */
  beforeEach(guard: Guard): () => void
  beforeLeave(guard: LeaveGuard): () => void
  afterEach(hook: (to: RouteInfo, from: RouteInfo | null) => void): () => void
  resolve(url: URL | string): RouteInfo
  start(): Promise<void>
  stop(): void
  readonly options: RouterOptions
}

// The router outlets use when they are not inside a <bz-router>.
const activeRouter = signal<Router | null>(null)
export const defaultRouter: ReadSignal<Router | null> = activeRouter

const isPageDef = (v: unknown): v is PageDef<any> => typeof v === "object" && v !== null && "setup" in v

export async function resolvePage(source: PageSource): Promise<PageDef<any> | string> {
  if (typeof source !== "function") return source
  const loaded = await source()
  return typeof loaded === "object" && loaded !== null && "default" in loaded && !isPageDef(loaded) ? loaded.default : loaded
}

function flattenRoutes(routes: RouteRecord[], parentPath = "/", parents: RouteRecord[] = []): Branch[] {
  const out: Branch[] = []
  for (const route of routes) {
    const full = joinPaths(parentPath, route.path)
    const chain = [...parents, route]
    // Children first: an index child (path "") wins over the bare layout.
    if (route.children?.length) out.push(...flattenRoutes(route.children, full, chain))
    out.push({ chain, compiled: compilePath(full) })
  }
  return out
}

let announcer: HTMLElement | null = null
function announce(text: string): void {
  if (!announcer?.isConnected) {
    announcer = document.createElement("div")
    announcer.setAttribute("aria-live", "polite")
    announcer.setAttribute("data-bz-route-announcer", "")
    announcer.style.cssText = "position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap"
    document.body.append(announcer)
  }
  announcer.textContent = ""
  // A separate task, so the change is announced even when the text repeats.
  setTimeout(() => announcer && (announcer.textContent = text), 50)
}

export function createRouter(options: RouterOptions): Router {
  const mode = options.mode ?? "path"
  const base = normalizePath(options.base ?? "/")
  const branches = flattenRoutes(options.routes)
    .map((b, order) => ({ ...b, order }))
    .sort((a, b) => compareScores(a.compiled.score, b.compiled.score) || a.order - b.order)

  const current = signal<RouterState | null>(null)
  const pending = signal(false)
  const beforeEachGuards = new Set<Guard>()
  const leaveGuards = new Set<LeaveGuard>()
  const afterHooks = new Set<(to: RouteInfo, from: RouteInfo | null) => void>()
  let token = 0
  let controller: AbortController | null = null
  let started = false
  const waiters: ((ok: boolean) => void)[] = []
  const settle = (ok: boolean) => waiters.splice(0).forEach((w) => w(ok))

  // The router reports outcomes itself (settle); the promises of a navigation it cancels and
  // re-issues reject with AbortError, which must not surface as unhandled rejections.
  const quiet = (result: NavigationResult | undefined) => {
    result?.committed?.catch(() => {})
    result?.finished?.catch(() => {})
  }
  const nav = () => {
    if (typeof navigation === "undefined")
      throw new Error("bazlama router: the Navigation API is not available in this browser")
    return navigation
  }

  // ------------------------------------------------------------------ URLs
  const routePathOf = (url: URL) => {
    if (mode === "hash") return normalizePath(url.hash.slice(1).split("?")[0] || "/")
    const path = url.pathname
    if (base === "/") return normalizePath(path)
    return path.toLowerCase().startsWith(base.toLowerCase()) ? normalizePath(path.slice(base.length)) : normalizePath(path)
  }
  const queryOf = (url: URL) => new URLSearchParams(mode === "hash" ? (url.hash.split("?")[1] ?? "") : url.search)
  const hashOf = (url: URL) => (mode === "hash" ? "" : url.hash.slice(1))
  // Hash mode serves one document: only its own path is in scope (links to other pages of the
  // site are left to the browser). `base`, when given, names that path; else the current one.
  const documentPath = (path: string) => normalizePath(path.replace(/\/index\.html$/i, "")).toLowerCase()
  const hashDocument = mode === "hash" ? documentPath(options.base ?? location.pathname) : ""
  const inScope = (url: URL) =>
    url.origin === location.origin &&
    (mode === "hash" ? documentPath(url.pathname) === hashDocument : base === "/" || url.pathname.toLowerCase().startsWith(base.toLowerCase()))

  const href = (to: string | NavigateTarget): string => {
    let path: string
    let search = ""
    let hash = ""
    if (typeof to === "string") {
      const u = new URL(to, "http://x/")
      path = to.startsWith("/") ? u.pathname : joinPaths(current.peek()?.path ?? "/", u.pathname.slice(1))
      search = u.search.slice(1)
      hash = u.hash.slice(1)
    } else {
      path = to.path ?? current.peek()?.path ?? "/"
      if (to.query instanceof URLSearchParams) search = to.query.toString()
      else if (typeof to.query === "string") search = to.query.replace(/^\?/, "")
      else if (to.query) {
        const q = new URLSearchParams()
        for (const [k, v] of Object.entries(to.query)) if (v !== null && v !== undefined && v !== "") q.set(k, String(v))
        search = q.toString()
      }
      hash = to.hash?.replace(/^#/, "") ?? ""
    }
    path = normalizePath(path)
    if (mode === "hash") return `${hashDocument === "/" ? "/" : `${hashDocument}/`}#${path}${search ? `?${search}` : ""}`
    return `${base === "/" ? "" : base}${path}${search ? `?${search}` : ""}${hash ? `#${hash}` : ""}`
  }

  const resolve = (input: URL | string, state: unknown = undefined): RouteInfo => {
    const url = typeof input === "string" ? new URL(input, location.href) : input
    const path = routePathOf(url)
    let matched: RouteRecord[] = []
    let params: Params = {}
    for (const branch of branches) {
      const p = matchPath(branch.compiled, path)
      if (p) {
        matched = branch.chain
        params = p
        break
      }
    }
    return { url, path, params, query: queryOf(url), hash: hashOf(url), state, matched }
  }

  // ------------------------------------------------------------------ preparing
  type Outcome = { kind: "ok"; state: RouterState } | { kind: "cancel" } | { kind: "redirect"; to: string } | { kind: "stale" }

  const prepare = async (url: URL, state: unknown, isReload = false): Promise<Outcome> => {
    const my = ++token
    controller?.abort()
    const ctrl = (controller = new AbortController())
    const signal = ctrl.signal
    const from = current.peek()
    pending.set(true)
    const stale = () => my !== token || signal.aborted
    try {
      const to = resolve(url, state)

      // Leave guards (global and page ones) run when the page changes, not for query-only
      // changes such as paging or filters.
      if (from && (from.path !== to.path || isReload)) {
        for (const guard of leaveGuards) {
          if ((await guard(to, from)) === false) return { kind: "cancel" }
          if (stale()) return { kind: "stale" }
        }
      }

      if (!to.matched.length && options.notFound) to.matched = [{ path: "*", page: options.notFound }]

      for (const record of to.matched) {
        if (record.redirect) {
          const target = typeof record.redirect === "function" ? record.redirect(to) : record.redirect
          return { kind: "redirect", to: target }
        }
      }
      for (const guard of [...beforeEachGuards, ...to.matched.map((r) => r.beforeEnter).filter(Boolean)] as Guard[]) {
        const result = await guard(to, from)
        if (stale()) return { kind: "stale" }
        if (result === false) return { kind: "cancel" }
        if (typeof result === "string") return { kind: "redirect", to: result }
      }

      const pages = new Map<RouteRecord, PageDef<any> | string>()
      const data = new Map<RouteRecord, unknown>()
      let error: RouterState["error"] = null
      const sameData = from && !isReload && from.url.pathname === url.pathname && from.url.search === url.search

      await Promise.all(
        to.matched.map(async (record, depth) => {
          try {
            if (!record.page) return
            const page = from?.pages.get(record) ?? (await resolvePage(record.page))
            pages.set(record, page)
            if (typeof page === "string" || !page.load) return
            if (sameData && from!.data.has(record)) return data.set(record, from!.data.get(record))
            data.set(record, await page.load({ params: to.params, query: to.query, url: to.url, signal }))
          } catch (e) {
            if (signal.aborted) return
            if (!error || depth < error.depth) error = { error: e, depth }
          }
        })
      )
      if (stale()) return { kind: "stale" }
      if (error && options.errorPage) {
        const { depth } = error
        const record: RouteRecord = { path: "", page: options.errorPage }
        pages.set(record, await resolvePage(options.errorPage))
        to.matched = [...to.matched.slice(0, depth), record]
      }
      return { kind: "ok", state: { ...to, pages, data, error } }
    } catch (e) {
      if (stale()) return { kind: "stale" }
      throw e
    } finally {
      if (my === token) pending.set(false)
    }
  }

  // ------------------------------------------------------------------ scrolling (inner container)
  const SCROLL_KEY = "bz-router-scroll"
  const entryKey = () => (typeof navigation === "undefined" ? undefined : navigation.currentEntry?.key)
  const positions = new Map<string, number>(
    (() => {
      try {
        return JSON.parse(sessionStorage.getItem(SCROLL_KEY) ?? "[]") as [string, number][]
      } catch {
        return []
      }
    })()
  )
  const scrollBox = (): Element | null => {
    const option = options.scrollElement
    if (option !== undefined) return typeof option === "function" ? option() : option
    return document.querySelector("bz-outlet[data-depth=\"0\"]")?.closest("[data-scroll-container]") ?? null
  }
  const saveScroll = () => {
    const el = scrollBox()
    const key = entryKey()
    if (!el || !key) return
    positions.set(key, el.scrollTop)
    // Keep the most recent entries only.
    while (positions.size > 100) positions.delete(positions.keys().next().value!)
    try {
      sessionStorage.setItem(SCROLL_KEY, JSON.stringify([...positions]))
    } catch {
      /* storage unavailable */
    }
  }
  const restoreScroll = (next: RouterState, from: RouterState | null, type: NavigationKind) => {
    const el = scrollBox()
    if (!el) return
    const key = entryKey()
    if (type === "traverse" || type === "reload" || type === "initial") {
      const saved = key !== undefined ? positions.get(key) : undefined
      if (saved !== undefined) return void (el.scrollTop = saved)
      if (type !== "traverse") return
    }
    if (next.hash) {
      const target = document.getElementById(decodeURIComponent(next.hash.replace(/^#/, "")))
      if (target && el.contains(target)) return target.scrollIntoView({ block: "start" })
    }
    // A same-page replace (query/filter change) keeps the reader's place.
    const samePage = !!from && from.matched.length === next.matched.length && from.matched.every((r, i) => r === next.matched[i])
    if (type === "replace" && samePage) return
    el.scrollTop = 0
  }

  const apply = (next: RouterState, focus: boolean, type: NavigationKind = "push") => {
    const from = current.peek()
    current.set(next)
    flush()
    restoreScroll(next, from, type)
    const last = next.matched.at(-1)
    const page = last ? next.pages.get(last) : undefined
    const titleSource =
      last?.title ?? (page && typeof page !== "string" ? page.title : undefined)
    const title =
      typeof titleSource === "function"
        ? (titleSource as (x: any) => string)({ ...next, data: last ? next.data.get(last) : undefined })
        : titleSource
    if (title) document.title = options.titleTemplate ? options.titleTemplate(title) : title
    markActiveLinks()
    if (focus && from && (options.focus ?? true)) {
      // Focus the part that changed: the outlet at the first depth whose route differs (a
      // layout that stays keeps its heading), its [data-page-focus] or first heading.
      let depth = next.matched.findIndex((r, i) => from.matched[i] !== r)
      if (depth === -1) depth = next.matched.length - 1
      const outlet = document.querySelector<HTMLElement>(`bz-outlet[data-depth="${Math.max(depth, 0)}"]`)
      const target = outlet?.querySelector<HTMLElement>("[data-page-focus], h1, h2, h3") ?? outlet
      if (target) {
        if (!target.hasAttribute("tabindex")) target.tabIndex = -1
        target.focus({ preventScroll: true })
      }
      announce(title ?? document.title)
    }
    for (const hook of afterHooks) hook(next, from)
    settle(true)
  }

  // ------------------------------------------------------------------ navigate event
  const onNavigate = (event: Event) => {
    const e = event as NavigateEvent
    if (!e.canIntercept || e.downloadRequest !== null || e.formData) return
    const url = new URL(e.destination.url)
    if (!inScope(url)) return
    // Leaving the current entry (or re-issuing the same navigation): remember its position.
    saveScroll()
    // Path mode: fragment-only changes are the browser's (scroll to #id).
    if (mode === "path" && e.hashChange) return
    const info = e.info as { [PREPARED]?: Prepared } | undefined
    const prepared = info?.[PREPARED]

    if (prepared) {
      if (prepared.token !== token) return e.preventDefault()
      const type = e.navigationType
      e.intercept({ focusReset: "manual", scroll: "after-transition", handler: async () => apply(prepared.state, true, type) })
      return
    }

    const state = e.destination.getState()
    const isReload = e.navigationType === "reload"
    // Back/forward are never canceled and re-issued: Chrome rejects re-issuing a canceled
    // traversal (traverseTo: "Invalid key"), so the buttons did nothing. They commit at once and
    // are prepared afterwards (a refused guard goes back), like non-cancelable traversals.
    if (e.cancelable && e.navigationType !== "traverse") {
      e.preventDefault()
      const type = e.navigationType
      void prepare(url, state, isReload).then(
        (outcome) => {
          if (outcome.kind === "stale") return
          if (outcome.kind === "cancel") return settle(false)
          if (outcome.kind === "redirect") return quiet(nav().navigate(href(outcome.to), { history: "replace" }))
          const payload = { [PREPARED]: { state: outcome.state, token } satisfies Prepared }
          quiet(
            nav().navigate(url.href, {
              history: type === "push" && url.href !== location.href ? "push" : "replace",
              state,
              info: payload,
            })
          )
        },
        (error) => {
          settle(false)
          console.error("bazlama router: navigation failed", error)
        }
      )
      return
    }

    // Not cancelable: the URL changes now; prepare afterwards.
    const fromKey = nav().currentEntry?.key
    e.intercept({
      focusReset: "manual",
      scroll: "after-transition",
      handler: async () => {
        const outcome = await prepare(url, state, isReload)
        if (outcome.kind === "ok") apply(outcome.state, true, e.navigationType)
        else if (outcome.kind === "redirect") quiet(nav().navigate(href(outcome.to), { history: "replace" }))
        else if (outcome.kind === "cancel" && fromKey) quiet(nav().traverseTo(fromKey))
      },
    })
  }

  // ------------------------------------------------------------------ active links
  const markActiveLinks = () => {
    const now = current.peek()
    if (!now) return
    for (const a of document.querySelectorAll<HTMLAnchorElement>("a[href]")) {
      if (a.hasAttribute("download") || (a.target && a.target !== "_self")) continue
      let url: URL
      try {
        url = new URL(a.href, location.href)
      } catch {
        continue
      }
      if (!inScope(url)) continue
      const path = routePathOf(url)
      const exact = path === now.path
      const partial = !exact && path !== "/" && now.path.toLowerCase().startsWith(`${path.toLowerCase()}/`)
      if (exact) a.setAttribute("aria-current", "page")
      else if (a.getAttribute("aria-current") === "page") a.removeAttribute("aria-current")
      a.toggleAttribute("data-active", exact || partial)
    }
  }

  // ------------------------------------------------------------------ API
  const router: Router = {
    current,
    pending,
    options,
    navigate(to, opts = {}) {
      const target = new URL(href(to), location.href)
      const done = new Promise<boolean>((r) => waiters.push(r))
      quiet(
        nav().navigate(target.href, {
          history: opts.replace || target.href === location.href ? "replace" : "push",
          state: opts.state,
        })
      )
      return done
    },
    back: () => void (nav().canGoBack && quiet(nav().back())),
    forward: () => void (nav().canGoForward && quiet(nav().forward())),
    reload() {
      const done = new Promise<boolean>((r) => waiters.push(r))
      quiet(nav().reload())
      return done
    },
    href,
    isActive(path, exact = false) {
      const now = current()
      if (!now) return false
      const p = normalizePath(path).toLowerCase()
      const c = now.path.toLowerCase()
      return exact ? c === p : c === p || (p !== "/" && c.startsWith(`${p}/`)) || p === "/"
    },
    beforeEach(guard) {
      beforeEachGuards.add(guard)
      return () => beforeEachGuards.delete(guard)
    },
    beforeLeave(guard) {
      leaveGuards.add(guard)
      return () => leaveGuards.delete(guard)
    },
    afterEach(hook) {
      afterHooks.add(hook)
      return () => afterHooks.delete(hook)
    },
    resolve: (url) => resolve(url),
    async start() {
      if (started) return
      started = true
      activeRouter.set(router)
      nav().addEventListener("navigate", onNavigate)
      addEventListener("pagehide", saveScroll)
      const url = new URL(location.href)
      const outcome = await prepare(url, nav().currentEntry?.getState())
      // The entry key survives a reload: a saved position comes back; a new tab has none.
      if (outcome.kind === "ok") apply(outcome.state, false, "initial")
      else if (outcome.kind === "redirect") await router.navigate(outcome.to, { replace: true })
    },
    stop() {
      if (!started) return
      started = false
      controller?.abort()
      nav().removeEventListener("navigate", onNavigate)
      removeEventListener("pagehide", saveScroll)
      if (activeRouter.peek() === router) activeRouter.set(null)
    },
  }
  return router
}
