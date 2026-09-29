import { html, signal } from "@bazlama/core"
import { dialogs, toast, type LookupPick, type TreeItem } from "@bazlama/headless"
import { lookupUsage } from "../docs/specs-forms"
import { usage } from "../docs/usage"
import { log } from "../log"

export const LOOKUP_TR = { select: "Seç", clear: "Temizle", search: "Ara", ok: "Seç", cancel: "Vazgeç", empty: "Sonuç yok", required: "Bir değer seçin." }

const DEPARTMENTS: TreeItem[] = [
  {
    id: "gm",
    label: "Genel Merkez",
    children: [
      { id: "kk", label: "Satış", children: [{ id: "kk-lab", label: "Kurumsal Satış" }, { id: "kk-giris", label: "Bayi Satış" }] },
      { id: "ur", label: "Finans" },
      { id: "sa", label: "Satın Alma Müdürlüğü" },
      { id: "ik", label: "İnsan Kaynakları" },
    ],
  },
]
const DOCS = [
  { id: 8, no: "SZL-2026-014", name: "Hizmet sözleşmesi", status: "Yayında" },
  { id: 7, no: "SZL-2026-007", name: "Bakım sözleşmesi", status: "Yayında" },
  { id: 1, no: "TKL-2026-101", name: "Fiyat teklifi", status: "Taslak" },
  { id: 2, no: "SPR-2026-044", name: "Satın alma siparişi", status: "İncelemede" },
  { id: 3, no: "FTR-2026-210", name: "Proforma fatura", status: "Yayında" },
]
const USERS = ["Ada Yılmaz", "Ekin Demir", "Deniz Kaya", "Test User 10"]

export default {
  id: "lookup",
  title: "Lookup",
  description:
    "Değeri bir dialogda seçilen salt okunur alan (ExtJS trigger field): ağaç, tablo veya kendi seçicin. Anahtar formda gönderilir, alan metni gösterir.",
  render() {
    const dept = signal("kk")
    const doc = signal("")
    const user = signal("")
    const readonly = signal(false)
    const pickUser = async (): Promise<LookupPick | undefined> => {
      const name = await dialogs.open<string>({
        heading: "Personel seç",
        size: "sm",
        content: (ref) => html`<div class="stack-sm">${USERS.map(
          (u) => html`<bz-button @click=${() => void ref.close(u)}>${u}</bz-button>`
        )}</div>`,
      })
      return name ? { value: name.toLowerCase().replace(/\s+/g, "."), text: name } : undefined
    }
    return html`
      ${usage(lookupUsage)}

      <section class="demo">
        <h2>Ağaçtan seçim</h2>
        <div class="stack-sm" style="max-width: 28rem">
          <bz-lookup label="Bölüm" required clearable selection="leaf" .items=${DEPARTMENTS} .labels=${LOOKUP_TR}
            ?readonly=${readonly} .value=${dept} @change=${(e: CustomEvent<{ value: string }>) => (dept.set(e.detail.value), log("bölüm")(e))}
            hint="Enter / F4 / Alt+↓ açar; seçicide yazarak filtreleyin."></bz-lookup>
          <div class="row">
            <span class="muted small">Değer: <code>${() => dept() || "—"}</code></span>
            <bz-switch .checked=${readonly} @change=${(e: CustomEvent<{ checked: boolean }>) => readonly.set(e.detail.checked)}>Salt okunur</bz-switch>
          </div>
        </div>
      </section>

      <section class="demo">
        <h2>Tablodan seçim</h2>
        <div class="stack-sm" style="max-width: 28rem">
          <bz-lookup label="İlişkili belge" clearable dialog-size="lg" display-key="no" .labels=${LOOKUP_TR}
            .columns=${[{ key: "no", header: "Belge No", width: "9rem" }, { key: "name", header: "Adı" }, { key: "status", header: "Durum" }]}
            .rows=${DOCS} .value=${doc} @change=${(e: CustomEvent<{ value: string; text: string }>) => {
              doc.set(e.detail.value)
              if (e.detail.value) toast(`${e.detail.text} seçildi`)
            }}></bz-lookup>
          <p class="note">Arama kutusundan ↓ tabloya geçer; çift tık / Enter seçer; tek sonuç kalınca arama kutusunda Enter yeter.</p>
        </div>
      </section>

      <section class="demo">
        <h2>Kendi seçicin (pick)</h2>
        <div class="stack-sm" style="max-width: 28rem">
          <bz-lookup label="Onaylayan" .pick=${pickUser} .labels=${LOOKUP_TR} clearable
            .value=${user} @change=${(e: CustomEvent<{ value: string }>) => user.set(e.detail.value)}></bz-lookup>
          <p class="muted small">Değer: <code>${() => user() || "—"}</code></p>
        </div>
      </section>

      <section class="demo">
        <h2>Formda</h2>
        <form class="stack-sm" style="max-width: 28rem" @submit=${(e: SubmitEvent) => (e.preventDefault(), toast.success(JSON.stringify([...new FormData(e.target as HTMLFormElement)])))}>
          <bz-lookup name="owner" label="Sorumlu Bölüm" required .items=${DEPARTMENTS} .labels=${LOOKUP_TR}></bz-lookup>
          <div class="row"><bz-button type="submit" variant="primary">Gönder</bz-button><bz-button type="reset">Sıfırla</bz-button></div>
        </form>
      </section>
    `
  },
}
