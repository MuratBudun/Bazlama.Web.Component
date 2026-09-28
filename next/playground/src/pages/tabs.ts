import { html, repeat, signal } from "@bazlama/core"
import { dialogs, type TabsElement } from "@bazlama/headless"
import { tabsUsage } from "../docs/specs-feedback"
import { usage } from "../docs/usage"
import { log, logEntry } from "../log"

export default {
  id: "tabs",
  title: "Tabs",
  description:
    "WAI-ARIA sekme deseni, tamamen light DOM. Sekmeler ve paneller value (yoksa sıra) ile eşleşir; sekmeler sonradan eklenip çıkarılabilir, iç içe sekmeler birbirinden bağımsızdır.",
  render() {
    const current = signal("general")

    // Open documents: closable tabs whose forms may have unsaved changes.
    interface Doc {
      id: string
      title: string
      note: ReturnType<typeof signal<string>>
      saved: ReturnType<typeof signal<string>>
    }
    let next = 3
    const makeDoc = (id: string, title: string): Doc => ({ id, title, note: signal(""), saved: signal("") })
    const docs = signal<Doc[]>([makeDoc("d1", "Sipariş #1042"), makeDoc("d2", "Fatura #88")])
    const openDocs = signal("d1")
    let docTabs: TabsElement | null = null
    const addDoc = () => {
      const id = `d${next++}`
      docs.update((l) => [...l, makeDoc(id, `Belge ${id.slice(1)}`)])
      openDocs.set(id)
    }
    const dirty = (d: Doc) => d.note() !== d.saved()
    // beforeClose: async guard, asks only when the tab's form has unsaved changes.
    const beforeClose = (id: string) => {
      const doc = docs.peek().find((d) => d.id === id)
      if (!doc || !dirty(doc)) return true
      return dialogs.confirm({
        heading: "Kaydedilmemiş değişiklikler",
        message: `"${doc.title}" sekmesindeki not kaydedilmedi. Kapatılsın mı?`,
        variant: "danger",
        confirmText: "Kapat",
        cancelText: "Sekmede kal",
      })
    }

    // Many tabs: scrolling strip.
    const many = signal(Array.from({ length: 24 }, (_, i) => `Rapor ${i + 1}`))
    const manyValue = signal("Rapor 1")

    return html`
      ${usage(tabsUsage)}

      <section class="demo">
        <h2>Müşteri kartı</h2>
        <bz-tabs .value=${current} @change.self=${(e: CustomEvent<{ value: string }>) => {
          current.set(e.detail.value)
          log("müşteri")(e)
        }}>
          <bz-tab-list>
            <bz-tab value="general">Genel</bz-tab>
            <bz-tab value="address">Adresler <span class="badge">2</span></bz-tab>
            <bz-tab value="orders">Siparişler</bz-tab>
            <bz-tab value="audit" disabled>Denetim kaydı</bz-tab>
          </bz-tab-list>
          <bz-tab-panel value="general">
            <div class="grid-2">
              <bz-input label="Ad Soyad" value="Ada Yılmaz"></bz-input>
              <bz-input label="E-posta" value="ada@ornek.com"></bz-input>
            </div>
          </bz-tab-panel>
          <bz-tab-panel value="address"><p>Merkez: Alsancak, İzmir</p><p>Depo: Kemalpaşa, İzmir</p></bz-tab-panel>
          <bz-tab-panel value="orders"><p class="muted">Son 30 günde 4 sipariş.</p></bz-tab-panel>
          <bz-tab-panel value="audit"></bz-tab-panel>
        </bz-tabs>
        <div class="row">
          <span class="muted small">value = <code>${current}</code></span>
          <bz-button size="sm" @click=${() => current.set("orders")}>Dışarıdan "Siparişler"</bz-button>
        </div>
      </section>

      <section class="demo">
        <h2>Kapatılabilir sekmeler ve kaydedilmemiş değişiklik</h2>
        <div class="row">
          <bz-button size="sm" @click=${addDoc}>+ Yeni belge</bz-button>
          <span class="muted small">Bir belgeye not yazıp kaydetmeden sekmesini kapatmayı deneyin (×, orta tık veya sekmedeyken Delete).</span>
        </div>
        <bz-tabs
          .value=${openDocs}
          .beforeClose=${() => beforeClose}
          @change.self=${(e: CustomEvent<{ value: string }>) => openDocs.set(e.detail.value)}
          @before-close=${log("belgeler")}
          @close=${(e: CustomEvent<{ value: string }>) => {
            docs.update((l) => l.filter((d) => d.id !== e.detail.value))
            logEntry("belgeler", "close", e.detail.value)
          }}
          ref=${(el: TabsElement) => (docTabs = el)}
        >
          <bz-tab-list>
            ${repeat(
              docs,
              (d) => d.id,
              (d) => html`<bz-tab value=${d.id} closable close-label="Kapat">${d.title}${() => (dirty(d) ? " ●" : "")}</bz-tab>`
            )}
          </bz-tab-list>
          ${repeat(
            docs,
            (d) => d.id,
            (d) => html`<bz-tab-panel value=${d.id}>
              <div class="stack-sm narrow">
                <bz-input label=${`${d.title} · not`} .value=${d.note} @input=${(e: Event) => d.note.set((e.currentTarget as HTMLInputElement).value)}></bz-input>
                <div class="row">
                  <bz-button size="sm" variant="primary" ?disabled=${() => !dirty(d)} @click=${() => d.saved.set(d.note.peek())}>Kaydet</bz-button>
                  <bz-button size="sm" @click=${() => void docTabs?.close(d.id)}>tabs.close("${d.id}")</bz-button>
                  <span class="muted small">${() => (dirty(d) ? "Kaydedilmemiş değişiklik var" : "Kaydedildi")}</span>
                </div>
              </div>
            </bz-tab-panel>`
          )}
        </bz-tabs>
        <p class="note">
          <code>beforeClose</code> bir Promise dönebilir: burada onay dialogunun cevabı beklenir, "Sekmede kal" kapatmayı iptal eder. Onaylanınca
          seçim komşu sekmeye geçer ve <code>close</code> olayı gelir; sekmeyi uygulama kaldırır (burada <code>repeat()</code> verisinden).
          Olay günlüğünde <code>before-close</code> ve <code>close</code> görünür.
        </p>
      </section>

      <section class="demo">
        <h2>Çok sekme: kaydırma</h2>
        <bz-tabs .value=${manyValue} @change.self=${(e: CustomEvent<{ value: string }>) => manyValue.set(e.detail.value)}
          @close=${(e: CustomEvent<{ value: string }>) => many.update((l) => l.filter((t) => t !== e.detail.value))}>
          <bz-tab-list>
            ${repeat(many, (t) => t, (t) => html`<bz-tab value=${t} closable>${t}</bz-tab>`)}
          </bz-tab-list>
          ${repeat(many, (t) => t, (t) => html`<bz-tab-panel value=${t}><p>${t} içeriği.</p></bz-tab-panel>`)}
        </bz-tabs>
        <div class="row">
          <bz-button size="sm" @click=${() => {
            const name = `Rapor ${many.peek().length + 1}`
            many.update((l) => [...l, name])
            manyValue.set(name)
          }}>+ Sekme ekle</bz-button>
          <bz-button size="sm" @click=${() => manyValue.set("Rapor 1")}>İlk sekmeye git</bz-button>
        </div>
        <p class="note">
          Sığmayan şerit yatay kayar: taşan uçlarda ‹ › düğmeleri, fare tekerleği yana kaydırır, seçilen (veya klavyeyle gelinen) sekme görünür
          alana gelir. Sekmeler <code>repeat()</code> ile üretildiği için kapatılan sekme <code>close</code> olayında veriden çıkarılır
          (<code>remove-on-close</code> sadece elle yazılmış HTML sekmeler içindir; <code>repeat()</code>'in yönettiği düğümleri silmemeli).
        </p>
      </section>

      <section class="demo">
        <h2>Dikey ve manuel etkinleştirme</h2>
        <bz-tabs orientation="vertical" activation="manual" value="profile" @change.self=${log("ayarlar")}>
          <bz-tab-list>
            <bz-tab value="profile">Profil</bz-tab>
            <bz-tab value="security">Güvenlik</bz-tab>
            <bz-tab value="notify">Bildirimler</bz-tab>
          </bz-tab-list>
          <bz-tab-panel value="profile"><p>Profil ayarları.</p></bz-tab-panel>
          <bz-tab-panel value="security">
            <p>İç içe sekmeler:</p>
            <bz-tabs>
              <bz-tab-list><bz-tab>Parola</bz-tab><bz-tab>İki adımlı</bz-tab></bz-tab-list>
              <bz-tab-panel>Parola değiştirme formu</bz-tab-panel>
              <bz-tab-panel>Doğrulama uygulaması</bz-tab-panel>
            </bz-tabs>
          </bz-tab-panel>
          <bz-tab-panel value="notify"><p>E-posta ve anlık bildirimler.</p></bz-tab-panel>
        </bz-tabs>
        <p class="note">
          <code>activation="manual"</code>: ↑/↓ sadece odağı taşır, Enter/Space seçer. Panel içeriği pahalıysa (sunucu çağrısı) tercih edin.
          İç içe sekmeler <code>value</code> vermeden sıraya göre eşleşir.
        </p>
      </section>

      <section class="demo">
        <h2>Klavye</h2>
        <table class="api">
          <tbody>
            <tr><td><kbd>←</kbd> <kbd>→</kbd></td><td>Önceki / sonraki sekme (dikeyde <kbd>↑</kbd> <kbd>↓</kbd>); sonda başa döner, devre dışı olanları atlar</td></tr>
            <tr><td><kbd>Home</kbd> <kbd>End</kbd></td><td>İlk / son sekme</td></tr>
            <tr><td><kbd>Enter</kbd> <kbd>Space</kbd></td><td>Seç (manuel modda)</td></tr>
            <tr><td><kbd>Tab</kbd></td><td>Sekme listesinden seçili panele geçer (tek sekme durağı)</td></tr>
          </tbody>
        </table>
      </section>
    `
  },
}
