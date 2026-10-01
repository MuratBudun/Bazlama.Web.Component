import { computed, html, signal, type ReadSignal, type Signal } from "@bazlama/core"
import { dialogs, icon, toast, type Column, type TreeItem } from "@bazlama/headless"
import { LOOKUP_TR } from "../lookup"
import { PAGINATION_TR } from "../pagination"

/**
 * Mockup helpers: the QMEX grid panel (toolbar + table + pager), the department lookup and
 * the status tag, built from bazlama components.
 */

type Row = Record<string, unknown>

export function statusTag(status: string) {
  const variant = /Hazırlan/.test(status) ? "warning" : /Onay/.test(status) ? "info" : /Yürürlüğe/.test(status) ? "danger" : "primary"
  return html`<bz-badge variant=${variant}>${status}</bz-badge>`
}

/** « ‹ Sayfa [n] / N › » ⟳ … "Gösterilen a - b / total" (the QMEX paging toolbar). */
export function pager(total: ReadSignal<number>, page: Signal<number>, size = 10, onRefresh?: () => void) {
  return html`<bz-pagination class="qx-pager" variant="compact" show-info page-size=${size} .labels=${PAGINATION_TR}
    .total=${total} .page=${page} @change=${(e: CustomEvent<{ page: number }>) => page.set(e.detail.page)}>
    <bz-button size="sm" variant="ghost" aria-label="Yenile" data-tooltip="Yenile" @click=${() => onRefresh?.()}>${icon("refresh")}</bz-button>
  </bz-pagination>`
}

/** Column filter menu + search box, as in the QMEX grid toolbars. */
export function searchBox(columns: Column[], query: Signal<string>, field: Signal<string>) {
  return html`<div class="qx-search">
    <bz-menu placement="bottom-end" @select=${(e: CustomEvent<{ value: string }>) => field.set(e.detail.value)}>
      <bz-button slot="trigger" size="sm" variant="ghost" aria-label="Arama kolonu" data-tooltip=${() => `Arama: ${columns.find((c) => c.key === field())?.header ?? "Tüm Kolonlar"}`}>
        ${icon("search")}▾
      </bz-button>
      <bz-menu-item type="radio" name="col" value="" .checked=${() => field() === ""}>Tüm Kolonlar</bz-menu-item>
      <bz-menu-separator></bz-menu-separator>
      ${columns.map((c) => html`<bz-menu-item type="radio" name="col" value=${c.key} .checked=${() => field() === c.key}>${c.header}</bz-menu-item>`)}
    </bz-menu>
    <bz-input placeholder="Ara…" .value=${query} @input=${(e: Event) => query.set((e.currentTarget as HTMLInputElement).value)}>
      <button slot="suffix" type="button" class="qx-clear" aria-label="Temizle" ?hidden=${() => !query()} @click=${() => query.set("")}>${icon("x")}</button>
    </bz-input>
  </div>`
}

export function filterRows<R extends Row>(rows: R[], query: string, field: string): R[] {
  const q = query.trim().toLocaleLowerCase("tr-TR")
  if (!q) return rows
  return rows.filter((r) =>
    (field ? [r[field]] : Object.values(r)).some((v) => String(v ?? "").toLocaleLowerCase("tr-TR").includes(q))
  )
}

export interface GridPanelOptions<R extends Row> {
  title: string
  columns: Column<R>[]
  rows: Signal<R[]>
  editable: ReadSignal<boolean>
  /** "Ekle" as a menu of kinds (e.g. Ürün, Hammadde…) instead of a single button. */
  addMenu?: string[]
  onAdd?: (kind?: string) => void
  view?: (row: R) => void
  open?: Signal<boolean>
}

