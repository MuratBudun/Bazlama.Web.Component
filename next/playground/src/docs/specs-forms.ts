import type { UsageSpec } from "./usage"

// "Kullanım" content of the form control and layout pages (see usage.ts).

const formFieldProps = [
  { name: "name", type: "string", desc: "Form alan adı (içteki native input taşır)." },
  { name: "label", type: "string", desc: "Etiket; boşsa içerik (slot) etiket olur." },
  { name: "hint", type: "string", desc: "Yardım metni (aria-describedby)." },
  { name: "required", type: "boolean", default: "false", desc: "Native doğrulama; hata dokunduktan / gönderme denemesinden sonra görünür." },
  { name: "disabled", type: "boolean", default: "false", desc: "Yansıtılır." },
  { name: "error", type: "string", desc: "Özel hata mesajı; dolu ise alan geçersiz." },
]

export const checkboxUsage: UsageSpec = {
  tag: "bz-checkbox",
  html: `
<form>
  <bz-checkbox name="terms" value="yes" required>Kullanım koşullarını kabul ediyorum</bz-checkbox>
  <bz-checkbox name="copy" checked hint="Onaylayan kişilere e-posta gider.">Bana da kopya gönder</bz-checkbox>
  <bz-checkbox indeterminate>Tümü (kısmi seçim)</bz-checkbox>
  <bz-checkbox checked readonly>Salt okunur</bz-checkbox>
  <bz-checkbox disabled>Devre dışı</bz-checkbox>
</form>`,
  js: `
const all = document.createElement("bz-checkbox")
all.label = "Tüm bölümler"
const items = ["Kalite", "Üretim", "Depo"].map((name) => {
  const cb = document.createElement("bz-checkbox")
  cb.label = name
  cb.addEventListener("change", sync)
  return cb
})
function sync() {
  const n = items.filter((i) => i.checked).length
  all.checked = n === items.length
  all.indeterminate = n > 0 && n < items.length
}
all.addEventListener("change", (e) => {
  items.forEach((i) => (i.checked = e.detail.checked))
  log("change", e.detail)
})
const box = document.createElement("div")
box.style.paddingInlineStart = "1.5rem"
box.append(...items)
output.append(all, box)`,
  template: `
html\`
  <bz-checkbox name="copy" .checked=\${copy}
    @change=\${(e) => copy.set(e.detail.checked)}>Bana da kopya gönder</bz-checkbox>

  <bz-checkbox .checked=\${allOn} .indeterminate=\${someOn}
    @change=\${(e) => setAll(e.detail.checked)}>Tümü</bz-checkbox>
\``,
  props: [
    { name: "checked", type: "boolean", default: "false", desc: "İşaretli mi. Özellik ile kontrol edilir; attribute başlangıç (reset) değeridir." },
    { name: "indeterminate", type: "boolean", default: "false", desc: "Kısmi seçim (−). Tıklanınca temizlenir. Yansıtılır." },
    { name: "value", type: "string", default: '"on"', desc: "İşaretliyken gönderilen değer." },
    { name: "readonly", type: "boolean", default: "false", desc: "Değer değişmez (native checkbox'ta readonly yok, bileşen sağlar)." },
    ...formFieldProps,
  ],
  events: [{ name: "change", detail: "{ checked, value }", desc: "Kullanıcı değiştirince. Kabarcıklanır (form alanı gibi); içteki native change dışarı çıkmaz." }],
  slots: [{ name: "(varsayılan)", desc: "Etiket (label özelliği yoksa)" }],
  parts: [{ name: "field / input / label / hint / error", desc: "input: native checkbox (appearance: none, işaret ::before)" }],
  hooks: ["[data-checked]", "[indeterminate]", "[readonly]", "[disabled]", "[data-invalid]"],
  notes: ["Form, doğrulama, reset ve Space tuşu native input'tan gelir."],
}

