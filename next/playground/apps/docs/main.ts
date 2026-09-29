import { computed, html, render, signal } from "@bazlama/core"
import { icon, toast, type TreeItem } from "@bazlama/headless"
import { createRouter, definePage } from "@bazlama/router"
import { boot, PLAYGROUND_URL } from "../shared/boot"
import { sourceButton } from "../shared/source"
import { ARTICLES, articleBySlug, CATEGORIES, categoryOf, FAQ, navTree, type Article } from "./content"
import "./docs.css"

/*
 * Rehber — a documentation site on the "page" scroll mode: the document scrolls (search engines,
 * the address bar hiding on phones, browser scroll restoration), the header is sticky and the
 * menu panel sticks below it. Forest (brand) theme. Hash routing: #/makale/router.
 */

boot("forest")

const PAGINATION_TR = { nav: "Sayfalama", previous: "Önceki sayfa", next: "Sonraki sayfa", page: (n: number) => `Sayfa ${n}`, info: (a: number, b: number, t: number) => `${a}–${b} / ${t} makale`, empty: "Makale yok" }
const LOOKUP_TR = { select: "Makale seç", clear: "Temizle", search: "Makale ara", ok: "Seç", cancel: "Vazgeç", empty: "Makale yok", required: "Bir makale seçin." }
const TEXTAREA_TR = { expand: "Genişlet", apply: "Uygula", cancel: "Vazgeç", close: "Kapat" }

const levelVariant = (l: Article["level"]) => (l === "Başlangıç" ? "success" : l === "Orta" ? "info" : "warning")
const meta = (a: Article) => html`<span class="row small">
  <bz-badge variant=${levelVariant(a.level)}>${a.level}</bz-badge>
  <span class="muted">${icon("clock", { size: 13 })} ${a.minutes} dk okuma</span>
  <span class="muted">· ${categoryOf(a.category)?.title}</span>
</span>`

// ------------------------------------------------------------------ pages
const home = definePage({
  title: "Rehber",
  setup(ctx) {
    const news = signal(true)
    return html`<div class="docs-page">
      <section class="docs-hero">
        <h1>Bazlama Rehberi</h1>
        <p class="muted">Sıfır bağımlılıklı web bileşenleriyle uygulama geliştirmenin her adımı.</p>
        ${articleSearch("docs-hero-search")}
      </section>
      ${() =>
        news()
          ? html`<bz-alert variant="success" heading="Yeni" dismissible @dismiss=${() => news.set(false)}>
              Kaydırma modları ve kullanıcı düzenini saklama (persist) üzerine iki yeni makale eklendi.
              <bz-button slot="actions" size="sm" @click=${() => void ctx.navigate("/makale/kaydirma")}>Makaleyi oku</bz-button>
            </bz-alert>`
          : null}
      <h2>Kategoriler</h2>
      <div class="cards">
        ${CATEGORIES.map(
          (c) => html`<a class="card docs-card" href=${ctx.router.href({ path: "/makaleler", query: { kategori: c.id } })}>
            <span class="docs-card-icon">${icon(c.icon, { size: 22 })}</span>
            <strong>${c.title}</strong>
            <span class="muted small">${c.description}</span>
            <span class="small">${ARTICLES.filter((a) => a.category === c.id).length} makale</span>
          </a>`
        )}
      </div>
      <h2>Popüler makaleler</h2>
      <ul class="docs-list">
        ${ARTICLES.slice(0, 5).map(
          (a) => html`<li><a href=${ctx.router.href(`/makale/${a.slug}`)}><strong>${a.title}</strong></a><br /><span class="muted">${a.summary}</span><br />${meta(a)}</li>`
        )}
      </ul>
    </div>`
  },
})

