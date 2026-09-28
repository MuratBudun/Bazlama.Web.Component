import { computed, html, signal } from "@bazlama/core"
import { dialogs, toast } from "@bazlama/headless"
import { definePage, type PageContext, type RouteRecord } from "@bazlama/router"
import { customers, type Customer } from "../data"
import { routerUsage } from "../docs/specs-router"
import { usage } from "../docs/usage"
import { logEntry } from "../log"

/**
 * The "Router" page is itself a layout route with children (/router/…): its demo area is a
 * nested <bz-outlet>. Everything here runs on the playground's own router.
 */

const all = customers(42)
const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    signal.addEventListener("abort", () => (clearTimeout(t), reject(signal.reason)))
  })

// ------------------------------------------------------------------ child pages

const Intro = definePage({
  title: "Router",
  setup: () => html`<div class="stack-sm">
    <p>Bu alan iç içe bir <code>&lt;bz-outlet&gt;</code>. Üstteki bağlantılar düz <code>&lt;a href&gt;</code>: Navigation API tıklamaları yakalar.</p>
    <p class="muted small">Geri/ileri tuşlarını, sayfayı yenilemeyi ve adres çubuğuna doğrudan bir URL yazmayı deneyin.</p>
  </div>`,
})

const CustomerList = definePage({
  title: "Müşteriler",
  setup(ctx) {
    const size = 8
    const page = computed(() => Math.max(1, ctx.query.number("page", 1)))
    const q = computed(() => ctx.query.get("q") ?? "")
    const filtered = computed(() => {
      const term = q().toLocaleLowerCase("tr-TR")
      return term ? all.filter((c) => c.name.toLocaleLowerCase("tr-TR").includes(term)) : all
    })
    const pages = computed(() => Math.max(1, Math.ceil(filtered().length / size)))
    const rows = computed(() => filtered().slice((page() - 1) * size, page() * size))
    return html`<div class="stack-sm">
      <div class="row">
        <bz-input placeholder="Ada göre ara (URL'de ?q=)" .value=${q} @input=${(e: Event) =>
          ctx.query.set({ q: (e.currentTarget as HTMLInputElement).value, page: null })}></bz-input>
        <span class="muted small">${() => `${filtered().length} kayıt`}</span>
      </div>
      <ul class="plain-list">
        ${() => rows().map((c) => html`<li><a href=${`/router/customers/${c.id}`}>${c.name}</a> <span class="muted small">${c.city}</span></li>`)}
      </ul>
      <div class="row">
        <bz-button size="sm" ?disabled=${() => page() <= 1} @click=${() => ctx.query.set({ page: page() - 1 })}>‹ Önceki</bz-button>
        <span class="small">${() => `Sayfa ${page()} / ${pages()}`}</span>
        <bz-button size="sm" ?disabled=${() => page() >= pages()} @click=${() => ctx.query.set({ page: page() + 1 })}>Sonraki ›</bz-button>
      </div>
      <p class="note">Sayfa ve arama URL'de (<code>?page=2&amp;q=ay</code>); <code>query.set()</code> geçmişi doldurmaz (replace).</p>
    </div>`
  },
})

const CustomerDetail = definePage<Customer>({
  title: (s) => s.data?.name ?? "Müşteri",
  // Runs before the page shows; aborted when you navigate elsewhere meanwhile.
  async load({ params, signal }) {
    await wait(600, signal)
    const c = all.find((x) => x.id === Number(params.id))
    if (!c) throw new Error(`Müşteri ${params.id} bulunamadı`)
    return c
  },
  setup(ctx) {
    const tab = computed(() => ctx.query.get("tab") ?? "summary")
    const id = computed(() => Number(ctx.params().id))
    return html`<div class="stack-sm">
      <p><a href="/router/customers">‹ Listeye dön</a></p>
      <h3 style="margin:0">${() => ctx.data().name}</h3>
      <bz-tabs variant="pills" .value=${tab} @change.self=${(e: CustomEvent<{ value: string }>) => ctx.query.set({ tab: e.detail.value === "summary" ? null : e.detail.value })}>
        <bz-tab-list>
          <bz-tab value="summary">Özet</bz-tab>
          <bz-tab value="orders">Siparişler</bz-tab>
        </bz-tab-list>
        <bz-tab-panel value="summary">${() => `${ctx.data().city} · ${ctx.data().email} · durum: ${ctx.data().status}`}</bz-tab-panel>
        <bz-tab-panel value="orders">${() => `Toplam ${ctx.data().amount.toLocaleString("tr-TR")} ₺`}</bz-tab-panel>
      </bz-tabs>
      <div class="row">
        <a href=${() => `/router/customers/${id() - 1}`} ?hidden=${() => id() <= 1}>‹ Önceki müşteri</a>
        <a href=${() => `/router/customers/${id() + 1}`}>Sonraki müşteri ›</a>
        <a href="/router/customers/999">Olmayan müşteri (load hatası)</a>
      </div>
      <p class="note">
        <code>load()</code> 600 ms bekler: bu sürede eski sayfa kalır ve üstte ilerleme çubuğu görünür. Sonraki müşteriye geçişte sayfa yeniden
        kurulmaz, sadece <code>params</code> ve <code>data</code> güncellenir. Sekme URL'de (<code>?tab=orders</code>).
      </p>
    </div>`
  },
})

