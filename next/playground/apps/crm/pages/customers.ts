import { computed, html, signal } from "@bazlama/core"
import { dialogs, icon, toast, type DataGridElement, type GridColumn } from "@bazlama/headless"
import { definePage } from "@bazlama/router"
import { CRM_GRID_TR } from "../labels"
import { dateText, money } from "../../shared/boot"
import { addCustomer, CITY_LIST, customers, removeCustomers, restoreCustomers, sectorLabel, type Customer, type CustomerStatus } from "../store"

const STATUS_VARIANT: Record<CustomerStatus, string> = { Aktif: "success", Potansiyel: "info", Pasif: "neutral" }
export const customerStatusBadge = (s: CustomerStatus) => html`<bz-badge variant=${STATUS_VARIANT[s]}>${s}</bz-badge>`

const COLUMNS: GridColumn<Customer>[] = [
  {
    key: "company",
    header: "Firma",
    width: 240,
    pinned: "start",
    hideable: false,
    sortable: true,
    format: (v, row) => html`<span class="row" style="flex-wrap: nowrap">${row.vip ? html`<span data-tooltip="VIP müşteri">${icon("star", { size: 14 })}</span>` : null}<strong>${String(v)}</strong></span>`,
  },
  { key: "name", header: "Yetkili", width: 160, sortable: true },
  { key: "sector", header: "Sektör", width: 130, sortable: true, format: (v) => sectorLabel(String(v)) },
  { key: "city", header: "Şehir", width: 110, sortable: true },
  { key: "email", header: "E-posta", width: 230, flex: true },
  { key: "phone", header: "Telefon", width: 150, hidden: true },
  { key: "owner", header: "Temsilci", width: 130, sortable: true },
  { key: "revenue", header: "Yıllık ciro", width: 130, align: "end", sortable: true, format: (v) => money.format(v as number) },
  { key: "lastContact", header: "Son görüşme", width: 120, sortable: true, format: (v) => dateText(v as Date), compare: (a, b) => a.lastContact.getTime() - b.lastContact.getTime() },
  { key: "status", header: "Durum", width: 120, pinned: "end", sortable: true, format: (v) => customerStatusBadge(v as CustomerStatus) },
]

const STATUS_FILTERS = ["Tümü", "Aktif", "Potansiyel", "Pasif"] as const

