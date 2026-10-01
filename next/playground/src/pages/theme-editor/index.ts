import { computed, effect, html, onCleanup, signal } from "@bazlama/core"
import { dialogs, icon, toast } from "@bazlama/headless"
import { preview } from "./preview"
import {
  contrastChecks,
  isHex,
  DEFAULT_SETTINGS,
  diffOverrides,
  FONTS,
  generate,
  parseCss,
  previewCss,
  themeNames,
  toCss,
  type Mode,
  type Neutral,
  type ShadowLevel,
  type Style,
  type ThemeSettings,
} from "@bazlama/themes/builder"
import { CONTRAST_TR, FONT_TR } from "../../../apps/shared/theme-tr"
import "./theme-editor.css"

/**
 * Theme editor (playground tool): a few choices become a full bazlama theme (light + dark),
 * previewed live on real components and exported as a CSS file. The preview applies exactly
 * the exported tokens to a container, so what you see is what you ship.
 */

const STORAGE_KEY = "bz-theme-editor"
const PREVIEW_THEME = "bz-theme-editor-preview"

function load(): ThemeSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<ThemeSettings> | null
    if (saved) return { ...DEFAULT_SETTINGS, ...saved, overrides: { light: {}, dark: {}, ...saved.overrides } }
  } catch {
    /* private mode or bad data: start fresh */
  }
  return structuredClone(DEFAULT_SETTINGS)
}

const WIDTHS: [string, string][] = [["full", "Tam"], ["768px", "Tablet"], ["390px", "Telefon"]]

