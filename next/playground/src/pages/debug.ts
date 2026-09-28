import * as core from "@bazlama/core"
import { computed, effect, html, onCleanup, repeat, signal, untrack, type Cleanup } from "@bazlama/core"
import defaultCode from "../debug/default.js?raw"
import { execute, format } from "../docs/runner"

const examples = import.meta.glob("../docs/examples/*.js", { query: "?raw", import: "default", eager: true }) as Record<
  string,
  string
>
const templates: [string, string][] = [
  ["Varsayılan (bileşenler + form)", defaultCode],
  ...Object.entries(examples).map(([path, code]): [string, string] => [path.split("/").pop()!.replace(".js", ""), code]),
]

/** Elements created by define(): they carry their prop signals. */
type BazEl = HTMLElement & {
  _signals?: Record<string, unknown>
  _internals?: ElementInternals | null
  _dispose?: unknown
}
const isBaz = (node: unknown): node is BazEl => node instanceof HTMLElement && !!(node as BazEl)._signals
const closestBaz = (node: Node | null, within: Element): BazEl | null => {
  for (let n: Node | null = node; n && n !== within; n = n.parentNode) if (isBaz(n)) return n
  return null
}
const describe = (el: Element | null) => {
  if (!el) return ""
  const part = el.getAttribute("data-part")
  return `<${el.localName}${el.id ? `#${el.id}` : ""}${part ? ` part=${part}` : ""}>`
}

type Category = "custom" | "native" | "dom" | "log" | "console"
const CATEGORIES: [Category, string][] = [
  ["custom", "Bileşen olayları (emit)"],
  ["native", "Native olaylar"],
  ["dom", "DOM değişiklikleri"],
  ["log", "log()"],
  ["console", "Konsol hataları"],
]
const NATIVE_EVENTS = ["click", "input", "change", "submit", "reset", "focusin", "focusout", "keydown", "invalid"]

interface DebugEvent {
  id: number
  time: string
  category: Category
  type: string
  target: string
  detail: string
}

const STORAGE_KEY = "bz-debug-code"
const load = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? defaultCode
  } catch {
    return defaultCode
  }
}
const save = (code: string) => {
  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch {
    /* storage unavailable */
  }
}

