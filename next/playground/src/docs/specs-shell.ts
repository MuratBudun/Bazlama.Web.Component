import type { UsageSpec } from "./usage"

// "Kullanım" content of the Shell and Avatar pages (see usage.ts).

export const shellUsage: UsageSpec = {
  tag: "bz-shell",
  html: `
<bz-shell variant="classic" breakpoint="720">
  <bz-header slot="header" title="Uygulama" subtitle="Örnek"></bz-header>
  <nav slot="start"><a href="#pano">Pano</a><br /><a href="#rapor">Raporlar</a></nav>
  <p>İçerik (zorunlu tek bölge)</p>
  <aside slot="end">Detay paneli</aside>
  <bz-footer slot="footer">© 2026 <span slot="end">v1.0</span></bz-footer>
</bz-shell>`,
  js: `
const shell = document.createElement("bz-shell")
shell.variant = "sidebar"
shell.breakpoint = 720

const header = document.createElement("bz-header")
header.slot = "header"
header.title = "JS ile shell"

const nav = document.createElement("div")
nav.slot = "start"
nav.textContent = "Menü"

const content = document.createElement("p")
content.textContent = "İçerik"

// Slotlar ilk bağlanmada okunur: çocukları append'den ÖNCE ekleyin
shell.append(header, nav, content)
shell.addEventListener("toggle", (e) => log("toggle", e.detail))
output.append(shell)

const b = document.createElement("bz-button")
b.textContent = "shell.toggle('start')"
b.addEventListener("click", () => shell.toggle("start"))
output.append(b)`,
  template: `
html\`
  <bz-shell variant="classic" .busy=\${router.pending} @toggle=\${(e) => savePreference(e.detail)}>
    <bz-header slot="header" title="Demo ERP" href="/" user-name=\${user.name}>…</bz-header>
    <nav slot="start"><bz-tree selection="leaf" .items=\${menu} .value=\${section}></bz-tree></nav>
    <bz-outlet></bz-outlet>
    <aside slot="end">\${details()}</aside>
    <bz-footer slot="footer">© 2026 <span slot="end">v\${version}</span></bz-footer>
  </bz-shell>
\`

// Herhangi bir düğme bir kenarı açıp kapatabilir
html\`<bz-button data-shell-toggle="end">Detaylar</bz-button>\``,
  props: [
    { name: "variant", type: '"classic" | "sidebar"', default: '"classic"', desc: "classic: header/footer tam genişlik. sidebar: kenarlar tam yükseklik. Yansıtılır." },
    { name: "breakpoint", type: "number (px)", default: "960", desc: "Shell'in kendi genişliği bunun altındaysa kenarlar çekmeceye dönüşür." },
    { name: "startCollapsed", type: "boolean", default: "false", desc: "Geniş modda sol kenar dar bir şerit (ör. sadece ikonlar)." },
    { name: "endCollapsed", type: "boolean", default: "false", desc: "Geniş modda sağ kenar gizli." },
    { name: "startOpen / endOpen", attr: "start-open, end-open", type: "boolean", default: "false", desc: "Dar modda çekmece açık mı (aynı anda biri)." },
    { name: "busy", type: "boolean", default: "false", desc: "Üstte ilerleme çubuğu (ör. router.pending)." },
    { name: "skipLabel", type: "string", default: '"Skip to content"', desc: "İçeriğe geç düğmesi." },
    { name: "sticky-footer", attr: "sticky-footer", type: "boolean (CSS)", desc: "Footer ekranın altına yapışır; yan paneller onun üstünde biter." },
  ],
  events: [{ name: "toggle", detail: "{ side, open, compact }", desc: "Bir kenar açılıp kapanınca (düğme, Esc, örtü, bağlantı veya metot)." }],
  api: [
    { name: 'data-shell-toggle="start|end"', desc: "Shell içindeki herhangi bir düğmeyi o kenarın aç/kapat düğmesi yapar; aria-expanded/aria-controls shell tarafından güncellenir." },
    { name: "shell.toggle(side) / open(side) / close(side)", desc: "Programatik kontrol; side: \"start\" | \"end\"." },
  ],
  slots: [
    { name: "header", desc: "Üst bölge (ör. bz-header). Yapışkan." },
    { name: "start", desc: "Sol kenar (RTL'de sağ): gezinme." },
    { name: "(varsayılan)", desc: "İçerik: <main> içine yerleşir. Tek zorunlu bölge." },
    { name: "end", desc: "Sağ kenar: detay, filtre, günlük." },
    { name: "footer", desc: "Alt bölge (ör. bz-footer)." },
  ],
  parts: [
    { name: "header / footer / content", desc: "Izgara bölgeleri (content bir <main>)" },
    { name: "start / end → start-panel / end-panel", desc: "Kenar hücresi ve içindeki yapışkan, kendi kayan panel" },
    { name: "skip / backdrop / progress", desc: "İçeriğe geç, çekmece örtüsü, ilerleme çubuğu" },
  ],
  hooks: [
    "[variant]",
    "[data-compact]",
    '[data-drawer="start|end"]',
    "[start-collapsed] / [end-collapsed]",
    "[data-has-header|footer|start|end]",
    "--bz-shell-areas (grid-template-areas)",
    "--bz-shell-start-width / -start-collapsed-width / -end-width",
  ],
  notes: [
    "Bölgelere ne konacağı uygulamanın tercihi: bz-header / bz-footer hazır bileşenler, ama herhangi bir element de olur. Slotlar ilk bağlanmada okunur.",
  ],
}

