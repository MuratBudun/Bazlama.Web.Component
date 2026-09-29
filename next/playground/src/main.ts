import { defineIcons, dialogs, icon, toast, type TreeItem } from "@bazlama/headless"
import * as icons from "@bazlama/icons"
import { computed, effect, html, render, signal } from "@bazlama/core"
import { createRouter, definePage, type RouteRecord } from "@bazlama/router"
import themesCss from "../../packages/themes/src/index.css?inline"
import uiCss from "../../packages/ui/src/index.css?inline"
import "./app.css"
import { EventLog } from "./log"
import button from "./pages/button"
import coreComponent from "./pages/core-component"
import coreSignals from "./pages/core-signals"
import coreTemplate from "./pages/core-template"
import debug from "./pages/debug"
import dialog from "./pages/dialog"
import tabs from "./pages/tabs"
import accordionPage from "./pages/accordion"
import alertPage from "./pages/alert"
import badgePage from "./pages/badge"
import menuPage from "./pages/menu"
import contextMenuPage from "./pages/context-menu"
import toastPage from "./pages/toast"
import tooltipPage from "./pages/tooltip"
import iconPage from "./pages/icon"
import tree from "./pages/tree"
import combobox from "./pages/combobox"
import input from "./pages/input"
import passwordPage from "./pages/password"
import fileUploadPage from "./pages/file-upload"
import loginPage from "./pages/login"
import textareaPage from "./pages/textarea"
import checkboxPage from "./pages/checkbox"
import switchPage from "./pages/switch"
import radioPage from "./pages/radio"
import lookupPage from "./pages/lookup"
import formLayoutPage from "./pages/form-layout"
import paginationPage from "./pages/pagination"
import toolbarPage from "./pages/toolbar"
import dataGridPage from "./pages/data-grid"
import cardPage from "./pages/card"
import list from "./pages/list"
import panel from "./pages/panel"
import table from "./pages/table"
import { routerRoute } from "./pages/router"
import { pageRoute } from "./pages/page"
import shellPage from "./pages/shell"
import avatarPage from "./pages/avatar"
import qmexPage from "./pages/qmex"
import demoAppsPage, { demoNav } from "./pages/demo-apps"

interface Page {
  id: string
  title: string
  description: string
  group?: string
  /** Full-width page without the global event log. */
  wide?: boolean
  render(): unknown
}

defineIcons(icons)
Object.assign(dialogs.labels, { ok: "Tamam", cancel: "Vazgeç", close: "Kapat" })
Object.assign(toast.labels, { close: "Kapat", region: "Bildirimler" })

const pages: Page[] = [coreSignals, coreTemplate, coreComponent, button, input, passwordPage, textareaPage, checkboxPage, switchPage, radioPage, combobox, lookupPage, fileUploadPage, loginPage, formLayoutPage, panel, list, table, dataGridPage, cardPage, paginationPage, toolbarPage, iconPage, tree, dialog, tabs, accordionPage, alertPage, badgePage, menuPage, contextMenuPage, toastPage, tooltipPage, avatarPage, shellPage, demoAppsPage, qmexPage, debug]
const pageIcons: Record<string, string> = {
  "core-signals": "refresh",
  "core-template": "code",
  "core-component": "box",
  button: "cursor-click",
  input: "edit",
  password: "lock",
  "file-upload": "upload",
  login: "user",
  textarea: "file-text",
  checkbox: "check",
  switch: "settings",
  radio: "circle-check",
  lookup: "search",
  "form-layout": "dashboard",
  pagination: "chevrons-right",
  "data-grid": "database",
  card: "dashboard",
  toolbar: "more-horizontal",
  panel: "layers",
  list: "list",
  combobox: "search",
  table: "table",
  icon: "star",
  tree: "folder",
  dialog: "layers",
  tabs: "folder-open",
  accordion: "layers",
  alert: "alert",
  badge: "tag",
  menu: "menu",
  "context-menu": "cursor-click",
  toast: "bell",
  tooltip: "info",
  debug: "bug",
  shell: "dashboard",
  avatar: "user",
  qmex: "file-text",
  "demo-apps": "box",
}
const groupIcons: Record<string, string> = { Core: "layers", "Bileşenler": "dashboard", Navigasyon: "external-link", Demo: "box", "Araçlar": "settings" }
const groups = [...new Set(pages.map((p) => p.group ?? "Bileşenler"))]

// The sidebar is a <bz-tree>: groups are parents, pages are links.
// Layout routes (with children) are not in `pages`: listed here.
const extraNav: Record<string, TreeItem[]> = {
  Navigasyon: [
    { id: "page", label: "Page", icon: "file-text", href: "/page" },
    { id: "router", label: "Router", icon: "external-link", href: "/router" },
  ],
  // The demo apps are separate pages: they open in a new tab.
  Demo: demoNav(),
}
const navItems: TreeItem[] = groups.map((group) => ({
  id: `group:${group}`,
  label: group,
  icon: groupIcons[group],
  children: pages
    .filter((page) => (page.group ?? "Bileşenler") === group)
    .map((page): TreeItem => ({ id: page.id, label: page.title, icon: pageIcons[page.id], href: `/${page.id}` }))
    .concat(extraNav[group] ?? []),
}))

