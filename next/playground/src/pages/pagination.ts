import { computed, html, signal } from "@bazlama/core"
import { icon, toast, type PaginationLabels } from "@bazlama/headless"
import { paginationUsage } from "../docs/specs-forms"
import { usage } from "../docs/usage"
import { log } from "../log"

export const PAGINATION_TR: Partial<PaginationLabels> = {
  nav: "Sayfalama",
  first: "İlk sayfa",
  previous: "Önceki sayfa",
  next: "Sonraki sayfa",
  last: "Son sayfa",
  page: (n) => `Sayfa ${n}`,
  pageInput: "Sayfa",
  of: (n) => `/ ${n}`,
  pageSize: "Sayfa başına",
  info: (a, b, t) => `Gösterilen ${a} - ${b} / ${t}`,
  empty: "Gösterilebilecek veri yok",
}

const ROWS = Array.from({ length: 137 }, (_, i) => ({ id: i + 1, no: `SPR-${String(i + 1).padStart(3, "0")}`, name: `Sipariş ${i + 1}` }))

export default {
  id: "pagination",
  title: "Pagination",
  description:
    "Sayfalama: numaralı (‹ 1 … 4 [5] 6 … 20 ›) veya kompakt (« ‹ Sayfa [5] / 20 › »). Sayfa boyu seçimi, bilgi metni ve ek kontroller için slot.",
  render() {
    const page = signal(1)
    const size = signal(10)
    const query = signal("")
    const filtered = computed(() => ROWS.filter((r) => r.name.includes(query())))
    const visible = computed(() => filtered().slice((page() - 1) * size(), page() * size()))
    const numbersPage = signal(7)
    return html`
      ${usage(paginationUsage)}

      <section class="demo">
        <h2>Numaralı</h2>
        <div class="stack-sm">
          <bz-pagination total="500" page-size="10" .page=${numbersPage} .labels=${PAGINATION_TR} show-info
            @change=${(e: CustomEvent<{ page: number }>) => (numbersPage.set(e.detail.page), log("sayfa")(e))}></bz-pagination>
          <bz-pagination total="500" page-size="10" .page=${numbersPage} .labels=${PAGINATION_TR} siblings="2" edges
            @change=${(e: CustomEvent<{ page: number }>) => numbersPage.set(e.detail.page)}></bz-pagination>
          <p class="muted small">İkinci: <code>siblings="2" edges</code>; ikisi aynı sinyale bağlı.</p>
        </div>
      </section>

      <section class="demo">
        <h2>Kompakt + tablo (masaüstü uygulaması tarzı)</h2>
        <div class="stack-sm">
          <bz-input placeholder="Ada göre filtrele (ör. 1)" .value=${query}
            @input=${(e: Event) => (query.set((e.currentTarget as HTMLInputElement).value), page.set(1))}></bz-input>
          <bz-table label="Formlar" .columns=${[{ key: "no", header: "No", width: "8rem" }, { key: "name", header: "Adı" }]} .rows=${visible}></bz-table>
          <bz-pagination variant="compact" show-info .labels=${PAGINATION_TR} .total=${() => filtered().length}
            .page=${page} .pageSize=${size} .pageSizes=${[10, 25, 50]}
            @change=${(e: CustomEvent<{ page: number; pageSize: number }>) => (page.set(e.detail.page), size.set(e.detail.pageSize))}>
            <bz-button size="sm" variant="ghost" aria-label="Yenile" data-tooltip="Yenile" @click=${() => toast.info("Yenilendi")}>${icon("refresh")}</bz-button>
          </bz-pagination>
          <p class="note">Filtre toplamı azaltınca sayfa son sayfaya kısılır. Sayfa kutusunda ↑/↓ sayfa değiştirir.</p>
        </div>
      </section>
    `
  },
}
