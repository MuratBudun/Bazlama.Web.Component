import { computed, html, signal } from "@bazlama/core"
import { dialogs, toast, type ColumnState, type DataGridLabels, type GridColumn, type Sort } from "@bazlama/headless"
import { dataGridUsage } from "../docs/specs-grid"
import { usage } from "../docs/usage"
import { logEntry } from "../log"

export const DATA_GRID_TR: Partial<DataGridLabels> = {
  selectAll: "Tüm satırları seç",
  selectRow: "Satırı seç",
  columnMenu: (h) => `Sütun menüsü: ${h}`,
  resize: (h) => `${h} genişliği`,
  sortAsc: "Artan sırala",
  sortDesc: "Azalan sırala",
  clearSort: "Sıralamayı kaldır",
  pin: "Sabitle",
  pinStart: "Başa sabitle",
  pinEnd: "Sona sabitle",
  unpin: "Sabit değil",
  moveLeft: "Sola taşı",
  moveRight: "Sağa taşı",
  autosize: "İçeriğe sığdır",
  hide: "Sütunu gizle",
  columns: "Sütunlar",
  reset: "Varsayılana dön",
  empty: "Gösterilebilecek veri yok",
}

const DEPTS = ["Kalite Kontrol Müdürlüğü", "Üretim Müdürlüğü", "Üretim Planlama ve Depo", "Satın Alma", "İnsan Kaynakları", "Mühendislik"]
const KINDS = ["Form", "Prosedür", "Talimat", "Şartname", "Kılavuz", "Tablo"]
const STATUSES = ["Hazırlanıyor", "Onay Bekliyor", "Yürürlük Onayında", "Yürürlükte", "İptal"]
const PEOPLE = ["Ada Yılmaz", "Ekin Demir", "Deniz Kaya", "Test User 10", "Mert Aksoy", "Zeynep Arslan"]

type Doc = Record<string, unknown> & { id: number }

function makeRows(n: number): Doc[] {
  const out: Doc[] = new Array(n)
  for (let i = 0; i < n; i++) {
    const kind = KINDS[i % KINDS.length]
    out[i] = {
      id: i + 1,
      no: `${kind.slice(0, 3).toLocaleUpperCase("tr-TR")}-${String(i + 1).padStart(6, "0")}`,
      name: `${kind} ${i + 1} — ${DEPTS[(i * 7) % DEPTS.length]} süreç dokümanı`,
      kind,
      rev: (i * 13) % 9,
      dept: DEPTS[i % DEPTS.length],
      owner: PEOPLE[(i * 5) % PEOPLE.length],
      status: STATUSES[(i * 3) % STATUSES.length],
      created: `${String((i % 28) + 1).padStart(2, "0")}.${String((i % 12) + 1).padStart(2, "0")}.20${20 + (i % 7)}`,
      valid: `${String(((i * 3) % 28) + 1).padStart(2, "0")}.${String(((i * 5) % 12) + 1).padStart(2, "0")}.20${27 + (i % 5)}`,
      copies: (i * 7) % 12,
      training: i % 4 === 0 ? "Evet" : "Hayır",
      location: ["Merkez", "Gebze", "Manisa"][i % 3],
      lang: i % 5 === 0 ? "EN" : "TR",
      pages: 1 + ((i * 11) % 40),
      approver: PEOPLE[(i * 3 + 1) % PEOPLE.length],
      code: `D00${1 + (i % 9)}.${i % 10}`,
      size: `${(((i * 37) % 900) + 12).toLocaleString("tr-TR")} KB`,
      views: (i * 97) % 5000,
      note: i % 9 === 0 ? "Revizyon bekliyor" : "",
    }
  }
  return out
}

const statusColor: Record<string, string> = {
  "Hazırlanıyor": "warning",
  "Onay Bekliyor": "info",
  "Yürürlük Onayında": "primary",
  "Yürürlükte": "success",
  "İptal": "neutral",
}

const COLUMNS: GridColumn<Doc>[] = [
  { key: "no", header: "Doküman No", width: 130, pinned: "start", sortable: true, hideable: false },
  { key: "name", header: "Doküman Adı", width: 280, flex: true, minWidth: 160, sortable: true },
  { key: "kind", header: "Tür", width: 100, sortable: true },
  { key: "rev", header: "Rev.", width: 64, align: "end", sortable: true },
  { key: "dept", header: "Sahip Bölüm", width: 200, sortable: true },
  { key: "owner", header: "Hazırlayan", width: 140, sortable: true },
  { key: "approver", header: "Onaylayan", width: 140 },
  { key: "created", header: "Oluşturma", width: 110 },
  { key: "valid", header: "Geçerlilik", width: 110 },
  { key: "copies", header: "Çıktı", width: 70, align: "end", sortable: true },
  { key: "training", header: "Eğitim", width: 80, align: "center" },
  { key: "location", header: "Lokasyon", width: 110, sortable: true },
  { key: "lang", header: "Dil", width: 60, align: "center" },
  { key: "pages", header: "Sayfa", width: 70, align: "end", sortable: true },
  { key: "code", header: "Bölüm Kodu", width: 110 },
  { key: "size", header: "Boyut", width: 90, align: "end" },
  { key: "views", header: "Görüntülenme", width: 120, align: "end", sortable: true },
  { key: "note", header: "Not", width: 160, hidden: true },
  {
    key: "status",
    header: "Durum",
    width: 150,
    pinned: "end",
    sortable: true,
    format: (v) => html`<bz-badge variant=${statusColor[String(v)] ?? "neutral"}>${String(v)}</bz-badge>`,
  },
]