export const switchUsage: UsageSpec = {
  tag: "bz-switch",
  html: `
<bz-switch checked>E-posta bildirimleri</bz-switch>
<bz-switch hint="Değişiklik hemen uygulanır.">Karanlık tema</bz-switch>
<bz-switch disabled>Devre dışı</bz-switch>`,
  js: `
const sw = document.createElement("bz-switch")
sw.label = "Otomatik kaydet"
sw.addEventListener("change", (e) => {
  log("change", e.detail)
  status.textContent = e.detail.checked ? "Açık" : "Kapalı"
})
const status = document.createElement("span")
status.textContent = "Kapalı"
output.append(sw, status)`,
  template: `
html\`
  <bz-switch .checked=\${autosave} @change=\${(e) => autosave.set(e.detail.checked)}>
    Otomatik kaydet
  </bz-switch>
\``,
  props: [
    { name: "checked", type: "boolean", default: "false", desc: "Açık mı." },
    { name: "value", type: "string", default: '"on"', desc: "Açıkken gönderilen değer." },
    { name: "readonly", type: "boolean", default: "false", desc: "Değer değişmez." },
    ...formFieldProps,
  ],
  events: [{ name: "change", detail: "{ checked, value }", desc: "Kullanıcı değiştirince. Kabarcıklanır." }],
  parts: [{ name: "field / input / label / hint / error", desc: "input: role=switch olan native checkbox (iz + düğme)" }],
  hooks: ["[data-checked]", "[readonly]", "[disabled]"],
  notes: ["Checkbox'tan farkı: anında uygulanan açık/kapalı ayar (role=switch). Formda 'kabul ediyorum' gibi seçimler için bz-checkbox."],
}

export const radioUsage: UsageSpec = {
  tag: "bz-radio-group · bz-radio",
  html: `
<bz-radio-group label="Doküman türü" name="kind" value="form" required>
  <bz-radio value="form">Form</bz-radio>
  <bz-radio value="proc" hint="Süreç tanımı">Prosedür</bz-radio>
  <bz-radio value="inst">Talimat</bz-radio>
  <bz-radio value="ext" disabled>Dış kaynaklı</bz-radio>
</bz-radio-group>

<bz-radio-group label="Öncelik" orientation="horizontal" value="normal">
  <bz-radio value="low">Düşük</bz-radio>
  <bz-radio value="normal">Normal</bz-radio>
  <bz-radio value="high">Yüksek</bz-radio>
</bz-radio-group>`,
  js: `
const group = document.createElement("bz-radio-group")
group.label = "Görünüm"
group.orientation = "horizontal"
for (const [value, label] of [["list", "Liste"], ["grid", "Izgara"], ["tree", "Ağaç"]]) {
  const r = document.createElement("bz-radio")
  r.value = value
  r.textContent = label
  group.append(r)
}
group.value = "list"
group.addEventListener("change", (e) => log("change", e.detail))
output.append(group)`,
  template: `
html\`
  <bz-radio-group label="Öncelik" orientation="horizontal" .value=\${priority}
    @change=\${(e) => priority.set(e.detail.value)}>
    \${PRIORITIES.map((p) => html\`<bz-radio value=\${p.id}>\${p.label}</bz-radio>\`)}
  </bz-radio-group>
\``,
  props: [
    { name: "value", type: "string", desc: "bz-radio-group: seçili radyonun değeri." },
    { name: "name", type: "string", desc: "bz-radio-group: form adı (varsayılan benzersiz id; göndermek için verin)." },
    { name: "orientation", type: '"vertical" | "horizontal"', default: '"vertical"', desc: "bz-radio-group: dizilim. Yansıtılır." },
    { name: "label / hint / required / disabled / error", attr: "label, hint, required, disabled, error", type: "string / boolean", desc: "bz-radio-group: grup etiketi (aria-labelledby), yardım, doğrulama, tümünü kapat." },
    { name: "value / label / hint / disabled", attr: "value, label, hint, disabled", type: "string / boolean", desc: "bz-radio: seçenek değeri, etiketi (veya içerik), yardım metni, devre dışı." },
  ],
  events: [{ name: "change (bz-radio-group)", detail: "{ value }", desc: "Kullanıcı seçince. Kabarcıklanır." }],
  parts: [
    { name: "bz-radio-group: label / items / hint / error", desc: "Grup parçaları (role=radiogroup)" },
    { name: "bz-radio: field / input / label / hint", desc: "Seçenek parçaları" },
  ],
  hooks: ["bz-radio-group[orientation]", "[disabled]", "[data-invalid]", "bz-radio[data-checked]"],
  notes: ["Ok tuşları ve tek sekme durağı native radio davranışıdır (aynı name): ek JavaScript yok."],
}

