import { computed, html, repeat, signal } from "@bazlama/core"
import { dialogs, icon, toast, type TreeItem } from "@bazlama/headless"
import { DOCUMENTS, DOCUMENTS_MENU, MAINTENANCE_MENU, PARAMETERS_MENU } from "./data"
import { home } from "./home"
import { documentList } from "./list"
import { ADEQUACY } from "./adequacy"
import "./qmex.css"

/**
 * QMEX document module mockup (feature adequacy test): the shell, accordion menu, MDI tabs,
 * home work list, "Taslaklar › Doküman No" list and the FRM-008 document form, built only
 * with bazlama components (plus the helpers in ui.ts where a component is missing).
 */

interface AppTab {
  id: string
  title: string
  view: unknown
  closable: boolean
  /** Asked before the tab closes (e.g. unsaved forms inside). */
  canClose?: () => boolean | Promise<boolean>
}

function qmexApp() {
  const tabs = signal<AppTab[]>([])
  const active = signal("home")
  const menuItem = signal("")
  let draftList: ReturnType<typeof documentList> | null = null

  const openTab = (tab: AppTab) => {
    if (!tabs.peek().some((t) => t.id === tab.id)) tabs.update((l) => [...l, tab])
    active.set(tab.id)
  }
  // bz-tabs asks beforeClose, moves the selection, then fires close: remove the tab here.
  const removeTab = (id: string) => {
    tabs.update((l) => l.filter((t) => t.id !== id))
    if (id === "taslaklar:Doküman No") draftList = null
  }
  const beforeClose = (id: string) => tabs.peek().find((t) => t.id === id)?.canClose?.() ?? true

  const openDraftList = () => {
    draftList ??= documentList("Taslaklar · Doküman No")
    const list = draftList
    openTab({ id: "taslaklar:Doküman No", title: "Doküman No", view: list.view, closable: true, canClose: () => list.canCloseAll() })
    return draftList
  }
  const openDoc = (no: string) => {
    const row = DOCUMENTS.find((d) => d.no === no)
    if (!row) return toast.info(`${no} mockup verisinde yok; FRM-00x veya N/A kayıtlarından birini açın.`)
    openDraftList().open(row)
  }
  const openMenu = (item: TreeItem, group: string) => {
    menuItem.set(item.id)
    if (item.id === "taslaklar:Doküman No") return void openDraftList()
    openTab({
      id: item.id,
      title: item.label,
      closable: true,
      view: html`<div class="qx-placeholder">
        ${icon(item.icon ?? "file", { size: 36 })}
        <h3>${group} › ${item.label}</h3>
        <p class="muted">Bu görünüm mockup'ta çizilmedi. "Taslaklar › Doküman No" ve FRM-008 formu çalışan örnek.</p>
        <bz-button variant="primary" @click=${() => openDraftList()}>Doküman No listesini aç</bz-button>
      </div>`,
    })
  }

  tabs.set([{ id: "home", title: "", view: home(openDoc), closable: false }])

  const menuSection = (key: string, heading: string, items: TreeItem[], expanded: string[]) => html`<bz-accordion-item value=${key} heading=${heading}>
    <bz-tree
      label=${heading}
      selection="leaf"
      .items=${items}
      .value=${menuItem}
      .expanded=${expanded}
      @activate=${(e: CustomEvent<{ item: TreeItem }>) => openMenu(e.detail.item, heading)}
    ></bz-tree>
  </bz-accordion-item>`

  const logout = async () => {
    if (await dialogs.confirm({ heading: "Çıkış", message: "Oturumu kapatmak istiyor musunuz?", confirmText: "Çıkış yap" })) toast.info("Çıkış yapıldı (mockup).")
  }

  return html`<bz-shell class="qx-shell" breakpoint="900" skip-label="İçeriğe geç" sticky-footer>
    <bz-header slot="header" class="qx-header" title="Doküman Yönetimi" user-name="Test User 10" user-detail="Firma - Varsayılan" menu-label="Menü"
      @select=${(e: CustomEvent<{ value: string }>) => (e.detail.value === "logout" ? void logout() : toast.info(`${e.detail.value} (mockup)`))}>
      <span slot="logo" class="qx-logo">QMex</span>
      <bz-button variant="ghost" size="sm" aria-label="Kullanıcı ayarları" data-tooltip="Kullanıcı ayarları" @click=${() => toast.info("Kullanıcı ayarları (mockup)")}>${icon("users")}</bz-button>
      <bz-button variant="ghost" size="sm" aria-label="Çıkış" data-tooltip="Çıkış" @click=${logout}>${icon("log-out")}</bz-button>
      <bz-menu-item slot="user-menu" value="Profil" icon="user">Profil</bz-menu-item>
      <bz-menu-item slot="user-menu" value="Şifre değiştir" icon="settings">Şifre değiştir</bz-menu-item>
      <bz-menu-separator slot="user-menu"></bz-menu-separator>
      <bz-menu-item slot="user-menu" value="logout" icon="log-out">Çıkış</bz-menu-item>
    </bz-header>

    <nav slot="start" class="qx-nav" aria-label="QMex menü">
      <bz-accordion fill always-open value="docs">
        ${menuSection("docs", "Dokümanlar", DOCUMENTS_MENU, ["taslaklar"])}
        ${menuSection("params", "Parametreler", PARAMETERS_MENU, [])}
        ${menuSection("maint", "Bakım", MAINTENANCE_MENU, [])}
      </bz-accordion>
    </nav>

    <bz-tabs
      class="qx-mdi"
      .value=${active}
      .beforeClose=${() => beforeClose}
      @change.self=${(e: CustomEvent<{ value: string }>) => active.set(e.detail.value)}
      @close=${(e: CustomEvent<{ value: string }>) => removeTab(e.detail.value)}
    >
      <bz-tab-list>
        ${repeat(
          tabs,
          (t) => t.id,
          (t) =>
            t.closable
              ? html`<bz-tab value=${t.id} closable close-label="Kapat (Delete)">${t.title}</bz-tab>`
              : html`<bz-tab value=${t.id} aria-label="Ana sayfa" data-tooltip="Ana sayfa">${icon("dashboard")}</bz-tab>`
        )}
      </bz-tab-list>
      ${repeat(
        tabs,
        (t) => t.id,
        (t) => html`<bz-tab-panel value=${t.id}>${t.view}</bz-tab-panel>`
      )}
    </bz-tabs>

    <bz-footer slot="footer" class="qx-footer">© 2018 BTS Bilişim <span slot="end">Mockup · bazlama next</span></bz-footer>
  </bz-shell>`
}

