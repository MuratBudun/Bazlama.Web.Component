import { html, signal } from "@bazlama/core"
import { toast, type TreeItem } from "@bazlama/headless"
import { formLayoutUsage } from "../docs/specs-forms"
import { usage } from "../docs/usage"
import { LOOKUP_TR } from "./lookup"

const DEPARTMENTS: TreeItem[] = [
  { id: "gm", label: "Genel Merkez", children: [{ id: "kk", label: "Yazılım" }, { id: "ur", label: "Tasarım" }] },
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
        <h2>Proje kartı</h2>
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
            <bz-input label="Proje No" value="PRJ-2026-014" readonly></bz-input>
            <bz-input label="Sürüm" value="1" readonly></bz-input>
            <bz-input label="Bitiş tarihi" type="date" name="due"></bz-input>
            <bz-input label="Proje adı" name="name" required data-span="2" value="Web sitesi yenileme"></bz-input>
            <bz-combobox label="Proje türü" name="kind" value="Müşteri projesi">
              <bz-option>Müşteri projesi</bz-option><bz-option>İç proje</bz-option><bz-option>Ar-Ge</bz-option>
            </bz-combobox>
            <bz-lookup label="Sorumlu ekip" name="owner" required data-span="2" .items=${DEPARTMENTS} .labels=${LOOKUP_TR} value="kk"></bz-lookup>
            <bz-radio-group label="Gizlilik" name="privacy" value="internal" orientation="horizontal">
              <bz-radio value="public">Genel</bz-radio><bz-radio value="internal">Şirket içi</bz-radio><bz-radio value="secret">Gizli</bz-radio>
            </bz-radio-group>

            <bz-form-section heading="Bildirimler" description="Proje durumu değişince bilgilendirilecekler.">
              <bz-switch name="email" checked>E-posta bildirimi</bz-switch>
              <bz-checkbox name="weekly">Haftalık rapor</bz-checkbox>
              <bz-input label="Hatırlatma (gün)" name="remind" type="number" value="2"></bz-input>
              <bz-textarea label="Not" name="note" data-span="full" rows="2" autosize expandable
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
