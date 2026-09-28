import { html, signal } from "@bazlama/core"
import { toast, type TreeItem } from "@bazlama/headless"
import { formLayoutUsage } from "../docs/specs-forms"
import { usage } from "../docs/usage"
import { LOOKUP_TR } from "./lookup"

const DEPARTMENTS: TreeItem[] = [
  { id: "gm", label: "Genel Müdürlük", children: [{ id: "kk", label: "Kalite Kontrol Müdürlüğü" }, { id: "ur", label: "Üretim Müdürlüğü" }] },
]

export default {
  id: "form-layout",
  title: "Form layout",
  description:
    "Alan ızgarası: en çok N sütun, dar ekranda azalır (telefonda tek sütun); data-span ile genişlik, bölümler (subgrid) ve düğme satırı. Etiketler üstte veya solda.",
  render() {
    const columns = signal(3)
    const position = signal<"top" | "start">("top")
    return html`
      ${usage(formLayoutUsage)}

      <section class="demo">
        <h2>Doküman formu</h2>
        <bz-toolbar label="Düzen" class="row">
          <bz-radio-group label="Sütun" orientation="horizontal" .value=${() => String(columns())}
            @change=${(e: CustomEvent<{ value: string }>) => columns.set(Number(e.detail.value))}>
            ${[1, 2, 3, 4].map((n) => html`<bz-radio value=${n}>${n}</bz-radio>`)}
          </bz-radio-group>
          <bz-toolbar-separator></bz-toolbar-separator>
          <bz-switch .checked=${() => position() === "start"}
            @change=${(e: CustomEvent<{ checked: boolean }>) => position.set(e.detail.checked ? "start" : "top")}>Etiketler solda</bz-switch>
        </bz-toolbar>
        <form
          class="form-layout-demo"
          @submit=${(e: SubmitEvent) => {
            e.preventDefault()
            toast.success(JSON.stringify(Object.fromEntries(new FormData(e.target as HTMLFormElement))))
          }}
        >
          <bz-form-layout .columns=${columns} label-position=${position} min-column-width="13rem" label-width="9rem">
            <bz-input label="Doküman No" value="FRM-008" readonly></bz-input>
            <bz-input label="Revizyon No" value="0" readonly></bz-input>
            <bz-input label="Geçerlilik Tarihi" type="date" name="valid"></bz-input>
            <bz-input label="Dokümanın Adı" name="name" required data-span="2" value="Doküman Formu"></bz-input>
            <bz-combobox label="Doküman Türü" name="kind" value="Form">
              <bz-option>Form</bz-option><bz-option>Prosedür</bz-option><bz-option>Talimat</bz-option>
            </bz-combobox>
            <bz-lookup label="Doküman Sahibi Bölüm" name="owner" required data-span="2" .items=${DEPARTMENTS} .labels=${LOOKUP_TR} value="kk"></bz-lookup>
            <bz-radio-group label="Gizlilik" name="privacy" value="internal" orientation="horizontal">
              <bz-radio value="public">Genel</bz-radio><bz-radio value="internal">Şirket içi</bz-radio><bz-radio value="secret">Gizli</bz-radio>
            </bz-radio-group>

            <bz-form-section heading="Dağıtım" description="Doküman yürürlüğe girince bilgilendirilecekler.">
              <bz-switch name="edist" checked>Elektronik dağıtım</bz-switch>
              <bz-checkbox name="print">Basılı kopya</bz-checkbox>
              <bz-input label="Çıktı sayısı" name="copies" type="number" value="2"></bz-input>
              <bz-textarea label="Dağıtım notu" name="note" data-span="full" rows="2" autosize expandable
                .labels=${{ expand: "Genişlet", apply: "Uygula", cancel: "Vazgeç", close: "Kapat" }}></bz-textarea>
            </bz-form-section>

            <bz-form-actions>
              <bz-button type="reset">Vazgeç</bz-button>
              <bz-button type="submit" variant="primary">Kaydet</bz-button>
            </bz-form-actions>
          </bz-form-layout>
        </form>
        <p class="note">
          Pencereyi daraltın: sütun sayısı <code>min-column-width</code>'e göre azalır, <code>data-span</code> o anki sütun sayısına kısılır. Bölüm
          alanları üst ızgaranın sütunlarına hizalanır (subgrid).
        </p>
      </section>
    `
  },
}
