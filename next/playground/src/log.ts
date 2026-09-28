import { html, repeat, signal } from "@bazlama/core"

interface Entry {
  id: number
  time: string
  source: string
  type: string
  detail: string
}

const entries = signal<Entry[]>([])
let nextId = 0

export function logEntry(source: string, type: string, detail = ""): void {
  const time = new Date().toLocaleTimeString("tr-TR", { hour12: false })
  const text = detail.length > 140 ? `${detail.slice(0, 140)}…` : detail
  entries.update((list) => [{ id: ++nextId, time, source, type, detail: text }, ...list].slice(0, 80))
}

/** Event handler that logs the event with its detail (CustomEvent) or the target's value. */
export function log(source: string) {
  return (event: Event) => {
    let detail = ""
    if (event instanceof CustomEvent) detail = JSON.stringify(event.detail)
    else if (event.currentTarget && "value" in event.currentTarget)
      detail = JSON.stringify((event.currentTarget as { value: unknown }).value)
    logEntry(source, event.type, detail)
  }
}

export const EventLog = () => html`
  <div class="log-head">
    <strong>Olay günlüğü</strong>
    <button type="button" class="link" @click=${() => entries.set([])}>Temizle</button>
  </div>
  <p class="muted small" ?hidden=${() => entries().length > 0}>Bileşenlerle etkileşime geçin; olaylar burada görünür.</p>
  <ol class="log-list">
    ${repeat(
      entries,
      (e) => e.id,
      (e) => html`<li>
        <div><time>${e.time}</time> <b>${e.source}</b> <code>${e.type}</code></div>
        <div class="log-detail" ?hidden=${!e.detail}>${e.detail}</div>
      </li>`
    )}
  </ol>
`
