import { html, signal } from "@bazlama/core"
import { icon, type ShellElement, type TreeItem } from "@bazlama/headless"
import { codeBlock } from "../docs/code"
import { headerUsage, shellUsage } from "../docs/specs-shell"
import { usage } from "../docs/usage"
import { logEntry } from "../log"

const SECTIONS: TreeItem[] = [
  { id: "dashboard", label: "Gösterge paneli", icon: "dashboard" },
  {
    id: "sales",
    label: "Satış",
    icon: "cart",
    children: [
      { id: "orders", label: "Siparişler", icon: "file-text", badge: 4 },
      { id: "invoices", label: "Faturalar", icon: "file" },
    ],
  },
  { id: "customers", label: "Müşteriler", icon: "users" },
  { id: "settings", label: "Ayarlar", icon: "settings" },
]
const LABELS: Record<string, string> = {
  dashboard: "Gösterge paneli",
  orders: "Siparişler",
  invoices: "Faturalar",
  customers: "Müşteriler",
  settings: "Ayarlar",
}
const WIDTHS = [
  ["100%", "Geniş"],
  ["760px", "Tablet"],
  ["380px", "Telefon"],
] as const
const REGIONS = [
  ["header", "Header"],
  ["start", "Sol kenar"],
  ["end", "Sağ kenar"],
  ["footer", "Footer"],
] as const
type Region = (typeof REGIONS)[number][0]

