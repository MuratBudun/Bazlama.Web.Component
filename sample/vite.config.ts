import { defineConfig } from "vite"
import htmlImportPlugin from "./src/vite-plugin/html-import"

export default defineConfig({
    plugins: [htmlImportPlugin()],
})
