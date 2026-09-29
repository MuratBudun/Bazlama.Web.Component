import { computed, html, signal } from "@bazlama/core"
import { dialogs, icon, toast, type Column } from "@bazlama/headless"
import { definePage } from "@bazlama/router"
import { dateText, money, timeAgo } from "../../shared/boot"
import { LOOKUP_TR, PAGINATION_TR, TEXTAREA_TR } from "../labels"
import { CITY_LIST, customerById, logActivity, OWNERS, ordersOf, saveCustomer, SECTORS, type Customer, type Order } from "../store"
import { customerStatusBadge } from "./customers"
import { orderStatusBadge } from "./orders"

interface Note {
  id: number
  text: string
  at: Date
}

export default definePage({
  title: (s) => customerById(Number(s.params.id))?.company ?? "Müşteri",
  setup(ctx) {
    const id = Number(ctx.params().id)
    const original = customerById(id)
    if (!original)
      return html`<div class="page">
        <bz-alert variant="danger" heading="Müşteri bulunamadı">#${id} numaralı müşteri yok ya da silinmiş.</bz-alert>
        <div><bz-button @click=${() => void ctx.navigate("/musteriler")}>${icon("arrow-left")} Müşterilere dön</bz-button></div>
      </div>`

    const draft = signal<Customer>({ ...original })
    const saved = signal<Customer>(original)
    const dirty = computed(() => JSON.stringify(draft()) !== JSON.stringify(saved()))
    const set = <K extends keyof Customer>(key: K, value: Customer[K]) => draft.update((d) => ({ ...d, [key]: value }))
    const tab = signal("general")
    const notes = signal<Note[]>([
      { id: 1, text: "Yıllık bakım sözleşmesi Ekim'de yenilenecek.", at: new Date(Date.now() - 3 * 86400000) },
      { id: 2, text: "Satın alma müdürü değişti; yeni iletişim bilgileri alınacak.", at: new Date(Date.now() - 9 * 86400000) },
    ])
    const note = signal("")
    const customerOrders = ordersOf(id)
    const page = signal(1)
    const pageRows = computed(() => customerOrders().slice((page() - 1) * 8, page() * 8))

    const save = () => {
      saveCustomer(draft())
      saved.set(draft())
      toast.success("Müşteri kaydedildi.")
    }
    const discard = () => draft.set({ ...saved.peek() })

    // Leaving with unsaved changes asks first; closing the tab asks the browser.
    ctx.onBeforeLeave(async () => {
      if (!dirty.peek()) return true
      return dialogs.confirm({ heading: "Kaydedilmemiş değişiklikler", message: "Değişiklikler kaybolacak. Sayfadan çıkılsın mı?", confirmText: "Çık", cancelText: "Kal", variant: "danger" })
    })
    ctx.blockUnload(() => dirty())

    const orderColumns: Column<Order>[] = [
      { key: "no", header: "Sipariş", sortable: true },
      { key: "date", header: "Tarih", sortable: true, format: (v) => dateText(v as Date), compare: (a, b) => a.date.getTime() - b.date.getTime() },
      { key: "items", header: "Kalem", align: "end" },
      { key: "total", header: "Tutar", align: "end", sortable: true, format: (v) => money.format(v as number) },
      { key: "status", header: "Durum", format: (v) => orderStatusBadge(v as Order["status"]) },
    ]

    const text = (label: string, key: "name" | "company" | "email" | "phone", extra: { type?: string; required?: boolean; span?: string } = {}) =>
      html`<bz-input label=${label} type=${extra.type ?? "text"} ?required=${!!extra.required} data-span=${extra.span ?? null}
        .value=${() => draft()[key]} @input=${(e: Event) => set(key, (e.currentTarget as HTMLInputElement).value)}></bz-input>`

    const general = html`<form @submit=${(e: SubmitEvent) => (e.preventDefault(), save())}>
      <bz-form-layout columns="3" min-column-width="14rem">
        <bz-form-section heading="Firma" description="Resmî bilgiler">
          ${text("Firma adı", "company", { required: true, span: "2" })}
          <bz-lookup label="Sektör" selection="leaf" required .items=${SECTORS} .labels=${LOOKUP_TR}
            .value=${() => draft().sector} @change=${(e: CustomEvent<{ value: string }>) => set("sector", e.detail.value)}></bz-lookup>
          <bz-combobox label="Şehir" .value=${() => draft().city} @change=${(e: CustomEvent<{ value: string }>) => set("city", e.detail.value)}>
            ${CITY_LIST.map((c) => html`<bz-option value=${c}>${c}</bz-option>`)}
          </bz-combobox>
          <bz-radio-group label="Segment" orientation="horizontal" data-span="2" .value=${() => draft().segment}
            @change=${(e: CustomEvent<{ value: Customer["segment"] }>) => set("segment", e.detail.value)}>
            <bz-radio value="kurumsal">Kurumsal</bz-radio>
            <bz-radio value="kobi">KOBİ</bz-radio>
            <bz-radio value="bireysel">Bireysel</bz-radio>
          </bz-radio-group>
        </bz-form-section>

        <bz-form-section heading="İletişim">
          ${text("Yetkili", "name", { required: true })}
          ${text("E-posta", "email", { type: "email" })}
          ${text("Telefon", "phone", { type: "tel" })}
          <bz-combobox label="Müşteri temsilcisi" .value=${() => draft().owner} @change=${(e: CustomEvent<{ value: string }>) => set("owner", e.detail.value)}>
            ${OWNERS.map((o) => html`<bz-option value=${o}>${o}</bz-option>`)}
          </bz-combobox>
        </bz-form-section>

        <bz-form-section heading="Tercihler">
          <bz-radio-group label="Durum" orientation="horizontal" .value=${() => draft().status}
            @change=${(e: CustomEvent<{ value: Customer["status"] }>) => set("status", e.detail.value)}>
            <bz-radio value="Aktif">Aktif</bz-radio>
            <bz-radio value="Potansiyel">Potansiyel</bz-radio>
            <bz-radio value="Pasif">Pasif</bz-radio>
          </bz-radio-group>
          <bz-checkbox .checked=${() => draft().vip} @change=${(e: CustomEvent<{ checked: boolean }>) => set("vip", e.detail.checked)}
            hint="VIP müşteriler listede yıldızla gösterilir.">VIP müşteri</bz-checkbox>
          <bz-switch .checked=${() => draft().newsletter} @change=${(e: CustomEvent<{ checked: boolean }>) => set("newsletter", e.detail.checked)}>E-bülten gönder</bz-switch>
          <bz-textarea label="Açıklama" data-span="full" rows="3" autosize max-rows="10" expandable show-count maxlength="1000" .labels=${TEXTAREA_TR}
            .value=${() => draft().notes} @input=${(e: Event) => set("notes", (e.currentTarget as HTMLTextAreaElement).value)}></bz-textarea>
        </bz-form-section>
      </bz-form-layout>
    </form>`

    const addNote = () => {
      const t = note().trim()
      if (!t) return
      notes.update((list) => [{ id: Date.now(), text: t, at: new Date() }, ...list])
      note.set("")
      logActivity(`${saved.peek().company} için not ekledi`, "edit")
    }

    return html`<div class="page">
      <nav class="small muted" aria-label="Konum"><a href=${ctx.router.href("/musteriler")}>Müşteriler</a> › ${() => saved().company}</nav>
      <div class="crm-customer-head">
        <bz-avatar name=${() => saved().name} size="lg"></bz-avatar>
        <div>
          <h1>${() => saved().company}</h1>
          <span class="muted">${() => saved().name} · ${() => saved().city}</span>
        </div>
        ${() => customerStatusBadge(saved().status)}
        ${() => (saved().vip ? html`<bz-badge variant="warning" solid>VIP</bz-badge>` : null)}
        <span class="spacer"></span>
        ${() => (dirty() ? html`<bz-badge variant="warning">Kaydedilmedi</bz-badge>` : null)}
        <bz-button ?disabled=${() => !dirty()} @click=${discard}>Vazgeç</bz-button>
        <bz-button variant="primary" ?disabled=${() => !dirty()} @click=${save} data-tooltip="Kaydet (Enter)">${icon("check")} Kaydet</bz-button>
      </div>

      <bz-tabs class="crm-tabs" .value=${tab} @change.self=${(e: CustomEvent<{ value: string }>) => tab.set(e.detail.value)}>
        <bz-tab-list label="Müşteri">
          <bz-tab value="general">Genel</bz-tab>
          <bz-tab value="orders">Siparişler <bz-badge variant="primary" .count=${() => customerOrders().length}></bz-badge></bz-tab>
          <bz-tab value="notes">Notlar <bz-badge .count=${() => notes().length} hide-zero></bz-badge></bz-tab>
        </bz-tab-list>
        <bz-tab-panel value="general">${general}</bz-tab-panel>
        <bz-tab-panel value="orders">
          <div class="stack">
            <bz-table label="Siparişler" .columns=${orderColumns} .rows=${pageRows}>
              <span slot="empty">Bu müşterinin siparişi yok.</span>
            </bz-table>
            <bz-pagination .total=${() => customerOrders().length} page-size="8" .page=${page} show-info .labels=${PAGINATION_TR}
              @change=${(e: CustomEvent<{ page: number }>) => page.set(e.detail.page)}></bz-pagination>
          </div>
        </bz-tab-panel>
        <bz-tab-panel value="notes">
          <div class="stack">
            <bz-textarea label="Yeni not" rows="2" autosize max-rows="6" .labels=${TEXTAREA_TR} .value=${note}
              @input=${(e: Event) => note.set((e.currentTarget as HTMLTextAreaElement).value)}></bz-textarea>
            <div><bz-button size="sm" variant="primary" ?disabled=${() => !note().trim()} @click=${addNote}>Not ekle</bz-button></div>
            <ul class="crm-notes">
              ${() => notes().map((n) => html`<li>${n.text}<br /><span class="small muted">Ada Yılmaz · ${timeAgo(n.at)}</span></li>`)}
            </ul>
          </div>
        </bz-tab-panel>
      </bz-tabs>
    </div>`
  },
})
