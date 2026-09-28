import { html, repeat, signal } from "@bazlama/core"
import { icon, toast } from "@bazlama/headless"
import { badgeUsage } from "../docs/specs-status"
import { usage } from "../docs/usage"
import { logEntry } from "../log"

const VARIANTS = ["neutral", "primary", "info", "success", "warning", "danger"] as const
const STATUSES: [string, (typeof VARIANTS)[number]][] = [
  ["Hazırlanıyor", "warning"],
  ["Onay Bekliyor", "info"],
  ["Yürürlük Onayında", "primary"],
  ["Yürürlüğe Alma", "danger"],
  ["Yürürlükte", "success"],
  ["İptal", "neutral"],
]

export default {
  id: "badge",
  title: "Badge / Chip",
  description:
    "Rozet (bz-badge): etkileşimsiz durum etiketi ve sayaç. Çip (bz-chip): filtre çipi (seçilebilir) veya kaldırılabilir etiket.",
  render() {
    const count = signal(7)
    const filter = signal("all")
    const tags = signal(["Kalite", "Üretim", "Depo", "Satın Alma"])
    const tagInput = signal("")
    const filters = [
      ["all", "Tümü"],
      ["form", "Doküman Formu (16)"],
      ["dcr", "Değişiklik İsteği (2)"],
    ]
    const addTag = () => {
      const t = tagInput.peek().trim()
      if (!t || tags.peek().includes(t)) return
      tags.update((l) => [...l, t])
      tagInput.set("")
    }
    return html`
      ${usage(badgeUsage)}

      <section class="demo">
        <h2>Rozet: durumlar ve sayaçlar</h2>
        <div class="row">
          ${STATUSES.map(([label, variant]) => html`<bz-badge variant=${variant}>${label}</bz-badge>`)}
        </div>
        <div class="row">
          <span>Bildirimler ${icon("bell")} <bz-badge variant="danger" solid .count=${count} label=${() => `${count()} bildirim`}></bz-badge></span>
          <bz-button size="sm" @click=${() => count.update((n) => n + 45)}>+45</bz-button>
          <bz-button size="sm" @click=${() => count.set(0)}>Sıfırla</bz-button>
          <span>Gizlenen sıfır: <bz-badge variant="primary" hide-zero .count=${count}></bz-badge></span>
          <span>Ada Yılmaz <bz-badge variant="success" dot label="Çevrimiçi"></bz-badge></span>
        </div>
        <p class="note"><code>max</code> (varsayılan 99) üstü "99+" gösterilir. <code>dot</code> ve çıplak sayılar için <code>label</code> verin.</p>
      </section>

      <section class="demo">
        <h2>Filtre çipleri</h2>
        <div class="row" role="group" aria-label="Form türü">
          ${filters.map(
            ([id, label]) => html`<bz-chip selectable .selected=${() => filter() === id} @change=${() => filter.set(id)}>${label}</bz-chip>`
          )}
        </div>
        <p class="muted small">Seçili: <code>${filter}</code> (tekli seçim uygulamada; çip sadece kendi durumunu bilir).</p>
      </section>

      <section class="demo">
        <h2>Kaldırılabilir etiketler</h2>
        <div class="row">
          ${repeat(
            tags,
            (t) => t,
            (t) => html`<bz-chip removable icon="tag" remove-label="Kaldır" @remove=${() => {
              tags.update((l) => l.filter((x) => x !== t))
              logEntry("etiket", "remove", t)
            }}>${t}</bz-chip>`
          )}
          <bz-input placeholder="Yeni etiket" .value=${tagInput} @input=${(e: Event) => tagInput.set((e.currentTarget as HTMLInputElement).value)}
            @keydown=${(e: KeyboardEvent) => e.key === "Enter" && addTag()}></bz-input>
        </div>
        <p class="note">× veya çipteki kaldır düğmesinde Delete/Backspace. <code>remove</code> iptal edilebilir; çipi uygulama kaldırır.</p>
      </section>

      <section class="demo">
        <h2>Tonlar</h2>
        <div class="row">
          ${VARIANTS.map((v) => html`<bz-chip variant=${v} selectable selected @change=${() => toast(`${v}`)}>${v}</bz-chip>`)}
        </div>
      </section>
    `
  },
}