const STORAGE_KEY = "bz-playground-data-grid"
const load = (): ColumnState[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as ColumnState[]
  } catch {
    return []
  }
}

export default {
  id: "data-grid",
  title: "Data grid",
  description:
    "Büyük veri için tablo: sütun genişliği (sürükle / klavye / sığdır), gizleme, başa-sona sabitleme, sürükleyerek sıralama ve dikey virtual scroll. Sütun düzeni columnState ile saklanır.",
  render() {
    const count = signal(10_000)
    const rows = computed(() => {
      const t = performance.now()
      const r = makeRows(count())
      queueMicrotask(() => logEntry("data-grid", "rows", `${count().toLocaleString("tr-TR")} satır ${Math.round(performance.now() - t)} ms`))
      return r
    })
    const columnState = signal<ColumnState[]>(load())
    const sort = signal<Sort>(null)
    const selection = signal<unknown[]>([])
    const loading = signal(false)
    const reload = () => {
      loading.set(true)
      setTimeout(() => loading.set(false), 900)
    }
    return html`
      ${usage(dataGridUsage)}

      <section class="demo">
        <h2>Doküman listesi</h2>
        <bz-toolbar label="Doküman listesi" class="grid-demo-toolbar">
          <bz-radio-group label="Satır" orientation="horizontal" .value=${() => String(count())}
            @change=${(e: CustomEvent<{ value: string }>) => count.set(Number(e.detail.value))}>
            <bz-radio value="1000">1 000</bz-radio>
            <bz-radio value="10000">10 000</bz-radio>
            <bz-radio value="100000">100 000</bz-radio>
          </bz-radio-group>
          <bz-toolbar-separator></bz-toolbar-separator>
          <bz-button size="sm" variant="ghost" @click=${reload}>Yenile (loading)</bz-button>
          <bz-toolbar-spacer></bz-toolbar-spacer>
          <span class="muted small">${() => (selection().length ? `${selection().length} seçili · ` : "")}${() => rows().length.toLocaleString("tr-TR")} satır</span>
          <bz-data-grid-columns for="demo-grid">Sütunlar</bz-data-grid-columns>
        </bz-toolbar>
        <bz-data-grid
          id="demo-grid"
          class="grid-demo"
          label="Dokümanlar"
          selectable
          .labels=${DATA_GRID_TR}
          .columns=${COLUMNS}
          .rows=${rows}
          .columnState=${columnState}
          .sort=${sort}
          .selection=${selection}
          ?loading=${loading}
          @columns-change=${(e: CustomEvent<{ state: ColumnState[]; reason: string; key?: string }>) => {
            columnState.set(e.detail.state)
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(e.detail.state))
            } catch {
              /* private mode */
            }
            logEntry("data-grid", "columns-change", `${e.detail.reason} ${e.detail.key ?? ""}`)
          }}
          @sort=${(e: CustomEvent<{ sort: Sort }>) => sort.set(e.detail.sort)}
          @selection-change=${(e: CustomEvent<{ selection: unknown[] }>) => selection.set(e.detail.selection)}
          @row-activate=${(e: CustomEvent<{ row: Doc }>) =>
            void dialogs.alert({ heading: String(e.detail.row.no), message: String(e.detail.row.name) })}
        ></bz-data-grid>
        <p class="note">
          Başlık kenarını sürükleyin (çift tık: sığdır), başlığı sürükleyip taşıyın, ⋮ menüsünden sabitleyin / gizleyin. Klavyede başlıkta Alt+↓
          menü, Alt+←/→ taşı, Shift+←/→ genişlik. Düzen tarayıcıda saklanır; "Sütunlar ▸ Varsayılana dön" sıfırlar.
        </p>
        <div class="row">
          <bz-button size="sm" @click=${() => (document.getElementById("demo-grid") as HTMLElement & { scrollToIndex(i: number): void }).scrollToIndex(Math.floor(count() / 2))}>
            Ortadaki satıra git
          </bz-button>
          <bz-button size="sm" @click=${() => {
            try {
              localStorage.removeItem(STORAGE_KEY)
            } catch {
              /* private mode */
            }
            columnState.set([])
            toast("Sütun düzeni sıfırlandı")
          }}>
            Kayıtlı düzeni sil
          </bz-button>
        </div>
      </section>
    `
  },
}
