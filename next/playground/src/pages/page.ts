import { computed, define, effect, html, onCleanup, prop, signal } from "@bazlama/core"
import { definePage, type PageContext, type RouteRecord } from "@bazlama/router"
import { pageUsage } from "../docs/specs-router"
import { usage } from "../docs/usage"
import { logEntry } from "../log"

/**
 * The "Page" page is a layout route (/page/…): the demo area is a nested <bz-outlet>, so the
 * examples run on the playground's own router.
 */

// How many times each demo page's setup ran (keep vs remount).
const setups = signal<Record<string, number>>({})
const countSetup = (key: string) => setups.update((s) => ({ ...s, [key]: (s[key] ?? 0) + 1 }))

/** Shows the page context live; used by the "keep" and "remount" routes. */
function inspector(ctx: PageContext, key: string) {
  countSetup(key)
  const effectRuns = signal(0)
  // An effect that reads params: it re-runs when /…/1 becomes /…/2 (the page itself stays).
  effect(() => {
    ctx.params()
    effectRuns.update((n) => n + 1)
  })
  onCleanup(() => logEntry("page", "dispose", key))
  const id = computed(() => Number(ctx.params().id) || 1)
  return html`<div class="stack-sm">
    <table class="api router-info">
      <tbody>
        <tr><td>ctx.params()</td><td><code>${() => JSON.stringify(ctx.params())}</code></td></tr>
        <tr><td>ctx.query.all()</td><td><code>${() => JSON.stringify(ctx.query.all())}</code></td></tr>
        <tr><td>ctx.hash()</td><td><code>${() => ctx.hash() || "—"}</code></td></tr>
        <tr><td>ctx.state()</td><td><code>${() => JSON.stringify(ctx.state() ?? null)}</code></td></tr>
        <tr><td>setup çalışma sayısı</td><td><code>${() => setups()[key] ?? 0}</code></td></tr>
        <tr><td>params effect'i</td><td><code>${effectRuns}</code> kez</td></tr>
      </tbody>
    </table>
    <div class="row">
      <bz-button size="sm" @click=${() => ctx.navigate(`/page/${key}/${id() + 1}`)}>params: id + 1</bz-button>
      <bz-button size="sm" @click=${() => ctx.query.set({ sort: ctx.query.get("sort") === "asc" ? "desc" : "asc" })}>query.set({ sort })</bz-button>
      <bz-button size="sm" @click=${() => ctx.navigate({ path: ctx.path(), query: ctx.query.all(), hash: "notlar" })}>hash: #notlar</bz-button>
      <bz-button size="sm" @click=${() => ctx.navigate(ctx.path(), { replace: true, state: { from: "buton", at: new Date().toLocaleTimeString("tr-TR") } })}>state ile git</bz-button>
    </div>
  </div>`
}

const Intro = definePage({
  title: "Page",
  setup: () => html`<p>Soldaki örnekleri seçin. Her örnek bu alanda (iç içe <code>&lt;bz-outlet&gt;</code>) açılır.</p>`,
})

const Keep = definePage({
  title: (s) => `Sayfa korunur · ${s.params.id}`,
  setup: (ctx) => html`<p><b>Varsayılan:</b> parametre değişince sayfa yeniden kurulmaz; signal'lar güncellenir. "params: id + 1"e basın: setup sayısı
      aynı kalır, effect yeniden çalışır.</p>
    ${inspector(ctx, "keep")}`,
})

const Remount = definePage({
  title: (s) => `Yeniden kurulur · ${s.params.id}`,
  setup: (ctx) => html`<p><b>remount: true:</b> parametre değişince sayfa atılır ve yeniden kurulur (form durumu sıfırlanır). Setup sayısı her
      seferinde artar; olay günlüğünde <code>dispose</code> görünür.</p>
    ${inspector(ctx, "remount")}`,
})

