import { computed, html, render, signal } from "@bazlama/core"
import { dialogs, icon, toast, type TreeItem } from "@bazlama/headless"
import { createRouter } from "@bazlama/router"
import { boot, PLAYGROUND_URL, timeAgo } from "../shared/boot"
import { sourceButton } from "../shared/source"
import "./crm.css"
import customerPage from "./pages/customer"
import customersPage from "./pages/customers"
import dashboardPage from "./pages/dashboard"
import ordersPage from "./pages/orders"
import settingsPage, { savedTheme } from "./pages/settings"
import { activity } from "./store"

/*
 * Ada CRM — the "classic" shell: header and footer across the top and bottom, a menu on the
 * start side (resizable, collapses to an icon rail), an activity panel on the end side,
 * content scrolling inside the frame (scroll-mode="content", the default). Pages fill the
 * height where it helps (data-shell-fill). Hash routing: #/musteriler/12.
 */

boot(savedTheme())

const router = createRouter({
  mode: "hash",
  titleTemplate: (t) => `${t} · Ada CRM`,
  routes: [
    { path: "/", redirect: "/pano" },
    { path: "/pano", page: dashboardPage },
    { path: "/musteriler", page: customersPage },
    // The form is built for one customer: another id needs a new page (remount).
    { path: "/musteriler/:id", page: customerPage, remount: true },
    { path: "/siparisler", page: ordersPage },
    { path: "/ayarlar", page: settingsPage },
  ],
})

const NAV: TreeItem[] = [
  { id: "/pano", label: "Gösterge paneli", icon: "dashboard", href: router.href("/pano") },
  { id: "/musteriler", label: "Müşteriler", icon: "users", href: router.href("/musteriler") },
  { id: "/siparisler", label: "Siparişler", icon: "cart", href: router.href("/siparisler"), badge: 12 },
  { id: "/ayarlar", label: "Ayarlar", icon: "settings", href: router.href("/ayarlar") },
]
/** The menu item of the current page (a customer page belongs to "Müşteriler"). */
const current = computed(() => {
  const path = router.current()?.path ?? "/pano"
  return NAV.find((n) => path === n.id || path.startsWith(`${n.id}/`))?.id ?? ""
})
const unread = signal(3)
const search = signal("")

const app = html`
  <bz-shell resizable persist="ada-crm" resize-label="Paneli boyutlandır" skip-label="İçeriğe geç" end-collapsed .busy=${router.pending}>
    <bz-header slot="header" title="Ada CRM" subtitle="Satış ve müşteri yönetimi" href=${router.href("/pano")} menu-label="Menü" center-label="Müşteri ara"
      user-name="Ada Yılmaz" user-detail="Satış Müdürü" user-label="Kullanıcı menüsü"
      @select=${(e: CustomEvent<{ value: string }>) => {
        if (e.detail.value === "settings") void router.navigate("/ayarlar")
        else if (e.detail.value === "logout") void dialogs.alert({ heading: "Demo", message: "Bu bir demo: çıkış yapılmaz." })
        else toast.info("Profil sayfası bu demoda yok.")
      }}>
      <bz-icon slot="logo" name="chart" size="26" class="crm-logo"></bz-icon>
      <form slot="center" class="crm-search" role="search" @submit=${(e: SubmitEvent) => {
        e.preventDefault()
        void router.navigate({ path: "/musteriler", query: { q: search() } })
      }}>
        <bz-input placeholder="Müşteri, firma veya şehir ara…" aria-label="Müşteri ara" .value=${search}
          @input=${(e: Event) => search.set((e.currentTarget as HTMLInputElement).value)}>
          <span slot="prefix">${icon("search")}</span>
        </bz-input>
      </form>
      <bz-button variant="ghost" size="sm" data-shell-toggle="end" data-tooltip="Aktiviteler" aria-label="Aktiviteler"
        @click=${() => unread.set(0)}>
        ${icon("bell")}<bz-badge variant="danger" solid dot label="Okunmamış aktivite var" ?hidden=${() => unread() === 0}></bz-badge>
      </bz-button>
      <bz-menu-item slot="user-menu" value="profile" icon="user">Profil</bz-menu-item>
      <bz-menu-item slot="user-menu" value="settings" icon="settings">Ayarlar</bz-menu-item>
      <bz-menu-separator slot="user-menu"></bz-menu-separator>
      <bz-menu-item slot="user-menu" value="logout" icon="log-out">Çıkış yap</bz-menu-item>
    </bz-header>

    <nav slot="start" aria-label="Menü" class="crm-nav">
      <bz-tree label="Menü" selection="leaf" .items=${NAV} .value=${current}></bz-tree>
    </nav>

    <bz-outlet></bz-outlet>

    <aside slot="end" class="crm-activity" aria-label="Aktiviteler">
      <div class="row"><strong>Aktiviteler</strong><span class="spacer"></span>
        <bz-button size="sm" variant="ghost" data-shell-toggle="end" aria-label="Paneli kapat">${icon("x")}</bz-button></div>
      <ul class="feed">
        ${() =>
          activity().map(
            (a) => html`<li>
              <bz-avatar name=${a.who} size="sm" decorative></bz-avatar>
              <div><strong>${a.who}</strong> <span class="muted">${a.text}</span><br /><span class="small muted">${icon(a.icon, { size: 12 })} ${timeAgo(a.at)}</span></div>
            </li>`
          )}
      </ul>
    </aside>

    <bz-footer slot="footer">
      © 2026 Ada CRM · Bazlama ile yapılmış demo uygulama
      <span slot="end" class="row">${sourceButton("crm")} <a class="demo-link" href=${PLAYGROUND_URL}>Playground'a dön</a></span>
    </bz-footer>
  </bz-shell>
`

render(app, document.getElementById("app")!)
void router.start()
