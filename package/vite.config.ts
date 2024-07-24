import { resolve } from "path"
import { defineConfig } from "vite"
import dts from "vite-plugin-dts"

export default defineConfig({
    plugins: [dts()],

    build: {
        lib: {
            entry: resolve(__dirname, "src/index.ts"),
            name: "bazlama-web-component",
            fileName: (format) => `bazlama-web-component.${format}.js`,
            formats: ['es', 'cjs', 'umd']
        },

        rollupOptions: {
            // Rollup options if needed
        }        
    },
})