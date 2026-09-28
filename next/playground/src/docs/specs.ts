import type { Column, TreeItem } from "@bazlama/headless"
import type { UsageSpec } from "./usage"

// "Kullanım" content of the component pages (see usage.ts).

export const panelUsage: UsageSpec = {
  tag: "bz-panel",
  html: `
<bz-panel heading="Sipariş özeti">
  <bz-button slot="actions" size="sm" variant="ghost">Düzenle</bz-button>
  <p>3 ürün · Toplam 1.249,90 ₺</p>
  <bz-button slot="footer" variant="primary">Onayla</bz-button>
</bz-panel>

<bz-panel heading="Gelişmiş ayarlar" collapsible>
  <p>Başlığa tıklayınca açılır.</p>
</bz-panel>`,
  js: `
const panel = document.createElement("bz-panel")
panel.heading = "Kargo bilgileri"
panel.collapsible = true
panel.open = true

// Slotlar ilk bağlanmada okunur: çocukları append'den ÖNCE ekleyin.
const body = document.createElement("p")
body.textContent = "Yarın teslim"
const edit = document.createElement("bz-button")
edit.slot = "actions"
edit.textContent = "Düzenle"
panel.append(body, edit)

panel.addEventListener("toggle", (e) => log("toggle", e.detail))
output.append(panel)`,
  template: `
const open = signal(true)

html\`
  <bz-panel heading="Kargo" collapsible .open=\${open}
            @toggle=\${(e) => open.set(e.detail.open)}>
    <bz-button slot="actions" size="sm">Düzenle</bz-button>
    <p>\${() => address()}</p>
  </bz-panel>
\``,
  props: [
    { name: "heading", type: "string", desc: "Başlık metni. header slotu verilirse onun yerine o kullanılır." },
    { name: "collapsible", type: "boolean", default: "false", desc: "Başlık bir <button> olur ve içeriği açıp kapatır." },
    { name: "open", type: "boolean", default: "false", desc: "collapsible modda içerik açık mı. Yansıtılır ([open])." },
  ],
  events: [{ name: "toggle", detail: "{ open: boolean }", desc: "Kullanıcı başlığa tıklayıp açınca/kapatınca." }],
  slots: [
    { name: "(varsayılan)", desc: "İçerik" },
    { name: "header", desc: "heading yerine zengin başlık" },
    { name: "actions", desc: "Başlığın sağındaki butonlar" },
    { name: "footer", desc: "Alt bölüm (yoksa çizilmez)" },
  ],
  parts: [
    { name: "header", desc: "Başlık satırı" },
    { name: "title / trigger", desc: "Başlık (collapsible ise trigger butonu)" },
    { name: "actions", desc: "Eylemler" },
    { name: "content", desc: "İçerik bölgesi (role=region)" },
    { name: "footer", desc: "Alt bölüm" },
  ],
  hooks: ["[open]", "[collapsible]"],
  notes: ["Light DOM slotları elementin ilk bağlandığı andaki çocuklarından alınır; sonradan eklenen çocuklar slota taşınmaz."],
}

