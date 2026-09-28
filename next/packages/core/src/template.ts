/**
 * Tagged-template rendering without a virtual DOM.
 *
 * Each `html` template is parsed once into a <template> element (cached by its strings
 * array) and cloned per use. Every `${}` becomes a part bound directly to a DOM node:
 *
 *   ${value}          child content (text, template, node, array, repeat())
 *   attr=${value}     attribute (null/false removes, true sets "")
 *   ?attr=${value}    boolean attribute
 *   .prop=${value}    element property
 *   @event=${fn}      event listener
 *   ref=${fn}         called with the element
 *
 * Any function value (signals included) is reactive: it runs in an effect and only its
 * part is updated when it changes. Values are written with textContent/setAttribute, so
 * interpolated data is never parsed as HTML.
 */

import { effect, onCleanup, root, type Cleanup } from "./signal"

export class TemplateResult {
  constructor(
    readonly strings: TemplateStringsArray,
    readonly values: readonly unknown[]
  ) {}
}

export function html(strings: TemplateStringsArray, ...values: unknown[]): TemplateResult {
  return new TemplateResult(strings, values)
}

class Repeat<T> {
  constructor(
    readonly items: readonly T[] | (() => readonly T[]),
    readonly key: (item: T, index: number) => unknown,
    readonly render: (item: T, index: number) => unknown
  ) {}
}

/**
 * Keyed list. Rows are created once per key and moved on reorder; a row is re-rendered
 * only when its item is replaced by a different object. Pass a signal as `items` to keep
 * rows alive across updates.
 */
export function repeat<T>(
  items: readonly T[] | (() => readonly T[]),
  key: (item: T, index: number) => unknown,
  render: (item: T, index: number) => unknown
): unknown {
  return new Repeat(items, key, render)
}

/** Renders `value` at the end of `container`. Effects belong to the current owner. */
export function render(value: unknown, container: ParentNode): void {
  const end = document.createComment("")
  container.appendChild(end)
  childPart(end, value)
}

// ---------------------------------------------------------------------------------------
// Compilation

interface PartMeta {
  index: number
  node: number
  name: string | null
}

interface Compiled {
  template: HTMLTemplateElement
  parts: PartMeta[]
}

