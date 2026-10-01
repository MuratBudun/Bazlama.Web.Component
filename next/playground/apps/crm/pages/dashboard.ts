import { computed, html, signal } from "@bazlama/core"
import { icon, toast, type Column } from "@bazlama/headless"
import { definePage } from "@bazlama/router"
import { dateText, money, number } from "../../shared/boot"
import { customers, orders, type Order } from "../store"
import { orderStatusBadge } from "./orders"

const RANGES = [
  ["7", "Son 7 gün"],
  ["30", "Son 30 gün"],
  ["90", "Son 90 gün"],
] as const

interface Task {
  id: number
  text: string
  due: "today" | "week" | "late"
  done: boolean
}

export default definePage({
  title: "Gösterge paneli",
  setup(ctx) {
    const range = signal<"7" | "30" | "90">("30")
    const since = computed(() => Date.now() - Number(range()) * 86400000)
    const inRange = computed(() => orders().filter((o) => o.date.getTime() >= since() && o.status !== "İptal"))
    const revenue = computed(() => inRange().reduce((n, o) => n + o.total, 0))
    const open = computed(() => orders().filter((o) => o.status === "Hazırlanıyor" || o.status === "Kargoda").length)
    const active = computed(() => customers().filter((c) => c.status === "Aktif").length)
    const leads = computed(() => customers().filter((c) => c.status === "Potansiyel").length)
    const recent = computed(() => orders().slice(0, 6))
    const expiring = signal(true)

    const tasks = signal<Task[]>([
      { id: 1, text: "Anadolu Tekstil teklifini güncelle", due: "today", done: false },
      { id: 2, text: "Ege Yazılım ile demo toplantısı", due: "today", done: true },
      { id: 3, text: "Q3 satış raporunu hazırla", due: "week", done: false },
      { id: 4, text: "Pasif müşterilere geri kazanım e-postası", due: "week", done: false },
      { id: 5, text: "Toros Enerji sözleşme yenilemesi", due: "late", done: false },
    ])
    const toggleTask = (id: number, done: boolean) => {
      tasks.update((list) => list.map((t) => (t.id === id ? { ...t, done } : t)))
      if (done) toast.success("Görev tamamlandı")
    }
    const taskGroup = (due: Task["due"]) => html`<div class="stack">
      ${() =>
        tasks()
          .filter((t) => t.due === due)
          .map((t) => html`<bz-checkbox .checked=${t.done} @change=${(e: CustomEvent<{ checked: boolean }>) => toggleTask(t.id, e.detail.checked)}>${t.text}</bz-checkbox>`)}
    </div>`
    const openCount = (due: Task["due"]) => () => tasks().filter((t) => t.due === due && !t.done).length

    const columns: Column<Order>[] = [
      { key: "no", header: "Sipariş" },
      { key: "customer", header: "Müşteri" },
      { key: "date", header: "Tarih", format: (v) => dateText(v as Date) },
      { key: "total", header: "Tutar", align: "end", format: (v) => money.format(v as number) },
      { key: "status", header: "Durum", format: (v) => orderStatusBadge(v as Order["status"]) },
    ]

    const stat = (label: string, value: () => string, hint: string, trend: string, variant: string) => html`<div class="card crm-stat">
      <span class="muted small" data-tooltip=${hint}>${label} ${icon("info", { size: 12 })}</span>
      <span class="value">${value}</span>
      <span class="trend"><bz-badge variant=${variant}>${trend}</bz-badge></span>
    </div>`

    return html`<div class="page">
      <div class="page-head">
        <h1>Gösterge paneli</h1>
        <span class="muted">${dateText(new Date())}</span>
        <span class="spacer"></span>
        <div class="row" role="group" aria-label="Zaman aralığı">
          ${RANGES.map(
            ([value, label]) => html`<bz-chip selectable .selected=${() => range() === value} @change=${() => range.set(value)}>${label}</bz-chip>`
          )}
        </div>
      </div>

      ${() =>
        expiring()
          ? html`<bz-alert variant="warning" heading="Süresi dolan teklifler" dismissible @dismiss=${() => expiring.set(false)}>
              3 teklifin geçerlilik süresi bu hafta doluyor. Müşterilere hatırlatma göndermek ister misiniz?
              <bz-button slot="actions" size="sm" variant="primary" @click=${() => toast.success("Hatırlatmalar gönderildi")}>Hatırlat</bz-button>
              <bz-button slot="actions" size="sm" @click=${() => void ctx.navigate({ path: "/musteriler", query: { durum: "Potansiyel" } })}>Müşterileri gör</bz-button>
            </bz-alert>`
          : null}

      <div class="cards">
        ${stat("Ciro", () => money.format(revenue()), "Seçilen aralıktaki, iptal edilmemiş siparişlerin toplamı", "+12,4%", "success")}
        ${stat("Sipariş", () => number.format(inRange().length), "Seçilen aralıktaki sipariş sayısı", "+3,1%", "success")}
        ${stat("Açık sipariş", () => number.format(open()), "Hazırlanan veya kargodaki siparişler", "takipte", "info")}
        ${stat("Aktif müşteri", () => number.format(active()), "Durumu Aktif olan müşteriler", "-0,8%", "warning")}
        ${stat("Potansiyel", () => number.format(leads()), "Teklif aşamasındaki müşteriler", "+5 bu hafta", "info")}
      </div>

      <div class="grid-2">
        <bz-panel heading="Son siparişler" open>
          <bz-table .columns=${columns} .rows=${recent} activatable striped aria-label="Son siparişler"
            @row-activate=${() => void ctx.navigate("/siparisler")}></bz-table>
          <div class="row" style="padding: 0.5rem 0 0">
            <a href=${ctx.router.href("/siparisler")}>Tüm siparişler ${icon("chevron-right", { size: 14 })}</a>
          </div>
        </bz-panel>

        <bz-panel heading="Görevler" open>
          <bz-accordion multiple value="late,today">
            <bz-accordion-item value="late" heading="Gecikmiş">
              <bz-badge slot="actions" variant="danger" .count=${openCount("late")} hide-zero></bz-badge>
              ${taskGroup("late")}
            </bz-accordion-item>
            <bz-accordion-item value="today" heading="Bugün">
              <bz-badge slot="actions" variant="primary" .count=${openCount("today")} hide-zero></bz-badge>
              ${taskGroup("today")}
            </bz-accordion-item>
            <bz-accordion-item value="week" heading="Bu hafta">
              <bz-badge slot="actions" .count=${openCount("week")} hide-zero></bz-badge>
              ${taskGroup("week")}
            </bz-accordion-item>
          </bz-accordion>
        </bz-panel>
      </div>
    </div>`
  },
})
