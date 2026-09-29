/**
 * Source of the Shell page's live example, generated from its settings: the same shell as
 * plain HTML, as JavaScript with the DOM API and as a Bazlama html`` template.
 * Only attributes that differ from the defaults are written.
 */

export interface ShellDemoSettings {
  variant: "classic" | "sidebar"
  scrollMode: "content" | "page"
  resizable: boolean
  /** Save widths / collapsed states (persist="shell-demo"). */
  persist: boolean
  stickyFooter: boolean
  fill: boolean
  regions: { header: boolean; start: boolean; end: boolean; footer: boolean }
}

const BREAKPOINT = 720

function shellAttrs(s: ShellDemoSettings): [string, string | true][] {
  const attrs: [string, string | true][] = []
  if (s.variant !== "classic") attrs.push(["variant", s.variant])
  attrs.push(["breakpoint", String(BREAKPOINT)])
  if (s.scrollMode !== "content") attrs.push(["scroll-mode", s.scrollMode])
  if (s.scrollMode === "page" && s.stickyFooter) attrs.push(["sticky-footer", true])
  if (s.resizable) attrs.push(["resizable", true])
  if (s.persist) attrs.push(["persist", "erp-shell"])
  return attrs
}
const fills = (s: ShellDemoSettings) => s.fill && s.scrollMode === "content"

export function shellHtml(s: ShellDemoSettings): string {
  const attrs = shellAttrs(s)
    .map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${v}"`))
    .join("")
  const r = s.regions
  const lines = [`<bz-shell${attrs}>`]
  if (r.header)
    lines.push(
      `  <bz-header slot="header" title="Demo ERP" subtitle="Satış ve stok" user-name="Ada Yılmaz">`,
      ...(r.end ? [`    <bz-button variant="ghost" size="sm" data-shell-toggle="end" aria-label="Detay paneli">Detay</bz-button>`] : []),
      `  </bz-header>`
    )
  if (r.start)
    lines.push(`  <nav slot="start" aria-label="Menü">`, `    <a href="/pano">Gösterge paneli</a>`, `    <a href="/siparisler">Siparişler</a>`, `  </nav>`)
  if (fills(s))
    lines.push(`  <h3>Siparişler</h3>`, `  <!-- Kalan yüksekliği doldurur; .columns / .rows JavaScript ile verilir -->`, `  <bz-data-grid id="orders" data-shell-fill label="Siparişler"></bz-data-grid>`)
  else lines.push(`  <p>İçerik (<main>): shell'in tek zorunlu bölgesi.</p>`)
  if (r.end) lines.push(`  <aside slot="end" aria-label="Detay">Detay paneli</aside>`)
  if (r.footer) lines.push(`  <bz-footer slot="footer">© 2026 Demo ERP <span slot="end">v1.4.2</span></bz-footer>`)
  lines.push(`</bz-shell>`)
  if (s.persist) lines.push(``, `<!-- persist: genişlikler ve daraltma localStorage["bz-shell:erp-shell"] içinde saklanır -->`)
  return lines.join("\n")
}

