import { html, signal } from "@bazlama/core"
import { toast } from "@bazlama/headless"
import { textareaUsage } from "../docs/specs-forms"
import { usage } from "../docs/usage"
import { log } from "../log"

const TR = { expand: "Genişlet", apply: "Uygula", cancel: "Vazgeç", close: "Kapat" }
const LONG = `1. AMAÇ
Bu projenin amacı, kurumsal web sitesinin yeni tasarımla yeniden yayınlanması ve içerik yönetiminin kolaylaştırılmasıdır.

2. KAPSAM
Ana sayfa, ürün sayfaları, blog ve iletişim formunu kapsar; mobil uygulama bu projenin dışındadır.

3. SORUMLULUKLAR
Proje yöneticisi takvim ve bütçeden; tasarım ekibi arayüzden; yazılım ekibi geliştirme ve yayından sorumludur.`

export default {
  id: "textarea",
  title: "Textarea",
  description:
    "Native textarea üzerine etiket, yardım, sayaç ve hata. autosize ile yazdıkça büyür (CSS field-sizing), expandable ile metni büyük bir editörde açar.",
  render() {
    const note = signal("")
    const reason = signal(LONG)
    const readonly = signal(true)
    return html`
      ${usage(textareaUsage)}

      <section class="demo">
        <h2>Otomatik büyüme ve sayaç</h2>
        <div class="stack-sm" style="max-width: 36rem">
          <bz-textarea label="Not" autosize rows="2" max-rows="8" show-count maxlength="500" placeholder="Yazdıkça büyür…"
            .value=${note} @input=${(e: Event) => note.set((e.currentTarget as HTMLInputElement).value)} .labels=${TR}></bz-textarea>
          <p class="muted small">${() => note().split("\n").length} satır</p>
        </div>
      </section>

      <section class="demo">
        <h2>Büyük editörde açma (expandable)</h2>
        <div class="stack-sm" style="max-width: 36rem">
          <bz-textarea label="Değişiklik gerekçesi" expandable rows="3" required .labels=${TR}
            hint="Sağ üstteki düğme veya Ctrl+Shift+Enter; editörde Ctrl+Enter uygular."
            .value=${reason} @input=${(e: Event) => reason.set((e.currentTarget as HTMLInputElement).value)} @change=${log("gerekçe")}></bz-textarea>
          <bz-textarea label="Kapsam (salt okunur)" expandable rows="2" ?readonly=${readonly} .labels=${TR} .value=${LONG}
            hint="Salt okunurda editör sadece okuma içindir."></bz-textarea>
          <bz-switch .checked=${readonly} @change=${(e: CustomEvent<{ checked: boolean }>) => readonly.set(e.detail.checked)}>Salt okunur</bz-switch>
        </div>
      </section>

      <section class="demo">
        <h2>Formda</h2>
        <form class="stack-sm" style="max-width: 36rem" @submit=${(e: SubmitEvent) => (e.preventDefault(), toast.success(`${new FormData(e.target as HTMLFormElement).get("opinion")}`))}>
          <bz-textarea name="opinion" label="Görüşünüz" required minlength="10" rows="2" resize="none" .labels=${TR}></bz-textarea>
          <bz-textarea label="Devre dışı" disabled value="Düzenlenemez"></bz-textarea>
          <div class="row"><bz-button type="submit" variant="primary">Gönder</bz-button><bz-button type="reset">Sıfırla</bz-button></div>
        </form>
      </section>
    `
  },
}
