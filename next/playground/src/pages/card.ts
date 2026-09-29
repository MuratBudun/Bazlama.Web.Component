import { html, signal } from "@bazlama/core"
import { icon, toast } from "@bazlama/headless"
import { cardUsage } from "../docs/specs-card"
import { usage } from "../docs/usage"
import { log, logEntry } from "../log"

interface Module {
  id: string
  title: string
  icon: string
  hue: number
  pending?: number
  keywords?: string
}

// A generic business app launcher.
const APPS: Module[] = [
  { id: "sales", title: "Satış", icon: "chart", hue: 215, pending: 12, keywords: "teklif fırsat müşteri" },
  { id: "crm", title: "Müşteriler", icon: "users", hue: 150 },
  { id: "orders", title: "Siparişler", icon: "box", hue: 18, pending: 8, keywords: "sevkiyat teslimat" },
  { id: "stock", title: "Stok", icon: "archive", hue: 42, keywords: "depo envanter" },
  { id: "purchase", title: "Satın Alma", icon: "building", hue: 268 },
  { id: "finance", title: "Muhasebe", icon: "database", hue: 160 },
  { id: "invoice", title: "Faturalar", icon: "file-text", hue: 205, pending: 5, keywords: "e-fatura ödeme" },
  { id: "hr", title: "İnsan Kaynakları", icon: "users", hue: 350, keywords: "ik personel izin" },
  { id: "projects", title: "Projeler", icon: "layers", hue: 262, pending: 3 },
  { id: "tasks", title: "Görevler", icon: "list", hue: 28, pending: 21 },
  { id: "support", title: "Destek", icon: "message", hue: 22, pending: 7, keywords: "talep bilet" },
  { id: "calendar", title: "Takvim", icon: "calendar", hue: 212 },
  { id: "files", title: "Belgeler", icon: "folder", hue: 45 },
  { id: "reports", title: "Raporlar", icon: "chart", hue: 12 },
  { id: "marketing", title: "Pazarlama", icon: "send", hue: 275, keywords: "kampanya bülten" },
]
const SYSTEM: Module[] = [
  { id: "users", title: "Kullanıcılar", icon: "users", hue: 200 },
  { id: "settings", title: "Ayarlar", icon: "settings", hue: 30 },
  { id: "api", title: "Entegrasyonlar", icon: "code", hue: 220, keywords: "api webhook" },
  { id: "audit", title: "Denetim Kayıtları", icon: "eye", hue: 110 },
  { id: "backup", title: "Yedekleme", icon: "archive", hue: 210 },
]