export const headerUsage: UsageSpec = {
  tag: "bz-header",
  id: "kullanim-header",
  heading: "Header",
  html: `
<bz-header title="Demo ERP" subtitle="Muhasebe" href="#" logo="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='6' fill='%232f5bea'/%3E%3C/svg%3E"
           user-name="Ada Yılmaz" user-detail="Yönetici">
  <input slot="center" type="search" placeholder="Ara…" />
  <bz-button variant="ghost" size="sm">Yardım</bz-button>
  <bz-menu-item slot="user-menu" value="profile">Profil</bz-menu-item>
  <bz-menu-item slot="user-menu" value="logout">Çıkış yap</bz-menu-item>
</bz-header>

<bz-footer>© 2026 Bazlama <span slot="end">v1.4.2 · Gizlilik</span></bz-footer>`,
  js: `
const header = document.createElement("bz-header")
header.title = "Sipariş Yönetimi"
header.userName = "Can Demir"
header.userDetail = "Depo sorumlusu"
header.noMenuButton = true

for (const [value, label] of [["profile", "Profil"], ["logout", "Çıkış yap"]]) {
  const item = document.createElement("bz-menu-item")
  item.slot = "user-menu"
  item.setAttribute("value", value)
  item.textContent = label
  header.append(item)
}
header.addEventListener("select", (e) => log("kullanıcı menüsü:", e.detail.value))
output.append(header)`,
  template: `
html\`
  <bz-header slot="header" title="Demo ERP" subtitle=\${company} href="/"
             user-name=\${() => user().name} user-src=\${() => user().photo}
             @select=\${(e) => e.detail.value === "logout" && logout()}>
    <img slot="logo" src="/logo.svg" alt="" />
    <bz-button variant="ghost" aria-label="Bildirimler">\${icon("bell")}</bz-button>
    <bz-menu-item slot="user-menu" value="profile" icon="user">Profil</bz-menu-item>
    <bz-menu-item slot="user-menu" value="logout" icon="log-out">Çıkış yap</bz-menu-item>
  </bz-header>
\``,
  props: [
    { name: "title / subtitle", attr: "title, subtitle", type: "string", desc: "Uygulama adı ve alt başlık (dar ekranda alt başlık gizlenir)." },
    { name: "logo / logoAlt", attr: "logo, logo-alt", type: "string", desc: "Logo resmi. slot=\"logo\" ile herhangi bir içerik." },
    { name: "href", type: "string", desc: "Logo + başlık bağlantısı (ör. \"/\")." },
    { name: "noMenuButton", type: "boolean", default: "false", desc: "Menü düğmesini gizler (data-shell-toggle=\"start\")." },
    { name: "menuLabel", type: "string", default: '"Menu"', desc: "Menü düğmesinin erişilebilir adı." },
    { name: "userName / userSrc / userDetail", attr: "user-name, user-src, user-detail", type: "string", desc: "Kullanıcı alanı: avatar, ad, rol." },
    { name: "userLabel", type: "string", default: '"User menu"', desc: "Kullanıcı menüsünün erişilebilir adı." },
  ],
  events: [{ name: "select", detail: "{ value, item }", desc: "Kullanıcı menüsünden seçim (bz-menu'den kabarcıklanır)." }],
  slots: [
    { name: "(varsayılan)", desc: "Eylemler (sağda): düğmeler, bildirimler" },
    { name: "center", desc: "Orta alan: arama, breadcrumb" },
    { name: "logo", desc: "Logo resmi yerine" },
    { name: "user-menu", desc: "Kullanıcı menüsü öğeleri (bz-menu-item…); verilirse avatar menü açar" },
    { name: "user", desc: "Kullanıcı alanının tamamı yerine" },
  ],
  parts: [
    { name: "bar (<header>) / menu / brand / logo / titles / title / subtitle", desc: "Sol taraf" },
    { name: "center / actions / user / user-button / user-name / user-detail", desc: "Orta ve sağ" },
  ],
  hooks: ["--bz-header-height", "--bz-header-bg", "--bz-header-fg", "--bz-header-logo-size"],
  notes: ["<bz-footer>: varsayılan slot solda, slot=\"end\" sağda; <footer> landmark'ı. --bz-footer-bg, --bz-footer-fg."],
}