export const listUsage: UsageSpec = {
  tag: "bz-list",
  html: `
<bz-list label="Dil" name="lang" value="tr">
  <bz-option value="tr">Türkçe</bz-option>
  <bz-option value="en">English</bz-option>
  <bz-option value="de" disabled>Deutsch</bz-option>
</bz-list>

<bz-list label="Etiketler" multiple value="a,c">
  <bz-option value="a">Acil</bz-option>
  <bz-option value="b">Bekliyor</bz-option>
  <bz-option value="c">Canlı</bz-option>
</bz-list>`,
  js: `
const list = document.createElement("bz-list")
list.label = "Şehir"
list.multiple = true
for (const [value, text] of [["ist", "İstanbul"], ["ank", "Ankara"], ["izm", "İzmir"]]) {
  const option = document.createElement("bz-option")
  option.setAttribute("value", value)   // bz-option: value/label öznitelikle verilir
  option.textContent = text
  list.append(option)
}
list.value = "ank"
list.addEventListener("change", (e) => log("change", e.detail.value))
output.append(list)`,
  template: `
const langs = signal([{ id: "tr", name: "Türkçe" }, { id: "en", name: "English" }])
const lang = signal("tr")

html\`
  <bz-list label="Dil" name="lang" .value=\${lang}
           @change=\${(e) => lang.set(e.detail.value)}>
    \${repeat(langs, (l) => l.id, (l) => html\`<bz-option value=\${l.id}>\${l.name}</bz-option>\`)}
  </bz-list>
\``,
  props: [
    { name: "value", type: "string", default: '""', desc: "Seçili değer. multiple ise virgülle ayrılmış liste (\"a,c\")." },
    { name: "multiple", type: "boolean", default: "false", desc: "Çoklu seçim (aria-multiselectable)." },
    { name: "disabled", type: "boolean", default: "false", desc: "Yansıtılır." },
    { name: "label", type: "string", desc: "Erişilebilir ad (aria-label)." },
    { name: "name", attr: "name", type: "string", desc: "Form alanı adı (öznitelik). multiple ise her değer ayrı gönderilir." },
  ],
  events: [{ name: "change", detail: "{ value: string }", desc: "Kullanıcı seçimi değiştirince." }],
  api: [
    { name: "<bz-option value label disabled>", desc: "Seçenek. value ve label yoksa metin içeriği kullanılır. Seçenekler dinamik eklenip çıkarılabilir." },
  ],
  hooks: ['bz-option[aria-selected="true"]', "bz-option[data-active]", 'bz-option[aria-disabled="true"]'],
  notes: ["Klavye: ↑/↓, Home/End, PageUp/PageDown, yazarak arama, Enter/Space seçer. Odak listede kalır (aria-activedescendant)."],
}

export const comboboxUsage: UsageSpec = {
  tag: "bz-combobox",
  html: `
<bz-combobox label="Şehir" name="city" placeholder="Seçin veya yazın" value="izmir" required>
  <bz-option value="istanbul">İstanbul</bz-option>
  <bz-option value="ankara">Ankara</bz-option>
  <bz-option value="izmir">İzmir</bz-option>
</bz-combobox>`,
  js: `
const combo = document.createElement("bz-combobox")
combo.label = "Meyve"
combo.placeholder = "Yazın…"
combo.allowCustom = true            // listede olmayan metin de değer olur
for (const name of ["Elma", "Armut", "Çilek", "Kiraz"]) {
  const option = document.createElement("bz-option")
  option.textContent = name
  combo.append(option)
}
combo.addEventListener("change", (e) => log("change", e.detail.value))
output.append(combo)`,
  template: `
const city = signal("izmir")
const cities = signal([])          // ör. sunucudan

html\`
  <bz-combobox label="Şehir" name="city" required
               .value=\${city} @change=\${(e) => city.set(e.detail.value)}>
    \${repeat(cities, (c) => c.id, (c) => html\`<bz-option value=\${c.id}>\${c.name}</bz-option>\`)}
    <span slot="empty">Sonuç bulunamadı</span>
  </bz-combobox>
\``,
  props: [
    { name: "value", type: "string", default: '""', desc: "Seçili seçeneğin value'su; input onun etiketini gösterir." },
    { name: "label", type: "string", desc: "" },
    { name: "placeholder", type: "string", desc: "" },
    { name: "open", type: "boolean", default: "false", desc: "Popup açık mı. Yansıtılır ([open])." },
    { name: "disabled", type: "boolean", default: "false", desc: "" },
    { name: "required", type: "boolean", default: "false", desc: "Form doğrulaması (valueMissing)." },
    { name: "allowCustom", type: "boolean", default: "false", desc: "Yazılan metin değer olur." },
    { name: "filter", type: '"contains" | "starts-with" | "none"', default: '"contains"', desc: "Filtreleme biçimi (aksan/harf duyarsız). none: sunucu tarafı filtre için." },
    { name: "emptyText", type: "string", default: '"No results"', desc: "Eşleşme yokken gösterilen metin." },
    { name: "name", attr: "name", type: "string", desc: "Form alanı adı (öznitelik)." },
  ],
  events: [{ name: "change", detail: "{ value: string }", desc: "Seçim değişince (allow-custom ise odak çıkınca da)." }],
  slots: [
    { name: "(varsayılan)", desc: "<bz-option> seçenekleri" },
    { name: "trigger", desc: "Açma butonunun içeriği (ikon)" },
    { name: "empty", desc: "Sonuç yok içeriği" },
  ],
  parts: [
    { name: "label / control / input / trigger", desc: "Alan" },
    { name: "popup / listbox / empty", desc: "Açılır liste" },
  ],
  hooks: ["[open]", "[disabled]", "bz-option[data-active]", 'bz-option[aria-selected="true"]'],
}

