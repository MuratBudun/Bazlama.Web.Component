import { html, repeat, signal } from "@bazlama/core"
import { log } from "../log"
import { submitToLog } from "./shared"
import { listUsage } from "../docs/specs"
import { usage } from "../docs/usage"

export default {
  id: "list",
  title: "List",
  description:
    "Listbox: odak listede kalır, aktif öğe aria-activedescendant ile gösterilir. Ok tuşları, Home/End, PageUp/Down, yazarak arama (typeahead), Enter/Space seçimi. Form-associated (ElementInternals).",
  render() {
    const single = signal("tr")
    let nextId = 4
    const tasks = signal([
      { id: 1, text: "Tasarımı gözden geçir" },
      { id: 2, text: "Testleri yaz" },
      { id: 3, text: "Boyut bütçesini ölç" },
    ])

    return html`
      ${usage(listUsage)}

      <section class="demo">
        <h2>Tekli seçim</h2>
        <div class="grid-2">
          <bz-list label="Dil" .value=${single} @change=${(e: CustomEvent<{ value: string }>) => {
            single.set(e.detail.value)
            log("dil")(e)
          }}>
            <bz-option value="tr">Türkçe</bz-option>
            <bz-option value="en">English</bz-option>
            <bz-option value="de">Deutsch</bz-option>
            <bz-option value="fr" disabled>Français (yakında)</bz-option>
            <bz-option value="es">Español</bz-option>
            <bz-option value="ja">日本語</bz-option>
          </bz-list>
          <div>
            <p>Seçili değer: <code>${single}</code></p>
            <div class="row">
              <bz-button size="sm" @click=${() => single.set("de")}>Dışarıdan "de" seç</bz-button>
              <bz-button size="sm" @click=${() => single.set("")}>Temizle</bz-button>
            </div>
          </div>
        </div>
      </section>

      <section class="demo">
        <h2>Çoklu seçim + form</h2>
        <form class="stack narrow" @submit=${submitToLog("ilgi alanları")}>
          <bz-list name="topics" multiple label="İlgi alanları" value="web,perf" @change=${log("ilgi alanları")}>
            <bz-option value="web">Web bileşenleri</bz-option>
            <bz-option value="a11y">Erişilebilirlik</bz-option>
            <bz-option value="perf">Performans</bz-option>
            <bz-option value="css">CSS mimarisi</bz-option>
            <bz-option value="test">Test</bz-option>
          </bz-list>
          <div class="row">
            <bz-button type="submit" variant="primary">Gönder</bz-button>
            <bz-button type="reset">Sıfırla</bz-button>
          </div>
        </form>
      </section>

      <section class="demo">
        <h2>Dinamik seçenekler</h2>
        <div class="grid-2">
          <bz-list label="Görevler" @change=${log("görevler")}>
            ${repeat(
              tasks,
              (t) => t.id,
              (t) => html`<bz-option value=${String(t.id)}>${t.text}</bz-option>`
            )}
          </bz-list>
          <div class="row">
            <bz-button size="sm" @click=${() => tasks.update((list) => [...list, { id: nextId, text: `Yeni görev ${nextId++}` }])}>Ekle</bz-button>
            <bz-button size="sm" @click=${() => tasks.update((list) => list.slice(1))}>İlkini sil</bz-button>
            <bz-button size="sm" @click=${() => tasks.update((list) => [...list].reverse())}>Ters çevir</bz-button>
          </div>
        </div>
        <p class="note">Liste bir enhancer olduğu için çocuklar yerinde kalır; <code>repeat()</code> ile eklenen/silinen/yeri değişen seçenekler MutationObserver üzerinden fark edilir.</p>
      </section>
    `
  },
}
