import { defineConfig } from "vite"
import htmImportPlugin from "./src/vite-plugin/htm-import"
import prismHighlightImportPlugin from "./src/vite-plugin/prism-highlight-import"

export default defineConfig({
    plugins: [htmImportPlugin(), prismHighlightImportPlugin()],
    base: process.env.BASE_PATH || '/',

    server: {
        proxy: {
			"/api": {
				target: "http://localhost:8087",
				changeOrigin: true,
				secure: false,
				configure: (proxy, options) => {
					// proxy will be an instance of 'http-proxy'
				},
			},
		},
	},
})
