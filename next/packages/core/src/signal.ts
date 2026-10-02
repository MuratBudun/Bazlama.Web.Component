/**
 * Fine-grained reactivity: signal / computed / effect.
 *
 * - Reading a signal inside an effect or computed subscribes to it.
 * - Computeds are lazy and cached; they recompute only when read after a dependency changed.
 *   A computed whose value stays the same (Object.is) does not re-run what depends on it:
 *   `computed(() => list().length > 0)` wakes its effects only when the answer flips.
 * - Effects run synchronously once, then re-run batched in a microtask after their
 *   dependencies change (call `flush()` to run pending effects immediately).
 * - Every effect is also an owner: effects, computeds and `onCleanup` callbacks created
 *   while it runs are disposed before it re-runs and when it is disposed.
 */

export type Cleanup = () => void

export interface ReadSignal<T> {
  (): T
  /** Reads the value without subscribing. */
  peek(): T
}

export interface Signal<T> extends ReadSignal<T> {
  set(value: T): void
  update(fn: (value: T) => T): void
}

interface Owner {
  cleanups: Cleanup[]
}

const EFFECT = 0
const COMPUTED = 1

/*
 * Reaction states. A signal marks its direct subscribers DIRTY; a computed that may change
 * marks its subscribers CHECK. A CHECK reaction first brings its computed dependencies up to
 * date and runs only if one of them really changed (push to mark, pull to confirm).
 */
const CLEAN: number = 0
const CHECK: number = 1
const DIRTY: number = 2

let observer: Reaction | null = null
let owner: Owner | null = null

class Reaction implements Owner {
  cleanups: Cleanup[] = []
  /** Subscriber sets of the sources this reaction currently depends on. */
  sources: Set<Reaction>[] = []
  /** The computeds among the sources (checked before a CHECK reaction runs). */
  computeds: Reaction[] = []
  /** Reactions that depend on this one (computeds only). */
  subs = new Set<Reaction>()
  state: number = DIRTY
  disposed = false
  /** A computed has a value to compare with after its first run. */
  hasValue = false
  value: unknown

  constructor(
    readonly fn: () => unknown,
    readonly kind: number
  ) {}

  /** A dependency changed (DIRTY) or may have changed (CHECK). */
  notify(state: number = DIRTY): void {
    if (this.disposed || this.state >= state) return
    const wasClean = this.state === CLEAN
    this.state = state
    if (!wasClean) return
    if (this.kind === EFFECT) schedule(this)
    else this.subs.forEach((sub) => sub.notify(CHECK))
  }

  /** Runs if a dependency really changed; a CHECK whose computeds kept their values ends CLEAN. */
  update(): void {
    if (this.state === CHECK) {
      for (const source of this.computeds) {
        source.update()
        if (this.state === DIRTY) break
      }
    }
    if (this.state === DIRTY) this.run()
    else this.state = CLEAN
  }

  run(): void {
    this.reset()
    this.state = CLEAN
    const prevObserver = observer
    const prevOwner = owner
    observer = owner = this
    let value: unknown
    try {
      value = this.fn()
    } finally {
      observer = prevObserver
      owner = prevOwner
    }
    if (this.kind === COMPUTED) {
      const changed = !this.hasValue || !Object.is(this.value, value)
      this.value = value
      this.hasValue = true
      // Subscribers waiting on CHECK must run. (One that is running right now reads the new
      // value; a CLEAN subscriber cannot have seen the old one since this went stale.)
      if (changed) for (const sub of this.subs) if (sub.state === CHECK) sub.state = DIRTY
    }
  }

  reset(): void {
    for (const subs of this.sources) subs.delete(this)
    this.sources.length = 0
    this.computeds.length = 0
    runCleanups(this)
  }

  dispose(): void {
    this.disposed = true
    this.reset()
  }
}

function runCleanups(o: Owner): void {
  const cleanups = o.cleanups
  o.cleanups = []
  for (let i = cleanups.length - 1; i >= 0; i--) cleanups[i]()
}

/** Subscribes the running reaction to a source; returns true when it was a new subscription. */
function track(subs: Set<Reaction>): boolean {
  if (observer && !subs.has(observer)) {
    subs.add(observer)
    observer.sources.push(subs)
    return true
  }
  return false
}

let queue: Reaction[] = []
let scheduled = false

function schedule(reaction: Reaction): void {
  queue.push(reaction)
  if (!scheduled) {
    scheduled = true
    queueMicrotask(flush)
  }
}

/** Runs all pending effects synchronously. */
export function flush(): void {
  let rounds = 0
  while (queue.length) {
    if (++rounds > 100) {
      queue = []
      scheduled = false
      throw new Error("bazlama: effects keep re-triggering each other (possible infinite loop)")
    }
    const batch = queue
    queue = []
    for (const reaction of batch) {
      if (reaction.state === CLEAN || reaction.disposed) continue
      try {
        reaction.update()
      } catch (error) {
        console.error(error)
      }
    }
  }
  scheduled = false
}

export function signal<T>(initial: T, equals: (a: T, b: T) => boolean = Object.is): Signal<T> {
  let value = initial
  const subs = new Set<Reaction>()
  const read = (() => {
    track(subs)
    return value
  }) as Signal<T>
  read.peek = () => value
  read.set = (next) => {
    if (equals(value, next)) return
    value = next
    subs.forEach((sub) => sub.notify())
  }
  read.update = (fn) => read.set(fn(value))
  return read
}

export function computed<T>(fn: () => T): ReadSignal<T> {
  const reaction = new Reaction(fn, COMPUTED)
  onCleanup(() => reaction.dispose())
  const read = (() => {
    const reader = observer
    if (track(reaction.subs)) reader!.computeds.push(reaction)
    if (reaction.state !== CLEAN) reaction.update()
    return reaction.value as T
  }) as ReadSignal<T>
  read.peek = () => untrack(read)
  return read
}

/**
 * Runs `fn` now and again whenever a signal it read changes.
 * `fn` may return a cleanup that runs before the next run and on dispose.
 */
export function effect(fn: () => unknown): Cleanup {
  const reaction = new Reaction(() => {
    const cleanup = fn()
    if (typeof cleanup === "function") onCleanup(cleanup as Cleanup)
  }, EFFECT)
  const dispose = () => reaction.dispose()
  onCleanup(dispose)
  reaction.run()
  return dispose
}

/** Registers a callback on the current owner (effect, computed, root or component). */
export function onCleanup(fn: Cleanup): void {
  owner?.cleanups.push(fn)
}

export function untrack<T>(fn: () => T): T {
  const prev = observer
  observer = null
  try {
    return fn()
  } finally {
    observer = prev
  }
}

/** Creates a detached owner; everything created inside is disposed by the returned callback. */
export function root<T>(fn: (dispose: Cleanup) => T): T {
  const o: Owner = { cleanups: [] }
  const prevOwner = owner
  const prevObserver = observer
  owner = o
  observer = null
  try {
    return fn(() => runCleanups(o))
  } finally {
    owner = prevOwner
    observer = prevObserver
  }
}
