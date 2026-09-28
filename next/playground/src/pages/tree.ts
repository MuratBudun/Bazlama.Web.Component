import { flush, html, signal } from "@bazlama/core"
import { collectIds, type TreeItem } from "@bazlama/headless"
import { log, logEntry } from "../log"
import { treeUsage } from "../docs/specs"
import { usage } from "../docs/usage"

const MENU: TreeItem[] = [
  { id: "dashboard", label: "Gösterge paneli", icon: "dashboard" },
  {
    id: "sales",
    label: "Satış",
    icon: "cart",
    children: [
      { id: "orders", label: "Siparişler", icon: "file-text", badge: 12 },
      { id: "invoices", label: "Faturalar", icon: "file" },
      { id: "returns", label: "İadeler", icon: "refresh", badge: 2 },
    ],
  },
  {
    id: "stock",
    label: "Stok",
    icon: "box",
    children: [
      { id: "products", label: "Ürünler", icon: "tag" },
      { id: "warehouses", label: "Depolar", icon: "database" },
      {
        id: "definitions",
        label: "Tanımlar",
        icon: "settings",
        children: [
          { id: "units", label: "Birimler" },
          { id: "categories", label: "Kategoriler" },
        ],
      },
    ],
  },
  { id: "customers", label: "Müşteriler", icon: "users" },
  { id: "reports", label: "Raporlar", icon: "chart", disabled: true },
]

const PERMISSIONS: TreeItem[] = [
  {
    id: "p-sales",
    label: "Satış",
    children: [
      { id: "p-sales-read", label: "Görüntüleme" },
      { id: "p-sales-write", label: "Oluşturma / düzenleme" },
      { id: "p-sales-delete", label: "Silme" },
    ],
  },
  {
    id: "p-stock",
    label: "Stok",
    children: [
      { id: "p-stock-read", label: "Görüntüleme" },
      { id: "p-stock-count", label: "Sayım" },
      {
        id: "p-stock-def",
        label: "Tanımlar",
        children: [
          { id: "p-stock-def-units", label: "Birimler" },
          { id: "p-stock-def-cats", label: "Kategoriler" },
        ],
      },
    ],
  },
  { id: "p-admin", label: "Yönetim", children: [{ id: "p-users", label: "Kullanıcılar" }, { id: "p-roles", label: "Roller" }] },
]

const REGIONS: Record<string, string[]> = {
  Marmara: ["İstanbul", "Bursa", "Kocaeli", "Edirne", "Tekirdağ", "Çanakkale", "Balıkesir", "Sakarya"],
  Ege: ["İzmir", "Aydın", "Denizli", "Manisa", "Muğla", "Afyonkarahisar", "Kütahya", "Uşak"],
  Akdeniz: ["Antalya", "Adana", "Mersin", "Hatay", "Isparta", "Burdur", "Kahramanmaraş", "Osmaniye"],
  "İç Anadolu": ["Ankara", "Konya", "Kayseri", "Eskişehir", "Sivas", "Nevşehir", "Aksaray", "Niğde"],
  Karadeniz: ["Samsun", "Trabzon", "Ordu", "Rize", "Giresun", "Zonguldak", "Bolu", "Sinop"],
  "Doğu Anadolu": ["Erzurum", "Van", "Malatya", "Elazığ", "Kars", "Ağrı", "Erzincan", "Bingöl"],
  "Güneydoğu Anadolu": ["Gaziantep", "Diyarbakır", "Şanlıurfa", "Mardin", "Batman", "Siirt", "Adıyaman", "Kilis"],
}
const PLACES: TreeItem[] = Object.entries(REGIONS).map(([region, cities]) => ({
  id: `r-${region}`,
  label: region,
  icon: "folder",
  children: cities.map((city) => ({ id: `c-${city}`, label: city })),
}))

let fileCounter = 0
/** Simulated server: every folder has 2 sub-folders and 3 files, deeper than 3 levels only files. */
const fakeFetch = (item: TreeItem): Promise<TreeItem[]> =>
  new Promise((resolve) =>
    setTimeout(() => {
      const depth = item.id.split("/").length
      const folders = depth < 3 ? ["Belgeler", "Arşiv"] : []
      resolve([
        ...folders.map((name) => ({ id: `${item.id}/${name}`, label: name, icon: "folder", lazy: true })),
        ...["rapor.pdf", "tablo.xlsx", "not.txt"].map((name) => ({ id: `${item.id}/${name}-${++fileCounter}`, label: name, icon: "file" })),
      ])
    }, 600)
  )

