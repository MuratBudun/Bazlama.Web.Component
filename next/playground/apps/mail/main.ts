import { computed, effect, html, render, signal } from "@bazlama/core"
import { contextMenu, icon, toast, type ShellElement } from "@bazlama/headless"
import { createRouter, definePage } from "@bazlama/router"
import { boot, PLAYGROUND_URL } from "../shared/boot"
import { sourceButton } from "../shared/source"
import { compose } from "./compose"
import "./mail.css"
import { reader } from "./reader"
import { FOLDER_LABEL, folderItems, inFolder, LABEL_VARIANT, LABELS, mails, move, unreadCount, update, type Folder } from "./store"

/*
 * Posta — the "sidebar" shell variant in the dark theme: the side panels take the full height
 * (header and footer sit between them), three panes: folders | message list | reading pane
 * (the end side, resizable). On a narrow screen the reading pane is a drawer that opens with
 * a message. Hash routing: #/gelen/12.
 */

boot("dark")

const folder = signal<Folder>("gelen")
const openId = signal<number | null>(null)
const labelFilter = signal<string | null>(null)
const query = signal("")
let shell: ShellElement | undefined

const listPage = definePage({
  title: (s) => FOLDER_LABEL[s.params.folder as Folder] ?? "Posta",
  setup(ctx) {
    effect(() => {
      const f = (ctx.params().folder as Folder) ?? "gelen"
      folder.set(f in FOLDER_LABEL ? f : "gelen")
      const id = Number(ctx.params().id)
      openId.set(Number.isFinite(id) && id > 0 ? id : null)
    })
    const list = computed(() => {
      const q = query().toLocaleLowerCase("tr-TR").trim()
      const label = labelFilter()
      return mails()
        .filter((m) => inFolder(m, folder()) && (!label || m.labels.includes(label)))
        .filter((m) => !q || `${m.from} ${m.subject} ${m.body}`.toLocaleLowerCase("tr-TR").includes(q))
        .sort((a, b) => b.at.getTime() - a.at.getTime())
    })
    const open = (id: string) => {
      void ctx.navigate(`/${folder.peek()}/${id}`)
      // On a narrow screen the reading pane is a drawer.
      if (shell?.hasAttribute("data-compact")) shell.open("end")
    }
    const time = (d: Date) =>
      Date.now() - d.getTime() < 86400000 ? d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })

    return html`<div class="mail-list-page">
      <div class="mail-list-head">
        <h1>${() => FOLDER_LABEL[folder()]}</h1>
        ${() => (labelFilter() ? html`<bz-chip removable variant=${LABEL_VARIANT[labelFilter()!]} remove-label="Filtreyi kaldır" @remove=${() => labelFilter.set(null)}>${labelFilter()}</bz-chip>` : null)}
        <span class="spacer"></span>
        <span class="muted small">${() => list().length} ileti</span>
      </div>
      <bz-list class="mail-list" data-shell-fill label="İletiler" .value=${() => String(openId() ?? "")}
        @change=${(e: CustomEvent<{ value: string }>) => open(e.detail.value)}
        ref=${(el: HTMLElement) => contextMenu(el, (event) => {
          // Right click on a message: the actions for that message.
          const option = (event.target as Element).closest("bz-option")
          const m = option && mails.peek().find((x) => String(x.id) === option.getAttribute("value"))
          if (!m) return null
          return [
            { label: "Yanıtla", value: "reply", icon: "reply", shortcut: "R", onSelect: () => void compose(m) },
            { label: m.unread ? "Okundu yap" : "Okunmadı yap", value: "read", icon: "mail", onSelect: () => update(m.id, { unread: !m.unread }) },
            { label: m.starred ? "Yıldızı kaldır" : "Yıldızla", value: "star", icon: "star", onSelect: () => update(m.id, { starred: !m.starred }) },
            { type: "separator" as const },
            { label: "Arşivle", value: "archive", icon: "archive", onSelect: () => (move(m.id, "arsiv"), toast("İleti arşivlendi.")) },
            { label: "Sil", value: "delete", icon: "trash", variant: "danger", onSelect: () => (move(m.id, "cop"), toast("İleti çöp kutusuna taşındı.")) },
          ]
        })}>
        ${() =>
          list().length
            ? list().map(
                (m) => html`<bz-option value=${String(m.id)} label=${m.subject} data-unread=${m.unread ? "" : null}>
                  <bz-avatar name=${m.from} size="sm" decorative></bz-avatar>
                  <span class="mail-item">
                    <span class="mail-item-top"><span class="mail-from">${m.from}</span><span class="spacer"></span>
                      ${m.attachments.length ? icon("paperclip", { size: 13 }) : null}${m.starred ? icon("star", { size: 13 }) : null}
                      <span class="small muted">${time(m.at)}</span></span>
                    <span class="mail-subject">${m.subject}</span>
                    <span class="mail-preview muted small">${m.body.split("\n")[0]}</span>
                    ${m.labels.length ? html`<span class="row">${m.labels.map((l) => html`<bz-badge variant=${LABEL_VARIANT[l]}>${l}</bz-badge>`)}</span>` : null}
                  </span>
                </bz-option>`
              )
            : html`<p class="muted mail-empty">${icon("inbox", { size: 32 })}<br />Bu klasörde ileti yok.</p>`}
      </bz-list>
    </div>`
  },
})

