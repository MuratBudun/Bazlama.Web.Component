import { html, signal } from "@bazlama/core"
import { icon, type DialogElement, type GridColumn } from "@bazlama/headless"
import { DATA_GRID_TR } from "../data-grid"
import { PAGINATION_TR } from "../pagination"

/**
 * The theme editor's preview: a small business screen with most components, so a theme can
 * be judged on real content. Popups live inside the preview (inline menu, inline dialog), so
 * they inherit its tokens.
 */

interface Order {
  id: number
  no: string
  customer: string
  date: string
  total: number
  status: string
}

const STATUS: Record<string, string> = { Hazırlanıyor: "warning", Kargoda: "info", "Teslim edildi": "success", İptal: "danger", Taslak: "neutral" }
const money = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 })
const CUSTOMERS = ["Toros Lojistik Ltd. Şti.", "Ege Makine A.Ş.", "Mavi Enerji A.Ş.", "Kuzey Yazılım A.Ş.", "Boğaziçi Gıda Ltd. Şti.", "Anadolu Tekstil A.Ş.", "Yıldız Tarım A.Ş.", "Marmara Kimya San."]
const ROWS: Order[] = CUSTOMERS.map((customer, i) => ({
  id: i + 1,
  no: `SP-2026${String(1200 - i).padStart(4, "0")}`,
  customer,
  date: `${String(30 - i).padStart(2, "0")}.09.2026`,
  total: [54694, 70528, 91679, 125145, 25583, 134960, 7262, 88410][i],
  status: Object.keys(STATUS)[i % 5],
}))
const COLUMNS: GridColumn<Order>[] = [
  { key: "no", header: "Sipariş", width: 130, pinned: "start", sortable: true, format: (v) => html`<strong>${String(v)}</strong>` },
  { key: "customer", header: "Müşteri", width: 220, flex: true, sortable: true },
  { key: "date", header: "Tarih", width: 110, sortable: true },
  { key: "total", header: "Tutar", width: 120, align: "end", sortable: true, format: (v) => money.format(Number(v)) },
  { key: "status", header: "Durum", width: 130, format: (v) => html`<bz-badge variant=${STATUS[String(v)]}>${String(v)}</bz-badge>` },
]

