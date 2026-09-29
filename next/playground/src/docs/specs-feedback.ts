import { toast } from "@bazlama/headless"
import type { UsageSpec } from "./usage"

// "Kullanım" content of the Tabs, Toast, Tooltip and Menu pages (see usage.ts).

export const contextMenuUsage: UsageSpec = {
  tag: "bz-context-menu",
  html: `
<div id="files" class="drop-zone">Buraya sağ tıklayın (veya uzun basın)</div>

<bz-context-menu for="files">
  <bz-menu-item value="new" icon="plus" shortcut="Ctrl+N">Yeni</bz-menu-item>
  <bz-menu-item value="paste" icon="copy" shortcut="Ctrl+V" disabled>Yapıştır</bz-menu-item>
  <bz-menu-separator></bz-menu-separator>
  <bz-menu>
    <bz-menu-item slot="trigger">Sırala</bz-menu-item>
    <bz-menu-item type="radio" name="sort" value="name" checked>Ada göre</bz-menu-item>
    <bz-menu-item type="radio" name="sort" value="date">Tarihe göre</bz-menu-item>
  </bz-menu>
  <bz-menu-item value="refresh" icon="refresh" shortcut="F5">Yenile</bz-menu-item>
</bz-context-menu>`,
  js: `
const area = document.createElement("div")
area.className = "drop-zone"
area.textContent = "Sağ tıklayın: kelimeye göre farklı menü"
area.innerHTML = 'Bir <b data-word="elma">elma</b> ve bir <b data-word="armut">armut</b>'
output.append(area)

// Öğeler olaydan üretilir; null dönerse tarayıcının menüsü açılır
contextMenu(
  area,
  (e) => {
    const word = e.target.closest("[data-word]")?.dataset.word
    return word
      ? [{ label: word + " kopyala", value: "copy:" + word, icon: "copy" }, { label: "Ara: " + word, value: "search:" + word, icon: "search" }]
      : null
  },
  (value) => log("seçilen:", value)
)`,
  template: `
// Tablo satırları: sadece <tr> üzerinde açılır, satır contextTarget'tadır
html\`
  <div id="orders"><bz-table .columns=\${columns} .rows=\${rows}></bz-table></div>

  <bz-context-menu for="orders" selector="tbody tr"
      @before-open=\${(e) => prepare(rowOf(e.detail.target))}
      @select=\${(e) => run(e.detail.value, rowOf(e.currentTarget.contextTarget))}>
    <bz-menu-item value="edit" icon="edit" shortcut="F2">Düzenle</bz-menu-item>
    <bz-menu-item value="delete" variant="danger" icon="trash">Sil</bz-menu-item>
  </bz-context-menu>
\`

// Programatik
import { contextMenu } from "@bazlama/headless"
const remove = contextMenu(el, (event) => itemsFor(event.target), (value, event) => …)`,
  props: [
    { name: "for", type: "string (id)", desc: "Menünün bağlandığı elemanın id'si. Yoksa üst eleman." },
    { name: "selector", type: "string (CSS)", desc: "Sadece bu seçiciye uyan elemanlarda açılır (ör. \"tbody tr\"); diğer yerlerde tarayıcının menüsü kalır." },
    { name: "disabled", type: "boolean", default: "false", desc: "Kapalıyken tarayıcının menüsü açılır." },
    { name: "label", type: "string", desc: "Menünün erişilebilir adı." },
    { name: "contextTarget", attr: false, type: "Element | null", desc: "Menünün açıldığı eleman (selector eşleşmesi). Salt okunur kullanın." },
  ],
  events: [
    { name: "before-open", detail: "{ target, event }", desc: "Açılmadan önce; öğeleri hedefe göre hazırlayın. preventDefault → açılmaz, tarayıcı menüsü kalır." },
    { name: "select", detail: "{ value, item, checked }", desc: "Öğe seçilince (bz-menu ile aynı)." },
  ],
  api: [
    { name: "contextMenu(el, items | (event) => items | null, onSelect?)", desc: "Programatik context menu; öğeler veri olarak (openMenu ile aynı biçim). Kaldırıcı döner." },
    { name: "onContextRequest(el, ({ anchor, origin, event }) => boolean)", desc: "Alt seviye: sağ tık + menü tuşu + uzun basma isteklerini tek yerden dinler. true dönerse tarayıcı menüsü engellenir." },
  ],
  notes: [
    "İçerik <bz-menu> ile aynıdır: bz-menu-item, bz-menu-separator, bz-menu-group ve alt menü için iç içe bz-menu kullanılır.",
  ],
}

