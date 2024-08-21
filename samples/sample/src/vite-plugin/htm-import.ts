import { Plugin } from "vite"

export default function htmImportPlugin(): Plugin {
    return {
        name: "vite-plugin-htm-import",

        transform(src: string, id: string) {
            if (id.endsWith(".htm")) {
                const escapedHTML = JSON.stringify(src)

                return {
                    code: `export default ${escapedHTML};`,
                    map: null, 
                }
            }
        },
    }
}