export default {
  id: "debug",
  group: "Araçlar",
  title: "Debug",
  wide: true,
  description:
    "Serbest sandbox + bileşen inspector + olay monitörü. Kodunuzu yazın, çalıştırın, bir bileşen seçip prop'larını canlı değiştirin ve olan her şeyi izleyin.",
  render() {
    const code = signal(load())
    const runError = signal("")
    const selected = signal<BazEl | null>(null)
    const picking = signal(false)
    const tab = signal<"inspector" | "events">("inspector")
    const treeVersion = signal(0)
    const attrVersion = signal(0)
    const events = signal<DebugEvent[]>([])
    const paused = signal(false)
    const filter = signal("")
    const enabled = signal(new Set<Category>(["custom", "native", "log", "console"]))
    const unread = signal(0)
    let output!: HTMLElement
    let disposeRun: Cleanup | null = null
    let eventId = 0

    // ------------------------------------------------------------------ events
    const push = (category: Category, type: string, target: string, detail = "") => {
      if (paused.peek() || !enabled.peek().has(category)) return
      const time = new Date().toLocaleTimeString("tr-TR", { hour12: false }) + "." + String(Date.now() % 1000).padStart(3, "0")
      events.update((list) => [{ id: ++eventId, time, category, type, target, detail: detail.slice(0, 300) }, ...list].slice(0, 400))
      if (tab.peek() !== "events") unread.update((n) => n + 1)
    }
    const visibleEvents = computed(() => {
      const q = filter().trim().toLowerCase()
      return q ? events().filter((e) => `${e.type} ${e.target} ${e.detail}`.toLowerCase().includes(q)) : events()
    })

    // ------------------------------------------------------------------ run
    const run = () => {
      disposeRun?.()
      disposeRun = null
      output.replaceChildren()
      selected.set(null)
      runError.set("")
      save(code.peek())
      try {
        disposeRun = execute(code.peek(), output, (...args) => push("log", "log", "", args.map(format).join(" ")), "bazlama-debug")
      } catch (e) {
        const message = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
        runError.set(message)
        push("console", "error", "çalıştırma", message)
      }
      queueMicrotask(() => {
        if (!selected.peek()) selected.set(tree.peek()[0]?.el ?? null)
      })
    }
    const onKeydown = (e: KeyboardEvent) => {
      const area = e.target as HTMLTextAreaElement
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        code.set(area.value)
        run()
      } else if (e.key === "Tab" && !e.shiftKey) {
        e.preventDefault()
        area.setRangeText("  ", area.selectionStart, area.selectionEnd, "end")
        code.set(area.value)
      } else if (e.key === "Escape") {
        area.blur()
      }
    }

    // ------------------------------------------------------------------ tree + highlight
    const tree = computed(() => {
      treeVersion()
      if (!output) return []
      const list: { el: BazEl; depth: number }[] = []
      const walk = (node: Element, depth: number) => {
        for (const child of Array.from(node.children)) {
          if (isBaz(child)) {
            list.push({ el: child, depth })
            walk(child, depth + 1)
          } else walk(child, depth)
        }
      }
      walk(output, 0)
      return list
    })

    const overlay = document.body.appendChild(Object.assign(document.createElement("div"), { className: "debug-overlay" }))
    overlay.hidden = true
    const highlight = (el: Element | null) => {
      if (!el || !el.isConnected) {
        overlay.hidden = true
        return
      }
      const r = el.getBoundingClientRect()
      Object.assign(overlay.style, { top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, height: `${r.height}px` })
      overlay.dataset.label = describe(el)
      overlay.hidden = false
    }
    const select = (el: BazEl | null) => {
      selected.set(el)
      tab.set("inspector")
    }

    // ------------------------------------------------------------------ instrumentation
    const setup = () => {
      const observer = new MutationObserver((records) => {
        let structure = false
        const sel = selected.peek()
        for (const r of records) {
          if (r.type === "childList") structure = true
          if (sel && (r.target === sel || sel.contains(r.target))) attrVersion.update((n) => n + 1)
          if (r.type === "attributes")
            push("dom", `attr ${r.attributeName}`, describe(r.target as Element), JSON.stringify((r.target as Element).getAttribute(r.attributeName!)))
          else if (r.type === "characterData")
            push("dom", "text", describe(r.target.parentElement), JSON.stringify((r.target as CharacterData).data))
          else push("dom", "childList", describe(r.target as Element), `+${r.addedNodes.length} −${r.removedNodes.length}`)
        }
        if (structure) treeVersion.update((n) => n + 1)
      })
      observer.observe(output, { subtree: true, childList: true, attributes: true, characterData: true })
      onCleanup(() => observer.disconnect())

      const onNative = (e: Event) => {
        const target = e.target as Element
        let detail = ""
        if (e instanceof KeyboardEvent) detail = e.key
        else if (e.type === "input" || e.type === "change") detail = JSON.stringify((target as HTMLInputElement).value ?? "")
        push("native", e.type, describe(target), detail)
      }
      for (const type of NATIVE_EVENTS) output.addEventListener(type, onNative, true)
      onCleanup(() => NATIVE_EVENTS.forEach((type) => output.removeEventListener(type, onNative, true)))

      // Component events (ctx.emit) go through dispatchEvent: wrap it while this page is open.
      const dispatch = EventTarget.prototype.dispatchEvent
      EventTarget.prototype.dispatchEvent = function (this: EventTarget, event: Event) {
        if (event instanceof CustomEvent && this instanceof Node && output.contains(this))
          push("custom", event.type, describe(this as Element), format(event.detail))
        return dispatch.call(this, event)
      }
      onCleanup(() => (EventTarget.prototype.dispatchEvent = dispatch))

      // Errors: effects report through console.error; listeners through window "error".
      const { error, warn } = console
      console.error = (...args: unknown[]) => {
        push("console", "console.error", "", args.map((a) => (a instanceof Error ? `${a.name}: ${a.message}` : format(a))).join(" "))
        error.apply(console, args)
      }
      console.warn = (...args: unknown[]) => {
        push("console", "console.warn", "", args.map(format).join(" "))
        warn.apply(console, args)
      }
      const onError = (e: ErrorEvent) => push("console", "hata", "", e.message)
      const onRejection = (e: PromiseRejectionEvent) => push("console", "unhandledrejection", "", format(e.reason))
      addEventListener("error", onError)
      addEventListener("unhandledrejection", onRejection)
      onCleanup(() => {
        console.error = error
        console.warn = warn
        removeEventListener("error", onError)
        removeEventListener("unhandledrejection", onRejection)
      })

      // Picking: hover highlights the nearest component, click selects it.
      const onPickMove = (e: PointerEvent) => picking.peek() && highlight(closestBaz(e.target as Node, output))
      const onPickClick = (e: MouseEvent) => {
        if (!picking.peek()) return
        e.preventDefault()
        e.stopImmediatePropagation()
        const el = closestBaz(e.target as Node, output)
        if (el) select(el)
        picking.set(false)
      }
      const onEscape = (e: KeyboardEvent) => e.key === "Escape" && picking.set(false)
      output.addEventListener("pointermove", onPickMove, true)
      output.addEventListener("click", onPickClick, true)
      addEventListener("keydown", onEscape)
      onCleanup(() => {
        output.removeEventListener("pointermove", onPickMove, true)
        output.removeEventListener("click", onPickClick, true)
        removeEventListener("keydown", onEscape)
      })

      // Globals for the browser DevTools console.
      const w = window as unknown as Record<string, unknown>
      w.bz = core
      w.$output = output
      effect(() => {
        w.$el = selected()
      })
      onCleanup(() => {
        delete w.bz
        delete w.$output
        delete w.$el
      })

      run()
    }

    effect(() => {
      if (!picking()) highlight(null)
    })
    onCleanup(() => {
      disposeRun?.()
      overlay.remove()
    })

    // ------------------------------------------------------------------ inspector views
    const propEditor = (el: BazEl, name: string) => {
      const record = el as unknown as Record<string, unknown>
      const value = record[name]
      const set = (v: unknown) => {
        record[name] = v
        push("custom", "inspector", describe(el), `${name} = ${format(v)}`)
      }
      if (typeof value === "boolean")
        return html`<input type="checkbox" .checked=${() => record[name] as boolean} @change=${(e: Event) => set((e.target as HTMLInputElement).checked)} />`
      if (typeof value === "number")
        return html`<input type="number" class="debug-input" .value=${() => String(record[name])} @change=${(e: Event) => set(Number((e.target as HTMLInputElement).value))} />`
      if (typeof value === "string")
        return html`<input type="text" class="debug-input" .value=${() => record[name] as string} @input=${(e: Event) => set((e.target as HTMLInputElement).value)} />`
      const invalid = signal(false)
      return html`<textarea
        class="debug-input"
        rows="2"
        spellcheck="false"
        data-invalid=${invalid}
        .value=${() => JSON.stringify(record[name])}
        @change=${(e: Event) => {
          try {
            set(JSON.parse((e.target as HTMLTextAreaElement).value))
            invalid.set(false)
          } catch {
            invalid.set(true)
          }
        }}
      ></textarea>`
    }

    const inspector = (el: BazEl) => {
      const record = el as unknown as Record<string, unknown>
      const names = Object.keys(el._signals ?? {})
      const ctor = el.constructor as { formAssociated?: boolean }
      const parent = () => closestBaz(el.parentNode, output)
      return html`
        <div class="debug-head">
          <code class="debug-tag">${describe(el)}</code>
          <span class="spacer"></span>
          <button type="button" class="link" ?hidden=${() => !parent()} @click=${() => select(parent())}>↑ üst bileşen</button>
          <button type="button" class="link" @click=${() => {
            el.scrollIntoView({ block: "center" })
            highlight(el)
            setTimeout(() => highlight(null), 900)
          }}>göster</button>
          <button type="button" class="link" @click=${() => {
            console.log("$el =", el)
            push("log", "$el", describe(el), "konsola yazıldı")
          }}>konsola yaz</button>
        </div>
        <div class="debug-badges">
          <span class="badge" data-on=${() => (attrVersion(), treeVersion(), el.isConnected)}>${() => (attrVersion(), treeVersion(), el.isConnected ? "DOM'da" : "DOM dışında")}</span>
          <span class="badge" data-on=${() => (treeVersion(), attrVersion(), !!el._dispose)}>${() => (treeVersion(), attrVersion(), el._dispose ? "setup aktif" : "dispose edildi")}</span>
          ${ctor.formAssociated ? html`<span class="badge" data-on>form-associated</span>` : null}
        </div>

        <h4>Prop'lar <span class="muted small">(canlı · düzenlenebilir)</span></h4>
        ${names.length
          ? html`<table class="debug-table">
              <tbody>
                ${names.map(
                  (name) => html`<tr>
                    <th>${name}</th>
                    <td class="muted small">${() => (Array.isArray(record[name]) ? "array" : record[name] === null ? "null" : typeof record[name])}</td>
                    <td>${propEditor(el, name)}</td>
                  </tr>`
                )}
              </tbody>
            </table>`
          : html`<p class="muted small">Prop yok.</p>`}

        <h4>Attribute'lar</h4>
        <table class="debug-table">
          <tbody>
            ${() => {
              attrVersion()
              const attrs = Array.from(el.attributes)
              return attrs.length
                ? attrs.map((a) => html`<tr><th>${a.name}</th><td><code>${JSON.stringify(a.value)}</code></td></tr>`)
                : html`<tr><td class="muted small">Attribute yok.</td></tr>`
            }}
          </tbody>
        </table>

        ${ctor.formAssociated && el._internals
          ? html`<h4>Form (ElementInternals)</h4>
              <table class="debug-table">
                <tbody>
                  ${() => {
                    attrVersion()
                    const internals = el._internals!
                    let valid: boolean | string = "—"
                    let message = ""
                    try {
                      valid = internals.validity.valid
                      message = internals.validationMessage
                    } catch {
                      /* not supported */
                    }
                    return html`<tr><th>form</th><td>${describe(internals.form) || "yok"}</td></tr>
                      <tr><th>geçerli</th><td>${String(valid)}</td></tr>
                      <tr><th>mesaj</th><td>${message || "—"}</td></tr>`
                  }}
                </tbody>
              </table>`
          : null}

        <h4>Anatomi (data-part)</h4>
        <ul class="debug-parts">
          ${() => {
            attrVersion()
            const parts = Array.from(el.querySelectorAll<HTMLElement>("[data-part]")).filter((p) => closestBaz(p, output) === el)
            return parts.length
              ? parts.map(
                  (p) => html`<li @pointerenter=${() => highlight(p)} @pointerleave=${() => highlight(null)}>
                    <code>${p.getAttribute("data-part")}</code>
                    <span class="muted small">${p.localName}${p.hidden ? " · hidden" : ""}</span>
                  </li>`
                )
              : html`<li class="muted small">data-part yok (enhancer veya özel bileşen).</li>`
          }}
        </ul>
      `
    }

    // ------------------------------------------------------------------ layout
    return html`
      <div class="debug">
        <div class="debug-main">
          <div class="runner">
            <div class="runner-bar">
              <strong>Sandbox</strong>
              <span class="muted small">Ctrl+Enter çalıştırır · kod tarayıcıda saklanır</span>
              <span class="spacer"></span>
              <select
                class="debug-select"
                aria-label="Şablon yükle"
                @change=${(e: Event) => {
                  const select = e.target as HTMLSelectElement
                  const template = templates[Number(select.value)]
                  if (template) {
                    code.set(template[1].trim())
                    run()
                  }
                  select.value = ""
                }}
              >
                <option value="">Şablon yükle…</option>
                ${templates.map(([name], i) => html`<option value=${String(i)}>${name}</option>`)}
              </select>
              <bz-button size="sm" variant="primary" @click=${run}>Çalıştır ▶</bz-button>
            </div>
            <textarea
              class="runner-code debug-code"
              spellcheck="false"
              aria-label="Sandbox kodu"
              .value=${code}
              @input=${(e: Event) => code.set((e.target as HTMLTextAreaElement).value)}
              @keydown=${onKeydown}
            ></textarea>
            <div class="runner-error" role="alert" ?hidden=${() => !runError()}>${runError}</div>
            <div class="runner-pane-title">
              Çıktı
              <span class="muted">${() => `${tree().length} bileşen`}</span>
            </div>
            <div class="runner-output debug-output" data-picking=${picking} ref=${(el: HTMLElement) => {
              // Runs during the page render, so every onCleanup in setup() belongs to the page.
              output = el
              setup()
            }}></div>
          </div>
        </div>

        <aside class="debug-side">
          <div class="debug-tabs" role="tablist">
            <button type="button" role="tab" aria-selected=${() => String(tab() === "inspector")} @click=${() => tab.set("inspector")}>Inspector</button>
            <button type="button" role="tab" aria-selected=${() => String(tab() === "events")} @click=${() => {
              tab.set("events")
              unread.set(0)
            }}>
              Olaylar <span class="badge" ?hidden=${() => unread() === 0}>${unread}</span>
            </button>
            <span class="spacer"></span>
            <bz-button size="sm" pressed=${() => String(picking())} @click=${() => picking.update((v) => !v)}>
              ${() => (picking() ? "Seçiliyor… (Esc)" : "⌖ Seç")}
            </bz-button>
          </div>

          <div ?hidden=${() => tab() !== "inspector"} class="debug-panel">
            <h4>Bileşen ağacı</h4>
            <ul class="debug-tree">
              ${() =>
                tree().length
                  ? tree().map(
                      ({ el, depth }) => html`<li
                        style=${`padding-inline-start:${depth * 0.9 + 0.4}rem`}
                        aria-current=${() => (selected() === el ? "true" : null)}
                        @click=${() => select(el)}
                        @pointerenter=${() => highlight(el)}
                        @pointerleave=${() => highlight(null)}
                      >
                        ${describe(el)}
                      </li>`
                    )
                  : html`<li class="muted small">Çıktıda bileşen yok.</li>`}
            </ul>
            ${() => {
              const el = selected()
              // untrack: building the inspector must not subscribe this block to the props it reads.
              return el ? untrack(() => inspector(el)) : html`<p class="muted">Ağaçtan veya "Seç" ile bir bileşen seçin.</p>`
            }}
          </div>

          <div ?hidden=${() => tab() !== "events"} class="debug-panel">
            <div class="debug-filters">
              ${CATEGORIES.map(
                ([category, label]) => html`<label class="check">
                  <input
                    type="checkbox"
                    .checked=${() => enabled().has(category)}
                    @change=${(e: Event) =>
                      enabled.update((set) => {
                        const next = new Set(set)
                        if ((e.target as HTMLInputElement).checked) next.add(category)
                        else next.delete(category)
                        return next
                      })}
                  />
                  <span class="debug-cat" data-cat=${category}></span>${label}
                </label>`
              )}
            </div>
            <div class="row">
              <input class="debug-input" type="search" placeholder="Filtrele…" .value=${filter} @input=${(e: Event) => filter.set((e.target as HTMLInputElement).value)} />
              <bz-button size="sm" pressed=${() => String(paused())} @click=${() => paused.update((v) => !v)}>${() => (paused() ? "▶ Devam" : "⏸ Duraklat")}</bz-button>
              <bz-button size="sm" variant="ghost" @click=${() => events.set([])}>Temizle</bz-button>
            </div>
            <ol class="debug-events">
              ${repeat(
                visibleEvents,
                (e) => e.id,
                (e) => html`<li data-cat=${e.category}>
                  <div>
                    <time>${e.time}</time>
                    <b>${e.type}</b>
                    <code ?hidden=${!e.target}>${e.target}</code>
                  </div>
                  <div class="debug-detail" ?hidden=${!e.detail}>${e.detail}</div>
                </li>`
              )}
            </ol>
          </div>
        </aside>
      </div>
    `
  },
}
