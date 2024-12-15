import { Plugin } from "vite"
import Prism from "prismjs"

import "prismjs/components/prism-css"
import "prismjs/components/prism-typescript"
import "prismjs/components/prism-javascript"
import "prismjs/components/prism-markup"
import "prismjs/components/prism-python"

const languageMap: Record<string, string> = {
    css: "css",
    ts: "typescript",
    js: "javascript",
    py: "python",
    html: "markup",
    htm: "markup",
}

export default function prismHighlightImportPlugin(): Plugin {
    return {
        name: "vite-plugin-prism-highlight-import",

        transform(src, id) {
            if (id.endsWith(".txt")) {
                const fileExtension = id.split(".")[1]
                const language = languageMap[fileExtension]

                if (!language) {
                    return src
                }

                const highlightedCode = Prism.highlight(src, Prism.languages[language], language)

                return {
                    code: `export default ${JSON.stringify(highlightedCode)}`,
                    map: null,
                }
            }

            return null
        },
    }
}