export const textareaUsage: UsageSpec = {
  tag: "bz-textarea",
  html: `
<bz-textarea label="Açıklama" name="desc" rows="3" placeholder="Kısa açıklama…"></bz-textarea>
<bz-textarea label="Notlar" autosize max-rows="8" show-count maxlength="500"
  hint="Yazdıkça büyür (en fazla 8 satır)."></bz-textarea>
<bz-textarea label="Değişiklik gerekçesi" expandable required rows="2"
  hint="Sağ üstteki düğme veya Ctrl+Shift+Enter büyük editörde açar."></bz-textarea>`,
  js: `
const t = document.createElement("bz-textarea")
t.label = "Görüş"
t.expandable = true
t.autosize = true
t.showCount = true
t.maxlength = 1000
t.labels = { expand: "Genişlet", apply: "Uygula", cancel: "Vazgeç", close: "Kapat" }
t.addEventListener("change", () => log("change", t.value.length + " karakter"))
output.append(t)`,
  template: `
html\`
  <bz-textarea label="Not" autosize max-rows="10" expandable show-count maxlength="2000"
    .value=\${note} @input=\${(e) => note.set(e.currentTarget.value)}
    .labels=\${{ expand: "Genişlet", apply: "Uygula", cancel: "Vazgeç", close: "Kapat" }}>
  </bz-textarea>
\``,
  props: [
    { name: "value", type: "string", desc: "Metin." },
    { name: "rows / maxRows", attr: "rows, max-rows", type: "number", default: "3 / 0", desc: "En az satır; autosize'da en çok satır (0: sınırsız)." },
    { name: "autosize", type: "boolean", default: "false", desc: "İçerikle büyür: CSS field-sizing: content, desteklenmezse scrollHeight ölçümü." },
    { name: "showCount", attr: "show-count", type: "boolean", default: "false", desc: "Karakter sayacı (\"n / maxlength\")." },
    { name: "expandable", type: "boolean", default: "false", desc: "Büyük editör: düğme veya Ctrl+Shift+Enter dialogda açar; Uygula geri yazar ve input + change olayı verir. Salt okunurda sadece okuma." },
    { name: "expandHeading", attr: "expand-heading", type: "string", desc: "Editör başlığı (varsayılan: etiket)." },
    { name: "placeholder / minlength / maxlength / readonly", attr: "placeholder, minlength, maxlength, readonly", type: "string / number / boolean", desc: "Native textarea'ya geçer." },
    { name: "labels", attr: false, type: "Partial<TextareaLabels>", desc: "{ expand, apply, cancel, close } metinleri." },
    ...formFieldProps.filter((p) => p.name !== "label"),
    { name: "label", type: "string", desc: "Etiket." },
  ],
  events: [
    { name: "input / change", detail: "native", desc: "İçteki textarea'dan (e.currentTarget.value). Editörde Uygula da ikisini de verir." },
  ],
  parts: [{ name: "label / control / input / expand / footer / hint / count / error", desc: "Parçalar; editör dialogu: bz-dialog[data-textarea-editor] [data-part=editor]" }],
  hooks: ["[autosize]", "[expandable]", "[resize=\"none|vertical|both\"]", "[readonly]", "[disabled]", "[data-invalid]", "--bz-textarea-rows"],
  notes: ["Ctrl+Enter editörde Uygula'dır; Escape vazgeçer."],
}

