import { html } from "@bazlama/core"
import { icon, type TreeItem } from "@bazlama/headless"
import { showSource, type DemoAppId } from "../../apps/shared/source"

export interface DemoApp {
  id: DemoAppId
  title: string
  href: string
  icon: string
  theme: string
  shell: string
  description: string
  components: string[]
}

/** Sample apps built with bazlama; each is its own page (playground/apps/<id>/index.html). */
export const DEMO_APPS: DemoApp[] = [
  {
    id: "crm",
    title: "Ada CRM",
    href: "/apps/crm/",
    icon: "chart",
    theme: "Açık (ayarlardan değişir)",
    shell: "classic · scroll-mode=content · resizable + persist · sol menü ikon şeridine daralır · sağda aktivite paneli",
    description: "Satış ve müşteri yönetimi: gösterge paneli, sayfayı dolduran müşteri grid'i, sekmeli müşteri formu (kaydedilmemiş değişiklik uyarısı), sayfalı siparişler, ayarlar.",
    components: ["bz-shell", "bz-header", "bz-footer", "bz-tree", "bz-data-grid", "bz-data-grid-columns", "bz-table", "bz-pagination", "bz-toolbar", "bz-tabs", "bz-form-layout", "bz-form-section", "bz-input", "bz-combobox", "bz-lookup", "bz-radio-group", "bz-checkbox", "bz-switch", "bz-textarea", "bz-accordion", "bz-alert", "bz-badge", "bz-chip", "bz-avatar", "bz-menu", "bz-context-menu", "bz-panel", "dialogs", "toast", "tooltip", "router"],
  },
  {
    id: "mail",
    title: "Posta",
    href: "/apps/mail/",
    icon: "mail",
    theme: "Koyu",
    shell: "sidebar varyantı · üç bölme (klasörler | liste | okuma paneli) · okuma paneli boyutlandırılır, dar ekranda çekmece",
    description: "E-posta istemcisi: klasörler ve etiketler, iletilerde arama, sağ tık menüsü, okuma paneli araç çubuğu, geri alınabilir işlemler, kişi seçmeli yazma dialogu.",
    components: ["bz-shell (sidebar)", "bz-list", "bz-tree", "bz-lookup (tablo seçici)", "bz-textarea (büyük editör)", "bz-chip (kaldırılabilir)", "bz-toolbar", "openMenu", "contextMenu()", "toast.promise", "dialogs (beforeClose)", "bz-alert", "bz-avatar", "bz-badge"],
  },
  {
    id: "docs",
    title: "Bazlama Rehberi",
    href: "/apps/docs/",
    icon: "book",
    theme: "Forest (marka teması)",
    shell: "scroll-mode=page · belge kayar, header yapışkan · sağ kenar yok · sayfa içi yapışkan içindekiler",
    description: "Dokümantasyon sitesi: kategoriler, makaleler (kod sekmeleri, uyarı kutuları, geri bildirim formu), sayfalı makale listesi, SSS akordeonu, iletişim formu.",
    components: ["bz-shell (page)", "bz-combobox (arama)", "bz-tree", "bz-tabs", "bz-alert", "bz-accordion", "bz-pagination", "bz-toolbar", "bz-chip", "bz-form-layout", "bz-lookup", "bz-textarea", "bz-radio-group", "bz-switch", "bz-checkbox", "bz-panel", "toast.promise"],
  },
]

/** Menu entries: each app opens in a new tab. */
export const demoNav = (): TreeItem[] =>
  DEMO_APPS.map((a) => ({ id: `app:${a.id}`, label: `${a.title} ↗`, icon: a.icon, href: a.href, target: "_blank" }))

export default {
  id: "demo-apps",
  title: "Demo uygulamalar",
  group: "Demo",
  description:
    "Bazlama ile yapılmış örnek uygulamalar: her biri ayrı bir sayfa, farklı bir shell yaklaşımı ve tema. Menüden ya da aşağıdan yeni sekmede açın.",
  render() {
    return html`<div class="demo-apps">
      ${DEMO_APPS.map(
        (a) => html`<section class="demo demo-app-card">
          <div class="row">
            <span class="demo-app-icon">${icon(a.icon, { size: 28 })}</span>
            <div><h2>${a.title}</h2><span class="muted small">Tema: ${a.theme}</span></div>
            <span class="spacer"></span>
            <bz-button variant="ghost" @click=${() => showSource(a.id)}>${icon("code")} Kaynağı göster</bz-button>
            <a class="demo-app-open" href=${a.href} target="_blank" rel="noopener">${icon("external-link", { size: 16 })} Yeni sekmede aç</a>
          </div>
          <p>${a.description}</p>
          <p class="small"><strong>Shell:</strong> ${a.shell}</p>
          <div class="row">${a.components.map((c) => html`<bz-badge variant="primary">${c}</bz-badge>`)}</div>
        </section>`
      )}
    </div>`
  },
}