export default {
  id: "theme-editor",
  title: "Tema editörü",
  group: "Araçlar",
  wide: true,
  description:
    "Marka rengi, gri tonu, köşe, yükseklik, gölge ve yazı tipinden açık + koyu bir bazlama teması üretir. Önizleme dışa aktarılan token'ların aynısını kullanır; kontrast WCAG'e göre denetlenir; CSS kopyalanır, indirilir veya geri yüklenir.",
  render() {
    const settings = signal(load())
    const mode = signal<Mode>("light")
    const compact = signal(false)
    const width = signal("full")
    const tab = signal("preview")
    const set = (patch: Partial<ThemeSettings>) => settings.update((s) => ({ ...s, ...patch }))
    // Wide screens: the editor fills the page height, settings and preview scroll on their own.
    const wideQuery = matchMedia("(min-width: 901px)")
    const wideScreen = signal(wideQuery.matches)
    const onWide = () => wideScreen.set(wideQuery.matches)
    wideQuery.addEventListener("change", onWide)
    onCleanup(() => wideQuery.removeEventListener("change", onWide))

    const tokens = computed(() => generate(settings(), mode()))
    const css = computed(() => toCss(settings()))
    const checks = computed(() => contrastChecks(tokens()))
    const failures = computed(() => checks().filter((c) => !c.advisory && c.ratio < c.min).length)
    const names = computed(() => themeNames(settings()))

    let styleEl: HTMLStyleElement | undefined
    effect(() => {
      const text = previewCss(settings(), mode(), `[data-theme="${PREVIEW_THEME}"]`)
      if (styleEl) styleEl.textContent = text
    })
    effect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings()))
      } catch {
        /* storage full or blocked: the draft is not kept */
      }
    })

    // ------------------------------------------------------------------ actions
    const copy = async () => {
      try {
        await navigator.clipboard.writeText(css())
        toast.success("Tema CSS'i panoya kopyalandı.")
      } catch {
        toast.error("Panoya kopyalanamadı; CSS sekmesinden seçip kopyalayın.")
      }
    }
    const download = () => {
      const url = URL.createObjectURL(new Blob([css()], { type: "text/css" }))
      const a = Object.assign(document.createElement("a"), { href: url, download: `${names().light}.css` })
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }
    const reset = async () => {
      if (await dialogs.confirm({ heading: "Sıfırla", message: "Tüm ayarlar ve elle değiştirilen token'lar varsayılana dönsün mü?", confirmText: "Sıfırla", variant: "danger" })) {
        settings.set(structuredClone(DEFAULT_SETTINGS))
      }
    }
    const importCss = async () => {
      const text = signal("")
      const ok = await dialogs.open<boolean>({
        heading: "Tema içe aktar",
        size: "lg",
        content: html`<div class="stack-sm">
          <p class="muted small">Bu editörle ya da elle yazılmış bir tema dosyasını yapıştırın: <code>[data-theme="ad"]</code> ve <code>[data-theme="ad-dark"]</code> blokları okunur. Ayarlardan farklı olan her token elle değiştirilmiş olarak saklanır.</p>
          <bz-textarea label="CSS" rows="12" .value=${text} @input=${(e: Event) => text.set((e.currentTarget as HTMLInputElement).value)}></bz-textarea>
        </div>`,
        footer: (ref) => html`<bz-button @click=${() => void ref.close()}>Vazgeç</bz-button>
          <bz-button variant="primary" @click=${() => void ref.close(true)}>İçe aktar</bz-button>`,
      })
      if (!ok) return
      const parsed = parseCss(text())
      const count = Object.keys(parsed.light).length + Object.keys(parsed.dark).length
      if (!count) return void toast.error('Tema bloğu bulunamadı: [data-theme="…"] { … } bekleniyor.')
      const base = { ...settings.peek(), name: parsed.name ?? settings.peek().name }
      settings.set({ ...base, overrides: diffOverrides(base, parsed) })
      toast.success(`${count} token okundu.`)
    }
    const override = (key: string, value: string) =>
      settings.update((s) => ({ ...s, overrides: { ...s.overrides, [mode.peek()]: { ...s.overrides[mode.peek()], [key]: value } } }))
    const clearOverride = (key: string) =>
      settings.update((s) => {
        const next = { ...s.overrides[mode.peek()] }
        delete next[key]
        return { ...s, overrides: { ...s.overrides, [mode.peek()]: next } }
      })
    const overridden = computed(() => settings().overrides[mode()])

    // ------------------------------------------------------------------ controls
    const colorField = (label: string, key: "primary" | "danger" | "success" | "warning" | "info", hint = "") => html`<div class="te-color">
      <input type="color" aria-label=${label} .value=${() => settings()[key]} @input=${(e: Event) => set({ [key]: (e.target as HTMLInputElement).value })} />
      <bz-input label=${label} hint=${hint} .value=${() => settings()[key]}
        @input=${(e: Event) => {
          const v = (e.currentTarget as HTMLInputElement).value.trim()
          if (isHex(v)) set({ [key]: v.toLowerCase() })
        }}></bz-input>
    </div>`
    const range = (label: string, key: "radius" | "controlHeight", min: number, max: number, unit = "px") => html`<label class="te-range">
      <span>${label} <output>${() => settings()[key]}${unit}</output></span>
      <input type="range" min=${min} max=${max} .value=${() => String(settings()[key])} @input=${(e: Event) => set({ [key]: Number((e.target as HTMLInputElement).value) })} />
    </label>`

    const controls = html`<div class="te-controls">
      <section>
        <h3>Tema</h3>
        <bz-input label="Ad" hint=${() => `data-theme="${names().light}" ve "${names().dark}"`} .value=${() => settings().name}
          @input=${(e: Event) => set({ name: (e.currentTarget as HTMLInputElement).value })}></bz-input>
        <bz-radio-group label="Stil" orientation="horizontal" .value=${() => settings().style} @change=${(e: CustomEvent<{ value: Style }>) => set({ style: e.detail.value })}>
          <bz-radio value="modern" hint="Sade tablolar, rozetler, toast">Modern</bz-radio>
          <bz-radio value="classic" hint="Bileşen varsayılanları">Klasik</bz-radio>
        </bz-radio-group>
        <div class="te-row">
          <bz-button size="sm" @click=${importCss}>${icon("upload")} İçe aktar</bz-button>
          <bz-button size="sm" variant="ghost" @click=${reset}>${icon("refresh")} Sıfırla</bz-button>
        </div>
      </section>

      <section>
        <h3>Renkler</h3>
        ${colorField("Birincil (marka)", "primary", "Hover, açık ton, odak ve üstündeki yazı rengi bundan türetilir.")}
        <bz-radio-group label="Gri tonu" orientation="horizontal" .value=${() => settings().neutral} @change=${(e: CustomEvent<{ value: Neutral }>) => set({ neutral: e.detail.value })}>
          <bz-radio value="cool">Soğuk</bz-radio><bz-radio value="neutral">Nötr</bz-radio><bz-radio value="warm">Sıcak</bz-radio><bz-radio value="brand">Markadan</bz-radio>
        </bz-radio-group>
        ${colorField("Tehlike", "danger")}
        ${colorField("Başarı", "success")}
        ${colorField("Uyarı", "warning")}
        ${colorField("Bilgi", "info")}
        <p class="te-muted small">Durum renkleri yüzeyde okunacak kadar (4.5:1) koyulaştırılır / açılır.</p>
      </section>

      <section>
        <h3>Şekil</h3>
        ${range("Köşe yuvarlaklığı", "radius", 0, 16)}
        ${range("Kontrol yüksekliği", "controlHeight", 28, 44)}
        <bz-radio-group label="Gölge" orientation="horizontal" .value=${() => settings().shadow} @change=${(e: CustomEvent<{ value: ShadowLevel }>) => set({ shadow: e.detail.value })}>
          <bz-radio value="none">Yok</bz-radio><bz-radio value="subtle">Hafif</bz-radio><bz-radio value="medium">Belirgin</bz-radio>
        </bz-radio-group>
      </section>

      <section>
        <h3>Yazı</h3>
        <bz-combobox label="Yazı tipi" .value=${() => settings().font} @change=${(e: CustomEvent<{ value: string }>) => set({ font: e.detail.value })}>
          ${FONTS.map((f) => html`<bz-option value=${f.value}>${FONT_TR[f.id] ?? f.label}</bz-option>`)}
        </bz-combobox>
        <bz-radio-group label="Boyut" orientation="horizontal" .value=${() => String(settings().fontSize)} @change=${(e: CustomEvent<{ value: string }>) => set({ fontSize: Number(e.detail.value) })}>
          ${[13, 14, 15, 16].map((n) => html`<bz-radio value=${n}>${n}px</bz-radio>`)}
        </bz-radio-group>
      </section>
    </div>`

    // ------------------------------------------------------------------ tabs
    const ratioText = (r: number) => `${r.toFixed(2)}:1`
    const contrastView = html`<div class="te-contrast">
      <p class="te-muted small">WCAG 2: normal metin en az 4.5:1 (AA), 7:1 (AAA); odak halkası ve kontrol kenarı gibi metin dışı öğeler 3:1. Değerler ${() => (mode() === "light" ? "açık" : "koyu")} varyant için.</p>
      <table class="api">
        <thead><tr><th>Çift</th><th>Örnek</th><th>Oran</th><th>Sonuç</th></tr></thead>
        <tbody>
          ${() =>
            checks().map(
              (c) => html`<tr>
                <td>${CONTRAST_TR[c.id]}</td>
                <td><span class="te-swatch" style=${`color:${c.fg};background:${c.bg}`}>Aa ${c.min === 3 ? "▢" : ""}</span></td>
                <td class="te-num">${ratioText(c.ratio)}</td>
                <td>${
                  c.ratio >= c.min
                    ? html`<bz-badge variant="success">${c.min === 4.5 && c.ratio >= 7 ? "AAA" : c.min === 3 ? "Geçer" : "AA"}</bz-badge>`
                    : c.advisory
                      ? html`<bz-badge variant="neutral" data-tooltip="WCAG bunu sadece kenarlık tek başına kontrolü belli ediyorsa ister.">Öneri &lt; ${c.min}:1</bz-badge>`
                      : html`<bz-badge variant="danger">Yetersiz &lt; ${c.min}:1</bz-badge>`
                }</td>
              </tr>`
            )}
        </tbody>
      </table>
    </div>`

    const cssView = html`<div class="te-css">
      <div class="te-row">
        <bz-button size="sm" variant="primary" @click=${copy}>${icon("copy")} Kopyala</bz-button>
        <bz-button size="sm" @click=${download}>${icon("download")} ${() => `${names().light}.css`} indir</bz-button>
      </div>
      <p class="te-muted small">
        Kullanım: dosyayı <code>@bazlama/themes</code>'ten sonra yükleyin, <code>&lt;html data-theme="${() => names().light}"&gt;</code> (koyu için
        <code>${() => names().dark}</code>). Tema bir kapsayıcıya da verilebilir; o bölge temayı alır.
      </p>
      <pre class="te-code"><code>${css}</code></pre>
    </div>`

    const tokenView = html`<div class="te-tokens">
      <p class="te-muted small">Üretilen token'ların hepsi (${() => (mode() === "light" ? "açık" : "koyu")} varyant). Bir değeri değiştirmek onu sabitler (●); ayarlar o token'ı artık değiştirmez. ↺ ile otomatiğe döner.</p>
      <table class="api">
        <thead><tr><th>Token</th><th>Değer</th><th></th></tr></thead>
        <tbody>
          ${() =>
            Object.entries(tokens()).map(([key, value]) => {
              const fixed = key in overridden()
              return html`<tr>
                <td><code>${key}</code> ${fixed ? html`<span class="te-fixed" title="Elle değiştirildi">●</span>` : null}</td>
                <td class="te-token-value">
                  ${isHex(value) ? html`<input type="color" aria-label=${key} .value=${value} @change=${(e: Event) => override(key, (e.target as HTMLInputElement).value)} />` : null}
                  <input class="te-token-input" aria-label=${`${key} değeri`} .value=${value} @change=${(e: Event) => override(key, (e.target as HTMLInputElement).value.trim())} />
                </td>
                <td>${fixed ? html`<bz-button size="sm" variant="ghost" aria-label="Otomatiğe döndür" data-tooltip="Otomatiğe döndür" @click=${() => clearOverride(key)}>↺</bz-button>` : null}</td>
              </tr>`
            })}
        </tbody>
      </table>
    </div>`

    return html`
      <style ref=${(el: HTMLStyleElement) => {
        styleEl = el
        el.textContent = previewCss(settings.peek(), mode.peek(), `[data-theme="${PREVIEW_THEME}"]`)
      }}></style>
      <div class="te" data-shell-fill=${() => (wideScreen() ? "" : null)}>
        ${controls}
        <div class="te-main">
          <div class="te-bar">
            <bz-radio-group label="Varyant" orientation="horizontal" .value=${mode} @change=${(e: CustomEvent<{ value: Mode }>) => mode.set(e.detail.value)}>
              <bz-radio value="light">Açık</bz-radio><bz-radio value="dark">Koyu</bz-radio>
            </bz-radio-group>
            <bz-radio-group label="Genişlik" orientation="horizontal" .value=${width} @change=${(e: CustomEvent<{ value: string }>) => width.set(e.detail.value)}>
              ${WIDTHS.map(([v, l]) => html`<bz-radio value=${v}>${l}</bz-radio>`)}
            </bz-radio-group>
            <bz-switch .checked=${compact} @change=${(e: CustomEvent<{ checked: boolean }>) => compact.set(e.detail.checked)}>Sıkı (data-density)</bz-switch>
          </div>
          <bz-tabs fill .value=${tab} @change.self=${(e: CustomEvent<{ value: string }>) => tab.set(e.detail.value)}>
            <bz-tab-list label="Tema editörü">
              <bz-tab value="preview">Önizleme</bz-tab>
              <bz-tab value="contrast">Kontrast ${() => (failures() ? html`<bz-badge variant="danger" solid>${failures()}</bz-badge>` : html`<bz-badge variant="success">✓</bz-badge>`)}</bz-tab>
              <bz-tab value="css">CSS</bz-tab>
              <bz-tab value="tokens">Token'lar ${() => {
                const n = Object.keys(overridden()).length
                return n ? html`<bz-badge variant="primary">${n}</bz-badge>` : null
              }}</bz-tab>
            </bz-tab-list>
            <bz-tab-panel value="preview">
              <div class="te-frame" style=${() => (width() === "full" ? "" : `max-width:${width()}`)}>
                <div class="te-preview" data-theme=${PREVIEW_THEME}>
                  <!-- Density on an inner element: on the themed element the preview tokens would win. -->
                  <div data-density=${() => (compact() ? "compact" : null)}>${preview()}</div>
                </div>
              </div>
            </bz-tab-panel>
            <bz-tab-panel value="contrast">${contrastView}</bz-tab-panel>
            <bz-tab-panel value="css">${cssView}</bz-tab-panel>
            <bz-tab-panel value="tokens">${tokenView}</bz-tab-panel>
          </bz-tabs>
        </div>
      </div>
    `
  },
}