export const avatarUsage: UsageSpec = {
  tag: "bz-avatar",
  html: `
<bz-avatar name="Ada Yılmaz"></bz-avatar>
<bz-avatar name="Can Demir" size="lg" status="online"></bz-avatar>
<bz-avatar name="Ece Kaya" src="https://example.invalid/yok.jpg" size="lg" status="busy"></bz-avatar>
<bz-avatar name="İsmail Öztürk" size="xl" status="away"></bz-avatar>`,
  js: `
for (const name of ["Zeynep Arslan", "Mert Koç", "Elif Doğan", "Umut Çelik", "Selin Aydın"]) {
  const a = document.createElement("bz-avatar")
  a.name = name
  a.setAttribute("size", "lg")
  a.dataset.tooltip = name
  output.append(a, " ")
}
log("baş harfler:", initials("İsmail Öztürk"), "· renk tonu:", hueOf("Ada Yılmaz"))`,
  template: `
html\`
  <bz-avatar name=\${user.name} src=\${user.photo} status=\${() => presence()}></bz-avatar>

  <!-- Görünen adın yanında: dekoratif (ekran okuyucu adı iki kez okumasın) -->
  <bz-button variant="ghost"><bz-avatar name=\${user.name} decorative size="sm"></bz-avatar> \${user.name}</bz-button>
\``,
  props: [
    { name: "name", type: "string", desc: "Ad: baş harfler ve renk bundan; erişilebilir ad da." },
    { name: "src", type: "string", desc: "Resim. Yüklenemezse baş harflere düşer." },
    { name: "size", type: '"sm" | "md" | "lg" | "xl"', desc: "Sadece CSS (@bazlama/ui)." },
    { name: "status", type: '"" | "online" | "away" | "busy" | "offline"', desc: "Durum noktası; erişilebilir ada eklenir." },
    { name: "label", type: "string", desc: "Erişilebilir ad (name yerine)." },
    { name: "decorative", type: "boolean", default: "false", desc: "Ekran okuyucudan gizler (yanında görünen ad varsa)." },
  ],
  api: [
    { name: "initials(name)", desc: "Baş harfler, Türkçe büyük harf kurallarıyla (\"ismail öztürk\" → \"İÖ\")." },
    { name: "hueOf(text)", desc: "Metinden sabit renk tonu (0–359)." },
  ],
  parts: [{ name: "image / initials / status", desc: "Resim, baş harfler, durum noktası" }],
  hooks: ["[size]", "[status]", "[data-fallback]", "--bz-avatar-hue", "--bz-avatar-radius"],
}