interface Product {
  id: number
  name: string
  price: number
}
const Loaded = definePage<Product>({
  title: (s) => s.data?.name ?? "Ürün",
  async load({ params, signal: abort }) {
    await new Promise((resolve, reject) => {
      const t = setTimeout(resolve, 700)
      abort.addEventListener("abort", () => (clearTimeout(t), reject(abort.reason)))
    })
    if (params.id === "0") throw new Error("Ürün 0 bulunamadı (load hatası)")
    const id = Number(params.id)
    return { id, name: `Ürün ${id}`, price: id * 125.5 }
  },
  setup: (ctx) => html`<div class="stack-sm">
    <p><b>load():</b> sayfa gösterilmeden önce veri yükler (700 ms). Beklerken eski sayfa kalır, üstte ilerleme çubuğu görünür; başka yere
      gidilirse <code>signal</code> iptal edilir. Başlık <code>title(state)</code> ile veriden gelir.</p>
    <p><code>ctx.data()</code> = <code>${() => JSON.stringify(ctx.data())}</code></p>
    <div class="row">
      <a href=${() => `/page/load/${ctx.data().id + 1}`}>Sonraki ürün ›</a>
      <a href="/page/load/0">Hata veren ürün</a>
    </div>
  </div>`,
})

// A page written as a custom element: it receives params, query (object), data and route.
define("demo-order-page", {
  props: {
    params: prop.object<Record<string, string>>({}),
    query: prop.object<Record<string, string>>({}),
    route: prop.object<PageContext | null>(null),
  },
  setup: (props) => html`<div class="stack-sm">
    <p><b>Custom element sayfa:</b> <code>page: "demo-order-page"</code>. Outlet elementi oluşturur ve <code>params</code>, <code>query</code>,
      <code>data</code>, <code>route</code> özelliklerini atar; HTML'deki <code>&lt;bz-route page="…"&gt;</code> de böyle çalışır.</p>
    <p>Sipariş <b>#${() => props.params().id}</b> · sekme: <code>${() => props.query().tab ?? "özet"}</code></p>
    <div class="row">
      <a href=${() => `/page/element/${props.params().id}?tab=kalemler`}>?tab=kalemler</a>
      <a href=${() => `/page/element/${Number(props.params().id) + 1}`}>Sonraki sipariş</a>
      <bz-button size="sm" @click=${() => props.route()?.query.set({ tab: null })}>route.query.set({ tab: null })</bz-button>
    </div>
  </div>`,
})

const Guarded = definePage({
  title: "Kaydedilmemiş form",
  setup(ctx) {
    const text = signal("")
    ctx.onBeforeLeave(() => {
      if (!text()) return true
      // A synchronous answer: refuse while there is text (see the Router page for a confirm dialog).
      logEntry("page", "onBeforeLeave", "reddedildi: önce metni temizleyin")
      return false
    })
    ctx.blockUnload(() => text() !== "")
    return html`<div class="stack-sm narrow">
      <p><b>onBeforeLeave / blockUnload:</b> metin varken başka bir örneğe geçmek reddedilir (günlüğe yazılır), yenilemek tarayıcı uyarısı açar.
        Onay dialogu ile örnek için Router sayfasındaki "Ayarlar"a bakın.</p>
      <bz-input label="Not" .value=${text} @input=${(e: Event) => text.set((e.currentTarget as HTMLInputElement).value)}></bz-input>
      <bz-button size="sm" @click=${() => text.set("")}>Temizle</bz-button>
    </div>`
  },
})

const Layout = definePage({
  setup: () => html`
    <h1>Page</h1>
    <p class="lead">
      Sayfa bileşeni: <code>definePage({ title, load, setup(ctx) })</code> veya bir custom element. Router sayfaya URL'yi signal olarak verir
      (<code>params</code>, <code>query</code>, <code>hash</code>, <code>state</code>), <code>load()</code> verisini <code>data</code> olarak iletir ve
      sayfanın ömrünü yönetir: sayfadan çıkınca içindeki effect'ler temizlenir.
    </p>

    <section class="demo">
      <h2>Canlı örnek</h2>
      <nav class="router-demo-nav" aria-label="Page örnekleri">
        <a href="/page/keep/1?sort=asc">Parametre: korunur</a>
        <a href="/page/remount/1">Parametre: remount</a>
        <a href="/page/load/1">load() ve data</a>
        <a href="/page/element/42">Custom element sayfa</a>
        <a href="/page/guard">onBeforeLeave</a>
      </nav>
      <div class="router-demo">
        <bz-outlet></bz-outlet>
      </div>
    </section>

    ${usage(pageUsage)}
  `,
})

export const pageRoute: RouteRecord = {
  path: "/page",
  page: Layout,
  children: [
    { path: "", page: Intro },
    { path: "keep/:id", page: Keep },
    { path: "remount/:id", page: Remount, remount: true },
    { path: "load/:id", page: Loaded },
    { path: "element/:id", page: "demo-order-page", title: "Custom element sayfa" },
    { path: "guard", page: Guarded },
  ],
}
