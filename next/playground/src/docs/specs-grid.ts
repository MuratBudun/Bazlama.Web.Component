import type { UsageSpec } from "./usage"

// "Kullanım" content of the Data grid page (see usage.ts).

export const dataGridUsage: UsageSpec = {
  tag: "bz-data-grid · bz-data-grid-columns",
  html: `
<bz-toolbar label="Formlar">
  <bz-toolbar-spacer></bz-toolbar-spacer>
  <bz-data-grid-columns for="forms">Sütunlar</bz-data-grid-columns>
</bz-toolbar>
<bz-data-grid id="forms" label="Belgeler" selectable style="--bz-data-grid-max-height: 16rem"></bz-data-grid>
<script>
  forms.columns = [
    { key: "no", header: "Belge No", width: 120, pinned: "start", sortable: true },
    { key: "name", header: "Adı", width: 220, flex: true, sortable: true },
    { key: "dept", header: "Bölüm", width: 180 },
    { key: "rev", header: "Sürüm", width: 70, align: "end" },
    { key: "status", header: "Durum", width: 130, pinned: "end" },
  ]
  forms.rows = Array.from({ length: 5000 }, (_, i) => ({ id: i + 1, no: "BLG-" + (i + 1), … }))
</script>`,
  preview: (root) => {
    const grid = root.querySelector("bz-data-grid") as HTMLElement & { columns: unknown; rows: unknown }
    grid.columns = [
      { key: "no", header: "Belge No", width: 120, pinned: "start", sortable: true },
      { key: "name", header: "Adı", width: 220, flex: true, sortable: true },
      { key: "dept", header: "Bölüm", width: 180 },
      { key: "rev", header: "Sürüm", width: 70, align: "end" },
      { key: "status", header: "Durum", width: 130, pinned: "end" },
    ]
    const depts = ["Satış", "Finans", "Pazarlama", "Satın Alma", "İnsan Kaynakları"]
    grid.rows = Array.from({ length: 5000 }, (_, i) => ({
      id: i + 1,
      no: `BLG-${String(i + 1).padStart(4, "0")}`,
      name: `Belge ${i + 1}`,
      dept: depts[i % depts.length],
      rev: i % 7,
      status: i % 3 ? "Yayında" : "Taslak",
    }))
  },
  js: `
const grid = document.createElement("bz-data-grid")
grid.style.setProperty("--bz-data-grid-max-height", "14rem")
grid.columns = [
  { key: "id", header: "#", width: 70, align: "end", pinned: "start" },
  { key: "name", header: "Ad", flex: true, width: 200, sortable: true },
  { key: "value", header: "Değer", width: 120, align: "end", sortable: true },
]
grid.rows = Array.from({ length: 100000 }, (_, i) => ({ id: i + 1, name: "Satır " + (i + 1), value: (i * 7919) % 1000 }))

// Kullanıcının sütun düzenini sakla / geri yükle
const saved = localStorage.getItem("demo-grid")
if (saved) grid.columnState = JSON.parse(saved)
grid.addEventListener("columns-change", (e) => {
  localStorage.setItem("demo-grid", JSON.stringify(e.detail.state))
  log("columns-change", e.detail.reason, e.detail.key)
})
grid.addEventListener("row-activate", (e) => log("row-activate", e.detail.key))
output.append(grid)`,
  template: `
html\`
  <bz-toolbar label="Belge listesi">
    <bz-toolbar-spacer></bz-toolbar-spacer>
    <bz-data-grid-columns for="docs">Sütunlar</bz-data-grid-columns>
  </bz-toolbar>
  <bz-data-grid id="docs" label="Belgeler" selectable
    .columns=\${COLUMNS} .rows=\${rows} .labels=\${DATA_GRID_TR}
    .columnState=\${columnState} @columns-change=\${(e) => save(e.detail.state)}
    .sort=\${sort} @sort=\${(e) => sort.set(e.detail.sort)}
    .selection=\${selection} @selection-change=\${(e) => selection.set(e.detail.selection)}
    @row-activate=\${(e) => open(e.detail.row)}>
    <span slot="empty">Gösterilebilecek veri yok</span>
  </bz-data-grid>
\``,
  props: [
    { name: "columns", attr: false, type: "GridColumn[]", desc: "Sütun tanımları: key, header, width (px, 150), minWidth/maxWidth, flex, pinned (\"start\" | \"end\"), hidden, sortable, align, format, compare, resizable/hideable/reorderable." },
    { name: "columnState", attr: false, type: "ColumnState[]", desc: "Kullanıcının düzeni: { key, width, hidden, pinned, order }. Kaydedip geri verin; [] tanımlara döner." },
    { name: "rows / rowKey", attr: "—, row-key", type: 'Row[] / string', default: '[] / "id"', desc: "Veri ve satır anahtarı." },
    { name: "pinLimit", attr: "pin-limit", type: "number (0–1)", default: "0.6", desc: "Sabit sütunlar görünen genişliğin bu oranını aşarsa (telefon, dar panel) sabitleme askıya alınır ([data-pins-suspended]); sütun durumu korunur, genişleyince geri gelir. 0: hiç askıya alma." },
    { name: "rowHeight", attr: "row-height", type: "number (px)", default: "0", desc: "Sabit satır yüksekliği. 0: CSS'teki --bz-data-grid-row-height (tema, data-density; varsayılan 36px) okunur ve satırlar yeniden boyutlanınca tekrar ölçülür." },
    { name: "virtual", type: '"auto" | "on" | "off"', default: '"auto"', desc: "Dikey virtual scroll; auto: virtual-threshold (200) satırın üstünde." },
    { name: "overscan", type: "number", default: "6", desc: "Görünen alanın üstünde/altında fazladan çizilen satır." },
    { name: "selectable / selection", attr: "selectable, —", type: "boolean / unknown[]", desc: "Onay kutusu sütunu (başa sabit) ve seçili anahtarlar." },
    { name: "sort / sortMode", attr: "—, sort-mode", type: 'Sort / "client" | "manual"', desc: "Sıralama; manual: sadece olay (sunucu sıralar)." },
    { name: "label / loading", attr: "label, loading", type: "string / boolean", desc: "Erişilebilir ad; yükleniyor çubuğu (aria-busy)." },
    { name: "highlightPinned", attr: "highlight-pinned", type: "boolean", default: "false", desc: "Sabit (pinned) sütunlar hafif tonlu arka plan alır; renk --bz-data-grid-pinned-bg. Üzerine gelme ve seçim rengi tonun önüne geçer. Yansıtılır." },
    { name: "striped", type: "boolean", default: "false", desc: "Zebra satırlar: sıralı listedeki konuma göre her ikinci satır [data-stripe] ve hafif bir şerit alır (--bz-row-stripe-bg); sanal kaydırmada şerit satırla birlikte kalır, sıralama / filtreden sonra yeniden dizilir. Sabit sütun tonu ve üzerine gelme renginin üstüne yarı saydam biner; seçili satırda yok. Yansıtılır." },
    { name: "labels", attr: false, type: "Partial<DataGridLabels>", desc: "Menü ve erişilebilirlik metinleri." },
    { name: "persist", type: "string", desc: "Saklama anahtarı (isteğe bağlı): sütun düzeni ve sıralama localStorage[\"bz-data-grid:<anahtar>\"] içinde saklanır; açılışta geri yüklenir, columns-change (reason: \"restore\") ve sort olayları gelir. Yoksa hiçbir şey saklanmaz." },
    { name: "bz-data-grid-columns: for", attr: "for", type: "string", desc: "\"Sütunlar\" düğmesinin bağlı olduğu grid id'si (yoksa en yakın grid)." },
  ],
  events: [
    { name: "columns-change", detail: "{ state, reason, key }", desc: "reason: resize | hide | show | pin | reorder | reset | restore (persist'ten yüklendi). Kabarcıklanmaz." },
    { name: "sort", detail: "{ sort }", desc: "Başlık veya menüden. Kabarcıklanmaz." },
    { name: "selection-change", detail: "{ selection }", desc: "Kabarcıklanmaz." },
    { name: "row-click / row-activate", detail: "{ row, key } / { row, key, via }", desc: "row-activate: çift tık veya Enter. Kabarcıklanır." },
  ],
  api: [
    { name: "openColumnsMenu(anchor)", desc: "Sütun göster/gizle menüsü." },
    { name: "resetColumns()", desc: "Tanımlara dön (columns-change reason=reset)." },
    { name: "autosizeColumn(key)", desc: "Çizilmiş satırlara göre sığdır." },
    { name: "scrollToIndex(i)", desc: "Satıra kaydır ve odakla." },
    { name: "getColumnState()", desc: "Tüm sütunların o anki durumu." },
  ],
  slots: [{ name: "empty", desc: "Satır yokken" }],
  parts: [
    { name: "scroller / table / head / header-cell / header / sort-indicator / menu / resize", desc: "Kap ve başlık" },
    { name: "body / row / cell / select / spacer / empty / drop-indicator", desc: "Gövde" },
  ],
  hooks: [
    "[loading]", "[data-virtual]", "[data-scrolled-start] / [data-scrolled-end] (sabit sütun gölgesi)", "th[data-pinned]",
    "[data-resizing] / [data-dragging]", "[highlight-pinned]", "[data-pins-suspended]", "[striped] / tr[data-stripe]", "--bz-row-stripe-bg", "--bz-data-grid-row-height", "--bz-data-grid-max-height", "--bz-data-grid-header-bg", "--bz-data-grid-pinned-bg",
  ],
  notes: [
    "Başlık klavyesi: Enter sıralar, Alt+↓ sütun menüsü, Alt+←/→ sütunu taşır, Shift+←/→ genişlik ±10 px (Ctrl ile ±50). Tutamaçta çift tık: sığdır.",
    "Satırlar tek sekme durağı: ↑/↓, PageUp/PageDown, Home/End, Enter (row-activate), Space (seçim). Odaklı satır ekrandan çıkarsa odak kaydırma kabına geçer; ↓ geri getirir.",
    "Yatay kaydırma tarayıcının; sabit sütunlar position: sticky. Virtual scroll sadece dikey.",
  ],
}
