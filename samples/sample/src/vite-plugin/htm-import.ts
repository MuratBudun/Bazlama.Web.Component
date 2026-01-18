import { Plugin } from "vite"
import fs from "fs"
import path from "path"
import Prism from "prismjs"
import { JSDOM } from "jsdom"

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

export default function htmImportPlugin(): Plugin {
    return {
        name: "vite-plugin-htm-import",

        async transform(src, id) {
            if (id.endsWith(".htm")) {
                const dom = new JSDOM(src)
                const document = dom.window.document

                // <prism-loader> taglarını işleme
                document.querySelectorAll("prism-loader").forEach((loader) => {
                    const srcPath = loader.getAttribute("src")
                    const langAttr = loader.getAttribute("lang")

                    if (srcPath) {
                        const fullPath = path.resolve(path.dirname(id), srcPath)
                        
                        try {
                            const codeContent = fs.readFileSync(fullPath, "utf-8")
                            const languageString = langAttr || fullPath.split(".").slice(-1)[0]
                            const language = languageMap[languageString] || "markup"

                            loader.outerHTML = language
                                ? Prism.highlight(codeContent, Prism.languages[language], language)
                                : codeContent
                        } catch (error) {
                            console.error(`[htm-import] File not found: ${fullPath}`)
                            loader.outerHTML = `<!-- Error: Could not load ${srcPath} -->`
                        }
                    }
                })

                // <prism> taglarını işleme
                document.querySelectorAll("prism").forEach((prism) => {
                    const language = prism.getAttribute("lang") || "typescript"
                    const dontUseTrim = prism.getAttribute("no-trim") === "true"
                    const codeContent = dontUseTrim ? prism.textContent || "" : prism.textContent?.trim() || ""

                    prism.outerHTML = `<pre><code>${Prism.highlight(
                        codeContent,
                        Prism.languages[language],
                        language
                    )}</code></pre>`
                })

                const newSrc = dom.serialize()
                const escapedHTML = JSON.stringify(newSrc)
                return {
                    code: `export default ${escapedHTML};`,
                    map: null,
                }
            }
        },
    }
}