const addStyle = (css: string) => document.head.appendChild(Object.assign(document.createElement("style"), { textContent: css }))
addStyle(themesCss)
const uiStyle = addStyle(uiCss)

const stored = (key: string, fallback: string) => {
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}
const persist = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* storage unavailable */
  }
}

const theme = signal(stored("bz-theme", "light"))
const uiEnabled = signal(stored("bz-ui", "on") === "on")
// Every playground page is a route: /button, /dialog, …
const routes: RouteRecord[] = [
  { path: "/", redirect: `/${pages[0].id}` },
  { path: "/app", redirect: "/shell" },
  ...pages.map(
    (page): RouteRecord => ({
      path: `/${page.id}`,
      title: page.title,
      meta: { wide: !!page.wide },
      page: definePage({
        setup: () => html`<h1>${page.title}</h1>
          <p class="lead">${page.description}</p>
          ${page.render()}`,
      }),
    })
  ),
  pageRoute,
  routerRoute,
]
const router = createRouter({
  routes,
  titleTemplate: (title) => `${title} · Bazlama next`,
  errorPage: definePage({
    title: "Hata",
    setup: (ctx) => html`<div class="error-page"><h3>Bir hata oluştu</h3><p>${() => String((ctx.error() as Error)?.message ?? ctx.error())}</p>
      <bz-button size="sm" @click=${() => ctx.router.back()}>Geri dön</bz-button></div>`,
  }),
  notFound: definePage({
    title: "Bulunamadı",
    setup: (ctx) => html`<h1>Sayfa bulunamadı</h1><p class="lead"><code>${ctx.path}</code> için bir sayfa yok.</p>`,
  }),
})
// Programmatic dialogs live in <body>, outside the page: close them before leaving
// (a dialog guard that refuses keeps the page).
router.beforeLeave(() => dialogs.closeAll())
const current = computed(() => router.current())
const pageId = computed(() => current()?.path.split("/")[1] ?? "")
const wide = computed(() => !!current()?.matched.at(-1)?.meta?.wide)

effect(() => {
  document.documentElement.dataset.theme = theme()
  persist("bz-theme", theme())
})
effect(() => {
  uiStyle.disabled = !uiEnabled()
  persist("bz-ui", uiEnabled() ? "on" : "off")
})

const app = html`
  <bz-shell skip-label="İçeriğe geç" .busy=${router.pending} data-wide=${() => wide() || null} end-collapsed=${() => (wide() ? "" : null)}
    resizable resize-label="Paneli boyutlandır" persist="playground">
    <bz-header slot="header" title="Bazlama next" subtitle="core · headless · ui · themes · router" href="/" menu-label="Menü">
      <bz-icon slot="logo" name="layers" size="28" class="accent"></bz-icon>
      <label class="field">
        Tema
        <select .value=${theme} @change=${(e: Event) => theme.set((e.target as HTMLSelectElement).value)}>
          <option value="light">Açık</option>
          <option value="dark">Koyu</option>
          <option value="forest">Forest (marka)</option>
        </select>
      </label>
      <label class="field" title="Kapatınca bileşenler headless (stilsiz) görünür">
        <input type="checkbox" .checked=${uiEnabled} @change=${(e: Event) => uiEnabled.set((e.target as HTMLInputElement).checked)} />
        UI CSS
      </label>
      <bz-button variant="ghost" size="sm" data-shell-toggle="end" data-tooltip="Olay günlüğü" aria-label="Olay günlüğü">${icon("list")}</bz-button>
    </bz-header>
    <nav slot="start" aria-label="Sayfalar">
      <bz-tree label="Sayfalar" selection="leaf" .items=${navItems} .value=${pageId} .expanded=${navItems.map((g) => g.id)}></bz-tree>
    </nav>
    <bz-outlet class="content"></bz-outlet>
    <aside slot="end" class="log" aria-label="Olay günlüğü">${EventLog()}</aside>
    <bz-footer slot="footer">
      Bazlama next · deneysel yeniden tasarım
      <span slot="end">Sıfır bağımlılık · Navigation API · Popover API</span>
    </bz-footer>
  </bz-shell>
`

const cls = signal("foo")
const name = signal("Bazlama")
const onClick = () => {
  cls.set(cls() === "foo" ? "bar" : "foo")
  name.set(name() === "Bazlama" ? "Next" : "Bazlama")
}

const tt = html`<p class=${cls} @click=${onClick}>Merhaba ${name}</p>`
console.log(tt)

render(app, document.getElementById("app")!)

// Old hash links (#button) → /button.
const legacy = location.hash.slice(1)
if (legacy && pages.some((p) => p.id === legacy)) history.replaceState(null, "", `/${legacy}`)
void router.start()
