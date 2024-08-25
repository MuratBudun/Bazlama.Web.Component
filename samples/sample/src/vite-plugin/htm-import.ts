import { Plugin } from "vite"
import fs from "fs"
import path from "path"
import Prism from "prismjs"
import { JSDOM } from "jsdom"

const languageMap: Record<string, string> = {
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

                // <prims-loader> taglarını işleme
                document.querySelectorAll("prims-loader").forEach((loader) => {
                    const srcPath = loader.getAttribute("src")
                    if (srcPath) {
                        const fullPath = path.resolve(path.dirname(id), srcPath)
                        const codeContent = fs.readFileSync(fullPath, "utf-8")

                        const languageString = fullPath.split(".").slice(-2)[0]
                        const language = languageMap[languageString] || "markup"

                        loader.outerHTML = language
                            ? Prism.highlight(codeContent, Prism.languages[language], language)
                            : codeContent
                    }
                })

                // <prims> taglarını işleme
                document.querySelectorAll("prims").forEach((prims) => {
                    const language = prims.getAttribute("lang") || "typescript" // Örnek olarak default 'typescript' alındı
                    const dontUseTrim = prims.getAttribute("no-trim") === "true" // trim özelliği varsa true alındı
                    const codeContent = dontUseTrim ? prims.textContent || "" : prims.textContent?.trim() || ""
                    console.log("language: ", language)
                    prims.outerHTML = `<pre><code>${Prism.highlight(
                        codeContent,
                        Prism.languages[language],
                        language
                    )}</code></pre>`
                })

                const newSrc = dom.serialize();
                const escapedHTML = JSON.stringify(newSrc)
                return {
                    code: `export default ${escapedHTML};`,
                    map: null,
                }
            }
        },

        /*
        async transform(src: string, id: string) {
            if (id.endsWith(".htm")) {
                const directory = path.dirname(id)
                const loaderTagRegex = /<prims-loader[^>]*src="([^"]+)"[^>]*>([\s\S]*?)<\/prims-loader>/gi
                let match

                while ((match = loaderTagRegex.exec(src)) !== null) {
                    const srcFile = match[1]
                    const fullPath = path.resolve(directory, srcFile)

                    try {
                        const codeContent = fs.readFileSync(fullPath, "utf-8")
                        const languageString = fullPath.split(".").slice(-2)[0]
                        const language = languageMap[languageString] || "markup"

                        const highlightedCode = language
                            ? Prism.highlight(codeContent, Prism.languages[language], language)
                            : codeContent

                        src = src.replace(match[0], `${highlightedCode}`)
                    } catch (error) {
                        console.error(`Error processing code src in ${id}: ${error}`)
                    }
                }

                const escapedHTML = JSON.stringify(src)
                return {
                    code: `export default ${escapedHTML};`,
                    map: null,
                }
            }
        },
        */
    }
}
