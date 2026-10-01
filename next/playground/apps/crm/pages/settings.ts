import { computed, html, signal } from "@bazlama/core"
import { dialogs, icon, toast } from "@bazlama/headless"
import { definePage } from "@bazlama/router"
import { contrastFailures, type Neutral } from "@bazlama/themes/builder"
import type { DemoTheme } from "../../shared/boot"
import { CONTRAST_TR, NEUTRAL_TR } from "../../shared/theme-tr"
import { applyBrand, BRAND_DEFAULT, BRAND_SWATCHES, brandSettings, loadBrand, saveBrand, type Brand } from "../brand"

/** A built-in theme or the company theme (generated at run time, light or dark). */
export type CrmTheme = DemoTheme | "brand" | "brand-dark"
const THEMES: CrmTheme[] = ["light", "dark", "forest", "modern", "modern-dark", "brand", "brand-dark"]
export const THEME_KEY = "ada-crm:theme"
export const savedTheme = (): CrmTheme => {
  try {
    const t = localStorage.getItem(THEME_KEY)
    return THEMES.includes(t as CrmTheme) ? (t as CrmTheme) : "light"
  } catch {
    return "light"
  }
}

/** Puts a theme on <html>; the company theme is generated (and regenerated) first. */
export function applyCrmTheme(theme: CrmTheme, brand: Brand = loadBrand()): void {
  if (theme === "brand" || theme === "brand-dark") {
    const names = applyBrand(brand)
    document.documentElement.dataset.theme = theme === "brand" ? names.light : names.dark
  } else document.documentElement.dataset.theme = theme
}

