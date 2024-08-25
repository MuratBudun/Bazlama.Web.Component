import { defineConfig } from "vite"
import htmImportPlugin from "./src/vite-plugin/htm-import"
import prismHighlightImportPlugin from "./src/vite-plugin/prism-highlight-import"

export default defineConfig({
    plugins: [htmImportPlugin(), prismHighlightImportPlugin()],
})
