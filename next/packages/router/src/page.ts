import { computed, onCleanup, untrack, type ReadSignal } from "@bazlama/core"
import type { Params } from "./match"
import type { LeaveGuard, NavigateOptions, Router, RouterState } from "./router"

/**
 * Pages: definePage({ title, load, setup(ctx) }).
 *
 * `ctx` exposes the URL as signals (params, query, hash, path, state), the data returned by
 * `load()`, and helpers. A page stays mounted while its route stays matched: going from
 * /customers/1 to /customers/2 only updates the signals (and re-runs load) unless the route
 * has `remount: true`.
 */

export interface LoadArgs {
  params: Params
  query: URLSearchParams
  url: URL
  /** Aborted when another navigation starts: pass it to fetch(). */
  signal: AbortSignal
}

export interface Query {
  get(key: string): string | null
  getAll(key: string): string[]
  has(key: string): boolean
  /** Number or the fallback when missing / not a number. */
  number(key: string, fallback?: number): number
  /** "false"/"0" are false; missing gives the fallback. */
  boolean(key: string, fallback?: boolean): boolean
  all(): Record<string, string>
  /**
   * Merges into the query string; null/undefined/""/false remove a key. Replaces the history
   * entry by default (paging and filters should not fill the back button).
   */
  set(patch: Record<string, string | number | boolean | null | undefined>, options?: NavigateOptions): Promise<boolean>
}

export interface PageContext<T = unknown> {
  router: Router
  params: ReadSignal<Params>
  query: Query
  hash: ReadSignal<string>
  path: ReadSignal<string>
  state: ReadSignal<unknown>
  /** What load() returned. */
  data: ReadSignal<T>
  /** The error, on an error page. */
  error: ReadSignal<unknown>
  navigate: Router["navigate"]
  /** Asked before leaving this page (false keeps it); removed when the page goes away. */
  onBeforeLeave(guard: LeaveGuard): void
  /** Browser "leave site?" prompt on reload/close while `when()` is true. */
  blockUnload(when: () => boolean): void
}

// Method syntax keeps the parameter bivariant, so PageDef<X> fits where PageDef<any> is expected.
type TitleFn<T> = { fn(info: RouterState & { data: T }): string }["fn"]

export interface PageDef<T = unknown> {
  title?: string | TitleFn<T>
  load?: (args: LoadArgs) => T | Promise<T>
  setup(ctx: PageContext<T>): unknown
}

export function definePage<T = unknown>(def: PageDef<T>): PageDef<T> {
  return def
}

export function createQuery(source: () => URLSearchParams, router: Router): Query {
  return {
    get: (key) => source().get(key),
    getAll: (key) => source().getAll(key),
    has: (key) => source().has(key),
    number(key, fallback = 0) {
      const value = source().get(key)
      const n = value === null || value.trim() === "" ? NaN : Number(value)
      return Number.isFinite(n) ? n : fallback
    },
    boolean(key, fallback = false) {
      const value = source().get(key)
      return value === null ? fallback : value !== "false" && value !== "0"
    },
    all: () => Object.fromEntries(source()),
    set(patch, options = {}) {
      const next = new URLSearchParams(untrack(source))
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === undefined || value === "" || value === false) next.delete(key)
        else next.set(key, String(value))
      }
      return router.navigate({ query: next }, { replace: options.replace ?? true, state: options.state })
    },
  }
}

/** Builds the context for one mounted page; `state` is updated only while it stays mounted. */
export function createPageContext<T>(router: Router, state: ReadSignal<RouterState>, record: object): PageContext<T> {
  return {
    router,
    params: computed(() => state().params),
    query: createQuery(() => state().query, router),
    hash: computed(() => state().hash),
    path: computed(() => state().path),
    state: computed(() => state().state),
    data: computed(() => state().data.get(record as never) as T),
    error: computed(() => state().error?.error),
    navigate: router.navigate,
    onBeforeLeave(guard) {
      onCleanup(router.beforeLeave(guard))
    },
    blockUnload(when) {
      const listener = (e: BeforeUnloadEvent) => {
        if (!when()) return
        e.preventDefault()
        e.returnValue = ""
      }
      addEventListener("beforeunload", listener)
      onCleanup(() => removeEventListener("beforeunload", listener))
    },
  }
}
