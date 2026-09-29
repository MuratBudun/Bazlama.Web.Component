// Bundle size report: minified + gzip/brotli for each entry (dependencies included).
import { build } from "esbuild"
import { brotliCompressSync, gzipSync } from "node:zlib"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))
const alias = {
  "@bazlama/core": `${root}packages/core/src/index.ts`,
  "@bazlama/headless": `${root}packages/headless/src/index.ts`,
  "@bazlama/icons": `${root}packages/icons/src/index.ts`,
  "@bazlama/router": `${root}packages/router/src/index.ts`,
}

const entries = [
  ["core", "packages/core/src/index.ts"],
  ["headless (hepsi, core dahil)", "packages/headless/src/index.ts"],
  ["  button + core", "packages/headless/src/button.ts"],
  ["  input + core", "packages/headless/src/input.ts"],
  ["  panel + core", "packages/headless/src/panel.ts"],
  ["  list + core", "packages/headless/src/list.ts"],
  ["  combobox + list + core", "packages/headless/src/combobox.ts"],
  ["  table + core", "packages/headless/src/table.ts"],
  ["  icon + core", "packages/headless/src/icon.ts"],
  ["  tree + icon + core", "packages/headless/src/tree.ts"],
  ["  dialog + icon + core", "packages/headless/src/dialog.ts"],
  ["  tabs + icon + core", "packages/headless/src/tabs.ts"],
  ["  accordion + core", "packages/headless/src/accordion.ts"],
  ["  alert + icon + core", "packages/headless/src/alert.ts"],
  ["  badge + chip + icon + core", "packages/headless/src/badge.ts"],
  ["  checkbox + switch + radio + core", "packages/headless/src/checkbox.ts"],
  ["  textarea + dialog + core", "packages/headless/src/textarea.ts"],
  ["  password + icon + core", "packages/headless/src/password.ts"],
  ["  login + password + … + core", "packages/headless/src/login.ts"],
  ["  file-upload + icon + core", "packages/headless/src/file-upload.ts"],
  ["  pagination + icon + core", "packages/headless/src/pagination.ts"],
  ["  toolbar + core", "packages/headless/src/toolbar.ts"],
  ["  lookup + tree + table + dialog + core", "packages/headless/src/lookup.ts"],
  ["  form-layout + core", "packages/headless/src/form-layout.ts"],
  ["  data-grid + menu + icon + core", "packages/headless/src/data-grid/grid.ts"],
  ["  toast + dialog + icon + core", "packages/headless/src/toast.ts"],
  ["  tooltip + position + core", "packages/headless/src/tooltip.ts"],
  ["  menu + dialog + icon + core", "packages/headless/src/menu.ts"],
  ["  context-menu + menu + …", "packages/headless/src/context-menu.ts"],
  ["router (core dahil)", "packages/router/src/index.ts"],
  ["icons (tüm set, veri)", "packages/icons/src/index.ts"],
  ["ui css (hepsi)", "packages/ui/src/index.css"],
  ["themes css (3 tema)", "packages/themes/src/index.css"],
]

const kb = (n) => `${(n / 1024).toFixed(2)} KB`.padStart(9)
console.log(`${"paket".padEnd(30)}${"min".padStart(9)}${"gzip".padStart(10)}${"brotli".padStart(10)}`)
for (const [name, entry] of entries) {
  const result = await build({
    entryPoints: [`${root}${entry}`],
    bundle: true,
    minify: true,
    format: "esm",
    target: "es2022",
    write: false,
    alias,
    logLevel: "error",
  })
  const code = result.outputFiles[0].contents
  console.log(
    `${name.padEnd(30)}${kb(code.length)} ${kb(gzipSync(code, { level: 9 }).length)} ${kb(brotliCompressSync(code).length)}`
  )
}
