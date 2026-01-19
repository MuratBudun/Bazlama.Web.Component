import { Plugin } from "vite"
import fs from 'fs'
import path from 'path'

export default function htmImportPlugin(): Plugin {
    return {
        name: "vite-plugin-htm-import",
        enforce: 'pre',

        resolveId(source, importer) {
            // .htm?template veya .htm?tpl için path resolve
            if ((source.includes('.htm?template') || source.includes('.htm?tpl')) && importer) {
                const cleanSource = source.split('?')[0]
                const resolvedPath = path.resolve(path.dirname(importer), cleanSource)
                return resolvedPath + '?' + source.split('?')[1]
            }
        },

        load(id) {
            // .htm?template veya .htm?tpl - Template rendering fonksiyonu oluştur
            if (id.includes('?template') || id.includes('?tpl')) {
                const filePath = id.split('?')[0]
                const content = fs.readFileSync(filePath, 'utf-8')
                
                // Placeholder'ları bul ({{...}} pattern)
                const placeholderRegex = /\{\{([^}]+)\}\}/g
                const placeholders = Array.from(
                    new Set(
                        Array.from(content.matchAll(placeholderRegex))
                            .map(match => match[1].trim())
                            .filter(p => !p.startsWith('#') && !p.startsWith('/'))
                    )
                )

                // Template render fonksiyonu oluştur
                const code = `
export default function render(data = {}) {
  let result = ${JSON.stringify(content)};
  
  // Conditional blocks ({{#if ...}}...{{/if}})
  result = result.replace(/\\{\\{#if\\s+(\\w+)\\}\\}([\\s\\S]*?)\\{\\{\\/if\\}\\}/g, (match, key, content) => {
    return data[key] ? content : '';
  });
  
  // Simple placeholders
  ${placeholders.map(ph => `
  if (data['${ph}'] !== undefined) {
    result = result.replace(/\\{\\{${ph}\\}\\}/g, String(data['${ph}']));
  }`).join('')}
  
  return result;
}

export const placeholders = ${JSON.stringify(placeholders)};
`
                return {
                    code,
                    map: null
                }
            }
        },

        transform(src, id) {
            // Normal .htm dosyaları - Raw string olarak export et
            if (id.endsWith(".htm") && !id.includes('?')) {
                const escapedHTML = JSON.stringify(src)
                
                return {
                    code: `export default ${escapedHTML};`,
                    map: null,
                }
            }
        },
    }
}