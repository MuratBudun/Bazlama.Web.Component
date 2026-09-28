import type { UsageSpec } from "./usage"

// "Kullanım" content of the Page and Router pages (see usage.ts). Page and Router have
// no live preview or runner: a second router would take over the playground's navigation.

export const pageUsage: UsageSpec = {
  tag: "definePage",
  livePreview: false,
  runnable: false,
  html: `
<!-- HTML ile sayfa: bir custom element + <bz-route page="…"> -->
<bz-router>
  <bz-route path="/orders/:id" page="order-page" title="Sipariş"></bz-route>
  <bz-outlet></bz-outlet>
</bz-router>

<script type="module">
  import { define, html, prop } from "@bazlama/core"

  // Outlet şu özellikleri atar: params, query (nesne), data, route (sayfa bağlamı)
  define("order-page", {
    props: { params: prop.object({}), query: prop.object({}) },
    setup: (props) => html\`<h1>Sipariş \${() => props.params().id}</h1>\`,
  })
</script>`,
  js: `
import { definePage } from "@bazlama/router"
import { computed, html } from "@bazlama/core"

export default definePage({
  // Metin veya fonksiyon: (state) => state.data.name
  title: (s) => \`Sipariş \${s.params.id}\`,

  // Sayfa gösterilmeden önce; hata → errorPage, başka yere gidilirse signal iptal
  load: ({ params, query, signal }) =>
    fetch(\`/api/orders/\${params.id}?\${query}\`, { signal }).then((r) => r.json()),

  setup(ctx) {
    const tab = computed(() => ctx.query.get("tab") ?? "summary")
    ctx.onBeforeLeave(() => !dirty() || dialogs.confirm("Değişiklikler kaybolsun mu?"))
    ctx.blockUnload(dirty)
    return html\`
      <h1>\${() => ctx.data().title}</h1>
      <bz-tabs .value=\${tab} @change.self=\${(e) => ctx.query.set({ tab: e.detail.value })}>…</bz-tabs>\`
  },
})`,
  template: `
// Route'ta kullanım
{ path: "/orders/:id", page: Order }                          // parametre değişince sayfa korunur
{ path: "/orders/:id/edit", page: OrderForm, remount: true }  // her id için yeni sayfa (form sıfırlanır)
{ path: "/reports", page: () => import("./pages/reports") }   // lazy: default export bir definePage
{ path: "/legacy", page: "legacy-page" }                      // custom element sayfa`,
  props: [
    { name: "title", attr: false, type: "string | (state) => string", desc: "Belge başlığı (router titleTemplate ile biçimlendirir). state.data load() sonucudur." },
    { name: "load", attr: false, type: "({ params, query, url, signal }) => T | Promise<T>", desc: "Veri yükleme. Sadece hash değişirse yeniden çalışmaz." },
    { name: "setup", attr: false, type: "(ctx) => template", desc: "Sayfayı kurar; bir kez çalışır (remount: true değilse)." },
  ],
  api: [
    { name: "ctx.params() / ctx.hash() / ctx.path() / ctx.state()", desc: "URL'den gelen signal'lar." },
    { name: "ctx.query.get / getAll / has / number / boolean / all", desc: "Query okuma (reaktif). number(\"page\", 1), boolean(\"debug\")." },
    { name: "ctx.query.set(patch, { replace = true })", desc: "Query'yi birleştirir; null/\"\"/false anahtarı siler." },
    { name: "ctx.data() / ctx.error()", desc: "load() sonucu; hata sayfasında hata." },
    { name: "ctx.navigate(to, options) / ctx.router", desc: "Gezinme ve router'ın kendisi." },
    { name: "ctx.onBeforeLeave(guard)", desc: "Sayfadan çıkmadan önce sorulur; false/Promise<false> kalır. Sayfa gidince kaldırılır." },
    { name: "ctx.blockUnload(() => boolean)", desc: "Yenileme/kapama sırasında tarayıcının \"sayfadan ayrıl?\" uyarısı." },
    { name: "Custom element sayfa", desc: "Outlet elementi oluşturur ve params, query (nesne), data, route özelliklerini atar." },
  ],
  notes: [
    "Sayfa bir root içinde kurulur: sayfadan çıkınca içindeki effect'ler ve onCleanup'lar çalışır. Aynı route kalıp sadece parametreler değişirse sayfa korunur.",
  ],
}

