import type { UsageSpec } from "./usage"

// "Kullanım" content of the Card page (see usage.ts).

export const cardUsage: UsageSpec = {
  tag: "bz-card · bz-card-group · bz-card-list",
  html: `
<bz-card-list label="Uygulamalar" min-card-width="15rem">
  <bz-card-group heading="Uygulamalar">
    <bz-card heading="Satış" icon="chart" href="#satis"
      meta="12 bekleyen iş" meta-variant="danger" indicator="danger" indicator-label="Bekleyen iş var"></bz-card>
    <bz-card heading="Müşteriler" icon="users" href="#musteriler"></bz-card>
    <bz-card heading="Faturalar" icon="file-text" hue="205" href="#faturalar" meta="5 bekleyen iş" meta-variant="danger"></bz-card>
  </bz-card-group>
  <bz-card-group heading="Ayarlar">
    <bz-card heading="Ayarlar" icon="settings" description="Şirket geneli ayarlar" href="#ayarlar"></bz-card>
  </bz-card-group>
</bz-card-list>`,
  js: `
const list = document.createElement("bz-card-list")
list.label = "Modüller"
for (const [heading, iconName, pending] of [["Satış", "chart", 12], ["Müşteriler", "users", 0], ["Faturalar", "file-text", 5]]) {
  const card = document.createElement("bz-card")
  card.heading = heading
  card.icon = iconName
  card.clickable = true
  if (pending) {
    card.meta = pending + " bekleyen iş"
    card.metaVariant = "danger"
    card.indicator = "danger"
  }
  card.addEventListener("activate", () => log("activate", heading))
  list.append(card)
}
const search = document.createElement("bz-input")
search.placeholder = "Filtrele…"
search.addEventListener("input", () => (list.filter = search.value))
output.append(search, list)`,
  template: `
html\`
  <bz-input placeholder="Uygulama ara…" .value=\${query} @input=\${(e) => query.set(e.currentTarget.value)}></bz-input>
  <bz-card-list .filter=\${query} .view=\${view} label="Uygulamalar">
    \${groups.map((g) => html\`<bz-card-group heading=\${g.title}>
      \${g.apps.map((a) => html\`<bz-card heading=\${a.title} icon=\${a.icon} hue=\${a.hue} href=\${router.href(a.path)}
        meta=\${a.pending ? a.pending + " bekleyen iş" : ""} meta-variant="danger" indicator=\${a.pending ? "danger" : ""}>
        <bz-button slot="actions" size="sm" variant="ghost" aria-label="Favori" @click=\${() => star(a)}>★</bz-button>
      </bz-card>\`)}
    </bz-card-group>\`)}
    <div slot="empty">Eşleşen uygulama yok.</div>
  </bz-card-list>
\``,
  props: [
    { name: "heading / description", attr: "heading, description", type: "string", desc: "bz-card: başlık (heading rolü, level 3) ve açıklama." },
    { name: "icon / hue", attr: "icon, hue", type: "string / number", desc: "bz-card: ikon ve ikon kutusunun tonu (0–360). hue yoksa başlıktan türetilir: her kartın kalıcı bir rengi olur. slot=\"media\" ile özel görsel." },
    { name: "href / target", attr: "href, target", type: "string", desc: "bz-card: tüm kart bağlantı olur (başlıktan uzatılmış bağlantı; adı başlıktır)." },
    { name: "clickable / disabled", attr: "clickable, disabled", type: "boolean", desc: "bz-card: bağlantı yoksa kart düğmedir (Enter/Space); disabled tıklanmaz." },
    { name: "meta / metaVariant", attr: "meta, meta-variant", type: 'string / "danger" | "warning" | "success" | "info" | "primary"', desc: "bz-card: durum satırı (ör. \"18 bekleyen iş\") ve rengi." },
    { name: "indicator / indicatorLabel", attr: "indicator, indicator-label", type: "string", desc: "bz-card: köşede nokta (ton adı); ekran okuyucu için etiket." },
    { name: "layout / level / keywords", attr: "layout, level, keywords", type: '"row" | "column" / number / string', desc: "bz-card: yerleşim; başlık seviyesi; filtrenin ek olarak aradığı kelimeler." },
    { name: "view / minCardWidth", attr: "view, min-card-width", type: '"grid" | "list" / string (CSS)', default: '"grid" / "16rem"', desc: "bz-card-list: ızgara (sığan kadar sütun) veya liste. Yansıtılır." },
    { name: "filter / label", attr: "filter, label", type: "string", desc: "bz-card-list: metin filtresi (aksan ve büyük/küçük harf duyarsız); erişilebilir ad." },
    { name: "heading / open / collapsible", attr: "heading, open, collapsible", type: "string / boolean", default: "— / true / true", desc: "bz-card-group: başlık, açık mı, daraltılabilir mi. Başlıkta görünür kart sayısı." },
  ],
  events: [
    { name: "activate (bz-card)", detail: "{ card }", desc: "Kart (href veya clickable) tıklanınca / Enter. Kabarcıklanır; bağlantı yine gezinir." },
    { name: "filter (bz-card-list)", detail: "{ visible }", desc: "Filtre sonrası görünen kart sayısı değişince. Kabarcıklanmaz." },
    { name: "toggle (bz-card-group)", detail: "{ open }", desc: "Grup açılıp kapanınca. Kabarcıklanmaz." },
  ],
  slots: [
    { name: "bz-card: media / (varsayılan) / actions / footer", desc: "Görsel; ek içerik; bağlantıdan ayrı düğmeler (sağ üst); alt kısım" },
    { name: "bz-card-group: (varsayılan) / actions", desc: "Kartlar; başlığın sağı" },
    { name: "bz-card-list: (varsayılan) / empty", desc: "Kartlar ve gruplar; eşleşme yokken" },
  ],
  parts: [
    { name: "bz-card: media / body / heading / link / description / meta / indicator / actions / footer", desc: "Kart" },
    { name: "bz-card-group: header / toggle / heading / count / cards", desc: "Grup" },
  ],
  hooks: ["bz-card[layout]", "[meta-variant]", "[indicator]", "[clickable]", "[disabled]", "bz-card-list[view]", "bz-card-group[open]", "--bz-card-hue", "--bz-card-bg", "--bz-card-media-size", "--bz-card-min-width", "--bz-card-gap"],
  notes: [
    "Liste tek sekme durağıdır: ←/→ önceki/sonraki kart, ↑/↓ konuma göre üst/alt satırdaki kart (sarmayı izler), Home/End. Liste görünümünde ↑/↓ sıradaki kart.",
    "İkon rengi açık ve koyu temada okunur kalacak şekilde yüzey ve metin rengiyle karıştırılır.",
  ],
}
