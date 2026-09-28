import { flush, html, repeat, signal } from "@bazlama/core"
import { dialogs, type Column, type Sort } from "@bazlama/headless"
import { customer, customers, resetData, type Customer } from "../data"
import { log } from "../log"
import { tableUsage } from "../docs/specs"
import { usage } from "../docs/usage"

const money = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" })

const columns: Column<Customer>[] = [
  { key: "id", header: "#", sortable: true, align: "end", width: "4rem" },
  { key: "name", header: "Ad Soyad", sortable: true },
  { key: "email", header: "E-posta" },
  { key: "city", header: "Şehir", sortable: true },
  { key: "amount", header: "Tutar", sortable: true, align: "end", format: (v) => money.format(v as number) },
  {
    key: "status",
    header: "Durum",
    sortable: true,
    format: (v) => html`<span class="badge" data-status=${v}>${v}</span>`,
  },
]

interface Measurement {
  id: number
  label: string
  script: number
  total: number
}

export default {
  id: "table",
  title: "Table",
  description:
    "Veri tablosu: .columns ve .rows property'leri, anahtarlı (keyed) satırlar, istemci/manuel sıralama, seçim, sticky başlık. Satır nesnesini değiştirirseniz satır yeniden çizilir; aynı nesne kalırsa DOM korunur.",
  render() {
    resetData()
    const rows = signal<Customer[]>(customers(25))
    const selection = signal<unknown[]>([])

    const perfRows = signal<Customer[]>([])
    const perfSort = signal<Sort>(null)
    const results = signal<Measurement[]>([])
    let measureId = 0

    const measure = async (label: string, fn: () => void) => {
      const t0 = performance.now()
      fn()
      flush()
      const t1 = performance.now()
      await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve)))
      const t2 = performance.now()
      results.update((list) => [{ id: ++measureId, label, script: t1 - t0, total: t2 - t0 }, ...list].slice(0, 10))
    }
    const create = (count: number) => measure(`${count.toLocaleString("tr-TR")} satır oluştur`, () => perfRows.set(customers(count)))
    const updateEvery10th = () =>
      measure("Her 10. satırı güncelle", () =>
        perfRows.update((list) => list.map((row, i) => (i % 10 === 0 ? { ...row, name: `${row.name} ✎`, amount: row.amount + 1 } : row)))
      )
    const swap = () =>
      measure("2. ve sondan 2. satırı değiştir", () =>
        perfRows.update((list) => {
          if (list.length < 4) return list
          const next = list.slice()
          const j = next.length - 2
          ;[next[1], next[j]] = [next[j], next[1]]
          return next
        })
      )
    const sortBy = (key: string) =>
      measure(`"${key}" sütununa göre sırala`, () =>
        perfSort.set(perfSort.peek()?.key === key && perfSort.peek()?.dir === "asc" ? { key, dir: "desc" } : { key, dir: "asc" })
      )
    const append = () => measure("1.000 satır ekle", () => perfRows.update((list) => [...list, ...Array.from({ length: 1000 }, () => customer())]))
    const clear = () => measure("Temizle", () => perfRows.set([]))
    const ms = (n: number) => `${n.toFixed(1)} ms`

    return html`
      ${usage(tableUsage)}

      <section class="demo">
        <h2>Satır açma: çift tık ve Enter</h2>
        <bz-table
          label="Müşteriler (açılabilir)"
          activatable
          .columns=${columns}
          .rows=${() => rows().slice(0, 6)}
          @row-activate=${(e: CustomEvent<{ row: Customer; via: string }>) =>
            void dialogs.alert({ heading: e.detail.row.name, message: `${e.detail.row.city} · ${e.detail.row.email} (açılış: ${e.detail.via})` })}
        ></bz-table>
        <p class="note">
          Çift tıklayın, ya da tabloya Tab ile girip ↑/↓ ile gezinin ve Enter'a basın: <code>row-activate</code> olayı
          <code>{ row, key, via }</code> ile gelir. <code>activatable</code> satırları tek sekme durağıyla odaklanabilir yapar; çift tık her tabloda çalışır.
        </p>
      </section>

      <section class="demo">
        <h2>Temel</h2>
        <bz-table
          label="Müşteriler"
          selectable
          .columns=${columns}
          .rows=${rows}
          .selection=${selection}
          @selection-change=${(e: CustomEvent<{ selection: unknown[] }>) => {
            selection.set(e.detail.selection)
            log("müşteriler")(e)
          }}
          @sort=${log("müşteriler")}
          @row-click=${(e: CustomEvent<{ row: Customer }>) => log("müşteriler")(new CustomEvent("row-click", { detail: { id: e.detail.row.id } }))}
          style="--bz-table-max-height: 360px"
        ></bz-table>
        <div class="row">
          <span class="muted">${() => `${selection().length} seçili`}</span>
          <bz-button size="sm" @click=${() => rows.update((list) => [customer(), ...list])}>Başa satır ekle</bz-button>
          <bz-button size="sm" @click=${() => rows.update((list) => list.filter((r) => !selection().includes(r.id)))}>Seçilenleri sil</bz-button>
          <bz-button size="sm" @click=${() => rows.set([])}>Boşalt</bz-button>
        </div>
      </section>

      <section class="demo">
        <h2>Performans</h2>
        <div class="row">
          <bz-button size="sm" variant="primary" @click=${() => create(1000)}>1.000 satır</bz-button>
          <bz-button size="sm" variant="primary" @click=${() => create(10000)}>10.000 satır</bz-button>
          <bz-button size="sm" @click=${append}>+1.000 ekle</bz-button>
          <bz-button size="sm" @click=${updateEvery10th}>Her 10. satırı güncelle</bz-button>
          <bz-button size="sm" @click=${swap}>Satır değiştir</bz-button>
          <bz-button size="sm" @click=${() => sortBy("name")}>Ada göre sırala</bz-button>
          <bz-button size="sm" @click=${() => sortBy("amount")}>Tutara göre sırala</bz-button>
          <bz-button size="sm" variant="ghost" @click=${clear}>Temizle</bz-button>
        </div>
        <table class="results" ?hidden=${() => results().length === 0}>
          <thead><tr><th>İşlem</th><th>Script</th><th>Boyamaya kadar</th></tr></thead>
          <tbody>
            ${repeat(
              results,
              (r) => r.id,
              (r) => html`<tr><td>${r.label}</td><td>${ms(r.script)}</td><td>${ms(r.total)}</td></tr>`
            )}
          </tbody>
        </table>
        <p class="muted">${() => `${perfRows().length.toLocaleString("tr-TR")} satır`}</p>
        <bz-table
          .columns=${columns}
          .rows=${perfRows}
          .sort=${perfSort}
          style="--bz-table-max-height: 420px"
        ></bz-table>
        <p class="note">"Script": sinyal güncellemesi + DOM işlemleri (senkron). "Boyamaya kadar": bir sonraki frame'e kadar geçen süre (layout + paint dahil, yaklaşık).</p>
      </section>
    `
  },
}