export const routerUsage: UsageSpec = {
  tag: "bz-router",
  livePreview: false,
  runnable: false,
  html: `
<bz-router title-template="{title} · Uygulama">
  <bz-route path="/" page="home-page" title="Ana sayfa"></bz-route>
  <bz-route path="/customers" page="customer-list-page" title="Müşteriler"></bz-route>
  <bz-route path="/customers/:id" page="customer-page" title="Müşteri"></bz-route>
  <bz-route path="/settings" page="settings-layout">
    <bz-route path="" page="settings-general"></bz-route>
    <bz-route path="profile" page="settings-profile"></bz-route>
  </bz-route>
  <bz-route path="/old" redirect="/customers"></bz-route>
  <bz-route path="*" page="not-found-page"></bz-route>

  <bz-app>
    <a slot="header" href="/">Uygulama</a>
    <nav slot="nav"><a href="/customers">Müşteriler</a> <a href="/settings">Ayarlar</a></nav>
    <bz-outlet></bz-outlet>
  </bz-app>
</bz-router>

<!-- "page" bir custom element: params, query (nesne), data ve route özelliklerini alır -->`,
  js: `
import { createRouter, definePage } from "@bazlama/router"
import { dialogs } from "@bazlama/headless"

const Customer = definePage({
  title: (s) => s.data.name,
  // Sayfa gösterilmeden önce; başka yere gidilirse signal iptal edilir
  load: ({ params, signal }) => fetch(\`/api/customers/\${params.id}\`, { signal }).then((r) => r.json()),
  setup(ctx) {
    // ctx.params(), ctx.query.get("tab"), ctx.data() → signal; ctx.query.set({ tab: "x" })
    ctx.onBeforeLeave(() => !dirty() || dialogs.confirm("Değişiklikler kaybolsun mu?"))
    return html\`<h1>\${() => ctx.data().name}</h1>\`
  },
})

const router = createRouter({
  routes: [
    { path: "/", page: () => import("./pages/home.js") },          // lazy
    { path: "/customers/:id", page: Customer },
    { path: "/admin", page: Admin, beforeEnter: () => auth.isAdmin || "/login" },
    { path: "/settings", page: SettingsLayout, children: [          // layout: içinde <bz-outlet>
      { path: "", page: General },
      { path: "profile", page: Profile },
    ]},
  ],
  titleTemplate: (t) => \`\${t} · Uygulama\`,
  notFound: NotFound,
  errorPage: ErrorPage,
})
router.beforeLeave(() => dialogs.closeAll())   // açık dialoglar sayfa değişince kapansın
router.start()

// Programatik
router.navigate("/customers/7?tab=orders")
router.navigate({ path: "/customers", query: { page: 2 } }, { replace: true })
router.back()`,
  template: `
import { html } from "@bazlama/core"

// Uygulama iskeleti + router
html\`
  <bz-app .busy=\${router.pending} nav-label="Ana menü">
    <a slot="header" href="/">Uygulama</a>
    <bz-tree slot="nav" selection="leaf" .items=\${menu}
             .value=\${() => router.current()?.path}></bz-tree>
    <bz-outlet></bz-outlet>
  </bz-app>
\`

// Sayfalama ve filtre URL'de
const page = computed(() => ctx.query.number("page", 1))
ctx.query.set({ page: page() + 1 })          // ?page=2, geçmişi doldurmaz
ctx.query.set({ q: "ay", page: null })       // null → anahtarı siler`,
  props: [
    { name: "routes", attr: false, type: "RouteRecord[]", desc: "JavaScript route dizisi. Verilmezse çocuk <bz-route> elementleri okunur." },
    { name: "mode", type: '"path" | "hash"', default: '"path"', desc: "path: /customers/1 (sunucu bilinmeyen yollarda index.html döndürmeli). hash: #/customers/1." },
    { name: "base", type: "string", default: '"/"', desc: "Uygulamanın kök yolu, ör. /app." },
    { name: "titleTemplate", type: "string", desc: "Başlık kalıbı, ör. \"{title} · Uygulama\"." },
    { name: "router", attr: false, type: "Router", desc: "Çalışan router (salt okunur)." },
  ],
  api: [
    { name: "<bz-route path page title redirect remount>", desc: "Route; iç içe <bz-route> alt route'lardır (path \"\" = index)." },
    { name: "<bz-outlet>", desc: "Kendi derinliğindeki sayfayı çizer; bir sayfanın içindeki outlet alt route'u gösterir." },
    { name: "createRouter({ routes, mode, base, titleTemplate, notFound, errorPage, focus })", desc: "JavaScript router'ı. start() ile başlar." },
    { name: "RouteRecord", desc: "{ path, page, title, children, redirect, beforeEnter, remount, meta }. page: definePage(), custom element adı veya () => import(...)." },
    { name: "definePage({ title, load, setup(ctx) })", desc: "ctx: params, query, hash, path, state, data, error (signal) + navigate, onBeforeLeave, blockUnload." },
    { name: "router.navigate(to, { replace, state }) / back() / forward() / reload()", desc: "to: \"/yol?x=1\" veya { path, query, hash }. Promise<boolean>: false = guard reddetti." },
    { name: "router.current() / pending() / isActive(path, exact?) / href(to)", desc: "Reaktif durum, aktiflik ve bağlantı adresi (base / hash moduna göre)." },
    { name: "router.beforeEach / beforeLeave / afterEach", desc: "Genel guard ve kancalar; kaldırıcı döner." },
    { name: "Yol kalıpları", desc: "/customers/:id, isteğe bağlı /c/:id/:tab?, geri kalan /files/*path, her şey *." },
  ],
  hooks: ['a[aria-current="page"] (tam eşleşme)', "a[data-active] (kendisi veya alt yolu)", "bz-outlet[data-depth]", "bz-outlet[data-route]"],
  notes: [
    "Linkler düz <a href>: Navigation API tüm aynı-origin gezinmeleri yakalar. Ctrl+tık / orta tık yeni sekmede açar; download ve target=\"_blank\" dokunulmaz.",
    "URL, sayfa hazır olunca değişir: guard'lar ve load() önce çalışır; reddedilirse adres ve sayfa yerinde kalır.",
  ],
}
