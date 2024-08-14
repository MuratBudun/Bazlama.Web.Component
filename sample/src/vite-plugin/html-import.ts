import { Plugin } from "vite"

export default function htmlImportPlugin(): Plugin {
    return {
        name: "vite-plugin-html-import",

        transform(src: string, id: string) {
            if (id.endsWith("template.htm")) {
                const escapedHTML = JSON.stringify(src)

                return {
                    code: `export default ${escapedHTML};`,
                    map: null, // sourcemap kullanılmıyor
                }
            }
        },
    }
}