export function preview() {
  const selection = signal<unknown[]>([2])
  const filter = signal("all")
  let dialog: DialogElement | undefined
  return html`
    <div class="te-screen">
      <div class="te-screen-head">
        <div>
          <h3>Siparişler <bz-badge variant="primary">128</bz-badge></h3>
          <span class="te-muted">Satış › Siparişler · son güncelleme 2 dk önce</span>
        </div>
        <span class="te-spacer"></span>
        <bz-menu>
          <bz-button slot="trigger" variant="ghost">${icon("more-horizontal")} İşlemler ▾</bz-button>
          <bz-menu-item value="export" icon="download" shortcut="Ctrl+E">Dışa aktar</bz-menu-item>
          <bz-menu-item value="copy" icon="copy">Kopyala</bz-menu-item>
          <bz-menu-separator></bz-menu-separator>
          <bz-menu-item value="delete" icon="trash" variant="danger">Seçilenleri sil</bz-menu-item>
        </bz-menu>
        <bz-button @click=${() => dialog?.show()}>${icon("layers")} Dialog aç</bz-button>
        <bz-button variant="primary">${icon("plus")} Yeni sipariş</bz-button>
      </div>

      <div class="te-toolbar">
        <bz-input class="te-search" placeholder="Sipariş no veya müşteri…" aria-label="Ara"><span slot="prefix">${icon("search")}</span></bz-input>
        ${[["all", "Tümü"], ["open", "Açık"], ["done", "Tamamlanan"]].map(
          ([v, l]) => html`<bz-chip selectable .selected=${() => filter() === v} @click=${() => filter.set(v)}>${l}</bz-chip>`
        )}
      </div>

      <div class="te-grid-row">
        <div class="te-col">
          <bz-tabs value="list">
            <bz-tab-list>
              <bz-tab value="list">Liste <bz-badge>128</bz-badge></bz-tab>
              <bz-tab value="summary">Özet</bz-tab>
              <bz-tab value="history" disabled>Geçmiş</bz-tab>
            </bz-tab-list>
            <bz-tab-panel value="list">
              <bz-data-grid label="Siparişler" selectable virtual="off" .labels=${DATA_GRID_TR} .columns=${COLUMNS} .rows=${ROWS}
                .selection=${selection} @selection-change=${(e: CustomEvent<{ selection: unknown[] }>) => selection.set(e.detail.selection)}></bz-data-grid>
              <bz-pagination variant="compact" show-info total="128" page-size="8" .labels=${PAGINATION_TR}></bz-pagination>
            </bz-tab-panel>
            <bz-tab-panel value="summary">
              <bz-card-list min-card-width="11rem" label="Özet">
                <bz-card heading="Ciro" description="₺14.858.930" icon="chart" meta="+12,4%" meta-variant="success"></bz-card>
                <bz-card heading="Açık sipariş" description="417" icon="box" meta="takipte" meta-variant="info"></bz-card>
                <bz-card heading="Geciken" description="12" icon="alert" meta="7 günden eski" meta-variant="danger" indicator="danger"></bz-card>
              </bz-card-list>
            </bz-tab-panel>
          </bz-tabs>

          <div class="te-alerts">
            <bz-alert variant="info" heading="Bilgi">Kargo entegrasyonu 22:00'de bakıma girecek.</bz-alert>
            <bz-alert variant="success">3 sipariş faturalandı.</bz-alert>
            <bz-alert variant="warning" heading="Süresi dolan teklifler">3 teklifin geçerliliği bu hafta doluyor.</bz-alert>
            <bz-alert variant="danger">Sunucuya ulaşılamadı; değişiklikler kaydedilmedi.</bz-alert>
          </div>
        </div>

        <bz-panel class="te-form" heading="Sipariş detayı">
          <div class="te-form-body">
            <bz-input label="Müşteri" value="Ege Makine A.Ş." required></bz-input>
            <bz-input label="Tutar" type="number" value="70528" hint="KDV dahil"><span slot="prefix">₺</span></bz-input>
            <bz-combobox label="Teslimat" value="Kargo">
              <bz-option>Kargo</bz-option><bz-option>Mağazadan teslim</bz-option><bz-option>Kurye</bz-option>
            </bz-combobox>
            <bz-input label="E-posta" value="ege@" type="email" error="Geçerli bir e-posta girin."
              ref=${(el: HTMLElement) => setTimeout(() => el.querySelector("input")?.checkValidity())}></bz-input>
            <bz-radio-group label="Öncelik" value="normal" orientation="horizontal">
              <bz-radio value="low">Düşük</bz-radio><bz-radio value="normal">Normal</bz-radio><bz-radio value="high">Yüksek</bz-radio>
            </bz-radio-group>
            <bz-checkbox checked>Müşteriye e-posta gönder</bz-checkbox>
            <bz-switch>Faturayı otomatik kes</bz-switch>
            <bz-textarea label="Not" rows="2" placeholder="Teslimat notu…"></bz-textarea>
            <div class="te-actions">
              <bz-button variant="danger" size="sm">${icon("trash")} Sil</bz-button>
              <span class="te-spacer"></span>
              <bz-button>Vazgeç</bz-button>
              <bz-button variant="primary">Kaydet</bz-button>
            </div>
          </div>
        </bz-panel>
      </div>

      <bz-dialog heading="Siparişi onayla" ref=${(el: DialogElement) => (dialog = el)}>
        <p>SP-20261199 numaralı sipariş onaylanacak ve depoya iletilecek.</p>
        <bz-checkbox checked>Müşteriye bildir</bz-checkbox>
        <bz-button slot="footer" @click=${() => dialog?.close()}>Vazgeç</bz-button>
        <bz-button slot="footer" variant="primary" @click=${() => dialog?.close()}>Onayla</bz-button>
      </bz-dialog>
    </div>
  `
}
