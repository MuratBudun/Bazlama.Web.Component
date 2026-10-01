import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"

const r = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export const alias = {
  "@bazlama/core": r("./packages/core/src/index.ts"),
  "@bazlama/headless": r("./packages/headless/src/index.ts"),
  "@bazlama/icons": r("./packages/icons/src/index.ts"),
  "@bazlama/router": r("./packages/router/src/index.ts"),
  "@bazlama/themes/builder": r("./packages/themes/src/builder/index.ts"),
}

export default defineConfig({
  root: r("./playground"),
  resolve: { alias },
  // Fixed port: 5173 is used by another local project. host: true also listens on the LAN
  // address, so the playground can be opened from a phone on the same network.
  server: { host: true, port: 5391, strictPort: true, fs: { allow: [r(".")] } },
  preview: { host: true, port: 5392, strictPort: true },
  build: {
    outDir: r("./dist"),
    emptyOutDir: true,
    // The playground and the demo apps (each its own page).
    rollupOptions: {
      input: {
        playground: r("./playground/index.html"),
        crm: r("./playground/apps/crm/index.html"),
        mail: r("./playground/apps/mail/index.html"),
        docs: r("./playground/apps/docs/index.html"),
      },
    },
  },
})
