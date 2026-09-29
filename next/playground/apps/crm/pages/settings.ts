import { html, signal } from "@bazlama/core"
import { dialogs, icon, toast } from "@bazlama/headless"
import { definePage } from "@bazlama/router"

export const THEME_KEY = "ada-crm:theme"
export const savedTheme = (): "light" | "dark" | "forest" => {
  try {
    const t = localStorage.getItem(THEME_KEY)
    return t === "dark" || t === "forest" ? t : "light"
  } catch {
    return "light"
  }
}

export default definePage({
  title: "Ayarlar",
  setup() {
    const theme = signal(savedTheme())
    const prefs = {
      mail: signal(true),
      push: signal(false),
      weekly: signal(true),
      compact: signal(false),
    }
    const setTheme = (t: "light" | "dark" | "forest") => {
      theme.set(t)
      document.documentElement.dataset.theme = t
      try {
        localStorage.setItem(THEME_KEY, t)
      } catch {
        /* storage unavailable */
      }
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
              @change=${(e: CustomEvent<{ value: "light" | "dark" | "forest" }>) => setTheme(e.detail.value)}>
              <bz-radio value="light">Açık</bz-radio>
              <bz-radio value="dark">Koyu</bz-radio>
              <bz-radio value="forest">Forest</bz-radio>
            </bz-radio-group>
            <bz-checkbox .checked=${prefs.compact} @change=${(e: CustomEvent<{ checked: boolean }>) => {
              prefs.compact.set(e.detail.checked)
              document.documentElement.style.setProperty("--bz-control-height", e.detail.checked ? "1.9rem" : "")
            }}>Sıkı yerleşim (daha küçük kontroller)</bz-checkbox>
          </bz-form-section>

          <bz-form-section heading="Yerleşim" description="Menü genişliği ve liste düzenleri bu tarayıcıda saklanır (persist).">
            <div><bz-button @click=${resetLayout}>${icon("refresh")} Yerleşimi sıfırla</bz-button></div>
          </bz-form-section>
        </bz-form-layout>
      </form>
    </div>`
  },
})
