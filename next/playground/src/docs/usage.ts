import { html, signal } from "@bazlama/core"
import { codeBlock } from "./code"
import { runner } from "./runner"

/**
 * "Kullanım" section shared by the component pages: the same example as plain HTML (with a
 * live preview), as JavaScript with the DOM API (runnable), and as a Bazlama html`` template,
 * followed by the API tables.
 */

export interface UsageProp {
  name: string
  /** Attribute name; default: kebab-case of `name`. `false`: property only (objects, arrays, functions). */
  attr?: string | false
  type: string
  default?: string
  desc: string
}
export interface UsageEvent {
  name: string
  detail: string
  desc: string
}
export interface UsagePart {
  name: string
  desc: string
}

export interface UsageSpec {
  tag: string
  /** Section id and heading when a page has several usage sections (default "kullanim", "Kullanım"). */
  id?: string
  heading?: string
  /** Rendered as the live preview (a <script> in it does not run: use `preview`). */
  html: string
  /** Does what the <script> part of `html` does, on the preview element. */
  preview?: (root: HTMLElement) => void
  /** false: no live preview (e.g. a second <bz-router> would take over navigation). */
  livePreview?: boolean
  /** false: show the JavaScript example as code instead of running it. */
  runnable?: boolean
  /** Runs in the "Kendin dene" runner: `output` is the result element, `log(...)` prints. */
  js: string
  /** Same example inside a Bazlama html`` template. */
  template: string
  props: UsageProp[]
  events?: UsageEvent[]
  /** Methods and extra properties (e.g. functions exported next to the element). */
  api?: UsagePart[]
  slots?: UsagePart[]
  parts?: UsagePart[]
  /** Attributes/states for CSS, e.g. `[aria-selected="true"]`. */
  hooks?: string[]
  notes?: string[]
}

const toKebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)

const INSTALL = `// Bileşenler (bz-* elementlerini kaydeder) ve isteğe bağlı görünüm + tema
import "@bazlama/headless"
import "@bazlama/ui/index.css"
import "@bazlama/themes/index.css"`

type Tab = "html" | "js" | "template"
const TABS: [Tab, string][] = [
  ["html", "HTML"],
  ["js", "JavaScript"],
  ["template", "Bazlama şablonu"],
]

export function usage(spec: UsageSpec) {
  const tab = signal<Tab>("html")
  const onKeydown = (e: KeyboardEvent) => {
    const i = TABS.findIndex(([id]) => id === tab.peek())
    const next = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : null
    if (next === null) return
    e.preventDefault()
    const [id] = TABS[(next + TABS.length) % TABS.length]
    tab.set(id)
    ;(e.currentTarget as HTMLElement).querySelector<HTMLElement>(`[data-tab="${id}"]`)?.focus()
  }
  const preview = (el: HTMLElement) => {
    el.innerHTML = spec.html
    spec.preview?.(el)
  }

  return html`
    <section class="demo usage" id=${spec.id ?? "kullanim"}>
      <h2>${spec.heading ?? "Kullanım"}</h2>
      <details class="usage-install">
        <summary>Kurulum</summary>
        ${codeBlock(INSTALL, "Uygulamanın giriş dosyası")}
        <p class="note">Paket adları yayın öncesi kesinleşmedi; playground aynı kaynakları doğrudan kullanır.</p>
      </details>

      <div class="usage-tabs" role="tablist" aria-label="Kullanım biçimi" @keydown=${onKeydown}>
        ${TABS.map(
          ([id, label]) => html`<button
            type="button"
            role="tab"
            data-tab=${id}
            aria-selected=${() => String(tab() === id)}
            tabindex=${() => (tab() === id ? "0" : "-1")}
            @click=${() => tab.set(id)}
          >${label}</button>`
        )}
      </div>

      <div role="tabpanel" ?hidden=${() => tab() !== "html"}>
        ${codeBlock(spec.html.trim(), `<${spec.tag}> düz HTML`)}
        ${spec.livePreview === false
          ? null
          : html`<div class="usage-preview">
              <span class="usage-preview-label">Önizleme</span>
              <div ref=${preview}></div>
            </div>`}
        <p class="note">
          Elementler tanımlanmadan önce sayfada olabilir; <code>customElements.define</code> çalışınca yükseltilirler ve o anki
          öznitelikleri okurlar. Nesne/dizi değerler (ör. <code>.items</code>) öznitelikle değil JavaScript ile verilir.
        </p>
      </div>
      <div role="tabpanel" ?hidden=${() => tab() !== "js"}>
        ${spec.runnable === false ? codeBlock(spec.js.trim(), "JavaScript") : runner(spec.js, "JavaScript (DOM API)")}
        <p class="note">Özellikler (property) doğrudan atanır, olaylar <code>addEventListener</code> ile dinlenir; ayrıntı <code>event.detail</code> içindedir.</p>
      </div>
      <div role="tabpanel" ?hidden=${() => tab() !== "template"}>
        ${codeBlock(spec.template.trim(), "html`` şablonu (signal bağlamalı)")}
        <p class="note">
          <code>attr=\${x}</code> özniteliğe, <code>.prop=\${x}</code> özelliğe, <code>?attr=\${x}</code> boolean özniteliğe,
          <code>@event=\${fn}</code> olaya bağlar. Signal verilirse değer değiştikçe güncellenir.
        </p>
      </div>

      <h3>Özellikler</h3>
      <div class="usage-scroll">
        <table class="api">
          <thead><tr><th>Özellik</th><th>Öznitelik</th><th>Tip</th><th>Varsayılan</th><th>Açıklama</th></tr></thead>
          <tbody>
            ${spec.props.map(
              (p) => html`<tr>
                <td><code>${p.name}</code></td>
                <td>${p.attr === false ? html`<span class="muted">—</span>` : html`<code>${p.attr ?? toKebab(p.name)}</code>`}</td>
                <td><code>${p.type}</code></td>
                <td>${p.default ? html`<code>${p.default}</code>` : html`<span class="muted">—</span>`}</td>
                <td>${p.desc}</td>
              </tr>`
            )}
          </tbody>
        </table>
      </div>
      ${spec.events?.length
        ? html`<h3>Olaylar</h3>
            <div class="usage-scroll">
              <table class="api">
                <thead><tr><th>Olay</th><th><code>detail</code></th><th>Ne zaman</th></tr></thead>
                <tbody>
                  ${spec.events.map((e) => html`<tr><td><code>${e.name}</code></td><td><code>${e.detail}</code></td><td>${e.desc}</td></tr>`)}
                </tbody>
              </table>
            </div>`
        : null}
      ${partsTable("Yardımcılar", "Ad", spec.api)} ${partsTable("Slotlar", "slot", spec.slots)}
      ${partsTable("Anatomi (CSS için)", "data-part", spec.parts)}
      ${spec.hooks?.length
        ? html`<p class="note">Stil kancaları: ${spec.hooks.map((h, i) => html`${i ? ", " : ""}<code>${h}</code>`)}</p>`
        : null}
      ${spec.notes?.map((n) => html`<p class="note">${n}</p>`)}
    </section>
  `
}

function partsTable(title: string, column: string, rows?: UsagePart[]) {
  if (!rows?.length) return null
  return html`<h3>${title}</h3>
    <table class="api">
      <thead><tr><th>${column}</th><th>Açıklama</th></tr></thead>
      <tbody>${rows.map((r) => html`<tr><td><code>${r.name}</code></td><td>${r.desc}</td></tr>`)}</tbody>
    </table>`
}