const router = createRouter({
  mode: "hash",
  titleTemplate: (t) => `${t} · Posta`,
  routes: [
    { path: "/", redirect: "/gelen" },
    { path: "/:folder/:id?", page: listPage },
  ],
})
const FOLDERS = folderItems((f) => router.href(`/${f}`))
const navItems = computed(() => FOLDERS.map((f) => (f.id === "gelen" ? { ...f, badge: unreadCount() || undefined } : f)))

const app = html`
  <bz-shell variant="sidebar" resizable compact-footer="hidden" persist="posta" resize-label="Paneli boyutlandır" skip-label="İçeriğe geç" breakpoint="1000"
    ref=${(el: ShellElement) => (shell = el)}>
    <nav slot="start" class="mail-nav" aria-label="Klasörler">
      <div class="mail-brand">${icon("mail", { size: 22 })} <strong>Posta</strong></div>
      <bz-button variant="primary" class="mail-compose" @click=${() => void compose()}>${icon("edit")} Yeni ileti</bz-button>
      <bz-tree label="Klasörler" selection="leaf" .items=${navItems} .value=${folder}></bz-tree>
      <div class="mail-labels">
        <span class="small muted">Etiketler</span>
        ${LABELS.map(
          (l) => html`<bz-chip selectable variant=${LABEL_VARIANT[l]} .selected=${() => labelFilter() === l}
            @change=${(e: CustomEvent<{ selected: boolean }>) => labelFilter.set(e.detail.selected ? l : null)}>${l}</bz-chip>`
        )}
      </div>
    </nav>

    <bz-header slot="header" title="" no-menu-button center-label="İletilerde ara" user-name="Ada Yılmaz" user-detail="ada.yilmaz@firma.com.tr"
      @select=${() => toast.info("Hesap ayarları bu demoda yok.")}>
      <bz-button slot="logo" variant="ghost" size="sm" data-shell-toggle="start" aria-label="Klasörler" data-tooltip="Klasörler">${icon("menu")}</bz-button>
      <bz-input slot="center" class="mail-search" placeholder="İletilerde ara" aria-label="İletilerde ara" .value=${query}
        @input=${(e: Event) => query.set((e.currentTarget as HTMLInputElement).value)}>
        <span slot="prefix">${icon("search")}</span>
      </bz-input>
      <bz-button variant="ghost" size="sm" data-shell-toggle="end" aria-label="Okuma paneli" data-tooltip="Okuma paneli">${icon("layers")}</bz-button>
      <bz-menu-item slot="user-menu" value="settings" icon="settings">Hesap ayarları</bz-menu-item>
      <bz-menu-item slot="user-menu" value="logout" icon="log-out">Çıkış yap</bz-menu-item>
    </bz-header>

    <bz-outlet></bz-outlet>

    <aside slot="end" class="mail-reader" aria-label="Okuma paneli">${reader(openId, (path) => void router.navigate(path), folder)}</aside>

    <bz-footer slot="footer">
      Posta · Bazlama demo (sidebar shell, koyu tema)
      <span slot="end" class="row">${sourceButton("mail")} <a class="demo-link" href=${PLAYGROUND_URL}>Playground'a dön</a></span>
    </bz-footer>
  </bz-shell>
`

render(app, document.getElementById("app")!)
void router.start()
