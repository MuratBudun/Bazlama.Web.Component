import type { UsageSpec } from "./usage"

// "Kullanım" content of the Alert and Badge / Chip pages (see usage.ts).

export const alertUsage: UsageSpec = {
  tag: "bz-alert",
  html: `
<bz-alert variant="info" heading="Bilgi">Bu teklif 20.07.2029 tarihine kadar geçerli.</bz-alert>
<bz-alert variant="success">Kayıt güncellendi.</bz-alert>
<bz-alert variant="warning" heading="Bekleyen işler" dismissible>
  Bu sayfada 7 günden uzun süredir bekleyen 18 iş var.
  <bz-button slot="actions" size="sm">Listeyi aç</bz-button>
</bz-alert>
<bz-alert variant="danger" heading="Kaydedilemedi" live="assertive">Sunucuya ulaşılamadı.</bz-alert>`,
  js: `
const a = document.createElement("bz-alert")
a.variant = "danger"
a.heading = "Doğrulama hatası"
a.dismissible = true
a.live = "assertive"          // sonradan eklenen hata: ekran okuyucu hemen okur
a.textContent = "Proje adı boş olamaz."
a.addEventListener("dismiss", (e) => log("dismiss"))
output.append(a)

const again = document.createElement("bz-button")
again.textContent = "Tekrar göster"
again.addEventListener("click", () => (a.hidden = false))
output.append(again)`,
  template: `
html\`
  \${() => error()
    ? html\`<bz-alert variant="danger" heading="Kaydedilemedi" live="assertive" dismissible
               @dismiss=\${() => error.set(null)}>\${error()}</bz-alert>\`
    : null}

  <bz-alert variant="warning" icon="clock">
    Onay süresi 3 gün içinde doluyor.
    <bz-button slot="actions" size="sm" variant="primary" @click=\${approve}>Onayla</bz-button>
  </bz-alert>
\``,
  props: [
    { name: "variant", type: '"info" | "success" | "warning" | "danger"', default: '"info"', desc: "Renk ve varsayılan ikon. Yansıtılır." },
    { name: "heading", type: "string", desc: "Kalın başlık satırı." },
    { name: "icon", type: "string", desc: "İkon adı; \"none\" gizler. Varsayılan: varyanta göre." },
    { name: "dismissible", type: "boolean", default: "false", desc: "Kapat düğmesi." },
    { name: "live", type: '"" | "polite" | "assertive"', default: '""', desc: "Boş: role=note (sayfanın parçası). polite: role=status, assertive: role=alert (sonradan eklenen mesajlar)." },
    { name: "closeLabel", type: "string", default: '"Close"', desc: "Kapat düğmesinin erişilebilir adı." },
  ],
  events: [{ name: "dismiss", detail: "—", desc: "Kapat'a basılınca; iptal edilebilir. Engellenmezse alert gizlenir (hidden). Kabarcıklanmaz." }],
  slots: [
    { name: "(varsayılan)", desc: "Mesaj" },
    { name: "actions", desc: "Mesajın altındaki düğmeler" },
    { name: "icon", desc: "İkon yerine" },
  ],
  parts: [{ name: "icon / body / heading / message / actions / close", desc: "Parçalar" }],
  hooks: ["[variant]", "[hidden]", "--bz-color-info / -success / -warning / -danger"],
  notes: ["Toast'tan farkı: sayfada kalır, içerikle birlikte okunur. Geçici bildirim için toast()."],
}

export const badgeUsage: UsageSpec = {
  tag: "bz-badge · bz-chip",
  html: `
<bz-badge>Taslak</bz-badge>
<bz-badge variant="success">Yayında</bz-badge>
<bz-badge variant="danger" count="128" max="99" label="128 bekleyen iş" solid></bz-badge>
<bz-badge variant="success" dot label="Çevrimiçi"></bz-badge>

<bz-chip selectable selected>Fatura</bz-chip>
<bz-chip selectable>Teklif</bz-chip>
<bz-chip removable icon="tag">Kalite</bz-chip>
<bz-chip variant="warning">Statik etiket</bz-chip>`,
  js: `
const tags = ["Kalite", "Üretim", "Depo"]
const box = document.createElement("div")
const draw = () => {
  box.replaceChildren(...tags.map((t) => {
    const chip = document.createElement("bz-chip")
    chip.removable = true
    chip.textContent = t
    chip.addEventListener("remove", () => {
      tags.splice(tags.indexOf(t), 1)
      log("remove", t)
      draw()
    })
    return chip
  }))
}
draw()
const badge = document.createElement("bz-badge")
badge.variant = "primary"
badge.count = 5
badge.label = "5 bildirim"
output.append(box, " Bildirim: ", badge)`,
  template: `
html\`
  <bz-tab value="mine">Benim İşlerim <bz-badge variant="danger" solid .count=\${() => work().length}></bz-badge></bz-tab>

  \${repeat(filters, (f) => f.id, (f) => html\`
    <bz-chip selectable .selected=\${() => active() === f.id} @change=\${() => active.set(f.id)}>\${f.label}</bz-chip>\`)}

  \${repeat(tags, (t) => t, (t) => html\`
    <bz-chip removable @remove=\${() => tags.update((l) => l.filter((x) => x !== t))}>\${t}</bz-chip>\`)}
\``,
  props: [
    { name: "variant", attr: "variant", type: '"neutral" | "primary" | "success" | "warning" | "danger" | "info"', default: '"neutral"', desc: "İkisinde de ton." },
    { name: "count / max", attr: "count, max", type: "number", default: "— / 99", desc: "bz-badge: sayı; max üstü \"99+\"." },
    { name: "dot / label / hideZero", attr: "dot, label, hide-zero", type: "boolean / string / boolean", desc: "bz-badge: sadece nokta; erişilebilir ad; 0 ise gizle." },
    { name: "solid", attr: "solid", type: "boolean (CSS)", desc: "bz-badge: dolu renk (sayaçlar için)." },
    { name: "selectable / selected", attr: "selectable, selected", type: "boolean", desc: "bz-chip: filtre çipi (role=button, aria-pressed)." },
    { name: "removable / removeLabel", attr: "removable, remove-label", type: "boolean / string", desc: "bz-chip: × düğmesi; Delete/Backspace de kaldırır." },
    { name: "icon / disabled", attr: "icon, disabled", type: "string / boolean", desc: "bz-chip: ikon; devre dışı." },
  ],
  events: [
    { name: "change (bz-chip)", detail: "{ selected }", desc: "Seçilebilir çip değişince. Kabarcıklanmaz." },
    { name: "remove (bz-chip)", detail: "—", desc: "× veya Delete; iptal edilebilir. Çipi uygulama kaldırır. Kabarcıklanmaz." },
  ],
  parts: [{ name: "bz-chip: icon / label / remove", desc: "Çip parçaları" }],
  hooks: ["[variant]", "bz-badge[dot]", "bz-badge[solid]", "bz-chip[selected]", "[removable]", "[disabled]"],
  notes: ["bz-badge etkileşimsizdir; tıklanabilir etiket gerekiyorsa bz-chip kullanın."],
}