/** Collapsible panel with the QMEX grid toolbar, a table and a pager. */
export function gridPanel<R extends Row>(o: GridPanelOptions<R>) {
  const selection = signal<unknown[]>([])
  const query = signal("")
  const field = signal("")
  const page = signal(1)
  const filtered = computed(() => filterRows(o.rows(), query(), field()))
  const visible = computed(() => filtered().slice((page() - 1) * 10, page() * 10))
  const selectedRow = () => o.rows().find((r) => selection().includes(r.id))
  const remove = async () => {
    const ok = await dialogs.confirm({ heading: "Seçileni Sil", message: `${selection().length} kayıt silinsin mi?`, variant: "danger", confirmText: "Sil" })
    if (!ok) return
    o.rows.update((rows) => rows.filter((r) => !selection().includes(r.id)))
    selection.set([])
    toast.success("Silindi (mockup)")
  }
  const add = o.addMenu
    ? html`<bz-menu @select=${(e: CustomEvent<{ value: string }>) => o.onAdd?.(e.detail.value)}>
        <bz-button slot="trigger" size="sm" variant="ghost" ?disabled=${() => !o.editable()}>${icon("plus")} Ekle ▾</bz-button>
        ${o.addMenu.map((k) => html`<bz-menu-item value=${k}>${k}</bz-menu-item>`)}
      </bz-menu>`
    : html`<bz-button size="sm" variant="ghost" ?disabled=${() => !o.editable()} @click=${() => o.onAdd?.()}>${icon("plus")} Ekle</bz-button>`

  return html`<bz-panel class="qx-grid-panel" heading=${o.title} collapsible .open=${o.open ?? true}
    @toggle=${(e: CustomEvent<{ open: boolean }>) => o.open?.set(e.detail.open)}>
    <bz-toolbar class="qx-toolbar" label=${o.title}>
      <bz-button size="sm" variant="ghost" aria-label="Yenile" data-tooltip="Yenile" @click=${() => toast.info("Yenilendi (mockup)")}>${icon("refresh")}</bz-button>
      ${o.view
        ? html`<bz-button size="sm" variant="ghost" ?disabled=${() => !selectedRow()} @click=${() => o.view?.(selectedRow()!)}>${icon("edit")} Görüntüle</bz-button>`
        : null}
      ${add}
      <bz-button size="sm" variant="ghost" ?disabled=${() => !o.editable() || !selection().length} @click=${remove}>${icon("trash")} Seçileni Sil</bz-button>
      <bz-toolbar-spacer></bz-toolbar-spacer>
      ${searchBox(o.columns as Column[], query, field)}
      <bz-button size="sm" variant="ghost" @click=${() => toast.info(`"${o.title}" Excel'e aktarıldı (mockup)`)}>${icon("table")} Excel</bz-button>
    </bz-toolbar>
    <bz-table
      striped
      selectable
      .columns=${o.columns}
      .rows=${visible}
      .selection=${selection}
      @selection-change=${(e: CustomEvent<{ selection: unknown[] }>) => selection.set(e.detail.selection)}
      ?activatable=${!!o.view}
      @row-click=${(e: CustomEvent<{ row: R }>) => selection.set([e.detail.row.id])}
      @row-activate=${(e: CustomEvent<{ row: R }>) => o.view?.(e.detail.row)}
    >
      <span slot="empty">Gösterilebilecek veri yok</span>
    </bz-table>
    ${pager(computed(() => filtered().length), page, 10, () => toast.info("Yenilendi (mockup)"))}
  </bz-panel>`
}

function idOf(items: TreeItem[], label: string): string {
  for (const item of items) {
    if (item.label === label) return item.id
    const found = item.children && idOf(item.children, label)
    if (found) return found
  }
  return ""
}

/** Department picker (ExtJS "triggerfield"): bz-lookup with a tree; the signal holds the label. */
export function lookupField(o: {
  label: string
  value: Signal<string>
  editable: ReadSignal<boolean>
  items: TreeItem[]
  required?: boolean
}) {
  return html`<bz-lookup label=${o.label} ?required=${!!o.required} ?readonly=${() => !o.editable()} selection="leaf"
    .items=${o.items} .labels=${LOOKUP_TR} .value=${() => idOf(o.items, o.value())}
    @change=${(e: CustomEvent<{ text: string }>) => o.value.set(e.detail.text)}></bz-lookup>`
}
