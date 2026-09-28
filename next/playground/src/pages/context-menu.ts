import { html, repeat, signal } from "@bazlama/core"
import { contextMenu, dialogs, icon, toast, type Column, type MenuItemData } from "@bazlama/headless"
import { customers, type Customer } from "../data"
import { contextMenuUsage } from "../docs/specs-feedback"
import { usage } from "../docs/usage"
import { logEntry } from "../log"

const columns: Column<Customer>[] = [
  { key: "id", header: "#", align: "end", width: "3rem" },
  { key: "name", header: "Ad Soyad" },
  { key: "city", header: "Şehir" },
  { key: "status", header: "Durum" },
]

interface DesktopFile {
  id: number
  name: string
  kind: "folder" | "file"
}

type ContextMenuEl = HTMLElementTagNameMap["bz-context-menu"]

export default {
  id: "context-menu",
  title: "Context menu",
  description:
    "Masaüstü uygulamalarındaki gibi context menu: sağ tık (imlecin yanında), klavyedeki menü tuşu / Shift+F10 (odaklı elemanın yanında) ve dokunmatikte uzun basma. HTML ile <bz-context-menu>, JavaScript ile contextMenu().",
  render() {
    // ---------------------------------------------------------------- table (declarative)
    const rows = signal(customers(8))
    let menu!: ContextMenuEl
    const rowOf = (tr: Element | null) => (tr ? rows.peek()[Array.from(tr.parentElement!.children).indexOf(tr)] : undefined)

    const onBeforeOpen = (e: CustomEvent<{ target: Element }>) => {
      const row = rowOf(e.detail.target)
      if (!row) return e.preventDefault()
      // Adjust the items for this row before the menu shows.
      for (const item of menu.querySelectorAll<HTMLElement & { checked: boolean }>('bz-menu-item[name="status"]'))
        item.checked = item.getAttribute("value") === `status:${row.status}`
      const del = menu.querySelector<HTMLElement & { disabled: boolean }>('[value="delete"]')!
      del.disabled = row.status === "aktif"
      e.detail.target.setAttribute("data-context", "")
    }
    const onClose = () => document.querySelectorAll("[data-context]").forEach((el) => el.removeAttribute("data-context"))

    const onSelect = async (e: CustomEvent<{ value: string }>) => {
      const row = rowOf(menu.contextTarget)
      if (!row) return
      const { value } = e.detail
      logEntry("satır", value, row.name)
      if (value === "delete") {
        const ok = await dialogs.confirm({ heading: "Kaydı sil", message: `${row.name} silinsin mi?`, variant: "danger", confirmText: "Sil" })
        if (!ok) return
        rows.update((list) => list.filter((r) => r !== row))
        toast({ message: `${row.name} silindi.` })
      } else if (value.startsWith("status:")) {
        const status = value.slice(7) as Customer["status"]
        rows.update((list) => list.map((r) => (r === row ? { ...r, status } : r)))
      } else toast.info(`${row.name}: ${value}`)
    }

    // ---------------------------------------------------------------- desktop (programmatic)
    let nextId = 5
    const files = signal<DesktopFile[]>([
      { id: 1, name: "Raporlar", kind: "folder" },
      { id: 2, name: "Faturalar", kind: "folder" },
      { id: 3, name: "notlar.txt", kind: "file" },
      { id: 4, name: "bütçe.xlsx", kind: "file" },
    ])
    const view = signal("medium")
    const sort = signal("name")
    const selected = signal<number | null>(null)
    const sorted = () => {
      const list = files().slice()
      return sort() === "name" ? list.sort((a, b) => a.name.localeCompare(b.name, "tr")) : list.sort((a, b) => a.kind.localeCompare(b.kind) || a.id - b.id)
    }
    const fileOf = (target: EventTarget | null) => {
      const el = (target as Element | null)?.closest?.("[data-file]")
      return el ? files.peek().find((f) => f.id === Number(el.getAttribute("data-file"))) : undefined
    }

    const fileItems = (file: DesktopFile): MenuItemData[] => [
      { label: "Aç", value: "open", icon: file.kind === "folder" ? "folder-open" : "file-text", shortcut: "Enter" },
      { label: "Yeniden adlandır", value: "rename", icon: "edit", shortcut: "F2" },
      { label: "Kopyala", value: "copy", icon: "copy", shortcut: "Ctrl+C" },
      { type: "separator" },
      { label: "Sil", value: "delete", icon: "trash", variant: "danger", shortcut: "Del" },
    ]
    const desktopItems = (): MenuItemData[] => [
      {
        label: "Görünüm",
        children: [
          { label: "Büyük simgeler", value: "view:large", type: "radio", name: "view", checked: view.peek() === "large" },
          { label: "Orta simgeler", value: "view:medium", type: "radio", name: "view", checked: view.peek() === "medium" },
          { label: "Küçük simgeler", value: "view:small", type: "radio", name: "view", checked: view.peek() === "small" },
        ],
      },
      {
        label: "Sırala",
        children: [
          { label: "Ada göre", value: "sort:name", type: "radio", name: "sort", checked: sort.peek() === "name" },
          { label: "Türe göre", value: "sort:kind", type: "radio", name: "sort", checked: sort.peek() === "kind" },
        ],
      },
      { label: "Yenile", value: "refresh", icon: "refresh", shortcut: "F5" },
      { type: "separator" },
      {
        label: "Yeni",
        icon: "plus",
        children: [
          { label: "Klasör", value: "new:folder", icon: "folder" },
          { label: "Metin belgesi", value: "new:file", icon: "file-text" },
        ],
      },
    ]

    const onDesktopSelect = async (value: string, event: MouseEvent) => {
      const file = fileOf(event.target)
      logEntry("masaüstü", value, file?.name ?? "boş alan")
      if (value.startsWith("view:")) view.set(value.slice(5))
      else if (value.startsWith("sort:")) sort.set(value.slice(5))
      else if (value.startsWith("new:")) {
        const kind = value.slice(4) as DesktopFile["kind"]
        const id = nextId++
        files.update((l) => [...l, { id, name: kind === "folder" ? `Yeni klasör ${id}` : `Yeni metin ${id}.txt`, kind }])
        selected.set(id)
      } else if (file && value === "delete") {
        if (await dialogs.confirm({ message: `"${file.name}" silinsin mi?`, variant: "danger", confirmText: "Sil" }))
          files.update((l) => l.filter((f) => f !== file))
      } else if (file) toast.info(`${file.name}: ${value}`)
    }

    return html`
      ${usage(contextMenuUsage)}

      <section class="demo">
        <h2>Masaüstü: contextMenu()</h2>
        <div
          class="desktop"
          data-view=${view}
          tabindex="0"
          aria-label="Masaüstü"
          @click=${(e: Event) => selected.set(fileOf(e.target)?.id ?? null)}
          ref=${(el: HTMLElement) =>
            contextMenu(
              el,
              (e) => {
                const file = fileOf(e.target)
                if (file) selected.set(file.id)
                return file ? fileItems(file) : desktopItems()
              },
              (value, e) => void onDesktopSelect(value, e)
            )}
        >
          ${repeat(
            sorted,
            (f) => f.id,
            (f) => html`<button type="button" class="desktop-file" data-file=${f.id} aria-pressed=${() => String(selected() === f.id)}>
              ${icon(f.kind === "folder" ? "folder" : "file-text")}
              <span>${f.name}</span>
            </button>`
          )}
        </div>
        <p class="note">
          Boş alana ve bir dosyaya sağ tıklayın: öğeler olaydan üretilir (<code>(event) =&gt; items</code>). Pencerenin sağ veya alt kenarına
          yakın sağ tıklayın: menü imlecin soluna / üstüne açılır. Menü açıkken başka bir yere sağ tıklamak onu oraya taşır. Sağ tuşu basılı tutup
          bir öğenin üzerinde bırakmak onu seçer. Bir dosyaya Tab ile gelip menü tuşuna (veya Shift+F10) basın: menü dosyanın yanında açılır.
        </p>
      </section>

      <section class="demo">
        <h2>Tablo satırları: &lt;bz-context-menu&gt;</h2>
        <div id="cm-orders">
          <bz-table label="Müşteriler" .columns=${columns} .rows=${rows}></bz-table>
        </div>
        <bz-context-menu
          for="cm-orders"
          selector="tbody tr"
          @before-open=${onBeforeOpen}
          @select=${onSelect}
          ref=${(el: ContextMenuEl) => {
            menu = el
            // The inner menu's close does not bubble: listen on it.
            queueMicrotask(() => el.querySelector("bz-menu")?.addEventListener("close", onClose))
          }}
        >
          <bz-menu-item value="open" icon="external-link" shortcut="Enter">Aç</bz-menu-item>
          <bz-menu-item value="edit" icon="edit" shortcut="F2">Düzenle</bz-menu-item>
          <bz-menu-item value="copy" icon="copy" shortcut="Ctrl+C">Kopyala</bz-menu-item>
          <bz-menu-separator></bz-menu-separator>
          <bz-menu>
            <bz-menu-item slot="trigger">Durumu değiştir</bz-menu-item>
            <bz-menu-item type="radio" name="status" value="status:aktif">aktif</bz-menu-item>
            <bz-menu-item type="radio" name="status" value="status:beklemede">beklemede</bz-menu-item>
            <bz-menu-item type="radio" name="status" value="status:pasif">pasif</bz-menu-item>
          </bz-menu>
          <bz-menu-separator></bz-menu-separator>
          <bz-menu-item value="delete" icon="trash" variant="danger" shortcut="Del">Sil</bz-menu-item>
        </bz-context-menu>
        <p class="note">
          <code>selector="tbody tr"</code>: sadece satırlarda açılır, başlıkta tarayıcının menüsü kalır. Tıklanan satır
          <code>contextTarget</code>'tadır. <code>before-open</code> olayında menü satıra göre hazırlanır: mevcut durum işaretlenir,
          "aktif" kayıtlarda Sil devre dışıdır. Satır menü açıkken vurgulanır.
        </p>
      </section>

      <section class="demo">
        <h2>Davranış</h2>
        <table class="api">
          <tbody>
            <tr><td>Sağ tık</td><td>İmlecin sağ altında açılır; yer yoksa sola / yukarı döner</td></tr>
            <tr><td><kbd>≣ Menü</kbd> / <kbd>Shift</kbd>+<kbd>F10</kbd></td><td>Odaklı elemanın yanında açılır, ilk öğe odaklanır</td></tr>
            <tr><td>Uzun basma (dokunmatik)</td><td>550 ms basılı tutunca açılır; parmak kalkınca oluşan tıklama yutulur</td></tr>
            <tr><td>Açıkken sağ tık</td><td>Menü yeni konuma taşınır (seçilen hedef de değişir)</td></tr>
            <tr><td>Basılı tut + bırak</td><td>Sağ tuş bir öğenin üzerinde bırakılınca öğe seçilir</td></tr>
            <tr><td>Menü üzerinde sağ tık</td><td>Tarayıcının menüsü açılmaz</td></tr>
            <tr><td>Klavye</td><td>Menü ile aynı: oklar, harfle arama, → / ← alt menü, Enter, Esc, Tab</td></tr>
          </tbody>
        </table>
      </section>
    `
  },
}