export const menuUsage: UsageSpec = {
  tag: "bz-menu",
  html: `
<bz-menu>
  <bz-button slot="trigger">İşlemler</bz-button>
  <bz-menu-item value="edit" icon="edit" shortcut="F2">Düzenle</bz-menu-item>
  <bz-menu-item value="copy" icon="copy">Kopyala</bz-menu-item>
  <bz-menu-separator></bz-menu-separator>
  <bz-menu>
    <bz-menu-item slot="trigger">Dışa aktar</bz-menu-item>
    <bz-menu-item value="xlsx">Excel</bz-menu-item>
    <bz-menu-item value="pdf">PDF</bz-menu-item>
  </bz-menu>
  <bz-menu-group label="Görünüm">
    <bz-menu-item type="checkbox" value="grid" checked>Izgara</bz-menu-item>
  </bz-menu-group>
  <bz-menu-item value="delete" variant="danger" icon="trash">Sil</bz-menu-item>
</bz-menu>`,
  js: `
const menu = document.createElement("bz-menu")
const trigger = document.createElement("bz-button")
trigger.slot = "trigger"
trigger.textContent = "Sırala"
menu.append(trigger)

for (const [value, label] of [["name", "Ada göre"], ["date", "Tarihe göre"], ["amount", "Tutara göre"]]) {
  const item = document.createElement("bz-menu-item")
  item.setAttribute("type", "radio")
  item.setAttribute("value", value)
  item.textContent = label
  menu.append(item)
}
menu.addEventListener("select", (e) => log("select", e.detail.value))
output.append(menu)

// Programatik: seçilen değeri döner (vazgeçilirse undefined)
const more = document.createElement("bz-button")
more.textContent = "openMenu()"
more.addEventListener("click", async () => {
  const value = await openMenu({
    anchor: more,
    items: [{ label: "Yenile", value: "refresh", icon: "refresh" }, { type: "separator" }, { label: "Ayarlar", value: "settings" }],
  })
  log("openMenu:", value)
})
output.append(" ", more)`,
  template: `
import { contextMenu, openMenu } from "@bazlama/headless"

html\`
  <bz-menu @select=\${(e) => run(e.detail.value)}>
    <bz-button slot="trigger">İşlemler</bz-button>
    \${repeat(actions, (a) => a.id, (a) => html\`
      <bz-menu-item value=\${a.id} icon=\${a.icon} ?disabled=\${() => !can(a)}>\${a.label}</bz-menu-item>\`)}
  </bz-menu>
\`

// Sağ tık: öğeler olaydan üretilir (ör. tıklanan satır); null → tarayıcının menüsü
contextMenu(tableEl, (e) => rowOf(e.target) ? rowItems(rowOf(e.target)) : null, (value) => …)`,
  props: [
    { name: "open", type: "boolean", default: "false", desc: "Açık mı. Yansıtılır." },
    { name: "placement", type: "bottom-start | bottom-end | top-start | right-start …", desc: "Varsayılan bottom-start (alt menüde right-start). Yer yoksa karşı tarafa döner." },
    { name: "label", type: "string", desc: "Menünün erişilebilir adı (varsayılan: trigger metni)." },
  ],
  events: [
    { name: "select", detail: "{ value, item, checked }", desc: "Öğe seçilince (alt menülerden kabarcıklanır). preventDefault menüyü açık tutar." },
    { name: "open / close", detail: "—", desc: "Menü (veya alt menü) açılıp kapanınca; kabarcıklanmaz." },
  ],
  api: [
    { name: '<bz-menu-item value icon shortcut disabled type="item|checkbox|radio" checked name variant>', desc: "Öğe. value yoksa metni. radio: aynı name (veya aynı grup) içinde tek seçim." },
    { name: "<bz-menu-separator> / <bz-menu-group label>", desc: "Ayırıcı ve başlıklı grup." },
    { name: '<bz-menu> içinde <bz-menu> + slot="trigger" öğe', desc: "Alt menü." },
    { name: "menu.show(anchor?) / menu.hide()", desc: "Trigger, bir eleman veya { x, y } noktasında açar." },
    { name: "openMenu({ items, anchor, placement })", desc: "Veriden geçici menü; Promise<value | undefined>. Öğe: { label, value, icon, shortcut, disabled, variant, type, checked, name, children, onSelect }." },
    { name: "contextMenu(el, items | (event) => items | null, onSelect?)", desc: "Sağ tık / menü tuşu. Kaldırıcı fonksiyon döner." },
    { name: "place(anchor, el, { placement, offset, padding, fitHeight })", desc: "Kütüphanesiz konumlandırma (tooltip de bunu kullanır)." },
  ],
  parts: [
    { name: "popup", desc: "role=menu, popover=auto; [data-placement]" },
    { name: "check / icon / label / shortcut / submenu-indicator", desc: "Öğe parçaları" },
    { name: "group-label", desc: "Grup başlığı" },
  ],
  hooks: ["bz-menu-item:focus", '[aria-expanded="true"]', "[aria-haspopup]", '[aria-checked="true"]', '[aria-disabled="true"]', '[variant="danger"]', "--bz-menu-min-width"],
}

