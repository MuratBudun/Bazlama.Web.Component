import { computed, html, repeat, signal } from "@bazlama/core"
import { dialogs, icon, toast, type Column, type DataGridElement, type GridColumn, type TabsElement } from "@bazlama/headless"
import { DATA_GRID_TR } from "../data-grid"
import { DEPARTMENTS, DOC_KINDS, DOCUMENTS, type DocRow } from "./data"
import { documentForm, type FormHandle } from "./form"
import { filterRows, lookupField, pager, searchBox, statusTag } from "./ui"

/**
 * "Taslaklar › Doküman No": toolbar, the document grid with context menu and pager, and the
 * forms opened from it as inner tabs (Liste | FRM-008 × …), as in QMEX.
 */

const COLUMNS: GridColumn<DocRow>[] = [
  { key: "no", header: "Doküman No", width: 140, pinned: "start", hideable: false, sortable: true, format: (v) => html`<strong>${String(v)}</strong>` },
  { key: "company", header: "Firma", width: 110, sortable: true },
  { key: "location", header: "Lokasyon", width: 110, sortable: true },
  { key: "rev", header: "Rev.", width: 64, align: "end", sortable: true },
  { key: "name", header: "Doküman Adı", width: 260, flex: true, sortable: true },
  { key: "kind", header: "Doküman Türü", width: 130, sortable: true },
  { key: "ownerDept", header: "Doküman Sahibi Bölüm", width: 210, sortable: true },
  { key: "training", header: "Eğitim gerekli mi?", width: 130 },
  { key: "nameOther", header: "Dokümanın Adı (Diğer Dil)", width: 190, hidden: true },
  { key: "enforcement", header: "Yürürlük Tarihi", width: 130, sortable: true },
  { key: "preparedBy", header: "Hazırlayan", width: 130, sortable: true },
  { key: "preparedDept", header: "Hazırlayan Bölüm", width: 240 },
  { key: "createdAt", header: "Tarih/Saat", width: 150, sortable: true },
  { key: "authority", header: "İşlem Yetkilisi", width: 140 },
  { key: "status", header: "Durum", width: 150, pinned: "end", sortable: true, format: (v) => statusTag(String(v)) },
]


interface OpenForm {
  row: DocRow
  handle: FormHandle
}