const articlePage = definePage({
  title: (s) => articleBySlug(String(s.params.slug))?.title ?? "Makale bulunamadı",
  setup(ctx) {
    const a = articleBySlug(String(ctx.params().slug))
    if (!a) return html`<div class="docs-page"><bz-alert variant="danger" heading="Makale bulunamadı">Aradığınız makale taşınmış olabilir.</bz-alert></div>`
    const i = ARTICLES.indexOf(a)
    const prev = ARTICLES[i - 1]
    const next = ARTICLES[i + 1]
    const rating = signal("")
    const comment = signal("")
    const sent = signal(false)
    const jump = (id: string) => document.getElementById(`s-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })

    return html`<div class="docs-page docs-article">
      <nav class="small muted" aria-label="Konum">
        <a href=${ctx.router.href("/")}>Rehber</a> ›
        <a href=${ctx.router.href({ path: "/makaleler", query: { kategori: a.category } })}>${categoryOf(a.category)?.title}</a> › ${a.title}
      </nav>
      <header><h1>${a.title}</h1>${meta(a)}<p class="docs-lead">${a.summary}</p></header>

      <div class="docs-article-grid">
        <div class="docs-article-body">
          ${a.sections.map(
            (s) => html`<section id=${`s-${s.id}`}>
              <h2>${s.title}</h2>
              ${s.text.map((p) => html`<p>${p}</p>`)}
              ${s.note ? html`<bz-alert variant=${s.note.variant} heading=${s.note.title}>${s.note.text}</bz-alert>` : null}
              ${s.code
                ? html`<bz-tabs class="docs-code">
                    <bz-tab-list label="Örnek kod"><bz-tab value="html">HTML</bz-tab><bz-tab value="js">JavaScript</bz-tab></bz-tab-list>
                    <bz-tab-panel value="html"><pre><code>${s.code.html}</code></pre></bz-tab-panel>
                    <bz-tab-panel value="js"><pre><code>${s.code.js}</code></pre></bz-tab-panel>
                  </bz-tabs>`
                : null}
            </section>`
          )}

          <bz-panel heading="Bu sayfa yardımcı oldu mu?" open class="docs-feedback">
            ${() =>
              sent()
                ? html`<bz-alert variant="success">Geri bildiriminiz için teşekkürler!</bz-alert>`
                : html`<form class="stack" @submit=${(e: SubmitEvent) => {
                    e.preventDefault()
                    sent.set(true)
                    toast.success("Geri bildirim gönderildi.")
                  }}>
                    <bz-radio-group label="Değerlendirme" orientation="horizontal" required .value=${rating}
                      @change=${(e: CustomEvent<{ value: string }>) => rating.set(e.detail.value)}>
                      <bz-radio value="evet">Evet</bz-radio><bz-radio value="kismen">Kısmen</bz-radio><bz-radio value="hayir">Hayır</bz-radio>
                    </bz-radio-group>
                    ${() =>
                      rating() && rating() !== "evet"
                        ? html`<bz-textarea label="Neyi iyileştirelim?" rows="3" autosize max-rows="8" show-count maxlength="500" .labels=${TEXTAREA_TR}
                            .value=${comment} @input=${(e: Event) => comment.set((e.currentTarget as HTMLTextAreaElement).value)}></bz-textarea>`
                        : null}
                    <bz-checkbox>Gerekirse benimle iletişime geçilebilir</bz-checkbox>
                    <div><bz-button type="submit" variant="primary">Gönder</bz-button></div>
                  </form>`}
          </bz-panel>

          <nav class="docs-pager" aria-label="Önceki ve sonraki makale">
            ${prev ? html`<a class="card" href=${ctx.router.href(`/makale/${prev.slug}`)}><span class="small muted">${icon("chevron-left", { size: 14 })} Önceki</span><strong>${prev.title}</strong></a>` : html`<span></span>`}
            ${next ? html`<a class="card docs-next" href=${ctx.router.href(`/makale/${next.slug}`)}><span class="small muted">Sonraki ${icon("chevron-right", { size: 14 })}</span><strong>${next.title}</strong></a>` : null}
          </nav>
        </div>

        <aside class="docs-toc" aria-label="Bu sayfada">
          <strong class="small">Bu sayfada</strong>
          ${a.sections.map((s) => html`<button type="button" class="docs-toc-link" @click=${() => jump(s.id)}>${s.title}</button>`)}
        </aside>
      </div>
    </div>`
  },
})

const listPage = definePage({
  title: "Tüm makaleler",
  setup(ctx) {
    const category = () => ctx.query.get("kategori") ?? ""
    const page = () => ctx.query.number("sayfa", 1)
    const q = signal("")
    const PER_PAGE = 5
    const filtered = computed(() =>
      ARTICLES.filter((a) => (!category() || a.category === category()) && (!q() || `${a.title} ${a.summary}`.toLocaleLowerCase("tr-TR").includes(q().toLocaleLowerCase("tr-TR"))))
    )
    const visible = computed(() => filtered().slice((page() - 1) * PER_PAGE, page() * PER_PAGE))
    return html`<div class="docs-page">
      <h1>Tüm makaleler</h1>
      <bz-toolbar label="Filtreler" wrap>
        <bz-input placeholder="Makalelerde ara" aria-label="Makalelerde ara" .value=${q}
          @input=${(e: Event) => (q.set((e.currentTarget as HTMLInputElement).value), void ctx.query.set({ sayfa: null }))}>
          <span slot="prefix">${icon("search")}</span>
        </bz-input>
        <bz-toolbar-separator></bz-toolbar-separator>
        <div role="group" aria-label="Kategori" class="row">
          <bz-chip selectable .selected=${() => !category()} @change=${() => void ctx.query.set({ kategori: null, sayfa: null })}>Tümü</bz-chip>
          ${CATEGORIES.map(
            (c) => html`<bz-chip selectable icon=${c.icon} .selected=${() => category() === c.id} @change=${() => void ctx.query.set({ kategori: c.id, sayfa: null })}>${c.title}</bz-chip>`
          )}
        </div>
      </bz-toolbar>
      <ul class="docs-list">
        ${() =>
          visible().length
            ? visible().map(
                (a) => html`<li><a href=${ctx.router.href(`/makale/${a.slug}`)}><strong>${a.title}</strong></a><br /><span class="muted">${a.summary}</span><br />${meta(a)}</li>`
              )
            : html`<li class="muted">Aramanızla eşleşen makale yok.</li>`}
      </ul>
      <bz-pagination .total=${() => filtered().length} page-size=${PER_PAGE} .page=${page} show-info .labels=${PAGINATION_TR}
        @change=${(e: CustomEvent<{ page: number }>) => void ctx.query.set({ sayfa: e.detail.page > 1 ? e.detail.page : null }, { replace: false })}></bz-pagination>
    </div>`
  },
})

const faqPage = definePage({
  title: "Sık sorulanlar",
  setup() {
    return html`<div class="docs-page">
      <h1>Sık sorulanlar</h1>
      <p class="muted">Kapalı yanıtlar da sayfa içi aramada (Ctrl+F) bulunur ve açılır.</p>
      <bz-accordion multiple>
        ${FAQ.map((f, i) => html`<bz-accordion-item value=${String(i)} heading=${f.q}><p>${f.a}</p></bz-accordion-item>`)}
      </bz-accordion>
      <bz-alert variant="info" heading="Sorunuz burada yok mu?">
        Bize yazın; genellikle bir iş günü içinde yanıtlıyoruz.
        <bz-button slot="actions" size="sm" variant="primary" data-href="/iletisim" @click=${() => void router.navigate("/iletisim")}>İletişim formu</bz-button>
      </bz-alert>
    </div>`
  },
})

const contactPage = definePage({
  title: "İletişim",
  setup(ctx) {
    const topic = signal("Soru")
    return html`<div class="docs-page">
      <h1>İletişim</h1>
      <p class="muted">Sorularınızı, önerilerinizi ve hata bildirimlerinizi bekliyoruz.</p>
      <form @submit=${(e: SubmitEvent) => {
        e.preventDefault()
        const form = e.currentTarget as HTMLFormElement
        void toast.promise(new Promise((r) => setTimeout(r, 900)), { loading: "Gönderiliyor…", success: "Mesajınız alındı. Teşekkürler!", error: "Gönderilemedi." }).then(() => {
          form.reset()
          void ctx.navigate("/")
        })
      }}>
        <bz-form-layout columns="2" min-column-width="16rem">
          <bz-input label="Ad soyad" name="name" required autocomplete="name"></bz-input>
          <bz-input label="E-posta" name="email" type="email" required autocomplete="email"></bz-input>
          <bz-combobox label="Konu" name="topic" .value=${topic} @change=${(e: CustomEvent<{ value: string }>) => topic.set(e.detail.value)}>
            <bz-option>Soru</bz-option><bz-option>Öneri</bz-option><bz-option>Hata bildirimi</bz-option><bz-option>Diğer</bz-option>
          </bz-combobox>
          <bz-lookup label="İlgili makale" name="article" clearable dialog-size="lg" .labels=${LOOKUP_TR} display-key="title"
            .columns=${[{ key: "title", header: "Makale" }, { key: "level", header: "Seviye", width: "7rem" }]}
            .rows=${ARTICLES.map((a) => ({ id: a.slug, title: a.title, level: a.level }))}></bz-lookup>
          ${() =>
            topic() === "Hata bildirimi"
              ? html`<bz-alert variant="warning" data-span="full">Hata bildirirken tarayıcınızı ve adımları yazarsanız daha hızlı çözebiliriz.</bz-alert>`
              : null}
          <bz-textarea label="Mesaj" name="message" required minlength="20" rows="5" autosize max-rows="14" expandable show-count maxlength="2000"
            data-span="full" .labels=${TEXTAREA_TR}></bz-textarea>
          <bz-radio-group label="Size nasıl dönelim?" name="reply" value="email" orientation="horizontal">
            <bz-radio value="email">E-posta</bz-radio><bz-radio value="phone">Telefon</bz-radio>
          </bz-radio-group>
          <bz-switch name="newsletter">Yeni makalelerden haberdar et</bz-switch>
          <bz-checkbox name="consent" required data-span="full">Kişisel verilerimin bu talep için işlenmesini kabul ediyorum.</bz-checkbox>
          <bz-form-actions>
            <bz-button type="reset">Temizle</bz-button>
            <bz-button type="submit" variant="primary">${icon("send")} Gönder</bz-button>
          </bz-form-actions>
        </bz-form-layout>
      </form>
    </div>`
  },
})

// ------------------------------------------------------------------ app
const router = createRouter({
  mode: "hash",
  titleTemplate: (t) => (t === "Rehber" ? "Bazlama Rehberi" : `${t} · Bazlama Rehberi`),
  routes: [
    { path: "/", page: home },
    // The page reads its article once: another slug needs a new page (remount).
    { path: "/makale/:slug", page: articlePage, remount: true },
    { path: "/makaleler", page: listPage },
    { path: "/sss", page: faqPage },
    { path: "/iletisim", page: contactPage },
  ],
})

/** Search box: pick an article to open it. */
function articleSearch(cls = "") {
  return html`<bz-combobox class=${cls} placeholder="Rehberde ara…" aria-label="Rehberde ara"
    @change=${(e: CustomEvent<{ value: string }>) => {
      if (e.detail.value) void router.navigate(`/makale/${e.detail.value}`)
      ;(e.currentTarget as HTMLElement & { value: string }).value = ""
    }}>
    ${ARTICLES.map((a) => html`<bz-option value=${a.slug} label=${a.title}>${a.title}</bz-option>`)}
  </bz-combobox>`
}

const NAV: TreeItem[] = navTree((path) => router.href(path))
const expanded = CATEGORIES.map((c) => `kategori:${c.id}`)
const current = computed(() => router.current()?.path ?? "/")

const app = html`
  <bz-shell scroll-mode="page" breakpoint="900" skip-label="İçeriğe geç" .busy=${router.pending}>
    <bz-header slot="header" title="Bazlama Rehberi" subtitle="Dokümantasyon" href=${router.href("/")} menu-label="Menü">
      <bz-icon slot="logo" name="book" size="26"></bz-icon>
      <div slot="center" class="docs-header-search">${articleSearch()}</div>
      <bz-button variant="ghost" size="sm" data-tooltip="GitHub (demo)" aria-label="GitHub" @click=${() => toast.info("Demo: dış bağlantı yok.")}>${icon("code")}</bz-button>
    </bz-header>
    <nav slot="start" aria-label="Rehber">
      <bz-tree label="Rehber" selection="leaf" .items=${NAV} .value=${current} .expanded=${expanded}></bz-tree>
    </nav>
    <bz-outlet></bz-outlet>
    <bz-footer slot="footer">
      © 2026 Bazlama · Rehber demo (scroll-mode="page", forest teması)
      <span slot="end" class="row">${sourceButton("docs")} <a class="demo-link" href=${router.href("/iletisim")}>İletişim</a> · <a class="demo-link" href=${PLAYGROUND_URL}>Playground'a dön</a></span>
    </bz-footer>
  </bz-shell>
`

render(app, document.getElementById("app")!)
void router.start()