export default {
  id: "card",
  title: "Card",
  description:
    "bz-card, bz-card-group ve bz-card-list: uygulama başlatıcı, modül listesi, kısayol kartları. Metin filtresi, ızgara/liste görünümü, ok tuşlarıyla iki boyutlu gezinme.",
  render() {
    const query = signal("")
    const view = signal<"grid" | "list">("grid")
    const favorites = signal(new Set(["sales"]))
    const recent = signal(["sales"])
    const visible = signal(APPS.length + SYSTEM.length)
    const pending = APPS.reduce((n, a) => n + (a.pending ?? 0), 0)
    const busy = APPS.filter((a) => a.pending).length
    let search: HTMLElement | undefined

    const open = (m: Module) => {
      recent.update((r) => [m.id, ...r.filter((x) => x !== m.id)].slice(0, 4))
      logEntry("bz-card", "activate", m.title)
      toast.info(`${m.title} açılıyor (demo)`)
    }
    const toggleFavorite = (m: Module) =>
      favorites.update((f) => {
        const next = new Set(f)
        if (next.has(m.id)) next.delete(m.id)
        else next.add(m.id)
        return next
      })
    const card = (m: Module) => html`<bz-card
      heading=${m.title}
      icon=${m.icon}
      hue=${m.hue}
      href=${`#${m.id}`}
      keywords=${m.keywords ?? ""}
      meta=${m.pending ? `${m.pending} bekleyen iş` : ""}
      meta-variant=${m.pending ? "danger" : ""}
      indicator=${m.pending ? "danger" : ""}
      indicator-label=${m.pending ? "Bekleyen iş var" : ""}
      @activate=${() => open(m)}
      @click=${(e: MouseEvent) => (e.target as Element).closest("[data-part=link]") && e.preventDefault()}
    >
      <bz-button slot="actions" size="sm" variant="ghost" aria-label=${`${m.title}: favori`} pressed=${() => String(favorites().has(m.id))}
        data-tooltip=${() => (favorites().has(m.id) ? "Favorilerden çıkar" : "Favorilere ekle")} @click=${() => toggleFavorite(m)}>${icon("star")}</bz-button>
    </bz-card>`
    const byId = new Map([...APPS, ...SYSTEM].map((m) => [m.id, m]))

    return html`
      ${usage(cardUsage)}

      <section class="demo">
        <h2>Uygulama başlatıcı</h2>
        <div class="card-home"
          @keydown=${(e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
              e.preventDefault()
              search?.querySelector("input")?.focus()
            }
          }}>
          <div class="row card-home-head">
            <div>
              <div class="row"><strong class="card-home-greet">İyi akşamlar</strong><bz-badge variant="primary">YÖNETİCİ</bz-badge></div>
              <span class="muted small">29 Eylül Salı · ${APPS.length + SYSTEM.length} uygulama ·
                <bz-badge variant="danger" dot label="Bekleyen iş"></bz-badge> ${pending} bekleyen iş (${busy} modülde)</span>
            </div>
            <span class="spacer"></span>
            <bz-input class="card-home-search" placeholder="Uygulama ve içerikte ara…" aria-label="Uygulama ara" aria-keyshortcuts="Control+K"
              .value=${query} @input=${(e: Event) => query.set((e.currentTarget as HTMLInputElement).value)} ref=${(el: HTMLElement) => (search = el)}>
              <span slot="prefix">${icon("search")}</span>
              <span slot="suffix" class="card-kbd"><kbd>Ctrl</kbd><kbd>K</kbd></span>
            </bz-input>
            <bz-toolbar label="Görünüm">
              <bz-button size="sm" variant="ghost" aria-label="Izgara" data-tooltip="Izgara" pressed=${() => String(view() === "grid")} @click=${() => view.set("grid")}>${icon("dashboard")}</bz-button>
              <bz-button size="sm" variant="ghost" aria-label="Liste" data-tooltip="Liste" pressed=${() => String(view() === "list")} @click=${() => view.set("list")}>${icon("list")}</bz-button>
            </bz-toolbar>
          </div>

          <bz-tabs value="apps">
            <bz-tab-list label="Ana sayfa">
              <bz-tab value="apps">${icon("dashboard")} Uygulamalar</bz-tab>
              <bz-tab value="mine">Benim İşlerim <bz-badge variant="danger" solid count="56"></bz-badge></bz-tab>
              <bz-tab value="created">Oluşturduklarım <bz-badge count="14"></bz-badge></bz-tab>
              <bz-tab value="fav">Favorilerim <bz-badge .count=${() => favorites().size}></bz-badge></bz-tab>
            </bz-tab-list>
            <bz-tab-panel value="apps">
              <div class="stack-sm">
                <div class="row">
                  <span class="card-home-label">Son kullanılanlar</span>
                  ${() => recent().map((id) => html`<bz-chip icon=${byId.get(id)!.icon}>${byId.get(id)!.title}</bz-chip>`)}
                </div>
                <bz-card-list label="Uygulamalar" .view=${view} .filter=${query} min-card-width="17rem"
                  @filter=${(e: CustomEvent<{ visible: number }>) => visible.set(e.detail.visible)}>
                  <bz-card-group heading="İş Uygulamaları" @toggle=${log("bz-card-group")}>${APPS.map(card)}</bz-card-group>
                  <bz-card-group heading="Yönetim">${SYSTEM.map(card)}</bz-card-group>
                  <div slot="empty">"${query}" ile eşleşen uygulama yok.</div>
                </bz-card-list>
              </div>
            </bz-tab-panel>
            <bz-tab-panel value="mine"><p class="muted">Benim işlerim (demo).</p></bz-tab-panel>
            <bz-tab-panel value="created"><p class="muted">Oluşturduklarım (demo).</p></bz-tab-panel>
            <bz-tab-panel value="fav">
              <bz-card-list label="Favoriler" min-card-width="17rem">
                ${() => [...favorites()].map((id) => card(byId.get(id)!))}
                <div slot="empty">Henüz favori yok: kartlardaki yıldızla ekleyin.</div>
              </bz-card-list>
            </bz-tab-panel>
          </bz-tabs>
        </div>
        <p class="note">
          ${visible} kart görünüyor. Arama başlık, açıklama ve <code>keywords</code> içinde arar (ör. "depo"). Kartlar arasında ←/→/↑/↓, Home/End;
          liste tek sekme durağıdır. Yıldız düğmesi kartın bağlantısından ayrı çalışır. Ctrl+K arama kutusuna gider.
        </p>
      </section>

      <section class="demo">
        <h2>Sütun yerleşimi ve düğme kartlar</h2>
        <bz-card-list min-card-width="13rem" label="Hızlı işlemler">
          <bz-card layout="column" clickable heading="Yeni kayıt" description="Boş bir kayıt formu açar." icon="plus" @activate=${() => toast.success("Yeni kayıt")}></bz-card>
          <bz-card layout="column" clickable heading="İçe aktar" description="Excel'den kayıt aktarır." icon="upload" hue="150" @activate=${() => toast.info("İçe aktar")}></bz-card>
          <bz-card layout="column" clickable heading="Raporlar" description="Haftalık özet ve grafikler." icon="chart" hue="262" meta="3 yeni rapor" meta-variant="primary" indicator="primary" indicator-label="Yeni rapor" @activate=${() => toast("Raporlar")}></bz-card>
          <bz-card layout="column" clickable disabled heading="Arşiv" description="Yetkiniz yok." icon="archive" hue="0"></bz-card>
          <bz-card layout="column" heading="Destek" description="Yardım ve iletişim" icon="mail" hue="200">
            <div slot="footer" class="row"><bz-button size="sm" @click=${() => toast("Destek talebi")}>Talep aç</bz-button></div>
          </bz-card>
        </bz-card-list>
      </section>
    `
  },
}