export const lookupUsage: UsageSpec = {
  tag: "bz-lookup",
  html: `
<bz-lookup id="dept" label="Hazırlayan Bölüm" name="dept" required clearable
  selection="leaf" placeholder="Seçmek için Enter / F4"></bz-lookup>
<script>
  dept.items = [
    { id: "gm", label: "Genel Müdürlük", children: [
      { id: "kk", label: "Kalite Kontrol Müdürlüğü" },
      { id: "ur", label: "Üretim Müdürlüğü" },
    ] },
  ]
</script>`,
  preview: (root) => {
    const el = root.querySelector("bz-lookup") as HTMLElement & { items: unknown }
    el.items = [
      {
        id: "gm",
        label: "Genel Müdürlük",
        children: [
          { id: "kk", label: "Kalite Kontrol Müdürlüğü" },
          { id: "ur", label: "Üretim Müdürlüğü" },
        ],
      },
    ]
  },
  js: `
const doc = document.createElement("bz-lookup")
doc.label = "İlişkili doküman"
doc.clearable = true
doc.columns = [{ key: "no", header: "Doküman No" }, { key: "name", header: "Adı" }]
doc.rows = [
  { id: 8, no: "FRM-008", name: "Doküman Formu" },
  { id: 7, no: "FRM-007", name: "Değişiklik İsteği" },
  { id: 1, no: "PRS-001", name: "Doküman Kontrol Prosedürü" },
]
doc.displayKey = "no"
doc.labels = { select: "Seç", clear: "Temizle", search: "Ara", ok: "Seç", cancel: "Vazgeç", empty: "Sonuç yok" }
doc.addEventListener("change", (e) => log("change", e.detail.value, e.detail.text))
output.append(doc)`,
  template: `
html\`
  <bz-lookup label="Doküman Sahibi Bölüm" required .items=\${DEPARTMENTS} selection="leaf"
    .value=\${ownerDept} @change=\${(e) => ownerDept.set(e.detail.value)}></bz-lookup>

  <bz-lookup label="Personel" .pick=\${async () => {
    const user = await openUserSearch()        // kendi seçicin
    return user && { value: user.id, text: user.name }
  }}></bz-lookup>
\``,
  props: [
    { name: "value / text", attr: "value, text", type: "string", desc: "Seçilen anahtar (formda gönderilir) ve gösterilen metin (verilmezse items/rows'tan bulunur)." },
    { name: "items / selection", attr: "—, selection", type: 'TreeItem[] / "single" | "leaf"', desc: "Ağaç seçici (filtre kutulu). leaf: sadece yaprak seçilir." },
    { name: "columns / rows / rowKey / displayKey", attr: "—, —, row-key, display-key", type: "Column[] / Row[] / string", desc: "Tablo seçici (arama kutulu). Değer rowKey, metin displayKey (varsayılan ilk sütun)." },
    { name: "pick", attr: false, type: "(host) => Promise<{ value, text, item? } | undefined>", desc: "Özel seçici; varsa önceliklidir." },
    { name: "clearable", type: "boolean", default: "false", desc: "× düğmesi; Delete/Backspace temizler." },
    { name: "heading / dialogSize", attr: "heading, dialog-size", type: "string", default: '— / "md"', desc: "Dialog başlığı (varsayılan etiket) ve boyutu." },
    { name: "readonly / placeholder", attr: "readonly, placeholder", type: "boolean / string", desc: "Salt okunur: seçici açılmaz." },
    { name: "labels", attr: false, type: "Partial<LookupLabels>", desc: "{ select, clear, search, ok, cancel, empty, required }." },
    ...formFieldProps.filter((p) => !["name", "error"].includes(p.name)),
    { name: "name", type: "string", desc: "Form adı (form-associated: ElementInternals)." },
  ],
  events: [{ name: "change", detail: "{ value, text, item }", desc: "Seçim veya temizleme sonrası. Kabarcıklanır." }],
  slots: [{ name: "prefix", desc: "Alanın başı (ikon)" }],
  parts: [
    { name: "label / control / input / clear / trigger / hint / error", desc: "Alan" },
    { name: "picker / search / tree / table", desc: "Seçici dialogu: bz-dialog[data-lookup-picker]" },
  ],
  hooks: ["[disabled]", "[readonly]", "[data-invalid]", "[data-empty]"],
  notes: ["Açma: tetikleyici, Enter, F4, Alt+↓ veya çift tık. Seçicide arama kutusundan ↓ listeye geçer; tabloda tek sonuç kalınca Enter seçer."],
}