export default {
  id: "shell",
  title: "Shell",
  group: "Navigasyon",
  description:
    "Uygulama yerleşimi: header, footer, sol ve sağ kenar içeriğin etrafında; içerik dışındaki her bölge isteğe bağlı. Shell yerleşimi, daraltmayı ve dar ekranda çekmeceleri yönetir; bölgelere ne konacağı uygulamanın tercihi. Bu playground da <bz-shell> ile çiziliyor.",
  render() {
    const width = signal<string>("100%")
    const variant = signal<"classic" | "sidebar">("classic")
    const regions = signal<Record<Region, boolean>>({ header: true, start: true, end: true, footer: true })
    const stickyFooter = signal(false)
    const busy = signal(false)
    const section = signal("dashboard")
    const state = signal("")
    let shell: ShellElement | null = null

    const describe = () => {
      if (!shell) return
      const mode = shell.hasAttribute("data-compact") ? "dar (çekmeceler)" : "geniş"
      const flags = ["start-open", "end-open", "start-collapsed", "end-collapsed"].filter((a) => shell!.hasAttribute(a))
      state.set(`${mode}${flags.length ? ` · ${flags.join(" · ")}` : ""}`)
    }
    const later = () => setTimeout(describe, 60)

    const demo = () => {
      const r = regions()
      return html`<bz-shell
        variant=${variant}
        breakpoint="720"
        skip-label="İçeriğe geç"
        ?sticky-footer=${stickyFooter}
        .busy=${busy}
        @toggle=${(e: CustomEvent) => {
          logEntry("bz-shell", "toggle", JSON.stringify(e.detail))
          later()
        }}
        ref=${(el: ShellElement) => {
          shell = el
          later()
        }}
      >
        ${r.header
          ? html`<bz-header slot="header" title="Demo ERP" subtitle="Satış ve stok" user-name="Ada Yılmaz" user-detail="Yönetici" menu-label="Menü"
              @select=${(e: CustomEvent<{ value: string }>) => logEntry("kullanıcı menüsü", "select", e.detail.value)}>
              <bz-icon slot="logo" name="box" size="26" class="accent"></bz-icon>
              <bz-button variant="ghost" size="sm" aria-label="Bildirimler" data-tooltip="Bildirimler">${icon("bell")}</bz-button>
              <bz-button variant="ghost" size="sm" data-shell-toggle="end" aria-label="Detay paneli" data-tooltip="Detay paneli">${icon("layers")}</bz-button>
              <bz-menu-item slot="user-menu" value="profile" icon="user">Profil</bz-menu-item>
              <bz-menu-item slot="user-menu" value="settings" icon="settings">Ayarlar</bz-menu-item>
              <bz-menu-separator slot="user-menu"></bz-menu-separator>
              <bz-menu-item slot="user-menu" value="logout" icon="log-out">Çıkış yap</bz-menu-item>
            </bz-header>`
          : null}
        ${r.start
          ? html`<nav slot="start" aria-label="Demo menüsü">
              <bz-tree label="Demo menüsü" selection="leaf" .items=${SECTIONS} .value=${section} .expanded=${["sales"]}
                @select=${(e: CustomEvent<{ id: string }>) => section.set(e.detail.id)}></bz-tree>
            </nav>`
          : null}
        <div class="app-frame-main">
          <h3>${() => LABELS[section()] ?? section()}</h3>
          <p class="muted">İçerik (<code>&lt;main&gt;</code>): shell'in tek zorunlu bölgesi.</p>
          ${r.start || r.end
            ? null
            : html`<p class="muted small">Kenar yok: menü düğmesi kendiliğinden gizlenir.</p>`}
          ${Array.from({ length: 14 }, (_, i) => html`<p class="app-frame-line">Satır ${i + 1}: header yapışkan kalır, kenar panelleri kendi kayar.</p>`)}
        </div>
        ${r.end
          ? html`<aside slot="end" class="app-frame-aside" aria-label="Detay">
              <strong>Detay paneli</strong>
              <p class="muted small">slot="end": filtreler, kayıt ayrıntısı, günlük. Header'daki katman düğmesi (data-shell-toggle="end") açar/kapatır.</p>
              <bz-button size="sm" @click=${() => shell?.close("end")}>shell.close("end")</bz-button>
            </aside>`
          : null}
        ${r.footer
          ? html`<bz-footer slot="footer">© 2026 Demo ERP <span slot="end">v1.4.2 · <a href="#yardim">Yardım</a></span></bz-footer>`
          : null}
      </bz-shell>`
    }

    return html`
      ${usage(shellUsage)}

      <section class="demo">
        <h2>Canlı örnek</h2>
        <div class="row">
          ${WIDTHS.map(
            ([w, label]) =>
              html`<bz-button size="sm" pressed=${() => String(width() === w)} @click=${() => {
                width.set(w)
                later()
              }}>${label}</bz-button>`
          )}
          <span class="spacer"></span>
          <label class="field">Varyant
            <select .value=${variant} @change=${(e: Event) => variant.set((e.target as HTMLSelectElement).value as "classic" | "sidebar")}>
              <option value="classic">classic</option>
              <option value="sidebar">sidebar</option>
            </select>
          </label>
          <label class="check"><input type="checkbox" .checked=${stickyFooter} @change=${(e: Event) => stickyFooter.set((e.target as HTMLInputElement).checked)} /> sticky-footer</label>
          <bz-button size="sm" @click=${() => {
            busy.set(true)
            setTimeout(() => busy.set(false), 1500)
          }}>busy</bz-button>
        </div>
        <div class="row">
          <span class="muted small">Bölgeler:</span>
          ${REGIONS.map(
            ([key, label]) => html`<label class="check"><input type="checkbox" .checked=${() => regions()[key]}
              @change=${(e: Event) => regions.update((r) => ({ ...r, [key]: (e.target as HTMLInputElement).checked }))} /> ${label}</label>`
          )}
          <span class="spacer"></span>
          <span class="muted small">Durum: <code>${state}</code></span>
        </div>

        <div class="app-frame" style=${() => `width:${width()}`}>${demo}</div>

        <p class="note">
          Genişken menü düğmesi sol kenarı ikon şeridine daraltır, katman düğmesi sağ kenarı gizler. Tablet/Telefon genişliğinde shell dar moda
          geçer (<code>breakpoint="720"</code>, kendi genişliğini ölçer): iki kenar da çekmece olur ve aynı anda biri açıktır. Açıkken geri kalanı
          <code>inert</code>, odak seçili öğeye gider; Esc, örtü veya bir bağlantı kapatır ve odak açan düğmeye döner.
        </p>
      </section>

      ${usage(headerUsage)}

      <section class="demo">
        <h2>Bu playground</h2>
        ${codeBlock(
          `<bz-shell .busy=\${router.pending} end-collapsed=\${() => wide() ? "" : null}>
  <bz-header slot="header" title="Bazlama next" subtitle="core · headless · ui · themes · router" href="/">
    <bz-icon slot="logo" name="layers" size="28"></bz-icon>
    …tema seçimi, UI CSS…
    <bz-button variant="ghost" data-shell-toggle="end" aria-label="Olay günlüğü">\${icon("list")}</bz-button>
  </bz-header>
  <nav slot="start"><bz-tree selection="leaf" .items=\${menu} .value=\${pageId}></bz-tree></nav>
  <bz-outlet class="content"></bz-outlet>
  <aside slot="end" class="log">\${EventLog()}</aside>
  <bz-footer slot="footer">… <span slot="end">…</span></bz-footer>
</bz-shell>`,
          "src/main.ts (özet)"
        )}
      </section>
    `
  },
}