const MARK = "bz$"
const ATTR_END = /([^\s"'<>/=]+)\s*=\s*(["']?)$/
const cache = new WeakMap<TemplateStringsArray, Compiled>()

function compile(strings: TemplateStringsArray): Compiled {
  let markup = ""
  let inTag = false
  let quote = ""
  let strip = ""
  const last = strings.length - 1

  strings.forEach((raw, i) => {
    let s = raw
    if (strip) {
      if (s[0] !== strip) throw new Error("bazlama: bindings inside a tag must be whole attribute values, e.g. attr=\"${value}\"")
      s = s.slice(1)
      strip = ""
    }
    for (let j = 0; j < s.length; j++) {
      const c = s[j]
      if (quote) {
        if (c === quote) quote = ""
      } else if (inTag) {
        if (c === '"' || c === "'") quote = c
        else if (c === ">") inTag = false
      } else if (c === "<" && /[a-zA-Z/!]/.test(s[j + 1] ?? "")) {
        inTag = true
      }
    }
    if (i === last) {
      markup += s
    } else if (inTag) {
      const m = ATTR_END.exec(s)
      if (!m) throw new Error("bazlama: bindings inside a tag must be whole attribute values, e.g. attr=${value}")
      markup += `${s.slice(0, m.index)}${MARK}${i}="${m[1]}"`
      if (m[2]) {
        strip = m[2]
        quote = ""
      }
    } else {
      markup += `${s}<!--${MARK}${i}-->`
    }
  })

  const template = document.createElement("template")
  template.innerHTML = markup
  const parts: PartMeta[] = []
  const walker = document.createTreeWalker(template.content, 129 /* elements + comments */)
  let n = 0
  while (walker.nextNode()) {
    const node = walker.currentNode
    if (node.nodeType === 8) {
      const data = (node as Comment).data
      if (data.startsWith(MARK)) parts.push({ index: +data.slice(MARK.length), node: n, name: null })
    } else {
      const el = node as Element
      for (const attr of Array.from(el.attributes)) {
        if (!attr.name.startsWith(MARK)) continue
        parts.push({ index: +attr.name.slice(MARK.length), node: n, name: attr.value })
        el.removeAttribute(attr.name)
      }
    }
    n++
  }
  return { template, parts }
}

function instantiate(result: TemplateResult): DocumentFragment {
  let compiled = cache.get(result.strings)
  if (!compiled) cache.set(result.strings, (compiled = compile(result.strings)))
  const fragment = document.importNode(compiled.template.content, true)
  const { parts } = compiled
  if (parts.length) {
    const nodes: Node[] = []
    const walker = document.createTreeWalker(fragment, 129)
    let n = 0
    let p = 0
    while (p < parts.length && walker.nextNode()) {
      while (p < parts.length && parts[p].node === n) {
        nodes.push(walker.currentNode)
        p++
      }
      n++
    }
    parts.forEach((part, i) => bind(nodes[i], part.name, result.values[part.index]))
  }
  return fragment
}

// ---------------------------------------------------------------------------------------
// Attribute-like parts

function bind(node: Node, name: string | null, value: unknown): void {
  if (name === null) return childPart(node as Comment, value)
  const el = node as HTMLElement
  const prefix = name[0]
  if (prefix === "@") {
    // Modifiers: @change.self (only events from this element, not bubbled from inside),
    // .prevent, .stop, .once.
    const [type, ...modifiers] = name.slice(1).split(".")
    const listener = value as EventListener
    if (!modifiers.length) {
      el.addEventListener(type, listener)
      return
    }
    const self = modifiers.includes("self")
    const prevent = modifiers.includes("prevent")
    const stop = modifiers.includes("stop")
    el.addEventListener(
      type,
      (e) => {
        if (self && e.target !== e.currentTarget) return
        if (prevent) e.preventDefault()
        if (stop) e.stopPropagation()
        listener.call(el, e)
      },
      { once: modifiers.includes("once") }
    )
    return
  }
  if (name === "ref") {
    ;(value as (el: Element) => void)(el)
    return
  }
  const key = name.slice(1)
  const apply =
    prefix === "."
      ? (v: unknown) => {
          ;(el as unknown as Record<string, unknown>)[key] = v
        }
      : prefix === "?"
        ? (v: unknown) => el.toggleAttribute(key, !!v)
        : (v: unknown) => {
            if (v == null || v === false) el.removeAttribute(name)
            else el.setAttribute(name, v === true ? "" : String(v))
          }
  if (typeof value === "function") {
    let prev: unknown = apply
    effect(() => {
      const v = (value as () => unknown)()
      if (v !== prev) apply((prev = v))
    })
  } else {
    apply(value)
  }
}

// ---------------------------------------------------------------------------------------
// Child parts: content between a start and an end anchor

function childPart(end: Comment, value: unknown): void {
  const start = document.createTextNode("")
  end.parentNode!.insertBefore(start, end)
  let text: Text | null = null
  let list: KeyedList | null = null

  const clear = () => {
    let node = start.nextSibling
    while (node && node !== end) {
      const next = node.nextSibling
      node.parentNode!.removeChild(node)
      node = next
    }
    text = null
  }

  const set = (v: unknown): void => {
    if (v instanceof Repeat) {
      if (list && list.render !== v.render) {
        list.dispose()
        list = null
      }
      if (!list) {
        clear()
        list = new KeyedList(end, v.key, v.render)
      }
      const current = list
      const { items } = v
      if (typeof items === "function") effect(() => current.update(items()))
      else current.update(items)
      return
    }
    if (list) {
      list.dispose()
      list = null
    }
    if (v == null || typeof v === "boolean") return clear()
    if (typeof v !== "object") {
      const s = String(v)
      if (text) {
        if (text.data !== s) text.data = s
        return
      }
      clear()
      text = document.createTextNode(s)
      end.parentNode!.insertBefore(text, end)
      return
    }
    clear()
    const fragment = document.createDocumentFragment()
    for (const node of toNodes(v)) fragment.appendChild(node)
    end.parentNode!.insertBefore(fragment, end)
  }

  onCleanup(() => list?.dispose())
  if (typeof value === "function") effect(() => set((value as () => unknown)()))
  else set(value)
}

function toNodes(value: unknown, out: Node[] = []): Node[] {
  if (value == null || typeof value === "boolean") return out
  if (value instanceof TemplateResult) {
    out.push(...instantiate(value).childNodes)
  } else if (value instanceof Node) {
    if (value.nodeType === 11) out.push(...value.childNodes)
    else out.push(value)
  } else if (Array.isArray(value)) {
    for (const item of value) toNodes(item, out)
  } else if (typeof value === "function" || value instanceof Repeat) {
    const holder = document.createDocumentFragment()
    childPart(holder.appendChild(document.createComment("")), value)
    out.push(...holder.childNodes)
  } else {
    out.push(document.createTextNode(String(value)))
  }
  return out
}

// ---------------------------------------------------------------------------------------
// Keyed list reconciliation

interface Entry {
  item: unknown
  first: Node
  last: Node
  dispose: Cleanup
}

class KeyedList {
  entries = new Map<unknown, Entry>()

  constructor(
    readonly end: Node,
    readonly key: (item: never, index: number) => unknown,
    readonly render: (item: never, index: number) => unknown
  ) {}

  update(items: readonly unknown[]): void {
    const parent = this.end.parentNode!
    const fresh = this.entries.size === 0
    const next = new Map<unknown, Entry>()
    const order: Entry[] = []
    items.forEach((item, i) => {
      const k = this.key(item as never, i)
      let entry = this.entries.get(k)
      if (entry) {
        this.entries.delete(k)
        if (entry.item !== item) {
          this.remove(entry)
          entry = undefined
        }
      }
      entry ??= this.create(item, i)
      next.set(k, entry)
      order.push(entry)
    })
    this.entries.forEach((entry) => this.remove(entry))
    this.entries = next

    if (fresh) {
      const fragment = document.createDocumentFragment()
      for (const entry of order) move(entry, fragment, null)
      parent.insertBefore(fragment, this.end)
      return
    }
    let ref: Node = this.end
    for (let i = order.length - 1; i >= 0; i--) {
      const entry = order[i]
      if (entry.last.nextSibling !== ref) move(entry, parent, ref)
      ref = entry.first
    }
  }

  create(item: unknown, index: number): Entry {
    return root((dispose) => {
      const nodes = toNodes(this.render(item as never, index))
      const single = nodes.length === 1 && nodes[0].nodeType === 1
      const first = single ? nodes[0] : document.createTextNode("")
      const last = single ? nodes[0] : document.createTextNode("")
      const holder = document.createDocumentFragment()
      if (!single) holder.appendChild(first)
      for (const node of nodes) holder.appendChild(node)
      if (!single) holder.appendChild(last)
      return { item, first, last, dispose }
    })
  }

  remove(entry: Entry): void {
    entry.dispose()
    let node: Node | null = entry.first
    while (node) {
      const next: Node | null = node === entry.last ? null : node.nextSibling
      node.parentNode?.removeChild(node)
      node = next
    }
  }

  dispose(): void {
    this.entries.forEach((entry) => this.remove(entry))
    this.entries.clear()
  }
}

function move(entry: Entry, parent: Node, ref: Node | null): void {
  let node: Node | null = entry.first
  while (node) {
    const next: Node | null = node === entry.last ? null : node.nextSibling
    parent.insertBefore(node, ref)
    node = next
  }
}