export const paginationUsage: UsageSpec = {
  tag: "bz-pagination",
  html: `
<bz-pagination total="195" page="5" page-size="10" show-info></bz-pagination>

<bz-pagination total="195" page="5" variant="compact" show-info></bz-pagination>`,
  js: `
const p = document.createElement("bz-pagination")
p.total = 1234
p.pageSize = 25
p.pageSizes = [10, 25, 50, 100]
p.showInfo = true
p.edges = true
p.labels = {
  nav: "Sayfalama", first: "İlk sayfa", previous: "Önceki sayfa", next: "Sonraki sayfa", last: "Son sayfa",
  page: (n) => "Sayfa " + n, pageSize: "Sayfa başına",
  info: (a, b, t) => a + "–" + b + " / " + t, empty: "Kayıt yok",
}
p.addEventListener("change", (e) => log("change", e.detail))
output.append(p)`,
  template: `
html\`
  <bz-pagination variant="compact" show-info .total=\${() => filtered().length}
    .page=\${page} .pageSize=\${size} .pageSizes=\${[10, 25, 50]}
    @change=\${(e) => (page.set(e.detail.page), size.set(e.detail.pageSize))}>
    <bz-button size="sm" variant="ghost" aria-label="Yenile" @click=\${reload}>\${icon("refresh")}</bz-button>
  </bz-pagination>
\``,
  props: [
    { name: "page", type: "number", default: "1", desc: "Geçerli sayfa (1'den). Son sayfayı aşarsa kısılır (change ile)." },
    { name: "total / pageSize", attr: "total, page-size", type: "number", default: "0 / 10", desc: "Kayıt sayısı ve sayfa boyu; sayfa sayısı bunlardan." },
    { name: "variant", type: '"numbers" | "compact"', default: '"numbers"', desc: "numbers: ‹ 1 … 4 [5] 6 … 20 ›; compact: « ‹ Sayfa [5] / 20 › ». Yansıtılır." },
    { name: "siblings / boundaries", type: "number", default: "1 / 1", desc: "numbers: geçerli sayfanın yanında ve uçlarda gösterilen sayfa sayısı." },
    { name: "edges", type: "boolean", default: "false", desc: "numbers: ilk/son düğmeleri (compact'ta hep var)." },
    { name: "pageSizes", attr: false, type: "number[]", default: "[]", desc: "Sayfa boyu seçimi; değişince ilk görünen satır ekranda kalır." },
    { name: "showInfo", attr: "show-info", type: "boolean", default: "false", desc: "\"21–30 / 195\" metni (aria-live)." },
    { name: "disabled", type: "boolean", default: "false", desc: "Tüm kontroller kapalı." },
    { name: "labels", attr: false, type: "Partial<PaginationLabels>", desc: "Metinler; page, of, info fonksiyondur." },
  ],
  events: [{ name: "change", detail: "{ page, pageSize }", desc: "Kullanıcı sayfa/boyut değiştirince veya kısılınca. Kabarcıklanmaz." }],
  api: [{ name: "pageItems(page, count, siblings?, boundaries?)", desc: "Sayfa penceresi hesabı ([1, \"gap\", 4, 5, 6, \"gap\", 20]); kendi görünümün için." }],
  slots: [{ name: "(varsayılan)", desc: "Kontrollerle bilgi metni arasına (ör. yenile düğmesi)" }],
  parts: [{ name: "first / previous / page / gap / next / last / page-input / of / size / info", desc: "Parçalar" }],
  hooks: ["[variant]", "[disabled]", "[aria-current=\"page\"]"],
  notes: ["Host role=navigation. Sayfa düğmeleri sabit sayıda yuvada yeniden kullanılır: tıklanan düğmede odak kalır."],
}

