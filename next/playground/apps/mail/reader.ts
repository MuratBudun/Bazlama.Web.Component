import { computed, html, type ReadSignal } from "@bazlama/core"
import { dialogs, icon, openMenu, toast } from "@bazlama/headless"
import { compose } from "./compose"
import { FOLDER_LABEL, LABEL_VARIANT, LABELS, mails, move, update, type Folder, type Mail } from "./store"

/** The reading pane (the shell's end side): toolbar, header, labels, body, attachments. */
export function reader(openId: ReadSignal<number | null>, navigate: (path: string) => void, folder: ReadSignal<Folder>) {
  const mail = computed(() => mails().find((m) => m.id === openId()) ?? null)

  // Opening a message marks it read.
  const markRead = computed(() => {
    const m = mail()
    if (m?.unread) queueMicrotask(() => update(m.id, { unread: false }))
    return null
  })

  const moveTo = (m: Mail, to: Folder, verb: string) => {
    const from = move(m.id, to)
    navigate(`/${folder.peek()}`)
    toast({ message: `İleti ${verb}.`, action: { label: "Geri al", onClick: (t) => (move(m.id, from), t.close()) } })
  }
  const remove = async (m: Mail) => {
    if (m.folder === "cop") {
      const ok = await dialogs.confirm({ heading: "Kalıcı olarak sil", message: "Bu ileti kalıcı olarak silinecek.", confirmText: "Sil", cancelText: "Vazgeç", variant: "danger" })
      if (!ok) return
      mails.update((l) => l.filter((x) => x.id !== m.id))
      navigate(`/${folder.peek()}`)
      return toast("İleti kalıcı olarak silindi.")
    }
    moveTo(m, "cop", "çöp kutusuna taşındı")
  }
  const labelMenu = (m: Mail, anchor: Element) =>
    void openMenu({
      anchor,
      label: "Etiketler",
      items: LABELS.map((l) => ({
        type: "checkbox" as const,
        label: l,
        checked: m.labels.includes(l),
        onSelect: ({ checked }: { checked: boolean }) => {
          const current = mails.peek().find((x) => x.id === m.id)!
          update(m.id, { labels: checked ? [...current.labels, l] : current.labels.filter((x) => x !== l) })
        },
      })),
    })

  // "R" replies to the open message (not while typing).
  document.addEventListener("keydown", (e) => {
    const t = e.target as HTMLElement
    if (e.key.toLowerCase() !== "r" || e.ctrlKey || e.metaKey || e.altKey || t.closest("input, textarea, [contenteditable], bz-dialog")) return
    const m = mail.peek()
    if (!m) return
    e.preventDefault()
    void compose(m)
  })

  return html`${() => {
    markRead()
    const m = mail()
    if (!m) return html`<div class="mail-reader-empty muted">${icon("mail", { size: 40 })}<p>Okumak için bir ileti seçin.</p></div>`
    return html`<article class="mail-read">
      <bz-toolbar label="İleti işlemleri">
        <bz-button size="sm" variant="ghost" data-tooltip="Yanıtla" aria-label="Yanıtla" @click=${() => void compose(m)}>${icon("reply")}</bz-button>
        <bz-button size="sm" variant="ghost" data-tooltip="Arşivle" aria-label="Arşivle" ?disabled=${m.folder === "arsiv"} @click=${() => moveTo(m, "arsiv", "arşivlendi")}>${icon("archive")}</bz-button>
        <bz-button size="sm" variant="ghost" data-tooltip="Sil" aria-label="Sil" @click=${() => void remove(m)}>${icon("trash")}</bz-button>
        <bz-toolbar-separator></bz-toolbar-separator>
        <bz-button size="sm" variant="ghost" pressed=${String(m.starred)} data-tooltip=${m.starred ? "Yıldızı kaldır" : "Yıldızla"} aria-label="Yıldızlı"
          @click=${() => update(m.id, { starred: !m.starred })}>${icon("star")}</bz-button>
        <bz-button size="sm" variant="ghost" data-tooltip="Okunmadı yap" aria-label="Okunmadı yap" @click=${() => (update(m.id, { unread: true }), navigate(`/${folder.peek()}`))}>${icon("mail")}</bz-button>
        <bz-button size="sm" variant="ghost" aria-haspopup="menu" data-tooltip="Etiketler" aria-label="Etiketler" @click=${(e: MouseEvent) => labelMenu(m, e.currentTarget as Element)}>${icon("tag")}</bz-button>
        <bz-toolbar-spacer></bz-toolbar-spacer>
        <bz-button size="sm" variant="ghost" data-shell-toggle="end" aria-label="Paneli kapat">${icon("x")}</bz-button>
      </bz-toolbar>
      <h2>${m.subject}</h2>
      <div class="row">
        ${m.labels.map((l) => html`<bz-chip removable variant=${LABEL_VARIANT[l]} remove-label="Etiketi kaldır"
          @remove=${() => update(m.id, { labels: m.labels.filter((x) => x !== l) })}>${l}</bz-chip>`)}
        <span class="small muted">${FOLDER_LABEL[m.folder]}</span>
      </div>
      <div class="mail-sender">
        <bz-avatar name=${m.from}></bz-avatar>
        <div><strong>${m.from}</strong> <span class="muted small">&lt;${m.email}&gt;</span><br /><span class="small muted">Kime: ${m.to}</span></div>
        <span class="spacer"></span>
        <span class="small muted">${m.at.toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })}</span>
      </div>
      <div class="mail-body">${m.body}</div>
      ${m.attachments.length
        ? html`<div class="row">${m.attachments.map((a) => html`<bz-chip icon="paperclip" selectable @change=${() => toast.info(`${a} indiriliyor (demo)`)}>${a}</bz-chip>`)}</div>`
        : null}
      ${m.folder === "gelen"
        ? html`<bz-alert variant="info" icon="reply">
            Hızlı yanıt: bu iletiyi yanıtlamak için <kbd>R</kbd> ya da aşağıdaki düğme.
            <bz-button slot="actions" size="sm" variant="primary" @click=${() => void compose(m)}>${icon("reply")} Yanıtla</bz-button>
          </bz-alert>`
        : null}
    </article>`
  }}`
}