export default definePage({
  title: "Müşteriler",
  setup(ctx) {
    const query = () => ctx.query.get("q") ?? ""
    const status = () => ctx.query.get("durum") ?? "Tümü"
    const setFilter = (patch: Record<string, string>) => ctx.query.set(patch)
    const selection = signal<unknown[]>([])
    let grid: DataGridElement | undefined
    let menuRow: Customer | null = null

    const rows = computed(() => {
      const q = query().toLocaleLowerCase("tr-TR").trim()
      const s = status()
      return customers().filter(
        (c) =>
          (s === "Tümü" || c.status === s) &&
          (!q || [c.company, c.name, c.city, c.email].some((v) => v.toLocaleLowerCase("tr-TR").includes(q)))
      )
    })

    const open = (c: Customer) => void ctx.navigate(`/musteriler/${c.id}`)
    const remove = async (ids: unknown[]) => {
      const ok = await dialogs.confirm({
        heading: "Müşterileri sil",
        message: ids.length === 1 ? "Bu müşteri silinsin mi?" : `${ids.length} müşteri silinsin mi?`,
        confirmText: "Sil",
        cancelText: "Vazgeç",
        variant: "danger",
      })
      if (!ok) return
      const removed = removeCustomers(ids)
      selection.set([])
      toast({
        message: `${removed.length} müşteri silindi.`,
        action: { label: "Geri al", onClick: (t) => (restoreCustomers(removed), t.close()) },
      })
    }
    const create = async () => {
      const form = { name: signal(""), company: signal(""), email: signal(""), city: signal("İstanbul"), status: signal<CustomerStatus>("Potansiyel") }
      const created = await dialogs.open<Customer>({
        heading: "Yeni müşteri",
        content: (ref) => html`<form id="new-customer" @submit=${(e: SubmitEvent) => {
          e.preventDefault()
          ref.close(addCustomer({ name: form.name(), company: form.company(), email: form.email(), city: form.city(), status: form.status() }))
        }}>
          <bz-form-layout columns="2" min-column-width="12rem">
            <bz-input label="Firma" required autofocus .value=${form.company} @input=${(e: Event) => form.company.set((e.currentTarget as HTMLInputElement).value)} data-span="full"></bz-input>
            <bz-input label="Yetkili" required .value=${form.name} @input=${(e: Event) => form.name.set((e.currentTarget as HTMLInputElement).value)}></bz-input>
            <bz-input label="E-posta" type="email" .value=${form.email} @input=${(e: Event) => form.email.set((e.currentTarget as HTMLInputElement).value)}></bz-input>
            <bz-combobox label="Şehir" .value=${form.city} @change=${(e: CustomEvent<{ value: string }>) => form.city.set(e.detail.value)}>
              ${CITY_LIST.map((c) => html`<bz-option value=${c}>${c}</bz-option>`)}
            </bz-combobox>
            <bz-radio-group label="Durum" orientation="horizontal" .value=${form.status} @change=${(e: CustomEvent<{ value: CustomerStatus }>) => form.status.set(e.detail.value)}>
              <bz-radio value="Potansiyel">Potansiyel</bz-radio><bz-radio value="Aktif">Aktif</bz-radio>
            </bz-radio-group>
          </bz-form-layout>
        </form>`,
        footer: (ref) => html`<bz-button @click=${() => void ref.close()}>Vazgeç</bz-button>
          <bz-button variant="primary" type="submit" form="new-customer" @click=${() => (document.getElementById("new-customer") as HTMLFormElement | null)?.requestSubmit()}>Oluştur</bz-button>`,
      })
      if (created) toast.success(`${created.company} eklendi.`, { action: { label: "Aç", onClick: (t) => (t.close(), open(created)) } })
    }

    return html`<div class="page crm-list-page">
      <div class="page-head">
        <h1>Müşteriler</h1>
        <bz-badge variant="primary" .count=${() => rows().length}></bz-badge>
        <span class="spacer"></span>
        <bz-button variant="primary" @click=${create}>${icon("plus")} Yeni müşteri</bz-button>
      </div>

      <bz-toolbar label="Müşteri listesi">
        <bz-input placeholder="Ara…" aria-label="Müşteri ara" .value=${query}
          @input=${(e: Event) => setFilter({ q: (e.currentTarget as HTMLInputElement).value })}>
          <span slot="prefix">${icon("search")}</span>
        </bz-input>
        <div role="group" aria-label="Durum" class="row">
          ${STATUS_FILTERS.map(
            (s) => html`<bz-chip selectable .selected=${() => status() === s} @change=${() => setFilter({ durum: s === "Tümü" ? "" : s })}>${s}</bz-chip>`
          )}
        </div>
        <bz-toolbar-spacer></bz-toolbar-spacer>
        ${() =>
          selection().length
            ? html`<bz-button size="sm" variant="danger" @click=${() => remove(selection())}>${icon("trash")} Sil (${selection().length})</bz-button>`
            : null}
        <bz-data-grid-columns for="crm-customers">Sütunlar</bz-data-grid-columns>
        <bz-menu placement="bottom-end" @select=${(e: CustomEvent<{ value: string }>) => toast.info(`${rows().length} kayıt ${e.detail.value} olarak dışa aktarıldı (demo).`)}>
          <bz-button slot="trigger" size="sm" variant="ghost">${icon("download")} Dışa aktar ▾</bz-button>
          <bz-menu-item value="Excel" icon="table">Excel</bz-menu-item>
          <bz-menu-item value="CSV" icon="file-text">CSV</bz-menu-item>
          <bz-menu-item value="PDF" icon="file">PDF</bz-menu-item>
        </bz-menu>
      </bz-toolbar>

      <bz-data-grid id="crm-customers" data-shell-fill label="Müşteriler" selectable persist="ada-crm-customers" highlight-pinned
        .labels=${CRM_GRID_TR} .columns=${COLUMNS} .rows=${rows} .selection=${selection}
        @selection-change=${(e: CustomEvent<{ selection: unknown[] }>) => selection.set(e.detail.selection)}
        @row-activate=${(e: CustomEvent<{ row: Customer }>) => open(e.detail.row)}
        ref=${(el: DataGridElement) => (grid = el)}>
        <span slot="empty">Aramanızla eşleşen müşteri yok.</span>
      </bz-data-grid>

      <bz-context-menu selector="#crm-customers tbody tr[data-part=row]"
        @before-open=${(e: CustomEvent<{ target: Element }>) => (menuRow = (grid?.rowFromElement(e.detail.target) as Customer | undefined) ?? null)}
        @select=${(e: CustomEvent<{ value: string }>) => {
          const row = menuRow
          if (!row) return
          if (e.detail.value === "open") open(row)
          else if (e.detail.value === "mail") location.href = `mailto:${row.email}`
          else if (e.detail.value === "copy") void navigator.clipboard?.writeText(row.email).then(() => toast("E-posta kopyalandı"))
          else if (e.detail.value === "delete") void remove([row.id])
        }}>
        <bz-menu-item value="open" icon="edit" shortcut="Enter">Aç</bz-menu-item>
        <bz-menu-item value="mail" icon="mail">E-posta gönder</bz-menu-item>
        <bz-menu-item value="copy" icon="copy">E-postayı kopyala</bz-menu-item>
        <bz-menu-separator></bz-menu-separator>
        <bz-menu-item value="delete" icon="trash" variant="danger">Sil</bz-menu-item>
      </bz-context-menu>
    </div>`
  },
})