export default definePage({
  title: "Ayarlar",
  setup() {
    const theme = signal(savedTheme())
    const brand = signal(loadBrand())
    // Readability of the company theme, both variants (WCAG AA).
    const failures = computed(() => contrastFailures(brandSettings(brand())))
    const prefs = {
      mail: signal(true),
      push: signal(false),
      weekly: signal(true),
      compact: signal(document.documentElement.dataset.density === "compact"),
    }
    const setTheme = (t: CrmTheme) => {
      theme.set(t)
      applyCrmTheme(t, brand.peek())
      try {
        localStorage.setItem(THEME_KEY, t)
      } catch {
        /* storage unavailable */
      }
    }
    /** A brand change shows at once: the company theme is switched on (keeping light / dark). */
    const setBrand = (patch: Partial<Brand>) => {
      brand.update((b) => ({ ...b, ...patch }))
      saveBrand(brand.peek())
      const current = theme.peek()
      const dark = current === "dark" || current === "modern-dark" || current === "brand-dark"
      setTheme(dark ? "brand-dark" : "brand")
    }
    const resetBrand = () => {
      brand.set({ ...BRAND_DEFAULT })
      saveBrand(brand.peek())
      if (theme.peek().startsWith("brand")) applyCrmTheme(theme.peek(), brand.peek())
      toast("Kurum teması varsayılana döndü.")
    }
    const resetLayout = async () => {
      const ok = await dialogs.confirm({
        heading: "Yerleşimi sıfırla",
        message: "Menü genişlikleri, müşteri listesinin sütun düzeni ve sıralaması varsayılana dönecek.",
        confirmText: "Sıfırla",
        cancelText: "Vazgeç",
      })
      if (!ok) return
      try {
        // What persist="…" saved (bz-shell / bz-data-grid).
        localStorage.removeItem("bz-shell:ada-crm")
        localStorage.removeItem("bz-data-grid:ada-crm-customers")
      } catch {
        /* storage unavailable */
      }
      toast.success("Yerleşim sıfırlandı; sayfa yenileniyor…")
      setTimeout(() => location.reload(), 900)
    }
    const toggle = (label: string, s: (typeof prefs)["mail"], hint = "") =>
      html`<bz-switch .checked=${s} hint=${hint} @change=${(e: CustomEvent<{ checked: boolean }>) => {
        s.set(e.detail.checked)
        toast(`${label}: ${e.detail.checked ? "açık" : "kapalı"}`)
      }}>${label}</bz-switch>`

    return html`<div class="page">
      <div class="page-head"><h1>Ayarlar</h1></div>
      <form @submit=${(e: SubmitEvent) => (e.preventDefault(), toast.success("Profil kaydedildi."))}>
        <bz-form-layout columns="1" label-position="start" label-width="11rem">
          <bz-form-section heading="Profil">
            <div class="row"><bz-avatar name="Ada Yılmaz" size="lg"></bz-avatar><span class="muted small">Profil resmi kurum dizininden gelir.</span></div>
            <bz-input label="Ad soyad" value="Ada Yılmaz" required></bz-input>
            <bz-input label="E-posta" value="ada.yilmaz@adacrm.com.tr" readonly hint="Değiştirmek için yöneticinize başvurun."></bz-input>
            <bz-input label="Unvan" value="Satış Müdürü"></bz-input>
            <bz-form-actions><bz-button type="submit" variant="primary">Kaydet</bz-button></bz-form-actions>
          </bz-form-section>

          <bz-form-section heading="Bildirimler" description="Değişiklikler hemen uygulanır.">
            ${toggle("E-posta bildirimleri", prefs.mail, "Size atanan müşteri ve siparişler için.")}
            ${toggle("Anlık bildirimler", prefs.push)}
            ${toggle("Haftalık özet", prefs.weekly, "Her pazartesi 09:00'da.")}
          </bz-form-section>

          <bz-form-section heading="Görünüm">
            <bz-radio-group label="Tema" orientation="horizontal" .value=${theme}
              @change=${(e: CustomEvent<{ value: CrmTheme }>) => setTheme(e.detail.value)}>
              <bz-radio value="light">Açık</bz-radio>
              <bz-radio value="dark">Koyu</bz-radio>
              <bz-radio value="forest">Forest</bz-radio>
              <bz-radio value="modern">Modern</bz-radio>
              <bz-radio value="modern-dark">Modern koyu</bz-radio>
              <bz-radio value="brand">Kurum</bz-radio>
              <bz-radio value="brand-dark">Kurum koyu</bz-radio>
            </bz-radio-group>
            <bz-checkbox .checked=${prefs.compact} @change=${(e: CustomEvent<{ checked: boolean }>) => {
              prefs.compact.set(e.detail.checked)
              if (e.detail.checked) document.documentElement.dataset.density = "compact"
              else delete document.documentElement.dataset.density
            }}>Sıkı yerleşim (daha küçük kontroller)</bz-checkbox>
          </bz-form-section>

          <bz-form-section heading="Kurum teması" description="Firmanızın rengi: açık ve koyu tema bundan üretilir, uygulamaya hemen yansır.">
            <div class="brand-field">
              <span class="brand-label" id="brand-color-label">Marka rengi</span>
              <div class="brand-swatches" role="group" aria-labelledby="brand-color-label">
                ${BRAND_SWATCHES.map(
                  (c) => html`<button type="button" class="brand-swatch" style=${`--swatch:${c}`} aria-label=${c}
                    aria-pressed=${() => String(brand().primary === c)} @click=${() => setBrand({ primary: c })}></button>`
                )}
                <label class="brand-custom" data-tooltip="Başka bir renk">
                  <input type="color" aria-label="Başka bir renk" .value=${() => brand().primary}
                    @change=${(e: Event) => setBrand({ primary: (e.target as HTMLInputElement).value })} />
                </label>
                <code class="muted small">${() => brand().primary}</code>
              </div>
            </div>
            <bz-radio-group label="Gri tonu" orientation="horizontal" .value=${() => brand().neutral}
              @change=${(e: CustomEvent<{ value: Neutral }>) => setBrand({ neutral: e.detail.value })}>
              ${(Object.keys(NEUTRAL_TR) as Neutral[]).map((n) => html`<bz-radio value=${n}>${NEUTRAL_TR[n]}</bz-radio>`)}
            </bz-radio-group>
            <bz-radio-group label="Köşeler" orientation="horizontal" .value=${() => String(brand().radius)}
              @change=${(e: CustomEvent<{ value: string }>) => setBrand({ radius: Number(e.detail.value) })}>
              <bz-radio value="2">Keskin</bz-radio><bz-radio value="8">Normal</bz-radio><bz-radio value="12">Yumuşak</bz-radio>
            </bz-radio-group>
            ${() => {
              const list = failures()
              return list.length
                ? html`<bz-alert variant="warning" heading="Okunabilirlik">
                    Bu renkle bazı metinler zor okunabilir:
                    ${list.map((f) => html`<br />· ${CONTRAST_TR[f.check.id]} (${f.mode === "light" ? "açık" : "koyu"}, ${f.check.ratio.toFixed(1)}:1)`)}
                  </bz-alert>`
                : html`<p class="muted small">${icon("circle-check")} Okunabilirlik kontrolü: açık ve koyu temada metinler yeterli kontrastta (WCAG AA).</p>`
            }}
            <div><bz-button size="sm" variant="ghost" @click=${resetBrand}>${icon("refresh")} Varsayılana dön</bz-button></div>
          </bz-form-section>

          <bz-form-section heading="Yerleşim" description="Menü genişliği ve liste düzenleri bu tarayıcıda saklanır (persist).">
            <div><bz-button @click=${resetLayout}>${icon("refresh")} Yerleşimi sıfırla</bz-button></div>
          </bz-form-section>
        </bz-form-layout>
      </form>
    </div>`
  },
})