export const accordionUsage: UsageSpec = {
  tag: "bz-accordion",
  html: `
<bz-accordion value="kargo">
  <bz-accordion-item value="kargo" heading="Kargo">Aynı gün teslim.</bz-accordion-item>
  <bz-accordion-item value="iade" heading="İade">14 gün içinde.</bz-accordion-item>
  <bz-accordion-item value="fatura" heading="Fatura" disabled>E-fatura.</bz-accordion-item>
</bz-accordion>

<bz-accordion multiple>
  <bz-accordion-item heading="Filtre A" open>A</bz-accordion-item>
  <bz-accordion-item heading="Filtre B" open>B</bz-accordion-item>
</bz-accordion>`,
  js: `
const acc = document.createElement("bz-accordion")
acc.multiple = true
for (const [value, heading, text] of [["a", "Adres", "Merkez, İzmir"], ["b", "Banka", "TR00 0000"], ["c", "İletişim", "0232 000 00 00"]]) {
  const item = document.createElement("bz-accordion-item")
  item.setAttribute("value", value)
  item.heading = heading
  item.textContent = text
  acc.append(item)
}
acc.value = "a,c"
acc.addEventListener("change", (e) => log("change", e.detail.value, e.detail.open))
output.append(acc)`,
  template: `
const section = signal("docs")

html\`
  <bz-accordion fill always-open .value=\${section} @change=\${(e) => section.set(e.detail.value)}>
    <bz-accordion-item value="docs" heading="Satış">\${menuTree}</bz-accordion-item>
    <bz-accordion-item value="params">
      <span slot="header">\${icon("settings")} Parametreler</span>
      <bz-button slot="actions" size="sm" variant="ghost" aria-label="Ekle">+</bz-button>
      …
    </bz-accordion-item>
  </bz-accordion>
\``,
  props: [
    { name: "value", type: "string", desc: "Açık öğenin value'su (multiple ise virgülle liste). value yoksa sırası." },
    { name: "multiple", type: "boolean", default: "false", desc: "Öğeler birbirinden bağımsız açılır. Yansıtılır." },
    { name: "alwaysOpen", type: "boolean", default: "false", desc: "Tekli modda açık öğe kapatılamaz (bir öğe hep açık)." },
    { name: "fill", attr: "fill", type: "boolean (CSS)", desc: "Kabın yüksekliğini doldurur; açık öğe kalanı alır ve kayar." },
  ],
  events: [{ name: "change", detail: "{ value, open: string[] }", desc: "Kullanıcı bir öğeyi açıp kapatınca. Kabarcıklanmaz." }],
  api: [
    { name: "<bz-accordion-item value heading open disabled level>", desc: "Öğe. level: başlık düzeyi (aria-level, varsayılan 3). Accordion dışında tek başına da açılıp kapanır." },
    { name: 'slot="header" / slot="actions"', desc: "Zengin başlık / başlığın yanındaki düğmeler (başlık düğmesinin dışında)." },
    { name: 'hidden="until-found"', desc: "Kapalı içerik Ctrl+F ile aranır; eşleşme bulunca öğe açılır (beforematch). Desteklemeyen tarayıcıda normal hidden." },
  ],
  parts: [
    { name: "heading (role=heading) > trigger > title / indicator", desc: "Başlık ve düğmesi" },
    { name: "actions / content (role=region)", desc: "Başlık eylemleri, içerik" },
  ],
  hooks: ["bz-accordion-item[open]", "[disabled]", "bz-accordion[fill]", "[multiple]", "--bz-accordion-header-bg"],
}

