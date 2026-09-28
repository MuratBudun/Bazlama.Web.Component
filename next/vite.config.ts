import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"

const r = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export const alias = {
  "@bazlama/core": r("./packages/core/src/index.ts"),
  "@bazlama/headless": r("./packages/headless/src/index.ts"),
  "@bazlama/icons": r("./packages/icons/src/index.ts"),
  "@bazlama/router": r("./packages/router/src/index.ts"),
}

export default defineConfig({
  root: r("./playground"),
  resolve: { alias },
  // Fixed port: 5173 is used by another local project.
  server: { port: 5391, strictPort: true, fs: { allow: [r(".")] } },
  preview: { port: 5392, strictPort: true },
  build: { outDir: r("./dist"), emptyOutDir: true },
})
