import { defineConfig } from "vite"
import htmImportPlugin from "./src/vite-plugin/htm-import"

export default defineConfig({
    plugins: [htmImportPlugin()],
})