export const tabsUsage: UsageSpec = {
  tag: "bz-tabs",
  html: `
<bz-tabs value="general">
  <bz-tab-list>
    <bz-tab value="general">Genel</bz-tab>
    <bz-tab value="address">Adres</bz-tab>
    <bz-tab value="audit" disabled>Denetim</bz-tab>
  </bz-tab-list>
  <bz-tab-panel value="general">Genel bilgiler</bz-tab-panel>
  <bz-tab-panel value="address">Adres bilgileri</bz-tab-panel>
  <bz-tab-panel value="audit"></bz-tab-panel>
</bz-tabs>

<!-- Kapatılabilir; remove-on-close: bileşen sekmeyi ve panelini kendisi kaldırır -->
<bz-tabs remove-on-close>
  <bz-tab-list>
    <bz-tab value="a" closable>Belge A</bz-tab>
    <bz-tab value="b" closable>Belge B</bz-tab>
  </bz-tab-list>
  <bz-tab-panel value="a">A</bz-tab-panel>
  <bz-tab-panel value="b">B</bz-tab-panel>
</bz-tabs>`,
  js: `
const tabs = document.createElement("bz-tabs")
const list = document.createElement("bz-tab-list")
tabs.append(list)

for (const [value, label] of [["mon", "Pazartesi"], ["tue", "Salı"], ["wed", "Çarşamba"]]) {
  const tab = document.createElement("bz-tab")
  tab.setAttribute("value", value)
  tab.textContent = label
  list.append(tab)

  const panel = document.createElement("bz-tab-panel")
  panel.setAttribute("value", value)
  panel.textContent = label + " vardiya planı"
  tabs.append(panel)
}

tabs.value = "tue"
tabs.addEventListener("change", (e) => log("change", e.detail.value))

// Kapatma: Salı kapatılabilir ama önce sorulur (Promise dönebilir)
tabs.querySelector('bz-tab[value="tue"]').closable = true
tabs.beforeClose = (value) => dialogs.confirm(value + " sekmesi kapatılsın mı?")
tabs.addEventListener("close", (e) => {
  log("close", e.detail.value)
  // Uygulama kaldırır (veya remove-on-close)
  e.detail.tab.remove()
  tabs.querySelector('bz-tab-panel[value="' + e.detail.value + '"]').remove()
})
output.append(tabs)`,
  template: `
const tab = signal("general")
const docs = signal([{ id: "d1", title: "Sipariş #1042" }])

html\`
  <bz-tabs .value=\${tab} @change.self=\${(e) => tab.set(e.detail.value)}
           .beforeClose=\${() => (id) => !isDirty(id) || dialogs.confirm("Kaydedilmedi. Kapatılsın mı?")}
           @close=\${(e) => docs.update((l) => l.filter((d) => d.id !== e.detail.value))}>
    <bz-tab-list>
      <bz-tab value="general">Genel</bz-tab>
      \${repeat(docs, (d) => d.id, (d) => html\`<bz-tab value=\${d.id} closable>\${d.title}</bz-tab>\`)}
    </bz-tab-list>
    <bz-tab-panel value="general">…</bz-tab-panel>
    \${repeat(docs, (d) => d.id, (d) => html\`<bz-tab-panel value=\${d.id}>\${editor(d)}</bz-tab-panel>\`)}
  </bz-tabs>
\``,
  props: [
    { name: "value", type: "string", desc: "Seçili sekmenin value'su (value yoksa sırası: \"0\", \"1\"…). Boş/geçersizse ilk etkin sekme." },
    { name: "activation", type: '"auto" | "manual"', default: '"auto"', desc: "auto: ok tuşları seçer. manual: oklar odağı taşır, Enter/Space seçer." },
    { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', desc: "Ok tuşları ve aria-orientation. Yansıtılır." },
    { name: "variant", type: '"pills"', desc: "Sadece CSS (@bazlama/ui)." },
    { name: "beforeClose", attr: false, type: "(value, tab) => boolean | Promise<boolean>", desc: "Kapatmadan önce sorulur; false (veya false dönen Promise, ör. onay dialogu) sekmeyi tutar." },
    { name: "removeOnClose", type: "boolean", default: "false", desc: "close olayından sonra sekmeyi ve panelini bileşen kaldırır (sadece HTML kullanımı için)." },
  ],
  events: [
    { name: "change", detail: "{ value: string }", desc: "Kullanıcı sekme değiştirince. Kabarcıklanmaz." },
    { name: "before-close", detail: "{ value, tab }", desc: "Kapatmadan önce, iptal edilebilir (preventDefault). Anlık kontroller için; beklemek gerekiyorsa beforeClose." },
    { name: "close", detail: "{ value, tab }", desc: "Kapatma onaylandı; seçim komşu sekmeye geçti. Sekmeyi burada kaldırın (ör. repeat verisinden). Kabarcıklanmaz." },
  ],
  api: [
    { name: "<bz-tab-list>", desc: "Sekme şeridi (role=tablist). Yerine herhangi bir sarmalayıcı da olabilir; sekmelerin ebeveyni role=tablist alır." },
    { name: "<bz-tab value disabled closable close-label>", desc: "Sekme; etiketi içeriğidir. closable: × işareti; ×, orta tık ve Delete kapatır." },
    { name: "tabs.close(value)", desc: "Programatik kapatma; aynı kontrollerden geçer. Promise<boolean>: false = reddedildi." },
    { name: "Kaydırma", desc: "bz-tab-list sığmayınca yatay kayar; taşan uçlarda ‹ › görünür, tekerlek yana kaydırır, seçili sekme görünür alana gelir." },
    { name: "<bz-tab-panel value>", desc: "Panel; seçili değilse hidden. Aynı value'lu sekmeye bağlanır (aria-labelledby/controls)." },
  ],
  hooks: ['bz-tab[aria-selected="true"]', 'bz-tab[aria-disabled="true"]', "bz-tab[closable] > [data-part=close]", "bz-tab-list[data-overflow]", "[data-part=scroll-prev|scroll-next]", "bz-tab-panel[hidden]", "[orientation]", "[variant]"],
  notes: [
    "Paneller DOM'da kalır, sadece gizlenir: form alanları sekme değişince kaybolmaz. İçerik pahalıysa change olayında yükleyin.",
  ],
}

export const toastUsage: UsageSpec = {
  tag: "toast()",
  html: `
<bz-button id="save">Kaydet</bz-button>
<bz-button id="fail">Hata</bz-button>

<script type="module">
  import { toast } from "@bazlama/headless"
  document.getElementById("save").addEventListener("click", () =>
    toast.success("Kayıt güncellendi.", { title: "Kaydedildi" }))
  document.getElementById("fail").addEventListener("click", () =>
    toast.error("Sunucuya ulaşılamadı."))
</script>`,
  preview(root) {
    root.querySelector("#save")!.addEventListener("click", () => toast.success("Kayıt güncellendi.", { title: "Kaydedildi" }))
    root.querySelector("#fail")!.addEventListener("click", () => toast.error("Sunucuya ulaşılamadı."))
  },
  js: `
const b = document.createElement("bz-button")
b.textContent = "Dosya yükle"
b.addEventListener("click", () => {
  const upload = new Promise((resolve) => setTimeout(() => resolve("rapor.pdf"), 1200))
  toast.promise(upload, {
    loading: "Yükleniyor…",
    success: (name) => ({ title: "Yüklendi", message: name }),
    error: "Yükleme başarısız",
  })
})

const d = document.createElement("bz-button")
d.textContent = "Sil"
d.addEventListener("click", () => {
  toast({
    message: "Kayıt silindi.",
    action: { label: "Geri al", onClick: (ref) => { ref.close(); log("geri alındı") } },
  })
})
output.append(b, " ", d)`,
  template: `
import { toast } from "@bazlama/headless"

// Uygulama girişinde bir kez
Object.assign(toast.labels, { close: "Kapat", region: "Bildirimler" })
Object.assign(toast.defaults, { placement: "top-right", duration: 4000 })

async function save() {
  await toast.promise(api.save(form()), {
    loading: "Kaydediliyor…",
    success: "Kaydedildi",
    error: (e) => ({ title: "Kaydedilemedi", message: e.message }),
  })
}

// Aynı id: yeni bildirim yerine günceller
toast({ id: "sync", message: "Eşitleniyor…", loading: true })
toast({ id: "sync", message: "Eşitlendi", variant: "success" })\``,
  props: [
    { name: "message", attr: false, type: "string | Node | html``", desc: "Mesaj." },
    { name: "title", attr: false, type: "string", desc: "Kalın başlık satırı." },
    { name: "variant", attr: false, type: '"info" | "success" | "warning" | "error"', default: '"info"', desc: "error: role=alert ve iki kat süre." },
    { name: "duration", attr: false, type: "number (ms)", default: "5000", desc: "0: kullanıcı kapatana kadar kalır." },
    { name: "action", attr: false, type: "{ label, onClick(ref) }", desc: "Tek eylem butonu (ör. Geri al)." },
    { name: "id", attr: false, type: "string", desc: "Aynı id açıksa yenisi eklenmez, o güncellenir." },
    { name: "placement", attr: false, type: "top|bottom-left|center|right", default: '"bottom-right"', desc: "Konum." },
    { name: "dismissible", attr: false, type: "boolean", default: "true", desc: "Kapat butonu." },
    { name: "loading", attr: false, type: "boolean", desc: "İkon yerine dönen gösterge, süre işlemez." },
  ],
  api: [
    { name: "toast(message | options): ToastRef", desc: "Bildirim gösterir. ToastRef: { id, element, close(), update(options) }." },
    { name: "toast.success / error / warning / info(message, options?)", desc: "Tür kısayolları." },
    { name: "toast.promise(promise, { loading, success, error })", desc: "Yükleniyor → başarı/hata. success/error fonksiyon olabilir. Promise'i geri döner." },
    { name: "toast.dismiss(id?)", desc: "Birini veya hepsini kapatır." },
    { name: "toast.defaults / toast.labels", desc: "{ placement, duration, max } ve { close, region }." },
  ],
  parts: [
    { name: "[data-bz-toaster][data-placement]", desc: "Konum başına kap (section, popover)" },
    { name: "toast", desc: "Bildirim; [data-variant], [data-loading], [data-paused], [data-leaving]" },
    { name: "icon / content / title / message", desc: "İçerik" },
    { name: "action / close / progress", desc: "Butonlar ve kalan süre çubuğu" },
  ],
  hooks: ["--bz-toast-width", "--bz-color-success", "--bz-color-warning"],
}

export const tooltipUsage: UsageSpec = {
  tag: "data-tooltip",
  html: `
<bz-button data-tooltip="Kaydet (Ctrl+S)">Kaydet</bz-button>
<bz-button data-tooltip="Altta açılır" data-tooltip-placement="bottom">Alt</bz-button>
<span tabindex="0" data-tooltip="Klavyeyle odaklanınca da görünür">Odaklanabilir metin</span>`,
  js: `
// Zengin içerik: tooltip(el, içerik, seçenekler) — içerik node veya html\`\` olabilir
const info = document.createElement("bz-button")
info.textContent = "Stok"
const box = document.createElement("div")
box.innerHTML = "<b>Merkez depo</b>: 24<br><b>Şube</b>: 3"
const remove = tooltip(info, box, { placement: "right" })

const off = document.createElement("bz-button")
off.textContent = "Tooltip'i kaldır"
off.addEventListener("click", () => { remove(); log("kaldırıldı") })

output.append(info, " ", off)`,
  template: `
import { icon, tooltip } from "@bazlama/headless"

html\`
  <!-- İkon butonu: ad aria-label'dan, açıklama tooltip'ten -->
  <bz-button variant="ghost" aria-label="Sil" data-tooltip="Sil (Del)">\${icon("trash")}</bz-button>

  <!-- Değişen metin: öznitelik bağlama -->
  <span data-tooltip=\${() => \`Son eşitleme: \${lastSync()}\`}>\${icon("refresh")}</span>

  <!-- Zengin içerik -->
  <span ref=\${(el) => tooltip(el, html\`<b>Limit</b><br>42.000 ₺\`)}>%42</span>
\``,
  props: [
    { name: "data-tooltip", attr: "data-tooltip", type: "string", desc: "Tooltip metni. Herhangi bir elemana eklenebilir." },
    { name: "data-tooltip-placement", attr: "data-tooltip-placement", type: '"top" | "bottom" | "left" | "right"', default: '"top"', desc: "Tercih edilen yön; sığmazsa karşı tarafa döner." },
  ],
  api: [
    { name: "tooltip(el, content, { placement }?)", desc: "Programatik/zengin tooltip. Kaldırmak için dönen fonksiyonu çağırın veya content olarak null verin." },
    { name: "tooltipDefaults", desc: "{ delay: 500, hideDelay: 100, warmFor: 400, offset: 8 }" },
    { name: "activeTooltip()", desc: "Tooltip'i gösterilen eleman (test ve hata ayıklama)." },
  ],
  parts: [{ name: "[data-bz-tooltip]", desc: "Paylaşılan balon (role=tooltip, popover); [data-placement], [data-open]" }],
  hooks: ["--bz-tooltip-bg", "--bz-tooltip-fg", "--bz-tooltip-max-width"],
  notes: [
    "Tooltip sadece açıklamadır (aria-describedby): ikon butonlarına ayrıca aria-label verin. Dokunmatik ekranda gösterilmez; kritik bilgiyi sadece tooltip'e koymayın.",
  ],
}