export const tableUsage: UsageSpec = {
  tag: "bz-table",
  html: `
<bz-table id="customers" label="Müşteriler" selectable></bz-table>

<script type="module">
  const table = document.getElementById("customers")
  table.columns = [
    { key: "name", header: "Ad", sortable: true },
    { key: "amount", header: "Tutar", align: "end" },
  ]
  table.rows = [{ id: 1, name: "Ada", amount: 120 }]
</script>`,
  preview(root) {
    const table = root.querySelector("bz-table")!
    table.columns = [
      { key: "name", header: "Ad", sortable: true },
      { key: "amount", header: "Tutar", align: "end" },
    ] satisfies Column[]
    table.rows = [{ id: 1, name: "Ada", amount: 120 }]
  },
  js: `
const table = document.createElement("bz-table")
table.label = "Siparişler"
table.selectable = true
table.columns = [
  { key: "id", header: "#", sortable: true, align: "end", width: "3rem" },
  { key: "customer", header: "Müşteri", sortable: true },
  { key: "total", header: "Tutar", sortable: true, align: "end",
    format: (v) => v.toLocaleString("tr-TR", { style: "currency", currency: "TRY" }) },
]
table.rows = [
  { id: 1, customer: "Ada Yılmaz", total: 1250 },
  { id: 2, customer: "Can Demir", total: 380.5 },
  { id: 3, customer: "Ece Kaya", total: 9020 },
]
table.addEventListener("row-click", (e) => log("row-click", e.detail.row.customer))
table.addEventListener("selection-change", (e) => log("seçim", e.detail.selection))
table.addEventListener("sort", (e) => log("sort", e.detail.sort))
output.append(table)`,
  template: `
const rows = signal([])
const selection = signal([])

const columns = [
  { key: "name", header: "Ad", sortable: true },
  { key: "status", header: "Durum",
    format: (v) => html\`<span class="badge" data-status=\${v}>\${v}</span>\` },
]

html\`
  <bz-table label="Müşteriler" selectable
            .columns=\${columns} .rows=\${rows} .selection=\${selection}
            @selection-change=\${(e) => selection.set(e.detail.selection)}
            @row-click=\${(e) => open(e.detail.row)}>
    <span slot="empty">Kayıt yok</span>
  </bz-table>
\``,
  props: [
    { name: "columns", attr: false, type: "Column[]", default: "[]", desc: "{ key, header, sortable?, align?, width?, format?(value,row), compare?(a,b) }" },
    { name: "rows", attr: false, type: "Row[]", default: "[]", desc: "Satır nesneleri. Aynı nesne kalırsa DOM korunur; güncellemek için nesneyi değiştirin." },
    { name: "rowKey", type: "string", default: '"id"', desc: "Satır anahtarı alanı." },
    { name: "selectable", type: "boolean", default: "false", desc: "Onay kutusu sütunu." },
    { name: "activatable", type: "boolean", default: "false", desc: "Satırlar odak alır (tek sekme durağı): ↑/↓, Home/End, PageUp/PageDown gezinir, Enter row-activate, Space seçer." },
    { name: "selection", attr: false, type: "unknown[]", default: "[]", desc: "Seçili satır anahtarları." },
    { name: "sort", attr: false, type: '{ key, dir: "asc" | "desc" } | null', default: "null", desc: "Geçerli sıralama." },
    { name: "sortMode", type: '"client" | "manual"', default: '"client"', desc: "manual: tablo sıralamaz, sadece sort olayı atar (sunucu tarafı)." },
    { name: "label", type: "string", desc: "Tablo başlığı (<caption>)." },
  ],
  events: [
    { name: "sort", detail: "{ sort }", desc: "Sıralanabilir başlığa tıklanınca (asc → desc → yok)." },
    { name: "selection-change", detail: "{ selection: unknown[] }", desc: "Seçim değişince." },
    { name: "row-click", detail: "{ row }", desc: "Satıra tıklanınca." },
    { name: "row-activate", detail: '{ row, key, via: "dblclick" | "keyboard" }', desc: "Satır açılmak istenince: çift tık (her zaman) veya activatable ile Enter." },
  ],
  slots: [{ name: "empty", desc: "Satır yokken gösterilen içerik" }],
  parts: [
    { name: "table / caption / head / body", desc: "Tablo iskeleti" },
    { name: "row / cell / header-cell", desc: "Satır ve hücreler" },
    { name: "sort / sort-indicator", desc: "Sıralama butonu" },
    { name: "select / empty", desc: "Seçim hücresi, boş durum" },
  ],
  hooks: ["th[aria-sort]", 'tr[aria-selected="true"]', "[data-align]"],
}

