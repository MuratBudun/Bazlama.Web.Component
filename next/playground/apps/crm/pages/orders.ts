import { computed, html, signal } from "@bazlama/core"
import { dialogs, icon, toast, type Column, type Sort } from "@bazlama/headless"
import { definePage } from "@bazlama/router"
import { dateText, money } from "../../shared/boot"
import { PAGINATION_TR } from "../labels"
import { logActivity, orders, type Order, type OrderStatus } from "../store"

const STATUS_VARIANT: Record<OrderStatus, string> = { Hazırlanıyor: "warning", Kargoda: "info", "Teslim edildi": "success", İptal: "neutral" }
export const orderStatusBadge = (s: OrderStatus) => html`<bz-badge variant=${STATUS_VARIANT[s]}>${s}</bz-badge>`
const TABS = ["Tümü", "Hazırlanıyor", "Kargoda", "Teslim edildi", "İptal"] as const
const PRODUCTS = ["Endüstriyel sensör", "Kontrol paneli", "Kablo seti (50 m)", "Yazılım lisansı", "Bakım hizmeti", "Yedek parça kiti"]

function setStatus(o: Order, status: OrderStatus) {
  orders.update((list) => list.map((x) => (x.id === o.id ? { ...x, status } : x)))
  logActivity(`${o.no} durumu "${status}" yapıldı`, "box")
  toast.success(`${o.no}: ${status}`)
}

async function showOrder(o: Order) {
  const lines = Array.from({ length: Math.min(o.items, 6) }, (_, i) => ({ name: PRODUCTS[(o.id + i) % PRODUCTS.length], qty: ((o.id * (i + 3)) % 9) + 1 }))
  const next = await dialogs.open<OrderStatus>({
    heading: `Sipariş ${o.no}`,
    content: html`<div class="stack">
      <div class="row"><strong>${o.customer}</strong><span class="spacer"></span>${orderStatusBadge(o.status)}</div>
      <span class="muted small">${dateText(o.date)} · ${o.items} kalem · ${money.format(o.total)}</span>
      <bz-list label="Kalemler">
        ${lines.map((l) => html`<bz-option value=${l.name}>${l.qty} × ${l.name}</bz-option>`)}
      </bz-list>
    </div>`,
    footer: (ref) => html`<bz-button @click=${() => void ref.close()}>Kapat</bz-button>
      ${o.status === "Hazırlanıyor" ? html`<bz-button variant="primary" @click=${() => void ref.close("Kargoda")}>${icon("send")} Kargoya ver</bz-button>` : null}`,
  })
  if (next) setStatus(o, next)
}

export default definePage({
  title: "Siparişler",
  setup(ctx) {
    const tab = signal<(typeof TABS)[number]>("Tümü")
    const query = signal("")
    const sort = signal<Sort>({ key: "date", dir: "desc" })
    const page = signal(ctx.query.number("sayfa", 1))
    const size = signal(15)

    const filtered = computed(() => {
      const q = query().toLocaleLowerCase("tr-TR").trim()
      return orders().filter((o) => (tab() === "Tümü" || o.status === tab()) && (!q || `${o.no} ${o.customer}`.toLocaleLowerCase("tr-TR").includes(q)))
    })
    const sorted = computed(() => {
      const s = sort()
      if (!s) return filtered()
      const dir = s.dir === "asc" ? 1 : -1
      const value = (o: Order) => (s.key === "date" ? o.date.getTime() : (o[s.key] as string | number))
      return filtered()
        .slice()
        .sort((a, b) => (value(a) > value(b) ? dir : value(a) < value(b) ? -dir : 0))
    })
    const visible = computed(() => sorted().slice((page() - 1) * size(), page() * size()))
    const counts = computed(() => {
      const map = new Map<string, number>()
      for (const o of orders()) map.set(o.status, (map.get(o.status) ?? 0) + 1)
      return map
    })

    const columns: Column<Order>[] = [
      { key: "no", header: "Sipariş", sortable: true, format: (v) => html`<strong>${String(v)}</strong>` },
      { key: "customer", header: "Müşteri", sortable: true },
      { key: "date", header: "Tarih", sortable: true, format: (v) => dateText(v as Date) },
      { key: "items", header: "Kalem", align: "end", sortable: true },
      { key: "total", header: "Tutar", align: "end", sortable: true, format: (v) => money.format(v as number) },
      { key: "status", header: "Durum", format: (v) => orderStatusBadge(v as OrderStatus) },
      {
        key: "actions",
        header: "",
        width: "3rem",
        format: (_v, row) => html`<bz-menu placement="bottom-end" @select=${(e: CustomEvent<{ value: string }>) => {
          if (e.detail.value === "show") void showOrder(row)
          else setStatus(row, e.detail.value as OrderStatus)
        }}>
          <bz-button slot="trigger" size="sm" variant="ghost" aria-label=${`${row.no} işlemleri`}>${icon("more-horizontal")}</bz-button>
          <bz-menu-item value="show" icon="eye">Ayrıntılar</bz-menu-item>
          <bz-menu-separator></bz-menu-separator>
          <bz-menu-item value="Kargoda" icon="send" ?disabled=${row.status !== "Hazırlanıyor"}>Kargoya ver</bz-menu-item>
          <bz-menu-item value="Teslim edildi" icon="check" ?disabled=${row.status !== "Kargoda"}>Teslim edildi</bz-menu-item>
          <bz-menu-item value="İptal" icon="x" variant="danger" ?disabled=${row.status === "Teslim edildi" || row.status === "İptal"}>İptal et</bz-menu-item>
        </bz-menu>`,
      },
    ]

    return html`<div class="page">
      <div class="page-head">
        <h1>Siparişler</h1>
        <span class="spacer"></span>
        <bz-input placeholder="Sipariş no veya müşteri" aria-label="Sipariş ara" .value=${query}
          @input=${(e: Event) => (query.set((e.currentTarget as HTMLInputElement).value), page.set(1))}>
          <span slot="prefix">${icon("search")}</span>
        </bz-input>
      </div>

      <bz-tabs .value=${tab} @change.self=${(e: CustomEvent<{ value: (typeof TABS)[number] }>) => (tab.set(e.detail.value), page.set(1))}>
        <bz-tab-list label="Durum">
          ${TABS.map(
            (t) => html`<bz-tab value=${t}>${t} <bz-badge .count=${() => (t === "Tümü" ? orders().length : (counts().get(t) ?? 0))}></bz-badge></bz-tab>`
          )}
        </bz-tab-list>
      </bz-tabs>

      <bz-table label="Siparişler" sort-mode="manual" activatable .columns=${columns} .rows=${visible} .sort=${sort}
        @sort=${(e: CustomEvent<{ sort: Sort }>) => (sort.set(e.detail.sort), page.set(1))}
        @row-activate=${(e: CustomEvent<{ row: Order }>) => void showOrder(e.detail.row)}>
        <span slot="empty">Bu filtrede sipariş yok.</span>
      </bz-table>

      <bz-pagination .total=${() => filtered().length} .page=${page} .pageSize=${size} .pageSizes=${[15, 30, 60]} edges show-info .labels=${PAGINATION_TR}
        @change=${(e: CustomEvent<{ page: number; pageSize: number }>) => {
          page.set(e.detail.page)
          size.set(e.detail.pageSize)
          void ctx.query.set({ sayfa: e.detail.page > 1 ? e.detail.page : null })
        }}></bz-pagination>
    </div>`
  },
})
