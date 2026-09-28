import { computed, html, signal } from "@bazlama/core"
import { icon } from "@bazlama/headless"
import { RECENT, WORK_ITEMS, type WorkItem } from "./data"
import { statusTag } from "./ui"

/** Home tab: "Doküman Yönetimi · 18 bekleyen iş", work list with filters, recent items. */
export function home(openDoc: (no: string) => void) {
  const tab = signal("mine")
  const filter = signal<"" | WorkItem["form"]>("")
  const query = signal("")
  const items = computed(() => {
    const q = query().trim().toLocaleLowerCase("tr-TR")
    return WORK_ITEMS.filter((w) => (!filter() || w.form === filter()) && (!q || `${w.no} ${w.title}`.toLocaleLowerCase("tr-TR").includes(q)))
  })
  const count = (form: WorkItem["form"]) => WORK_ITEMS.filter((w) => w.form === form).length
  const late = WORK_ITEMS.filter((w) => w.days > 7).length

  const chip = (value: "" | WorkItem["form"], label: string) =>
    html`<bz-chip selectable .selected=${() => filter() === value} @change=${() => filter.set(value)}>${label}</bz-chip>`

  return html`<div class="qx-home">
    <div class="qx-home-main">
      <div class="qx-home-head">
        <span class="qx-home-icon">${icon("file-text", { size: 22 })}</span>
        <div><h2>Doküman Yönetimi</h2><span class="muted small">${WORK_ITEMS.length} bekleyen iş</span></div>
      </div>
      <bz-tabs .value=${tab} @change.self=${(e: CustomEvent<{ value: string }>) => tab.set(e.detail.value)}>
        <bz-tab-list>
          <bz-tab value="mine">Benim İşlerim <bz-badge variant="danger" solid count=${WORK_ITEMS.length}></bz-badge></bz-tab>
          <bz-tab value="created">Oluşturduklarım <bz-badge variant="primary" count="13"></bz-badge></bz-tab>
          <bz-tab value="delegated">Bana Delege Edilenler</bz-tab>
          <bz-tab value="favorites">Favorilerim <bz-badge variant="primary" count="1"></bz-badge></bz-tab>
          <bz-tab value="search">${icon("search")} Arama</bz-tab>
        </bz-tab-list>
        <bz-tab-panel value="mine">
          <bz-toolbar class="qx-toolbar" label="Filtreler">
            ${chip("", "Tümü")}
            ${chip("Doküman Değişiklik İsteği Formu", `Doküman Değişiklik İsteği Formu (${count("Doküman Değişiklik İsteği Formu")})`)}
            ${chip("Doküman Formu", `Doküman Formu (${count("Doküman Formu")})`)}
            <bz-toolbar-spacer></bz-toolbar-spacer>
            <bz-input placeholder="Doküman no / açıklama ara…" .value=${query} @input=${(e: Event) => query.set((e.currentTarget as HTMLInputElement).value)}>
              <span slot="prefix">${icon("search")}</span>
            </bz-input>
          </bz-toolbar>
          <bz-alert variant="warning" class="qx-alert">Bu sayfada 7 günden uzun süredir bekleyen ${late} iş var.</bz-alert>
          <ul class="qx-work">
            ${() =>
              items().length
                ? items().map(
                    (w) => html`<li>
                      <button type="button" class="qx-work-item" @click=${() => openDoc(w.no)}>
                        <span class="qx-work-title"><strong>${w.no}</strong> <span class="muted">${w.title}</span></span>
                        <span class="qx-work-meta"><bz-badge>${w.form}</bz-badge> ${w.status}</span>
                      </button>
                      <span class="qx-age" data-late=${w.days > 30 ? "" : null}>${w.days} gündür</span>
                    </li>`
                  )
                : html`<li class="qx-empty">Eşleşen iş yok.</li>`}
          </ul>
        </bz-tab-panel>
        ${["created", "delegated", "favorites", "search"].map(
          (v) => html`<bz-tab-panel value=${v}><p class="qx-empty">${icon("list", { size: 28 })}<br />Bu liste mockup'ta boş.</p></bz-tab-panel>`
        )}
      </bz-tabs>
    </div>
    <aside class="qx-recent" aria-label="Son erişilenler">
      <h3>${icon("clock")} Son Erişilenler</h3>
      <p class="muted small">Son açtığınız ${RECENT.length} form (tüm oturumlardan)</p>
      <ul>
        ${RECENT.map(
          (r) => html`<li>
            <button type="button" class="qx-work-item" @click=${() => openDoc(r.no)}>
              <span class="qx-work-title"><strong>${r.no}</strong> <span class="muted">${r.title}</span></span>
              <span class="qx-work-meta"><bz-badge>Doküman Formu</bz-badge> ${statusTag(r.status)}</span>
            </button>
            <span class="qx-age">${r.when}</span>
          </li>`
        )}
      </ul>
    </aside>
  </div>`
}