export const iconUsage: UsageSpec = {
  tag: "bz-icon",
  html: `
<bz-icon name="home"></bz-icon>
<bz-icon name="folder" size="24"></bz-icon>
<bz-icon name="star" label="Favori" size="32" style="color: #e8a200"></bz-icon>
<bz-button variant="primary"><bz-icon name="plus"></bz-icon> Yeni kayıt</bz-button>`,
  js: `
// Element biçimi (ikonlar uygulama girişinde defineIcons ile kaydedilmiş olmalı)
for (const name of ["home", "folder", "settings", "bell"]) {
  const el = document.createElement("bz-icon")
  el.name = name
  el.size = "28"
  output.append(el, " ")
}
// Fonksiyon biçimi: import { icon } from "@bazlama/headless"
// output.append(icon("check", { size: 28, label: "Tamam" }))`,
  template: `
import { defineIcons, icon } from "@bazlama/headless"
import { home, folder, plus } from "@bazlama/icons"   // sadece kullanılanlar pakete girer

defineIcons({ home, folder, plus })   // camelCase anahtarlar: chevronRight → "chevron-right"

html\`
  <bz-button variant="primary">\${icon("plus")} Yeni kayıt</bz-button>
  <span>\${icon("folder", { size: 20, label: "Klasör" })}</span>
  <bz-icon name=\${() => (open() ? "folder-open" : "folder")}></bz-icon>
\``,
  props: [
    { name: "name", type: "string", desc: "Kayıtlı ikon adı." },
    { name: "label", type: "string", desc: "Erişilebilir ad. Yoksa ikon dekoratiftir (aria-hidden)." },
    { name: "size", type: "string", default: '"1em"', desc: "CSS uzunluğu veya px sayısı." },
  ],
  api: [
    { name: "icon(name, { label?, size?, inline? })", desc: "SVGSVGElement döner. Tablo/ağaç satırlarında elemente göre çok daha ucuz. inline: shadow root içinde kullanım için." },
    { name: "defineIcons({ ad: { body, viewBox?, mode? } })", desc: "İkon kaydeder. mode: \"stroke\" (varsayılan) veya \"fill\"." },
    { name: "defineIconFromSvg(name, svgText)", desc: "Tam bir <svg> metninden ikon kaydeder." },
    { name: "hasIcon(name) / iconNames()", desc: "Kayıt sorgulama." },
  ],
  hooks: [".bz-icon", "--bz-icon-stroke-width", "color (currentColor)"],
}