export default {
  id: "qmex",
  title: "QMEX Doküman (mockup)",
  group: "Demo",
  wide: true,
  description:
    "Yeterlilik testi: QMEX doküman modülünün (ExtJS 4.2) ana ekranı, Taslaklar › Doküman No listesi ve FRM-008 doküman formu, sadece bazlama bileşenleriyle. Veriler gerçek ekrandan okundu; kaydetme, silme gibi işlemler mockup.",
  render() {
    const fullscreen = signal(false)
    const counts = computed(() => ({
      ok: ADEQUACY.filter((a) => a.status === "ok").length,
      partial: ADEQUACY.filter((a) => a.status === "partial").length,
      missing: ADEQUACY.filter((a) => a.status === "missing").length,
    }))
    return html`
      <section class="demo">
        <div class="row">
          <span class="muted small">
            Deneyin: Taslaklar › Doküman No'yu açın, FRM-008'e çift tıklayın (veya sağ tık › Görüntüle), Güncelle ile düzenleyin, bir alanı değiştirip
            sekmeyi kapatmayı deneyin; Araçlar › Tarihçe; "Doküman ile İlgili Olanlar" › Ekle ▾.
          </span>
          <span class="spacer"></span>
          <bz-button size="sm" pressed=${() => String(fullscreen())} @click=${() => fullscreen.set(!fullscreen())}>${icon("external-link")} Tam ekran</bz-button>
        </div>
        <div class="app-frame qx-frame" ?data-fullscreen=${fullscreen}>${qmexApp()}</div>
      </section>

      <section class="demo">
        <h2>Yeterlilik tablosu</h2>
        <p>
          <bz-badge variant="success">${() => counts().ok} hazır bileşen</bz-badge>
          <bz-badge variant="warning">${() => counts().partial} geçici çözüm</bz-badge>
          <bz-badge variant="danger">${() => counts().missing} eksik</bz-badge>
        </p>
        <div class="usage-scroll">
          <table class="api qx-adequacy">
            <thead><tr><th>QMEX özelliği</th><th>Mockup'ta</th><th>Durum</th><th>Not</th></tr></thead>
            <tbody>
              ${ADEQUACY.map(
                (a) => html`<tr data-status=${a.status}>
                  <td>${a.feature}</td>
                  <td><code>${a.used}</code></td>
                  <td><bz-badge variant=${a.status === "ok" ? "success" : a.status === "partial" ? "warning" : "danger"}>${a.status === "ok" ? "hazır" : a.status === "partial" ? "geçici çözüm" : "eksik"}</bz-badge></td>
                  <td>${a.note}</td>
                </tr>`
              )}
            </tbody>
          </table>
        </div>
      </section>
    `
  },
}
