import { Plugin } from "vite"
import fs from 'fs'
import path from 'path'

/**
 * Vite plugin for enhanced .htm file imports
 * Supports multiple import modes:
 * - .htm (default): Raw HTML string
 * - .htm?raw: Raw HTML string (explicit)
 * - .htm?html: HTMLTemplateElement (Web Standard template element)
 * - .htm?template or .htm?tpl: Template function with placeholder support
 */
export default function htmImportPlugin(): Plugin {
    return {
        name: "vite-plugin-htm-import",
        enforce: 'pre',

        resolveId(source, importer) {
            return resolveHtmPath(source, importer)
        },

        load(id) {
            if (id.includes('?template') || id.includes('?tpl')) {
                return importTemplate(id)
            }
            
            if (id.includes('?html')) {
                return importHtmlTemplate(id)
            }
            
            if (id.includes('?raw')) {
                return importRaw(id)
            }
            
            return null
        },

        transform(src, id) {
            // Default .htm handling (no query params)
            if (id.endsWith(".htm") && !id.includes('?')) {
                return importRaw(id, src)
            }
            
            return null
        },
    }
}

/**
 * Resolve .htm file paths with query parameters
 */
function resolveHtmPath(source: string, importer: string | undefined): string | null {
    if (!importer || !source.includes('.htm?')) {
        return null
    }
    
    const cleanSource = source.split('?')[0]
    const resolvedPath = path.resolve(path.dirname(importer), cleanSource)
    const query = source.split('?')[1]
    
    return `${resolvedPath}?${query}`
}

/**
 * Import .htm as raw HTML string
 */
function importRaw(id: string, content?: string) {
    const filePath = id.split('?')[0]
    const htmlContent = content || fs.readFileSync(filePath, 'utf-8')
    const escapedHTML = JSON.stringify(htmlContent)
    
    return {
        code: `export default ${escapedHTML};`,
        map: null,
    }
}

/**
 * Import .htm as HTML <template> element (Web Standard)
 * Returns a native HTMLTemplateElement that can be cloned and queried
 * 
 * @example
 * import template from './card.htm?html'
 * 
 * // Clone and use
 * const clone = template.content.cloneNode(true)
 * document.body.appendChild(clone)
 * 
 * // Query before cloning
 * const title = template.content.querySelector('.title')
 * title.textContent = 'New Title'
 */
function importHtmlTemplate(id: string) {
    const filePath = id.split('?')[0]
    const htmlContent = fs.readFileSync(filePath, 'utf-8')
    
    // Use JSON.stringify for safe escaping (same as importRaw)
    const escapedHTML = JSON.stringify(htmlContent)
    
    return {
        code: `
const template = document.createElement('template');
template.innerHTML = ${escapedHTML};
export default template;
`,
        map: null,
    }
}

/**
 * Import .htm as template function with placeholder support
 * Supports {{variable}} and {{#if variable}}...{{/if}} syntax
 */
function importTemplate(id: string) {
    const filePath = id.split('?')[0]
    const content = fs.readFileSync(filePath, 'utf-8')
    
    // Find placeholders ({{...}} pattern, excluding conditionals)
    const placeholderRegex = /\{\{([^}]+)\}\}/g
    const placeholders = Array.from(
        new Set(
            Array.from(content.matchAll(placeholderRegex))
                .map(match => match[1].trim())
                .filter(p => !p.startsWith('#') && !p.startsWith('/'))
        )
    )

    // Generate template render function
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