function generate(breadth: number[], prefix = "n"): TreeItem[] {
  const [count, ...rest] = breadth
  return Array.from({ length: count }, (_, i) => {
    const id = `${prefix}-${i}`
    return { id, label: `Düğüm ${id.slice(2).replace(/-/g, ".")}`, children: rest.length ? generate(rest, id) : undefined }
  })
}

type TreeEl = HTMLElementTagNameMap["bz-tree"]

export default {
  id: "tree",
  title: "Tree",
  description:
    "Menü, dosya gezgini ve yetki ağacı için tek bileşen. Veri .items ile gelir; satırlar düz DOM olarak (aria-level ile) anahtarlı çizilir, açma/kapama sadece değişen satırları ekler.",
  render() {
    const menuValue = signal("orders")
    const checked = signal<string[]>(["p-sales-read", "p-stock-read"])
    const filter = signal("")
    const perf = signal<{ label: string; ms: number; rows: number }[]>([])
    let menuTree!: TreeEl
    let perfTree!: TreeEl
    const big = generate([20, 25, 20]) // 20 + 500 + 10.000 = 10.520 düğüm

    const measure = (label: string, fn: () => void) => {
      const t0 = performance.now()
      fn()
      flush()
      perfTree.offsetHeight
      perf.update((list) => [{ label, ms: performance.now() - t0, rows: perfTree.querySelectorAll("[role=treeitem]").length }, ...list].slice(0, 8))
    }

    return html`
      ${usage(treeUsage)}

      <section class="demo">
        <h2>Navigasyon menüsü</h2>
        <div class="grid-2">
          <div class="tree-box">
            <bz-tree
              label="Ana menü"
              selection="leaf"
              .items=${MENU}
              .value=${menuValue}
              .expanded=${["sales"]}
              @select=${(e: CustomEvent<{ id: string }>) => menuValue.set(e.detail.id)}
              @activate=${(e: CustomEvent<{ id: string }>) => logEntry("menü", "activate", e.detail.id)}
              @toggle=${(e: CustomEvent<{ id: string; expanded: boolean }>) => logEntry("menü", "toggle", `${e.detail.id} → ${e.detail.expanded}`)}
              ref=${(el: TreeEl) => (menuTree = el)}
            ></bz-tree>
          </div>
          <div>
            <p>Seçili: <code>${menuValue}</code></p>
            <div class="row">
              <bz-button size="sm" @click=${() => (menuTree.expanded = collectIds(MENU))}>Tümünü aç</bz-button>
              <bz-button size="sm" @click=${() => (menuTree.expanded = [])}>Tümünü kapat</bz-button>
              <bz-button size="sm" @click=${() => menuValue.set("units")}>Dışarıdan "Birimler"</bz-button>
            </div>
            <p class="note">
              <code>selection="leaf"</code>: üst öğeler seçilmez, tıklayınca açılır/kapanır. Uygulamada <code>href</code> verilirse satır bir
              bağlantı olur (bu playground'un sol menüsü böyle). Devre dışı öğe odaklanabilir ama seçilemez.
            </p>
          </div>
        </div>
      </section>

      <section class="demo">
        <h2>Dosya gezgini (lazy yükleme)</h2>
        <div class="grid-2">
          <div class="tree-box">
            <bz-tree
              label="Dosyalar"
              .items=${[
                { id: "root", label: "Paylaşılan sürücü", icon: "database", lazy: true },
                { id: "home", label: "Belgelerim", icon: "folder", lazy: true },
              ]}
              .loadChildren=${() => fakeFetch}
              @toggle=${log("dosyalar")}
              @select=${log("dosyalar")}
            ></bz-tree>
          </div>
          <p class="note">
            <code>lazy: true</code> olan öğe ilk açılışta <code>loadChildren(item)</code> ile yüklenir (burada 600 ms gecikmeli sahte sunucu).
            Yüklenirken satır <code>aria-busy</code> alır ve oku bir yükleniyor göstergesine döner.
            <br />Not: <code>.loadChildren=\${() =&gt; fn}</code> şeklinde sarmalandı, çünkü şablonda fonksiyon değerler reaktif kabul edilir.
          </p>
        </div>
      </section>

      <section class="demo">
        <h2>Yetki ağacı (onay kutuları)</h2>
        <div class="grid-2">
          <div class="tree-box">
            <bz-tree
              label="Yetkiler"
              checkable
              selection="none"
              .items=${PERMISSIONS}
              .expanded=${collectIds(PERMISSIONS)}
              .checked=${checked}
              @check=${(e: CustomEvent<{ checked: string[] }>) => {
                checked.set(e.detail.checked)
                log("yetkiler")(e)
              }}
            ></bz-tree>
          </div>
          <div>
            <p>İşaretli yapraklar (<code>checked</code>):</p>
            <p><code>${() => (checked().length ? checked().join(", ") : "—")}</code></p>
            <div class="row">
              <bz-button size="sm" @click=${() => checked.set(collectIds(PERMISSIONS, false).filter((id) => !collectIds(PERMISSIONS).includes(id)))}>Tümünü işaretle</bz-button>
              <bz-button size="sm" @click=${() => checked.set([])}>Temizle</bz-button>
            </div>
            <p class="note">Bir üst öğeyi işaretlemek tüm alt öğelerini işaretler; kısmen işaretli üst öğe <code>aria-checked="mixed"</code> olur. Klavyede Space.</p>
          </div>
        </div>
      </section>

      <section class="demo">
        <h2>Arama / filtre</h2>
        <div class="grid-2">
          <div class="tree-box stack-sm">
            <bz-input placeholder="İl veya bölge ara (ör. izm, dogu)" .value=${filter} @input=${(e: Event) => filter.set((e.currentTarget as HTMLElement & { value: string }).value)}>
              <span slot="prefix">${"⌕"}</span>
            </bz-input>
            <bz-tree label="İller" .items=${PLACES} .filter=${filter} empty-text="Sonuç yok" @select=${log("iller")}></bz-tree>
          </div>
          <p class="note">
            Eşleşen öğeler üst öğeleriyle birlikte gösterilir ve üst öğeler otomatik açılır. Büyük/küçük harf ve aksan duyarsızdır
            ("dogu" → "Doğu Anadolu", "izm" → "İzmir"). Eşleşen etiketler <code>[data-match]</code> ile işaretlenir.
          </p>
        </div>
      </section>

      <section class="demo">
        <h2>Performans: 10.520 düğüm</h2>
        <div class="row">
          <bz-button size="sm" variant="primary" @click=${() => measure("Tümünü aç", () => (perfTree.expanded = collectIds(big)))}>Tümünü aç</bz-button>
          <bz-button size="sm" @click=${() => measure("Tümünü kapat", () => (perfTree.expanded = []))}>Tümünü kapat</bz-button>
          <bz-button size="sm" @click=${() => measure("İlk dalı aç/kapat", () => {
            const open = perfTree.expanded.includes("n-0")
            perfTree.expanded = open ? perfTree.expanded.filter((id) => id !== "n-0") : [...perfTree.expanded, "n-0"]
          })}>İlk dalı aç/kapat</bz-button>
          <bz-button size="sm" @click=${() => measure("Filtre: \"7.7\"", () => (perfTree.filter = perfTree.filter ? "" : "7.7"))}>Filtre aç/kapat</bz-button>
        </div>
        <table class="results" ?hidden=${() => perf().length === 0}>
          <thead><tr><th>İşlem</th><th>Süre (script + layout)</th><th>Görünen satır</th></tr></thead>
          <tbody>${() => perf().map((p) => html`<tr><td>${p.label}</td><td>${`${p.ms.toFixed(1)} ms`}</td><td>${p.rows.toLocaleString("tr-TR")}</td></tr>`)}</tbody>
        </table>
        <div class="tree-box tree-perf">
          <bz-tree label="Büyük ağaç" .items=${big} ref=${(el: TreeEl) => (perfTree = el)}></bz-tree>
        </div>
      </section>

      <section class="demo">
        <h2>Klavye</h2>
        <table class="api">
          <tbody>
            <tr><td><kbd>↑</kbd> <kbd>↓</kbd></td><td>Önceki / sonraki görünen öğe</td></tr>
            <tr><td><kbd>→</kbd></td><td>Kapalıysa aç; açıksa ilk alt öğeye geç</td></tr>
            <tr><td><kbd>←</kbd></td><td>Açıksa kapat; değilse üst öğeye geç</td></tr>
            <tr><td><kbd>Home</kbd> <kbd>End</kbd></td><td>İlk / son öğe</td></tr>
            <tr><td><kbd>Enter</kbd></td><td>Seç ve <code>activate</code> (bağlantıysa git; seçilemeyen üst öğeyse aç/kapat)</td></tr>
            <tr><td><kbd>Space</kbd></td><td>İşaretle (checkable) veya seç</td></tr>
            <tr><td><kbd>*</kbd></td><td>Aynı seviyedeki tüm öğeleri aç</td></tr>
            <tr><td>harf</td><td>Yazarak ara (typeahead)</td></tr>
          </tbody>
        </table>
      </section>
    `
  },
}
