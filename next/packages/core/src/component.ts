/**
 * define(): custom elements from a props schema and a setup function.
 *
 * - Every prop is a signal, exposed as an element property (reactive getter/setter) and,
 *   unless disabled, synced from an attribute. `reflect` writes the value back.
 * - `setup` runs once per connection. It may return a template (rendered into the light
 *   DOM, or the shadow root when `shadow` is set) or nothing (an "enhancer" that only
 *   decorates its host and children).
 * - The constructor never touches attributes or children, so document.createElement,
 *   upgrades and parser-created elements all work. Values assigned before the element
 *   was defined are picked up; attributes present at upgrade win over defaults.
 * - Moving an element keeps it alive. Removing it disposes all effects after a microtask;
 *   inserting it again runs setup again (props keep their values).
 */

import { effect, onCleanup, root, signal, type Cleanup, type Signal } from "./signal"
import { render } from "./template"

type Kind = "string" | "number" | "boolean" | "object"

export interface PropOptions {
  /** Write the value back to the attribute. */
  reflect?: boolean
  /** Sync from an attribute (default: true, false for object props). */
  attribute?: boolean
}

export interface Prop<T> {
  kind: Kind
  initial: T
  reflect: boolean
  attribute: boolean
}

const make = <T>(kind: Kind, initial: T, o: PropOptions = {}): Prop<T> => ({
  kind,
  initial,
  reflect: !!o.reflect,
  attribute: o.attribute ?? kind !== "object",
})

function stringProp(initial?: string, o?: PropOptions): Prop<string>
/** Narrow string type: prop.string<"a" | "b">("a"). */
function stringProp<T extends string>(initial: T, o?: PropOptions): Prop<T>
function stringProp(initial = "", o?: PropOptions): Prop<string> {
  return make("string", initial, o)
}

export const prop = {
  string: stringProp,
  number: (initial = 0, o?: PropOptions) => make<number>("number", initial, o),
  /** Attribute presence means true (HTML semantics). */
  boolean: (initial = false, o?: PropOptions) => make<boolean>("boolean", initial, o),
  /** Property-only by default; with `attribute: true` the attribute is parsed as JSON. */
  object: <T>(initial: T, o?: PropOptions) => make<T>("object", initial, o),
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PropsDef = Record<string, Prop<any>>
export type PropValues<P extends PropsDef> = { [K in keyof P]: P[K] extends Prop<infer T> ? T : never }
export type PropSignals<P extends PropsDef> = {
  [K in keyof P]: P[K] extends Prop<infer T> ? Signal<T> : never
}
export type BazElement<P extends PropsDef = PropsDef> = HTMLElement & PropValues<P>

export interface Context<P extends PropsDef> {
  host: BazElement<P>
  /** ElementInternals, when `form: true`. */
  internals: ElementInternals | null
  /** Dispatches a bubbling, composed CustomEvent from the host. */
  emit(type: string, detail?: unknown, init?: EventInit): boolean
  /** Light-DOM children captured at first connection, by `slot` attribute ("" = default). */
  slot(name?: string): Node[]
  hasSlot(name?: string): boolean
  /** addEventListener that is removed when the component is disposed. */
  on<E extends Event = Event>(
    target: EventTarget,
    type: string,
    listener: (event: E) => void,
    options?: AddEventListenerOptions
  ): void
  /** Runs after the returned template was rendered (refs are set). */
  onMount(fn: () => void): void
  onFormReset(fn: () => void): void
  onFormDisabled(fn: (disabled: boolean) => void): void
}

export interface ComponentOptions<P extends PropsDef> {
  props?: P
  /** Form-associated element (ElementInternals). */
  form?: boolean
  shadow?: boolean | ShadowRootInit
  /** Shared stylesheet for the shadow root. */
  styles?: string
  setup(props: PropSignals<P>, ctx: Context<P>): unknown
}

export interface BazElementConstructor<P extends PropsDef> {
  new (): BazElement<P>
  readonly observedAttributes: string[]
  prototype: BazElement<P>
}

const toKebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)

function fromAttribute(p: Prop<unknown>, v: string | null): unknown {
  switch (p.kind) {
    case "boolean":
      return v !== null
    case "number": {
      const n = v === null || v.trim() === "" ? NaN : Number(v)
      return Number.isNaN(n) ? p.initial : n
    }
    case "string":
      return v ?? p.initial
    default:
      try {
        return v === null ? p.initial : JSON.parse(v)
      } catch {
        return p.initial
      }
  }
}

function toAttribute(p: Prop<unknown>, v: unknown): string | null {
  if (p.kind === "boolean") return v ? "" : null
  if (v == null || v === "") return null
  return p.kind === "object" ? JSON.stringify(v) : String(v)
}

let uidCounter = 0
/** Document-unique id, for aria-* references. */
export const uid = (prefix = "bz") => `${prefix}-${++uidCounter}`

