/**
 * Minimal Navigation API for jsdom (which has none): enough for the router — navigate,
 * traverseTo/back/forward, reload, the cancelable `navigate` event with intercept(), and
 * location updates through history.pushState/replaceState.
 */

interface Entry {
  url: string
  key: string
  id: string
  state: unknown
}

let counter = 0

export class FakeNavigation extends EventTarget {
  entries: Entry[]
  index = 0
  /** Every event dispatched, for assertions. */
  log: { type: string; url: string; prevented: boolean; intercepted: boolean }[] = []
  /** When false, traversals arrive as non-cancelable (no user activation). */
  cancelableTraversals = true

  constructor() {
    super()
    this.entries = [{ url: location.href, key: `k${++counter}`, id: `i${counter}`, state: undefined }]
  }

  get currentEntry() {
    const e = this.entries[this.index]
    return { url: e.url, key: e.key, id: e.id, getState: () => e.state }
  }
  get canGoBack() {
    return this.index > 0
  }
  get canGoForward() {
    return this.index < this.entries.length - 1
  }

  navigate(url: string, options: { history?: "push" | "replace" | "auto"; state?: unknown; info?: unknown } = {}) {
    const href = new URL(url, location.href).href
    const type = options.history === "replace" ? "replace" : "push"
    return this.run(type, href, options.state, options.info, null)
  }
  reload(options: { info?: unknown } = {}) {
    return this.run("reload", location.href, this.entries[this.index].state, options.info, null)
  }
  traverseTo(key: string, options: { info?: unknown } = {}) {
    const target = this.entries.findIndex((e) => e.key === key)
    if (target === -1) throw new Error(`no entry ${key}`)
    const e = this.entries[target]
    return this.run("traverse", e.url, e.state, options.info, target)
  }
  back() {
    return this.traverseTo(this.entries[this.index - 1].key)
  }
  forward() {
    return this.traverseTo(this.entries[this.index + 1].key)
  }

  private run(type: string, url: string, state: unknown, info: unknown, traverseIndex: number | null) {
    const handlers: (() => unknown)[] = []
    let prevented = false
    let intercepted = false
    const from = new URL(location.href)
    const to = new URL(url)
    const hashChange = from.pathname === to.pathname && from.search === to.search && from.hash !== to.hash
    const cancelable = type !== "traverse" || this.cancelableTraversals
    const event = Object.assign(new Event("navigate", { cancelable }), {
      navigationType: type,
      destination: {
        url,
        key: traverseIndex === null ? null : this.entries[traverseIndex].key,
        getState: () => state,
      },
      canIntercept: true,
      hashChange,
      info,
      downloadRequest: null,
      formData: null,
      signal: new AbortController().signal,
      intercept: (opts: { handler?: () => unknown } = {}) => {
        intercepted = true
        if (opts.handler) handlers.push(opts.handler)
      },
    })
    this.dispatchEvent(event)
    prevented = event.defaultPrevented
    this.log.push({ type, url, prevented, intercepted })
    if (prevented) {
      const aborted = Promise.reject(new DOMException("Navigation was aborted", "AbortError"))
      aborted.catch(() => {})
      return { committed: aborted, finished: aborted }
    }
    // Commit.
    if (type === "traverse" && traverseIndex !== null) {
      this.index = traverseIndex
      history.replaceState(null, "", url)
    } else if (type === "push") {
      this.entries.splice(this.index + 1)
      this.entries.push({ url, key: `k${++counter}`, id: `i${counter}`, state })
      this.index = this.entries.length - 1
      history.pushState(null, "", url)
    } else {
      this.entries[this.index] = { ...this.entries[this.index], url, state, id: `i${++counter}` }
      history.replaceState(null, "", url)
    }
    const finished = Promise.all(handlers.map((h) => h())).then(() => undefined)
    finished.catch(() => {})
    return { committed: Promise.resolve(), finished }
  }
}

export function installFakeNavigation(): FakeNavigation {
  const nav = new FakeNavigation()
  ;(globalThis as unknown as { navigation: FakeNavigation }).navigation = nav
  return nav
}
