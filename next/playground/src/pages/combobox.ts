import { html, repeat, signal } from "@bazlama/core"
import { CITIES } from "../data"
import { log, logEntry } from "../log"
import { submitToLog } from "./shared"
import { comboboxUsage } from "../docs/specs"
import { usage } from "../docs/usage"

export default {
  id: "combobox",
  title: "Combobox",
  description:
    "Filtrelenebilir açılır liste. Input'ta odak kalır; ok tuşları, Enter, Escape, Tab. Seçenekler light DOM çocukları olarak verilir ve popup içine projekte edilir. Form-associated, required destekler.",
  render() {
    const city = signal("izmir")
    const remote = signal<string[]>([])
    const loading = signal(false)
    const load = () => {
      loading.set(true)
      remote.set([])
      setTimeout(() => {
        remote.set(CITIES.slice(0, 12))
        loading.set(false)
        logEntry("uzak veri", "loaded", "12 seçenek")
      }, 800)
    }
    const many = Array.from({ length: 2000 }, (_, i) => `Kayıt ${String(i + 1).padStart(4, "0")}`)
    const toValue = (name: string) =>
      name.toLocaleLowerCase("tr-TR").replace(/ı/g, "i").replace(/ş/g, "s").replace(/ç/g, "c").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ğ/g, "g").replace(/i̇/g, "i")

    return html`
      ${usage(comboboxUsage)}

      <section class="demo">
        <h2>Temel</h2>
        <div class="grid-2">
          <bz-combobox label="Şehir" placeholder="Şehir seçin" .value=${city} @change=${(e: CustomEvent<{ value: string }>) => {
            city.set(e.detail.value)
            log("şehir")(e)
          }}>
            ${CITIES.map((name) => html`<bz-option value=${toValue(name)}>${name}</bz-option>`)}
          </bz-combobox>
          <div>
            <p>Değer: <code>${city}</code></p>
            <bz-button size="sm" @click=${() => city.set("trabzon")}>Dışarıdan "trabzon"</bz-button>
          </div>
        </div>
      </section>

      <section class="demo">
        <h2>Serbest metin ve baş harfle filtre</h2>
        <div class="grid-2">
          <bz-combobox label="Etiket (allow-custom)" placeholder="Yazın veya seçin" allow-custom @change=${log("etiket")}>
            <bz-option>frontend</bz-option>
            <bz-option>backend</bz-option>
            <bz-option>devops</bz-option>
            <bz-option>tasarım</bz-option>
          </bz-combobox>
          <bz-combobox label="Şehir (starts-with)" filter="starts-with" placeholder="Baş harf" @change=${log("starts-with")}>
            ${CITIES.map((name) => html`<bz-option>${name}</bz-option>`)}
          </bz-combobox>
        </div>
      </section>

      <section class="demo">
        <h2>Form, required ve asenkron seçenekler</h2>
        <form class="stack narrow" @submit=${submitToLog("teslimat formu")}>
          <bz-combobox name="city" label="Teslimat şehri" required placeholder=${() => (loading() ? "Yükleniyor…" : "Önce yükleyin")} @change=${log("teslimat")}>
            ${repeat(
              remote,
              (name) => name,
              (name) => html`<bz-option value=${toValue(name)}>${name}</bz-option>`
            )}
            <span slot="empty">${() => (loading() ? "Yükleniyor…" : "Seçenek yok")}</span>
          </bz-combobox>
          <div class="row">
            <bz-button @click=${load} .loading=${loading}>Seçenekleri yükle (0.8 sn)</bz-button>
            <bz-button type="submit" variant="primary">Gönder</bz-button>
            <bz-button type="reset">Sıfırla</bz-button>
          </div>
        </form>
      </section>

      <section class="demo">
        <h2>2.000 seçenek</h2>
        <div class="narrow">
          <bz-combobox label="Büyük liste" placeholder="Örn. 1999" @change=${log("büyük liste")}>
            ${many.map((name) => html`<bz-option>${name}</bz-option>`)}
          </bz-combobox>
        </div>
        <p class="note">Sanal liste (virtualization) yok: her tuş vuruşunda 2.000 seçeneğin <code>hidden</code> durumu güncellenir. Gecikmeyi burada gözlemleyin.</p>
      </section>
    `
  },
}