export const treeUsage: UsageSpec = {
  tag: "bz-tree",
  html: `
<bz-tree id="menu" label="Ana menü" selection="leaf"></bz-tree>

<script type="module">
  const menu = document.getElementById("menu")
  menu.items = [
    { id: "sales", label: "Satış", icon: "cart", children: [
      { id: "orders", label: "Siparişler", href: "#orders", badge: 12 },
    ]},
  ]
  menu.expanded = ["sales"]
</script>`,
  preview(root) {
    const menu = root.querySelector("bz-tree")!
    // No href here: it would change the playground's route.
    menu.items = [
      { id: "sales", label: "Satış", icon: "cart", children: [{ id: "orders", label: "Siparişler", badge: 12 }] },
    ] satisfies TreeItem[]
    menu.expanded = ["sales"]
  },
  js: `
const tree = document.createElement("bz-tree")
tree.label = "Dosyalar"
tree.items = [
  { id: "docs", label: "Belgeler", icon: "folder", children: [
    { id: "cv", label: "özgeçmiş.pdf", icon: "file" },
    { id: "notes", label: "notlar.txt", icon: "file-text" },
  ]},
  { id: "remote", label: "Sunucu", icon: "database", lazy: true },
  { id: "trash", label: "Çöp", icon: "trash", disabled: true },
]
tree.expanded = ["docs"]
tree.loadChildren = async (item) => {
  await new Promise((r) => setTimeout(r, 500))
  return [{ id: item.id + "/a", label: "yüklendi.txt", icon: "file" }]
}
tree.addEventListener("select", (e) => log("select", e.detail.id))
tree.addEventListener("toggle", (e) => log("toggle", e.detail.id, e.detail.expanded))
output.append(tree)`,
  template: `
import { collectIds } from "@bazlama/headless"

const current = signal("orders")

html\`
  <bz-tree label="Ana menü" selection="leaf"
           .items=\${items} .value=\${current} .expanded=\${collectIds(items)}
           @activate=\${(e) => router.go(e.detail.id)}></bz-tree>

  <bz-tree label="Yetkiler" checkable selection="none"
           .items=\${permissions} .checked=\${granted}
           @check=\${(e) => granted.set(e.detail.checked)}></bz-tree>

  <!-- Fonksiyon değerler şablonda reaktif sayılır: sarmalayın -->
  <bz-tree .items=\${roots} .loadChildren=\${() => fetchChildren}></bz-tree>
\``,
  props: [
    { name: "items", attr: false, type: "TreeItem[]", default: "[]", desc: "{ id, label, icon?, href?, badge?, disabled?, children?, lazy? }" },
    { name: "value", type: "string", desc: "Seçili öğe id'si." },
    { name: "selection", type: '"single" | "leaf" | "none"', default: '"single"', desc: "leaf: menüler için, üst öğeler sadece açılır/kapanır." },
    { name: "expanded", attr: false, type: "string[]", default: "[]", desc: "Açık öğe id'leri. Tümünü açmak için collectIds(items)." },
    { name: "checkable", type: "boolean", default: "false", desc: "Üç durumlu onay kutuları." },
    { name: "checked", attr: false, type: "string[]", default: "[]", desc: "İşaretli yaprak id'leri." },
    { name: "filter", type: "string", desc: "Eşleşen öğeleri üst öğeleriyle gösterir (aksan/harf duyarsız)." },
    { name: "label", type: "string", desc: "Erişilebilir ad." },
    { name: "emptyText", type: "string", default: '"No items"', desc: "" },
    { name: "loadChildren", attr: false, type: "(item) => Promise<TreeItem[]>", desc: "lazy: true öğelerin çocuklarını ilk açılışta yükler." },
  ],
  events: [
    { name: "select", detail: "{ id, item }", desc: "Seçim değişince." },
    { name: "activate", detail: "{ id, item }", desc: "Tıklama veya Enter (navigasyon için)." },
    { name: "toggle", detail: "{ id, expanded, item }", desc: "Öğe açılıp kapanınca." },
    { name: "check", detail: "{ checked: string[], id }", desc: "Onay kutusu değişince." },
  ],
  api: [{ name: "collectIds(items, onlyParents = true)", desc: "Ağaçtaki id'ler; tree.expanded = collectIds(items) hepsini açar." }],
  parts: [
    { name: "tree / item", desc: "Kök ve satırlar (role=tree / treeitem)" },
    { name: "toggle / checkbox / icon / label / badge", desc: "Satır parçaları" },
    { name: "empty", desc: "Boş durum" },
  ],
  hooks: ["[aria-expanded]", "[aria-selected]", "[aria-checked]", "[aria-busy]", "[aria-disabled]", "[data-match]", "--bz-tree-level", "--bz-tree-indent"],
}