export function shellJs(s: ShellDemoSettings): string {
  const r = s.regions
  const lines = [`const shell = document.createElement("bz-shell")`]
  for (const [k, v] of shellAttrs(s)) {
    const prop = k.replace(/-(\w)/g, (_, c: string) => c.toUpperCase())
    const note = k === "persist" ? "   // genişlikler + daraltma saklanır" : ""
    lines.push((v === true ? `shell.${prop} = true` : k === "breakpoint" ? `shell.${prop} = ${v}` : `shell.${prop} = "${v}"`) + note)
  }
  lines.push(``, `// Bölgeler slot'larla; shell'i sayfaya eklemeden ÖNCE ekleyin (slotlar ilk bağlanmada okunur)`)
  const parts: string[] = []
  if (r.header) {
    lines.push(`const header = document.createElement("bz-header")`, `header.slot = "header"`, `header.title = "Demo ERP"`, `header.userName = "Ada Yılmaz"`)
    if (r.end)
      lines.push(
        `const details = document.createElement("bz-button")`,
        `details.dataset.shellToggle = "end"   // sağ kenarı aç/kapat`,
        `details.textContent = "Detay"`,
        `header.append(details)`
      )
    parts.push("header")
  }
  if (r.start) {
    lines.push(`const nav = document.createElement("nav")`, `nav.slot = "start"`, `nav.innerHTML = '<a href="/pano">Gösterge paneli</a>'`)
    parts.push("nav")
  }
  if (fills(s)) {
    lines.push(
      `const grid = document.createElement("bz-data-grid")`,
      `grid.toggleAttribute("data-shell-fill", true)   // kalan yüksekliği doldur`,
      `grid.columns = [{ key: "no", header: "Sipariş", width: 110 }, { key: "customer", header: "Müşteri", flex: true }]`,
      `grid.rows = orders`
    )
    parts.push("grid")
  } else {
    lines.push(`const content = document.createElement("p")`, `content.textContent = "İçerik"`)
    parts.push("content")
  }
  if (r.end) {
    lines.push(`const aside = document.createElement("aside")`, `aside.slot = "end"`, `aside.textContent = "Detay paneli"`)
    parts.push("aside")
  }
  if (r.footer) {
    lines.push(`const footer = document.createElement("bz-footer")`, `footer.slot = "footer"`, `footer.textContent = "© 2026 Demo ERP"`)
    parts.push("footer")
  }
  lines.push(`shell.append(${parts.join(", ")})`, ``)
  lines.push(`shell.addEventListener("toggle", (e) => console.log("toggle", e.detail))`)
  if (s.resizable && !s.persist) lines.push(`shell.addEventListener("resize", (e) => savePreference(e.detail))   // kendi saklama yönteminiz`)
  lines.push(`document.body.append(shell)`)
  return lines.join("\n")
}

export function shellTemplate(s: ShellDemoSettings): string {
  const r = s.regions
  const attrs = shellAttrs(s).map(([k, v]) => (v === true ? k : `${k}="${v}"`))
  if (s.resizable && !s.persist) attrs.push(".startWidth=${widths().start}", ".endWidth=${widths().end}", "@resize=${saveWidth}")
  attrs.push("@toggle=${(e) => savePreference(e.detail)}")
  const lines = ["html`", `  <bz-shell ${attrs.join("\n    ")}>`]
  if (r.header)
    lines.push(
      "    <bz-header slot=\"header\" title=\"Demo ERP\" user-name=${user().name}>",
      ...(r.end ? ["      <bz-button variant=\"ghost\" size=\"sm\" data-shell-toggle=\"end\">Detay</bz-button>"] : []),
      "    </bz-header>"
    )
  if (r.start)
    lines.push("    <nav slot=\"start\"><bz-tree selection=\"leaf\" .items=${menu} .value=${section}></bz-tree></nav>")
  lines.push(
    fills(s)
      ? "    <bz-data-grid data-shell-fill label=\"Siparişler\" .columns=${COLUMNS} .rows=${orders}></bz-data-grid>"
      : "    <bz-outlet></bz-outlet>"
  )
  if (r.end) lines.push("    <aside slot=\"end\">${details()}</aside>")
  if (r.footer) lines.push("    <bz-footer slot=\"footer\">© 2026 Demo ERP <span slot=\"end\">v${version}</span></bz-footer>")
  lines.push("  </bz-shell>", "`")
  if (s.resizable && !s.persist)
    lines.push(
      "",
      "// Kenar genişlikleri kendi yönteminizle (ör. sunucuda, kullanıcı başına); tarayıcıda yeterliyse: persist=\"anahtar\"",
      "const widths = signal({ start: 0, end: 0 })",
      "const saveWidth = (e) => widths.update((w) => ({ ...w, [e.detail.side]: e.detail.width ?? 0 }))"
    )
  return lines.join("\n")
}
