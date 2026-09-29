import { computed, html, signal } from "@bazlama/core"
import { dialogs, icon, type TreeItem } from "@bazlama/headless"
import { highlight } from "../../src/docs/code"
import "./source.css"

/**
 * "Kaynağı göster": the demo apps' own files, read from the source (Vite ?raw imports, loaded
 * when the viewer opens, so the shown code is always the real one).
 */
const FILES = import.meta.glob(["../**/*.ts", "../**/*.css", "../**/*.html"], { query: "?raw", import: "default" }) as Record<
  string,
  () => Promise<string>
>

export type DemoAppId = "crm" | "mail" | "docs"
export const DEMO_APP_TITLES: Record<DemoAppId, string> = { crm: "Ada CRM", mail: "Posta", docs: "Bazlama Rehberi" }

/** Glob keys are relative to this folder: "./boot.ts" (shared) or "../crm/main.ts". */
const pathOf = (key: string) => (key.startsWith("./") ? `shared/${key.slice(2)}` : key.replace(/^\.\.\//, ""))
const loaders = new Map(Object.entries(FILES).map(([key, load]) => [pathOf(key), load]))

/** Paths of an app's files (and the shared ones), relative to playground/apps. */
export function sourceFiles(app: DemoAppId): string[] {
  const order = (p: string) => (p.endsWith("index.html") ? 0 : p.endsWith("main.ts") ? 1 : p.includes("/pages/") ? 3 : p.startsWith("shared/") ? 4 : 2)
  return [...loaders.keys()]
    .filter((p) => p.startsWith(`${app}/`) || p.startsWith("shared/"))
    .sort((a, b) => order(a) - order(b) || a.localeCompare(b))
}

function fileTree(paths: string[]): TreeItem[] {
  const root: TreeItem[] = []
  for (const path of paths) {
    const parts = path.split("/")
    let level = root
    parts.forEach((part, i) => {
      const id = parts.slice(0, i + 1).join("/")
      const leaf = i === parts.length - 1
      let node = level.find((n) => n.id === id)
      if (!node) {
        node = leaf
          ? { id, label: part, icon: part.endsWith(".css") ? "palette" : part.endsWith(".html") ? "code" : "file-text" }
          : { id, label: part, icon: "folder", children: [] }
        level.push(node)
      }
      if (!leaf) level = node.children!
    })
  }
  return root
}

/** Opens the source viewer of a demo app: file tree on the start side, the code on the end. */
export function showSource(app: DemoAppId) {
  const paths = sourceFiles(app)
  const tree = fileTree(paths)
  const current = signal(paths.find((p) => p.endsWith("main.ts")) ?? paths[0])
  const text = signal<string | null>(null)
  const copied = signal(false)
  const cache = new Map<string, string>()
  const load = async (path: string) => {
    current.set(path)
    if (!cache.has(path)) {
      text.set(null)
      cache.set(path, (await loaders.get(path)!()).replace(/\r\n/g, "\n"))
    }
    if (current.peek() === path) text.set(cache.get(path)!)
  }
  void load(current.peek())
  const lines = computed(() => (text() ?? "").split("\n").length)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text.peek() ?? "")
      copied.set(true)
      setTimeout(() => copied.set(false), 1200)
    } catch {
      /* clipboard unavailable */
    }
  }

  void dialogs.open({
    heading: `${DEMO_APP_TITLES[app]} · kaynak kod`,
    size: "full",
    attrs: { class: "source-viewer" },
    content: html`<div class="source-layout">
      <bz-tree label="Dosyalar" selection="leaf" .items=${tree} .value=${current}
        .expanded=${[...new Set(paths.flatMap((p) => p.split("/").slice(0, -1).map((_, i, a) => a.slice(0, i + 1).join("/"))))]}
        @select=${(e: CustomEvent<{ id: string }>) => void load(e.detail.id)}></bz-tree>
      <div class="source-file">
        <div class="source-file-head">
          <code>playground/apps/${current}</code>
          <span class="muted small">${() => (text() === null ? "yükleniyor…" : `${lines()} satır`)}</span>
          <span class="spacer"></span>
          <bz-button size="sm" variant="ghost" @click=${copy}>${icon("copy")} ${() => (copied() ? "Kopyalandı" : "Kopyala")}</bz-button>
        </div>
        <pre class="source-code"><code>${() => (text() === null ? "" : highlight(text()!))}</code></pre>
      </div>
    </div>`,
    footer: (ref) => html`<span class="muted small">Kod, sayfanın kendi dosyalarından okunur (Vite ?raw).</span>
      <span class="spacer"></span><bz-button @click=${() => void ref.close()}>Kapat</bz-button>`,
  })
}

/** The footer button every demo app shows. */
export const sourceButton = (app: DemoAppId) =>
  html`<bz-button size="sm" variant="ghost" @click=${() => showSource(app)}>${icon("code")} Kaynağı göster</bz-button>`