export const dialogUsage: UsageSpec = {
  tag: "bz-dialog",
  html: `
<bz-button id="open-profile">Profili düzenle</bz-button>

<bz-dialog id="profile" heading="Profil" size="sm">
  <bz-input label="Ad" autofocus></bz-input>
  <bz-button slot="footer" data-close>Vazgeç</bz-button>
  <bz-button slot="footer" variant="primary" data-close="saved">Kaydet</bz-button>
</bz-dialog>

<script type="module">
  const dialog = document.getElementById("profile")
  document.getElementById("open-profile").addEventListener("click", async () => {
    const result = await dialog.show()          // close(result) değeri; Esc → undefined
    console.log(result)
  })
  dialog.addEventListener("click", (e) => {
    const button = e.target.closest("[data-close]")
    if (button) dialog.close(button.dataset.close || undefined)
  })
</script>`,
  preview(root) {
    const dialog = root.querySelector("bz-dialog")!
    root.querySelector("#open-profile")!.addEventListener("click", () => void dialog.show())
    dialog.addEventListener("click", (e) => {
      const button = (e.target as Element).closest<HTMLElement>("[data-close]")
      if (button) void dialog.close(button.dataset.close || undefined)
    })
  },
  js: `
// dialogs manager: programatik dialog, sonucu await ile alınır
const open = document.createElement("bz-button")
open.textContent = "Renk seç"
open.addEventListener("click", async () => {
  const color = await dialogs.open({
    heading: "Renk",
    size: "sm",
    // İçerik fonksiyonu ref alır: ref.close(sonuç)
    content: (ref) => ["Kırmızı", "Yeşil", "Mavi"].map((name) => {
      const b = document.createElement("bz-button")
      b.textContent = name
      b.style.margin = "0 .25rem"
      b.addEventListener("click", () => ref.close(name))
      return b
    }),
  })
  log("seçilen:", color ?? "(vazgeçildi)")
})

const del = document.createElement("bz-button")
del.textContent = "Sil"
del.setAttribute("variant", "danger")
del.addEventListener("click", async () => {
  const ok = await dialogs.confirm({ heading: "Kaydı sil", message: "Geri alınamaz.", variant: "danger" })
  log("onay:", ok)
})

output.append(open, " ", del)`,
  template: `
import { dialogs } from "@bazlama/headless"

// Uygulama girişinde bir kez: varsayılan metinler
Object.assign(dialogs.labels, { ok: "Tamam", cancel: "Vazgeç", close: "Kapat" })

// Formdan açılan seçim dialogu: sonuç forma döner
async function pickCustomer() {
  const customer = await dialogs.open({
    heading: "Müşteri seç",
    size: "lg",
    content: (ref) => html\`
      <bz-table .columns=\${columns} .rows=\${rows}
                @row-click=\${(e) => ref.close(e.detail.row)}></bz-table>\`,
  })
  if (customer) form.customer.set(customer)
}

// Kaydedilmemiş değişiklik: guard iç içe bir onay açar
dialogs.open({
  heading: "Sipariş",
  content: orderForm,
  beforeClose: (reason) =>
    !dirty() || dialogs.confirm({ message: "Değişiklikler kaybolsun mu?", variant: "danger" }),
})

// HTML ile tanımlı dialog, signal ile
html\`<bz-dialog heading="Profil" .open=\${open} @close=\${() => open.set(false)}>…</bz-dialog>\``,
  props: [
    { name: "open", type: "boolean", default: "false", desc: "Açık mı. true yapmak açar, false yapmak guard sormadan kapatır. Yansıtılır." },
    { name: "heading", type: "string", desc: "Başlık (aria-labelledby)." },
    { name: "label", type: "string", desc: "Başlık yoksa erişilebilir ad." },
    { name: "persistent", type: "boolean", default: "false", desc: "Esc ve arka plan tıklaması kapatmaz." },
    { name: "hideClose", type: "boolean", default: "false", desc: "× butonunu gizler." },
    { name: "closeLabel", type: "string", desc: "× butonunun erişilebilir adı (varsayılan dialogs.labels.close)." },
    { name: "beforeClose", attr: false, type: "(reason, result) => boolean | Promise<boolean>", desc: "Kapanmadan önce sorulur; false dönerse açık kalır. Promise dönebilir (ör. confirm)." },
    { name: "size", type: '"sm" | "md" | "lg" | "xl" | "full"', desc: "Sadece CSS (@bazlama/ui). Genişlik: --bz-dialog-width." },
  ],
  events: [
    { name: "open", detail: "—", desc: "Açılınca." },
    { name: "before-close", detail: "{ reason, result }", desc: "Kapanmadan önce; preventDefault() açık tutar." },
    { name: "close", detail: "{ result, reason }", desc: "Kapanınca. reason: close-button | escape | backdrop | parent | api" },
  ],
  api: [
    { name: "element.show(): Promise<result>", desc: "Yığının en üstünde açar; close(result) ile çözülür, vazgeçilirse undefined." },
    { name: "element.close(result?): Promise<boolean>", desc: "Guard'lara sorarak kapatır (üstündekilerle birlikte). Reddedilirse false." },
    { name: "dialogs.open({ heading, content, footer, size, persistent, beforeClose })", desc: "Programatik dialog. content/footer: metin, node, şablon veya (ref) => …. DialogRef döner: await edilebilir, ref.close(result), ref.element." },
    { name: "dialogs.confirm(message | { heading, message, confirmText, cancelText, variant })", desc: "Promise<boolean>. variant: \"danger\" ilk odağı Vazgeç'e verir." },
    { name: "dialogs.alert(message | { heading, message, okText })", desc: "Promise<void>." },
    { name: "dialogs.stack() / dialogs.top", desc: "Açık dialoglar (reaktif) ve en üstteki." },
    { name: "dialogs.closeAll()", desc: "Tüm yığını üstten kapatır (guard'lar sorulur)." },
    { name: "dialogs.labels", desc: "{ ok, cancel, close } varsayılan metinleri." },
  ],
  slots: [
    { name: "(varsayılan)", desc: "Gövde (kayan bölüm)" },
    { name: "header", desc: "heading yerine zengin başlık" },
    { name: "footer", desc: "Butonlar (yoksa çizilmez)" },
  ],
  parts: [
    { name: "dialog", desc: "Native <dialog> (::backdrop buradan stillenir)" },
    { name: "panel", desc: "İç kutu" },
    { name: "header / title / close", desc: "Başlık satırı" },
    { name: "body / footer", desc: "Gövde ve alt bölüm" },
  ],
  hooks: ["[open]", "[size]", "[data-depth]", "[data-covered]", "[data-refused]", "--bz-dialog-width", "--bz-dialog-backdrop", "--bz-dialog-duration"],
}