export const toolbarUsage: UsageSpec = {
  tag: "bz-toolbar",
  html: `
<bz-toolbar label="Doküman işlemleri">
  <bz-button size="sm" variant="ghost">Yenile</bz-button>
  <bz-button size="sm" variant="ghost">Görüntüle</bz-button>
  <bz-button size="sm" variant="ghost" disabled>Sil</bz-button>
  <bz-toolbar-separator></bz-toolbar-separator>
  <bz-button size="sm" variant="ghost" pressed="false">Favori</bz-button>
  <bz-toolbar-spacer></bz-toolbar-spacer>
  <bz-input placeholder="Ara…"></bz-input>
  <bz-button size="sm" variant="ghost">Excel</bz-button>
</bz-toolbar>`,
  js: `
const tb = document.createElement("bz-toolbar")
tb.label = "Biçim"
for (const name of ["Kalın", "İtalik", "Altı çizili"]) {
  const b = document.createElement("bz-button")
  b.setAttribute("size", "sm")
  b.setAttribute("variant", "ghost")
  b.pressed = "false"
  b.textContent = name
  b.addEventListener("click", () => log(name, b.pressed))
  tb.append(b)
}
output.append(tb)`,
  template: `
html\`
  <bz-toolbar label="Form">
    <bz-button size="sm" variant="primary" @click=\${save}>Kaydet</bz-button>
    <bz-menu>
      <bz-button slot="trigger" size="sm" variant="ghost">Araçlar ▾</bz-button>
      <bz-menu-item value="history">Tarihçe</bz-menu-item>
    </bz-menu>
    <bz-toolbar-spacer></bz-toolbar-spacer>
    <bz-button size="sm" variant="ghost" @click=\${close}>Kapat</bz-button>
  </bz-toolbar>
\``,
  props: [
    { name: "label", type: "string", desc: "Erişilebilir ad (aria-label); birden çok araç çubuğunda gerekli." },
    { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', desc: "Ok tuşu yönü ve dizilim. Yansıtılır." },
    { name: "wrap", type: "boolean (CSS)", desc: "Sığmayınca alt satıra geçer." },
  ],
  slots: [
    { name: "(varsayılan)", desc: "Kontroller; <bz-toolbar-separator>, <bz-toolbar-spacer>, <div role=\"group\" aria-label>" },
  ],
  hooks: ["[orientation]", "[wrap]", "--bz-toolbar-gap"],
  notes: [
    "Tek sekme durağı: ←/→ (dikeyde ↑/↓) gezinir ve başa sarar, Home/End uçlara gider; Tab çubuktan çıkar, dönünce son kullanılan kontrole gelir.",
    "Metin alanları ok tuşlarını kendisi kullanır; menü öğeleri ve iç içe araç çubukları öğe sayılmaz; devre dışı kontroller atlanır.",
  ],
}

export const formLayoutUsage: UsageSpec = {
  tag: "bz-form-layout",
  html: `
<form>
  <bz-form-layout columns="3" min-column-width="12rem">
    <bz-input label="Doküman No" value="FRM-008" readonly></bz-input>
    <bz-input label="Revizyon" value="0" readonly></bz-input>
    <bz-input label="Tarih" type="date"></bz-input>
    <bz-input label="Dokümanın Adı" required data-span="2"></bz-input>
    <bz-combobox label="Tür"><bz-option>Form</bz-option><bz-option>Prosedür</bz-option></bz-combobox>

    <bz-form-section heading="Dağıtım" description="Yürürlüğe girince bilgilendirilecekler">
      <bz-switch>Elektronik dağıtım</bz-switch>
      <bz-checkbox>Basılı kopya</bz-checkbox>
      <bz-textarea label="Not" data-span="full" rows="2"></bz-textarea>
    </bz-form-section>

    <bz-form-actions>
      <bz-button type="reset">Vazgeç</bz-button>
      <bz-button type="submit" variant="primary">Kaydet</bz-button>
    </bz-form-actions>
  </bz-form-layout>
</form>`,
  js: `
const layout = document.createElement("bz-form-layout")
layout.columns = 2
layout.labelPosition = "start"
layout.labelWidth = "8rem"
for (const [label, span] of [["Ad", ""], ["Soyad", ""], ["Adres", "full"]]) {
  const f = document.createElement("bz-input")
  f.label = label
  if (span) f.dataset.span = span
  layout.append(f)
}
output.append(layout)
log("sütun", layout.getAttribute("data-columns"))`,
  template: `
html\`
  <bz-form-layout columns="4" label-position=\${() => (wide() ? "start" : "top")}>
    <bz-input label="Adı" data-span="2" .value=\${name}></bz-input>
    <bz-lookup label="Bölüm" data-span="2" .items=\${DEPARTMENTS}></bz-lookup>
    <bz-form-section heading="Ekler">…</bz-form-section>
    <bz-form-actions><bz-button variant="primary" type="submit">Kaydet</bz-button></bz-form-actions>
  </bz-form-layout>
\``,
  props: [
    { name: "columns", type: "number", default: "2", desc: "En çok sütun sayısı." },
    { name: "minColumnWidth", attr: "min-column-width", type: "string (CSS)", default: '"14rem"', desc: "Sütun bundan daralacaksa sütun sayısı azalır (telefonda tek sütun)." },
    { name: "labelPosition", attr: "label-position", type: '"top" | "start"', default: '"top"', desc: "start: etiket alanın solunda (tek sütunda yine üstte). Yansıtılır." },
    { name: "labelWidth", attr: "label-width", type: "string (CSS)", default: '"10rem"', desc: "start'ta etiket sütunu genişliği." },
    { name: "data-span (çocuk)", attr: "data-span", type: '"2" | "3" | … | "full"', desc: "Çocuğun kapladığı sütun; o an sığan sütun sayısına kısılır." },
    { name: "bz-form-section: heading / description / level", attr: "heading, description, level", type: "string / number", desc: "Başlıklı alan grubu (role=group), aynı sütunlarda (subgrid). slot=\"actions\" başlığın sağına." },
    { name: "bz-form-actions: align", attr: "align", type: '"end" | "start" | "between"', default: '"end"', desc: "Düğme satırı (tam genişlik)." },
  ],
  parts: [{ name: "bz-form-section: header / heading / description", desc: "Bölüm başlığı" }],
  hooks: ["[label-position]", "[data-columns] (o anki sütun sayısı)", "--bz-form-gap", "--bz-form-row-gap"],
  notes: ["Düzen CSS grid (auto-fill + minmax); JS sadece o anki sütun sayısını ölçüp span'leri kısar."],
}