const Settings = definePage({
  title: "Ayarlar (kaydedilmemiş)",
  setup(ctx: PageContext) {
    const saved = signal("Ada Yılmaz")
    const name = signal(saved.peek())
    const dirty = () => name() !== saved()
    ctx.onBeforeLeave(async () =>
      !dirty() ||
      dialogs.confirm({
        heading: "Kaydedilmemiş değişiklikler",
        message: "Sayfadan çıkarsanız değişiklikler kaybolur.",
        variant: "danger",
        confirmText: "Çık",
        cancelText: "Sayfada kal",
      })
    )
    ctx.blockUnload(dirty)
    return html`<div class="stack-sm narrow">
      <bz-input label="Görünen ad" .value=${name} @input=${(e: Event) => name.set((e.currentTarget as HTMLInputElement).value)}></bz-input>
      <div class="row">
        <bz-button variant="primary" ?disabled=${() => !dirty()} @click=${() => (saved.set(name.peek()), toast.success("Kaydedildi"))}>Kaydet</bz-button>
        <span class="muted small">${() => (dirty() ? "Kaydedilmemiş değişiklik var" : "Kaydedildi")}</span>
      </div>
      <p class="note">
        Adı değiştirip başka bir bağlantıya tıklayın veya geri tuşuna basın: <code>onBeforeLeave</code> onay sorar. Sayfayı yenilemeye
        çalışın: tarayıcının kendi uyarısı (<code>blockUnload</code>).
      </p>
    </div>`
  },
})

const isAdmin = signal(false)
const Admin = definePage({ title: "Yönetim", setup: () => html`<p>Yönetim paneli: sadece yetkili kullanıcılar.</p>` })
const Login = definePage({
  title: "Giriş",
  setup: (ctx) => html`<div class="stack-sm">
    <p>Yönetim sayfası için yetki gerekiyor (<code>beforeEnter</code> buraya yönlendirdi).</p>
    <bz-button variant="primary" @click=${() => {
      isAdmin.set(true)
      void ctx.navigate(ctx.query.get("next") ?? "/router")
    }}>Yetkili olarak giriş yap</bz-button>
  </div>`,
})

// ------------------------------------------------------------------ layout

const Layout = definePage({
  setup(ctx) {
    const info = computed(() => ctx.router.current())
    return html`
      <h1>Router</h1>
      <p class="lead">
        URL'den sayfa seçen, sayfaya path parametrelerini ve query string'i signal olarak veren router. Navigation API üzerinde; guard'lar,
        veri yükleme, iç içe layout'lar. Bu playground'un kendisi de bu router ile çalışıyor.
      </p>

      <section class="demo">
        <h2>Canlı örnek</h2>
        <nav class="router-demo-nav" aria-label="Router örneği">
          <a href="/router" data-exact>Giriş</a>
          <a href="/router/customers">Müşteriler</a>
          <a href="/router/customers/3?tab=orders">Müşteri 3 (sekme)</a>
          <a href="/router/settings">Ayarlar</a>
          <a href="/router/admin">Yönetim (guard)</a>
          <a href="/router/nope">Olmayan sayfa</a>
        </nav>
        <div class="router-demo">
          <bz-outlet></bz-outlet>
        </div>
        <table class="api router-info">
          <tbody>
            <tr><td>path</td><td><code>${() => info()?.path}</code></td></tr>
            <tr><td>params</td><td><code>${() => JSON.stringify(info()?.params ?? {})}</code></td></tr>
            <tr><td>query</td><td><code>${() => info()?.query.toString() || "—"}</code></td></tr>
            <tr><td>eşleşen route'lar</td><td><code>${() => info()?.matched.map((r) => r.path || '""').join(" › ")}</code></td></tr>
            <tr><td>pending</td><td><code>${() => String(ctx.router.pending())}</code></td></tr>
          </tbody>
        </table>
        <div class="row">
          <bz-button size="sm" @click=${() => ctx.router.back()}>router.back()</bz-button>
          <bz-button size="sm" @click=${() => ctx.navigate({ path: "/router/customers", query: { page: 3 } })}>navigate({ path, query })</bz-button>
          <bz-button size="sm" @click=${() => isAdmin.set(false)}>Yetkiyi kaldır</bz-button>
        </div>
      </section>

      ${usage(routerUsage)}
    `
  },
})

export const routerRoute: RouteRecord = {
  path: "/router",
  page: Layout,
  children: [
    { path: "", page: Intro },
    { path: "customers", page: CustomerList },
    { path: "customers/:id", page: CustomerDetail },
    { path: "settings", page: Settings },
    { path: "login", page: Login },
    {
      path: "admin",
      page: Admin,
      beforeEnter: (to) => {
        if (isAdmin.peek()) return true
        logEntry("router", "beforeEnter", `${to.path} → /router/login`)
        return `/router/login?next=${encodeURIComponent(to.path)}`
      },
    },
    {
      path: "*",
      page: definePage({ title: "Bulunamadı", setup: (ctx) => html`<p>Bu örnekte <code>${ctx.path}</code> diye bir sayfa yok (iç içe <code>*</code> route'u).</p>` }),
    },
  ],
}