export function documentList(title: string) {
  const rows = signal<DocRow[]>(DOCUMENTS)
  const query = signal("")
  const field = signal("")
  const page = signal(1)
  const view = signal("Varsayılan Görünüm")
  const scope = signal("firma-varsayilan")
  const selected = signal<DocRow | null>(null)
  const filtered = computed(() => filterRows(rows(), query(), field()))
  const visible = computed(() => filtered().slice((page() - 1) * 10, page() * 10))

  // Inner tabs: "Liste" + opened forms.
  const forms = signal<OpenForm[]>([])
  const tab = signal("list")
  const openForm = (row: DocRow | null) => {
    if (!row) return
    if (!forms.peek().some((f) => f.row.no === row.no)) {
      const form: OpenForm = { row, handle: documentForm(row, () => void innerTabs?.close(row.no)) }
      forms.update((l) => [...l, form])
    }
    tab.set(row.no)
  }
  let innerTabs: TabsElement | null = null
  // The guard (unsaved changes) runs before the tab closes; the close event removes the form.
  const beforeClose = (no: string) => forms.peek().find((f) => f.row.no === no)?.handle.canClose() ?? true
  const removeForm = (no: string) => forms.update((l) => l.filter((f) => f.row.no !== no))

  const newDocument = async () => {
    const kind = signal("Form")
    const name = signal("")
    const dept = signal("")
    const created = await dialogs.open<boolean>({
      heading: "Yeni Doküman",
      content: html`<div class="stack">
        <bz-combobox label="Doküman Türü" required .value=${kind} @change=${(e: CustomEvent<{ value: string }>) => kind.set(e.detail.value)}>
          ${DOC_KINDS.map((k) => html`<bz-option value=${k}>${k}</bz-option>`)}
        </bz-combobox>
        <bz-input label="Dokümanın Adı" required autofocus .value=${name} @input=${(e: Event) => name.set((e.currentTarget as HTMLInputElement).value)}></bz-input>
        ${lookupField({ label: "Doküman Sahibi Bölüm", value: dept, editable: signal(true), items: DEPARTMENTS })}
        <p class="note">Mockup: kayıt sunucuya gönderilmez, listeye eklenir.</p>
      </div>`,
      beforeClose: (_reason, result) =>
        result !== true || !!name().trim() || (void dialogs.alert({ heading: "Eksik bilgi", message: "Dokümanın Adı zorunlu." }), false),
      footer: (ref) => html`<bz-button @click=${() => void ref.close()}>Vazgeç</bz-button>
        <bz-button variant="primary" @click=${() => void ref.close(true)}>Oluştur</bz-button>`,
    })
    if (!created) return
    const no = `N/A-${String(143 + rows.peek().length).padStart(8, "0")}`
    const row: DocRow = {
      ...DOCUMENTS[1],
      id: no,
      no,
      name: name(),
      kind: kind(),
      ownerDept: dept(),
      createdAt: new Date().toLocaleString("tr-TR"),
      status: "Hazırlanıyor",
    }
    rows.update((r) => [row, ...r])
    toast.success(`${no} oluşturuldu.`, { action: { label: "Aç", onClick: (t) => (t.close(), openForm(row)) } })
  }

  let contextRow: DocRow | null = null
  let grid: DataGridElement | undefined

  const listView = html`
    <bz-toolbar class="qx-toolbar" label=${title}>
      <bz-button size="sm" variant="ghost" aria-label="Yenile" data-tooltip="Yenile" @click=${() => toast.info("Liste yenilendi (mockup).")}>${icon("refresh")}</bz-button>
      <bz-button size="sm" variant="ghost" ?disabled=${() => !selected()} @click=${() => openForm(selected())}>${icon("edit")} Görüntüle</bz-button>
      <bz-button size="sm" variant="ghost" @click=${newDocument}>${icon("plus")} Yeni Doküman</bz-button>
      <bz-toolbar-spacer></bz-toolbar-spacer>
      <bz-menu placement="bottom-end" @select=${(e: CustomEvent<{ value: string }>) =>
        e.detail.value.startsWith("view:") ? view.set(e.detail.value.slice(5)) : toast.info(`${e.detail.value} (mockup)`)}>
        <bz-button slot="trigger" size="sm" variant="ghost">${icon("layers")} ${view} ▾</bz-button>
        <bz-menu-group label="Görünümler">
          <bz-menu-item type="radio" name="view" value="view:Varsayılan Görünüm" checked>Varsayılan Görünüm</bz-menu-item>
          <bz-menu-item type="radio" name="view" value="view:Sadece Formlar">Sadece Formlar</bz-menu-item>
        </bz-menu-group>
        <bz-menu-separator></bz-menu-separator>
        <bz-menu-item value="Görünümü kaydet" icon="download">Görünümü kaydet</bz-menu-item>
        <bz-menu-item value="Görünümleri yönet" icon="settings">Görünümleri yönet</bz-menu-item>
      </bz-menu>
      <bz-combobox class="qx-scope" .value=${scope} @change=${(e: CustomEvent<{ value: string }>) => scope.set(e.detail.value)}>
        <bz-option value="firma-varsayilan">Firma, Varsayılan</bz-option>
        <bz-option value="tum">Tüm lokasyonlar</bz-option>
      </bz-combobox>
      ${searchBox(COLUMNS as unknown as Column[], query, field)}
      <bz-data-grid-columns>Sütunlar</bz-data-grid-columns>
      <bz-button size="sm" variant="ghost" @click=${() => toast.info(`${filtered().length} satır Excel'e aktarıldı (mockup).`)}>${icon("table")} Excel</bz-button>
    </bz-toolbar>
    <div class="qx-grid">
      <bz-data-grid
        data-shell-fill
        label=${title}
        row-height="32"
        .labels=${DATA_GRID_TR}
        .columns=${COLUMNS}
        persist="qmex-documents"
        .rows=${visible}
        .selection=${computed(() => (selected() ? [selected()!.id] : []))}
        selectable
        ref=${(el: DataGridElement) => (grid = el)}
        @row-click=${(e: CustomEvent<{ row: DocRow }>) => selected.set(e.detail.row)}
        @row-activate=${(e: CustomEvent<{ row: DocRow }>) => openForm(e.detail.row)}
        @selection-change=${(e: CustomEvent<{ selection: unknown[] }>) =>
          selected.set(rows.peek().find((r) => r.id === e.detail.selection.at(-1)) ?? null)}
      >
        <span slot="empty">Gösterilebilecek veri yok</span>
      </bz-data-grid>
    </div>
    <bz-context-menu
      class="qx-row-menu"
      selector="tbody tr[data-part=row]"
      @before-open=${(e: CustomEvent<{ target: Element }>) => {
        contextRow = (grid?.rowFromElement(e.detail.target) as DocRow | undefined) ?? null
        if (contextRow) selected.set(contextRow)
      }}
      @select=${(e: CustomEvent<{ value: string }>) => {
        const row = contextRow
        if (!row) return
        if (e.detail.value === "open") openForm(row)
        else if (e.detail.value === "copy") void navigator.clipboard?.writeText(row.no).then(() => toast(`${row.no} kopyalandı.`))
        else toast.info(`${e.detail.value}: ${row.no} (mockup)`)
      }}
    >
      <bz-menu-item value="open" icon="edit" shortcut="Enter">Görüntüle</bz-menu-item>
      <bz-menu-item value="copy" icon="copy" shortcut="Ctrl+C">Doküman No kopyala</bz-menu-item>
      <bz-menu-separator></bz-menu-separator>
      <bz-menu-item value="Tarihçe" icon="clock">Tarihçe</bz-menu-item>
      <bz-menu-item value="Excel" icon="table">Excel'e aktar</bz-menu-item>
    </bz-context-menu>
    ${pager(computed(() => filtered().length), page, 10, () => toast.info("Liste yenilendi (mockup)."))}
  `

  return {
    open: openForm,
    view: html`<bz-tabs class="qx-inner-tabs" fill .value=${tab} .beforeClose=${() => beforeClose}
      @change.self=${(e: CustomEvent<{ value: string }>) => tab.set(e.detail.value)}
      @close=${(e: CustomEvent<{ value: string }>) => removeForm(e.detail.value)}
      ref=${(el: TabsElement) => (innerTabs = el)}>
      <bz-tab-list>
        <bz-tab value="list">Liste</bz-tab>
        ${repeat(
          forms,
          (f) => f.row.no,
          (f) => html`<bz-tab value=${f.row.no} closable close-label="Kapat (Delete)">${f.row.no}</bz-tab>`
        )}
      </bz-tab-list>
      <bz-tab-panel value="list">${listView}</bz-tab-panel>
      ${repeat(
        forms,
        (f) => f.row.no,
        (f) => html`<bz-tab-panel value=${f.row.no}>${f.handle.view}</bz-tab-panel>`
      )}
    </bz-tabs>`,
    /** Asks once when any open form has unsaved changes (closing the whole list tab). */
    async canCloseAll() {
      const dirty = forms.peek().filter((f) => f.handle.isDirty())
      if (!dirty.length) return true
      return dialogs.confirm({
        heading: "Kaydedilmemiş değişiklikler",
        message: `${dirty.map((f) => f.row.no).join(", ")} formunda kaydedilmemiş değişiklik var. Hepsi kapatılsın mı?`,
        variant: "danger",
        confirmText: "Kapat",
      })
    },
  }
}
