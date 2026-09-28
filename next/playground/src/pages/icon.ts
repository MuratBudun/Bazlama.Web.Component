import { flush, html, signal } from "@bazlama/core"
import { defineIconFromSvg, fold, icon, iconNames } from "@bazlama/headless"
import { iconUsage } from "../docs/specs"
import { usage } from "../docs/usage"
import { logEntry } from "../log"

const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
  <path d="M12 3v18M3 12h18"/>
  <circle cx="12" cy="12" r="4"/>
</svg>`

export default {
  id: "icon",
  title: "İkonlar",
  description:
    "Tek bir SVG sprite, kullanılan her ikon için bir <symbol> ve her kullanımda ucuz bir <svg><use>. İkonlar currentColor ile boyanır, 1em boyutundadır; çizgi kalınlığı --bz-icon-stroke-width ile ayarlanır.",
  render() {
    const names = signal(iconNames())
    const query = signal("")
    const size = signal(28)
    const stroke = signal(2)
    const color = signal("")
    const svgText = signal(SAMPLE_SVG)
    const svgName = signal("hedef")
    const svgError = signal("")
    const perf = signal<{ label: string; ms: number }[]>([])

    const visible = () => {
      const q = fold(query().trim())
      return q ? names().filter((n) => fold(n).includes(q)) : names()
    }
    const copyName = async (name: string) => {
      const snippet = `icon("${name}")`
      try {
        await navigator.clipboard.writeText(snippet)
      } catch {
        /* clipboard unavailable */
      }
      logEntry("ikon", "kopyalandı", snippet)
    }
    const addSvg = () => {
      try {
        defineIconFromSvg(svgName.peek().trim(), svgText.peek())
        names.set(iconNames())
        svgError.set("")
        logEntry("ikon", "eklendi", svgName.peek())
      } catch (e) {
        svgError.set(e instanceof Error ? e.message : String(e))
      }
    }
    const measure = (label: string, create: () => Node) => {
      const box = document.createElement("div")
      box.className = "icon-perf-box"
      document.body.append(box)
      const t0 = performance.now()
      const fragment = document.createDocumentFragment()
      for (let i = 0; i < 5000; i++) fragment.append(create())
      box.append(fragment)
      flush()
      box.offsetHeight
      const ms = performance.now() - t0
      box.remove()
      perf.update((list) => [{ label, ms }, ...list].slice(0, 6))
    }

    return html`
      ${usage(iconUsage)}

      <section class="demo">
        <h2>Galeri</h2>
        <div class="row icon-controls">
          <label class="field">Ara <input type="search" .value=${query} @input=${(e: Event) => query.set((e.target as HTMLInputElement).value)} placeholder="ör. arrow" /></label>
          <label class="field">Boyut ${size}px <input type="range" min="12" max="56" .value=${() => String(size())} @input=${(e: Event) => size.set(Number((e.target as HTMLInputElement).value))} /></label>
          <label class="field">Çizgi ${stroke} <input type="range" min="1" max="3" step="0.25" .value=${() => String(stroke())} @input=${(e: Event) => stroke.set(Number((e.target as HTMLInputElement).value))} /></label>
          <label class="field">Renk <input type="color" @input=${(e: Event) => color.set((e.target as HTMLInputElement).value)} /></label>
        </div>
        <div
          class="icon-grid"
          style=${() => `font-size:${size()}px;--bz-icon-stroke-width:${stroke()};${color() ? `color:${color()}` : ""}`}
        >
          ${() =>
            visible().map(
              (name) => html`<button type="button" class="icon-tile" title=${`icon("${name}") — kopyala`} @click=${() => copyName(name)}>
                ${icon(name)}<span>${name}</span>
              </button>`
            )}
        </div>
        <p class="note">${() => `${visible().length} / ${names().length} ikon`} · Bir ikona tıklayınca <code>icon("…")</code> kodu kopyalanır.</p>
      </section>

      <section class="demo">
        <h2>Metin içinde</h2>
        <p class="icon-inline">
          ${icon("info")} Bilgi mesajı ·
          <span style="color:var(--bz-color-danger)">${icon("alert")} Hata rengini devralır</span> ·
          <bz-button size="sm">${icon("download")} İndir</bz-button>
          <bz-button size="sm" variant="primary">${icon("plus")} Yeni kayıt</bz-button>
          <bz-icon name="star" label="Favori" size="24" style="color:#e8a200"></bz-icon>
        </p>
      </section>

      <section class="demo">
        <h2>SVG'den ikon ekle</h2>
        <div class="grid-2">
          <div class="stack-sm">
            <label class="field">Ad <input .value=${svgName} @input=${(e: Event) => svgName.set((e.target as HTMLInputElement).value)} /></label>
            <textarea class="runner-code" rows="7" spellcheck="false" .value=${svgText} @input=${(e: Event) => svgText.set((e.target as HTMLTextAreaElement).value)}></textarea>
            <div class="row"><bz-button size="sm" variant="primary" @click=${addSvg}>Ekle</bz-button></div>
            <p class="note" style="color:var(--bz-color-danger)" ?hidden=${() => !svgError()}>${svgError}</p>
          </div>
          <div>
            <p class="note">
              Kök <code>&lt;svg&gt;</code> üzerindeki <code>viewBox</code> korunur. <code>fill="none"</code> veya bir <code>stroke</code>
              varsa çizgi ikonu, yoksa dolgu ikonu olarak kaydedilir. İçerik SVG olarak eklenir; sadece güvendiğiniz kaynaklardan ikon kaydedin.
            </p>
            <p class="icon-preview">${() => (names().includes(svgName().trim()) ? icon(svgName().trim(), { size: 48 }) : html`<span class="muted small">Önizleme: ekledikten sonra</span>`)}</p>
          </div>
        </div>
      </section>

      <section class="demo">
        <h2>Performans: 5.000 ikon</h2>
        <div class="row">
          <bz-button size="sm" @click=${() => measure("icon() fonksiyonu", () => icon("folder"))}>icon() × 5.000</bz-button>
          <bz-button size="sm" @click=${() =>
            measure("<bz-icon> elementi", () => Object.assign(document.createElement("bz-icon"), { name: "folder" }))}>&lt;bz-icon&gt; × 5.000</bz-button>
        </div>
        <table class="results" ?hidden=${() => perf().length === 0}>
          <thead><tr><th>Yöntem</th><th>Oluştur + DOM'a ekle + layout</th></tr></thead>
          <tbody>
            ${() => perf().map((p) => html`<tr><td>${p.label}</td><td>${`${p.ms.toFixed(1)} ms`}</td></tr>`)}
          </tbody>
        </table>
        <p class="note">Tablo, ağaç ve liste satırlarında <code>icon()</code> tercih edin: custom element'in setup maliyeti yoktur.</p>
      </section>
    `
  },
}
