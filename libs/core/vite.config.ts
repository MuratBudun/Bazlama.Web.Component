import { resolve } from "path"
import { defineConfig } from "vite"
import dts from "vite-plugin-dts"

export default defineConfig(({ mode }) => {
    const isDev = mode === 'development';
    
    return {
        plugins: [dts()],

        define: {
            __DEV__: JSON.stringify(isDev)
        },

        build: {
            sourcemap: true,
            minify: false,
            emptyOutDir: mode !== 'development', // Only clean on first build (prod)
            
            lib: {
                entry: resolve(__dirname, "src/index.ts"),
                name: "bazlama-web-component",
                fileName: (format) => isDev 
                    ? `bazlama-web-component.dev.${format}.js`
                    : `bazlama-web-component.${format}.js`,
                formats: ['es', 'cjs', 'umd']
            },

            rollupOptions: {
                // Rollup options if needed
            }        
        },
    }
})