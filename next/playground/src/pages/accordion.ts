import { html, signal } from "@bazlama/core"
import { icon, toast, type TreeItem } from "@bazlama/headless"
import { accordionUsage } from "../docs/specs-feedback"
import { usage } from "../docs/usage"
import { log } from "../log"

const MENU: Record<string, TreeItem[]> = {
  docs: [
    { id: "drafts", label: "Taslaklar", icon: "folder", children: [{ id: "d1", label: "Doküman No" }, { id: "d2", label: "Doküman Türü" }, { id: "d3", label: "Hazırlayan" }] },
    { id: "live", label: "Yürürlüktekiler", icon: "folder", children: [{ id: "l1", label: "Doküman No" }, { id: "l2", label: "Yürürlük Tarihi" }] },
    { id: "archive", label: "Arşiv", icon: "file" },
    { id: "cancelled", label: "İptal Edilenler", icon: "file" },
  ],
  params: ["Doküman Türü", "Çıktı Türü", "Revizyon Nedeni", "Diğer Parametreler"].map((l, i) => ({ id: `p${i}`, label: l, icon: "settings" })),
  maint: ["İş Aktarımı", "İşlem Yetkilisi Değişikliği", "Zamanlanmış Görev Yöneticisi"].map((l, i) => ({ id: `m${i}`, label: l, icon: "refresh" })),
}

export default {
  id: "accordion",
  title: "Accordion",
  description:
    "Açılır/kapanır bölümler (WAI-ARIA accordion). Tekli veya çoklu açık; fill ile kenar menüsü gibi yüksekliği doldurur. Kapalı içerik tarayıcının sayfa içi aramasında (Ctrl+F) bulunur ve bölüm kendiliğinden açılır.",
  render() {
    const faq = signal("ship")
    const filters = signal("status,date")
    return html`
      ${usage(accordionUsage)}

      <section class="demo">
        <h2>Tekli (SSS)</h2>
        <div class="narrow">
          <bz-accordion .value=${faq} @change=${(e: CustomEvent<{ value: string }>) => {
            faq.set(e.detail.value)
            log("sss")(e)
          }}>
            <bz-accordion-item value="ship" heading="Siparişim ne zaman kargoya verilir?">
              Hafta içi 14:00'e kadar verilen siparişler aynı gün kargoya teslim edilir.
            </bz-accordion-item>
            <bz-accordion-item value="return" heading="İade süresi kaç gün?">
              Teslimattan itibaren 14 gün içinde, faturasıyla birlikte iade edebilirsiniz.
            </bz-accordion-item>
            <bz-accordion-item value="invoice" heading="E-fatura kesiliyor mu?">
              Evet, vergi numarası girilen siparişler için e-fatura otomatik düzenlenir. Anahtar kelime: <mark>mükellef</mark>.
            </bz-accordion-item>
            <bz-accordion-item value="old" heading="Havale ile ödeme (kaldırıldı)" disabled>Artık desteklenmiyor.</bz-accordion-item>
          </bz-accordion>
        </div>
        <p class="note">
          Açık bölüm: <code>${() => faq() || "—"}</code>. Açık olana tekrar tıklamak kapatır (<code>always-open</code> ile kapanmaz).
          Kapalıyken Ctrl+F ile "mükellef" arayın: tarayıcı üçüncü bölümü kendisi açar (<code>hidden="until-found"</code>, Chrome/Edge).
        </p>
      </section>

      <section class="demo">
        <h2>Çoklu ve başlık eylemleri</h2>
        <div class="narrow">
          <bz-accordion multiple .value=${filters} @change=${(e: CustomEvent<{ value: string }>) => filters.set(e.detail.value)}>
            <bz-accordion-item value="status" heading="Durum">
              <bz-button slot="actions" size="sm" variant="ghost" aria-label="Durum filtresini temizle" data-tooltip="Temizle" @click=${() => toast("Durum filtresi temizlendi.")}>${icon("x")}</bz-button>
              <bz-list label="Durum" multiple value="draft">
                <bz-option value="draft">Hazırlanıyor</bz-option>
                <bz-option value="wait">Onay bekliyor</bz-option>
                <bz-option value="live">Yürürlükte</bz-option>
              </bz-list>
            </bz-accordion-item>
            <bz-accordion-item value="date" heading="Tarih">
              <div class="stack-sm">
                <bz-input label="Başlangıç" type="date"></bz-input>
                <bz-input label="Bitiş" type="date"></bz-input>
              </div>
            </bz-accordion-item>
            <bz-accordion-item value="owner">
              <span slot="header">${icon("users")} Sorumlu <span class="badge">3</span></span>
              <bz-combobox label="Sorumlu" placeholder="Seçin">
                <bz-option value="ada">Ada Yılmaz</bz-option>
                <bz-option value="can">Can Demir</bz-option>
              </bz-combobox>
            </bz-accordion-item>
          </bz-accordion>
        </div>
        <p class="note">
          <code>multiple</code>: <code>value</code> virgülle ayrılmış liste (<code>${filters}</code>). <code>slot="actions"</code> başlığın sağına düğme koyar
          (başlık düğmesinin içine değil, yanına: iç içe etkileşimli öğe olmaz). <code>slot="header"</code> zengin başlık.
        </p>
      </section>

      <section class="demo">
        <h2>fill: kenar menüsü</h2>
        <div class="accordion-fill-demo">
          <bz-accordion fill always-open value="docs" @change=${log("menü")}>
            <bz-accordion-item value="docs" heading="Dokümanlar">
              <bz-tree label="Dokümanlar" selection="leaf" .items=${MENU.docs} .expanded=${["drafts"]}></bz-tree>
            </bz-accordion-item>
            <bz-accordion-item value="params" heading="Parametreler">
              <bz-tree label="Parametreler" selection="leaf" .items=${MENU.params}></bz-tree>
            </bz-accordion-item>
            <bz-accordion-item value="maint" heading="Bakım">
              <bz-tree label="Bakım" selection="leaf" .items=${MENU.maint}></bz-tree>
            </bz-accordion-item>
          </bz-accordion>
          <p class="muted small">
            <code>fill</code>: açık bölüm kalan yüksekliği alır ve kendi kayar; kapalı başlıklar alta dizilir. <code>always-open</code>: bir bölüm hep açık.
            QMEX mockup'ının sol menüsü böyle.
          </p>
        </div>
      </section>

      <section class="demo">
        <h2>Klavye</h2>
        <table class="api">
          <tbody>
            <tr><td><kbd>Enter</kbd> <kbd>Space</kbd></td><td>Başlıktaki bölümü açar/kapatır</td></tr>
            <tr><td><kbd>↓</kbd> <kbd>↑</kbd></td><td>Sonraki / önceki başlık (sonda başa döner)</td></tr>
            <tr><td><kbd>Home</kbd> <kbd>End</kbd></td><td>İlk / son başlık</td></tr>
            <tr><td><kbd>Tab</kbd></td><td>Başlıktan açık bölümün içeriğine, sonra sonraki başlığa</td></tr>
          </tbody>
        </table>
      </section>
    `
  },
}