export function define<P extends PropsDef = Record<string, never>>(
  tag: string,
  options: ComponentOptions<P>
): BazElementConstructor<P> {
  const existing = customElements.get(tag)
  if (existing) return existing as unknown as BazElementConstructor<P>

  const props = (options.props ?? {}) as P
  const names = Object.keys(props)
  const attrToName = new Map<string, string>()
  for (const name of names) if (props[name].attribute) attrToName.set(toKebab(name), name)
  let sheet: CSSStyleSheet | undefined

  class BazlamaElement extends HTMLElement {
    static observedAttributes = [...attrToName.keys()]
    static formAssociated = !!options.form

    _signals: Record<string, Signal<unknown>> = {}
    _internals: ElementInternals | null
    _dispose: Cleanup | null = null
    _slots: Map<string, Node[]> | null = null
    _hooks: { reset?: () => void; disabled?: (disabled: boolean) => void } = {}
    _reflecting = false

    constructor() {
      super()
      const self = this as unknown as Record<string, unknown>
      for (const name of names) {
        const s = signal<unknown>(props[name].initial)
        // Value assigned before the element was upgraded shadows the prototype accessor.
        if (Object.prototype.hasOwnProperty.call(this, name)) {
          s.set(self[name])
          delete self[name]
        }
        this._signals[name] = s
      }
      this._internals = options.form ? this.attachInternals() : null
      if (options.shadow) {
        const shadowRoot = this.attachShadow(
          typeof options.shadow === "object" ? options.shadow : { mode: "open" }
        )
        if (options.styles) {
          if (!sheet) {
            sheet = new CSSStyleSheet()
            sheet.replaceSync(options.styles)
          }
          shadowRoot.adoptedStyleSheets = [sheet]
        }
      }
    }

    attributeChangedCallback(attr: string, _old: string | null, value: string | null): void {
      if (this._reflecting) return
      const name = attrToName.get(attr)!
      this._signals[name].set(fromAttribute(props[name], value))
    }

    connectedCallback(): void {
      if (this._dispose) return
      this._dispose = root((dispose) => {
        try {
          this._setup()
        } catch (error) {
          console.error(`<${tag}> setup failed`, error)
        }
        return dispose
      })
    }

    disconnectedCallback(): void {
      queueMicrotask(() => {
        if (this.isConnected || !this._dispose) return
        this._dispose()
        this._dispose = null
      })
    }

    formResetCallback(): void {
      this._hooks.reset?.()
    }

    formDisabledCallback(disabled: boolean): void {
      this._hooks.disabled?.(disabled)
    }

    _captureSlots(): Map<string, Node[]> {
      if (!this._slots) {
        this._slots = new Map()
        for (const node of Array.from(this.childNodes)) {
          const name = (node as Element).getAttribute?.("slot") ?? ""
          const list = this._slots.get(name)
          if (list) list.push(node)
          else this._slots.set(name, [node])
        }
      }
      return this._slots
    }

    _setup(): void {
      for (const name of names) {
        const p = props[name]
        if (!p.reflect) continue
        const s = this._signals[name]
        const attr = toKebab(name)
        effect(() => {
          const v = toAttribute(p, s())
          if (this.getAttribute(attr) === v) return
          this._reflecting = true
          try {
            if (v === null) this.removeAttribute(attr)
            else this.setAttribute(attr, v)
          } finally {
            this._reflecting = false
          }
        })
      }

      const light = !this.shadowRoot
      if (light) this._captureSlots()
      const mounts: (() => void)[] = []
      const ctx: Context<P> = {
        host: this as unknown as BazElement<P>,
        internals: this._internals,
        emit: (type, detail, init) =>
          this.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true, ...init, detail })),
        slot: (name = "") => (light ? (this._captureSlots().get(name) ?? []) : []),
        hasSlot: (name = "") =>
          light &&
          (this._captureSlots().get(name) ?? []).some(
            (n) => n.nodeType === 1 || (n.nodeType === 3 && n.textContent!.trim() !== "")
          ),
        on: (target, type, listener, opts) => {
          target.addEventListener(type, listener as EventListener, opts)
          onCleanup(() => target.removeEventListener(type, listener as EventListener, opts))
        },
        onMount: (fn) => mounts.push(fn),
        onFormReset: (fn) => (this._hooks.reset = fn),
        onFormDisabled: (fn) => (this._hooks.disabled = fn),
      }

      const out = options.setup(this._signals as PropSignals<P>, ctx)
      if (out !== undefined) {
        const target = this.shadowRoot ?? this
        target.replaceChildren()
        render(out, target)
      }
      for (const fn of mounts) fn()
    }
  }

  for (const name of names) {
    Object.defineProperty(BazlamaElement.prototype, name, {
      get(this: BazlamaElement) {
        return this._signals[name]()
      },
      set(this: BazlamaElement, value: unknown) {
        this._signals[name].set(value)
      },
      configurable: true,
      enumerable: true,
    })
  }

  customElements.define(tag, BazlamaElement)
  return BazlamaElement as unknown as BazElementConstructor<P>
}
