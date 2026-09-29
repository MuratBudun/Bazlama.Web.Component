import * as core from "@bazlama/core"
import * as headless from "@bazlama/headless"
import { html, onCleanup, repeat, root, signal, type Cleanup } from "@bazlama/core"

/**
 * "Kendin dene": an editable JavaScript example that runs against the real core.
 *
 * The code runs inside a root(): re-running (or leaving the page) disposes every effect,
 * interval and component it created. In scope: all core and headless exports (signal, html,
 * define, dialogs, icon…),
 * `output` (the result element), `log(...)` and `tag(name)` (unique custom element names,
 * because a tag can be defined only once per page).
 */

const scope: Record<string, unknown> = { ...headless, ...core }
const names = Object.keys(scope)
  .filter((n) => /^[A-Za-z_$][\w$]*$/.test(n))
  .join(", ")
let tagCounter = 0
const tag = (base: string) => `${base}-${++tagCounter}`
let lineCounter = 0
let exampleCounter = 0

/**
 * Runs example code in its own root and returns its dispose function. The code is named
 * with a sourceURL, so it shows up in the browser DevTools (Sources) and `debugger` works.
 */
export function execute(
  code: string,
  output: HTMLElement,
  log: (...args: unknown[]) => void,
  name = "bazlama-example"
): Cleanup {
  // The example runs in an inner block: its own declarations may shadow the scope's names
  // (e.g. an example defining its own "Card" next to the library's Card export).
  const fn = new Function("scope", "output", "log", "tag", `"use strict";\nconst { ${names} } = scope;\n{\n${code}\n}\n//# sourceURL=${name}.js`)
  let dispose: Cleanup = () => {}
  try {
    root((d) => {
      dispose = d
      fn(scope, output, log, tag)
    })
  } catch (error) {
    dispose()
    throw error
  }
  return dispose
}

export const format = (value: unknown): string => {
  if (typeof value === "string") return value
  if (value instanceof Element) return `<${value.localName}>`
  if (typeof value === "function") return `ƒ ${value.name || "anonim"}`
  try {
    return JSON.stringify(value) ?? String(value)
  } catch {
    return String(value)
  }
}

export function runner(source: string, title = "Kendin dene") {
  const exampleId = ++exampleCounter
  const initial = source.trim()
  const code = signal(initial)
  const logs = signal<{ id: number; text: string }[]>([])
  const error = signal("")
  let output!: HTMLElement
  let dispose: Cleanup | null = null
  let runId = 0

  const run = () => {
    dispose?.()
    dispose = null
    output.replaceChildren()
    logs.set([])
    error.set("")
    const id = ++runId
    const log = (...args: unknown[]) => {
      if (id !== runId) return
      logs.update((list) => [...list.slice(-120), { id: ++lineCounter, text: args.map(format).join(" ") }])
    }
    try {
      dispose = execute(code.peek(), output, log, `bazlama-example-${exampleId}`)
    } catch (e) {
      error.set(e instanceof Error ? `${e.name}: ${e.message}` : String(e))
    }
  }
  const reset = () => {
    code.set(initial)
    run()
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

  onCleanup(() => {
    runId++
    dispose?.()
  })
  queueMicrotask(run)

  return html`<div class="runner">
    <div class="runner-bar">
      <strong>${title}</strong>
      <span class="muted small">JavaScript · Ctrl+Enter çalıştırır · Esc editörden çıkar</span>
      <span class="spacer"></span>
      <bz-button size="sm" variant="ghost" @click=${reset}>Sıfırla</bz-button>
      <bz-button size="sm" variant="primary" @click=${run}>Çalıştır ▶</bz-button>
    </div>
    <textarea
      class="runner-code"
      spellcheck="false"
      aria-label="Örnek kod"
      rows=${() => Math.min(30, code().split("\n").length + 1)}
      .value=${code}
      @input=${(e: Event) => code.set((e.target as HTMLTextAreaElement).value)}
      @keydown=${onKeydown}
    ></textarea>
    <div class="runner-error" role="alert" ?hidden=${() => !error()}>${error}</div>
    <div class="runner-panes">
      <div class="runner-pane">
        <div class="runner-pane-title">Çıktı</div>
        <div class="runner-output" ref=${(el: HTMLElement) => (output = el)}></div>
      </div>
      <div class="runner-pane">
        <div class="runner-pane-title">
          log()
          <button type="button" class="link" @click=${() => logs.set([])}>Temizle</button>
        </div>
        <ol class="runner-log">
          ${repeat(
            logs,
            (l) => l.id,
            (l) => html`<li>${l.text}</li>`
          )}
        </ol>
      </div>
    </div>
  </div>`
}
