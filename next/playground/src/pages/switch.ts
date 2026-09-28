import { html, signal } from "@bazlama/core"
import { toast } from "@bazlama/headless"
import { switchUsage } from "../docs/specs-forms"
import { usage } from "../docs/usage"
import { log } from "../log"

export default {
  id: "switch",
  title: "Switch",
  description: "Anında uygulanan açık/kapalı ayar: role=switch olan native checkbox. API bz-checkbox ile aynı (indeterminate hariç).",
  render() {
    const settings = {
      mail: signal(true),
      autosave: signal(false),
      compact: signal(false),
    }
    const row = (label: string, s: (typeof settings)["mail"], hint = "") =>
      html`<bz-switch .checked=${s} hint=${hint} @change=${(e: CustomEvent<{ checked: boolean }>) => {
        s.set(e.detail.checked)
        toast(`${label}: ${e.detail.checked ? "açık" : "kapalı"}`)
      }}>${label}</bz-switch>`
    return html`
      ${usage(switchUsage)}

      <section class="demo">
        <h2>Ayarlar</h2>
        <div class="stack-sm">
          ${row("E-posta bildirimleri", settings.mail, "Onay adımı size geldiğinde.")}
          ${row("Otomatik kaydet", settings.autosave)}
          ${row("Sıkı tablo görünümü", settings.compact)}
          <bz-switch checked readonly>Yönetici tarafından kilitli</bz-switch>
          <bz-switch disabled>Devre dışı</bz-switch>
        </div>
        <p class="muted small">
          Durum: <code>${() => JSON.stringify({ mail: settings.mail(), autosave: settings.autosave(), compact: settings.compact() })}</code>
        </p>
      </section>

      <section class="demo">
        <h2>Formda</h2>
        <form class="row" @submit=${(e: SubmitEvent) => (e.preventDefault(), toast(JSON.stringify([...new FormData(e.target as HTMLFormElement)])))}>
          <bz-switch name="public" value="1" @change=${log("public")}>Herkese açık</bz-switch>
          <bz-button type="submit" size="sm">Gönder</bz-button>
        </form>
      </section>
    `
  },
}
