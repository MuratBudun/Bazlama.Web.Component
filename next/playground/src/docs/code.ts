import { html, signal } from "@bazlama/core"

// ---------------------------------------------------------------------------------------
// Minimal syntax highlighting (no dependency): comments, strings, keywords, numbers.

const TOKEN =
  /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|(`(?:\\[\s\S]|[^`\\])*`|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|\b(const|let|var|function|return|if|else|for|of|in|new|class|export|import|from|type|interface|extends|implements|while|switch|case|break|continue|default|try|catch|finally|throw|typeof|instanceof|readonly|static|private|public|this|null|undefined|true|false|void|async|await|keyof|infer|as)\b|\b(\d+(?:\.\d+)?)\b/g
const CLASSES = ["tok-comment", "tok-string", "tok-keyword", "tok-number"]

export function highlight(code: string): Node[] {
  const nodes: Node[] = []
  let last = 0
  for (const match of code.matchAll(TOKEN)) {
    if (match.index > last) nodes.push(document.createTextNode(code.slice(last, match.index)))
    const span = document.createElement("span")
    span.className = CLASSES[match.slice(1).findIndex((group) => group !== undefined)]
    span.textContent = match[0]
    nodes.push(span)
    last = match.index + match[0].length
  }
  if (last < code.length) nodes.push(document.createTextNode(code.slice(last)))
  return nodes
}

export function codeBlock(code: string, caption = "") {
  const copied = signal(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      copied.set(true)
      setTimeout(() => copied.set(false), 1200)
    } catch {
      /* clipboard unavailable */
    }
  }
  return html`<figure class="code">
    <figcaption>
      <span>${caption}</span>
      <button type="button" class="link" @click=${copy}>${() => (copied() ? "Kopyalandı ✓" : "Kopyala")}</button>
    </figcaption>
    <pre><code>${highlight(code)}</code></pre>
  </figure>`
}

// ---------------------------------------------------------------------------------------
// Source excerpts read live from the core files (imported with ?raw).

export interface Excerpt {
  code: string
  line: number
}

/**
 * Cuts one declaration out of a source file: the first line starting with `start`
 * (leading spaces in `start` must match exactly), the doc comment above it, and the
 * block up to the closing brace at the same indentation. The result is dedented.
 */
export function excerpt(source: string, start: string): Excerpt {
  const lines = source.split(/\r?\n/)
  const exact = start.startsWith(" ")
  const i = lines.findIndex((l) => (exact ? l.startsWith(start) : l.trimStart().startsWith(start)))
  if (i === -1) return { code: `// bulunamadı: ${start}`, line: 0 }
  const indent = lines[i].match(/^\s*/)![0]
  let from = i
  while (from > 0 && /^\s*(\/\*\*|\*)/.test(lines[from - 1])) from--
  // A declaration opening a block ends at the first "}" (or "})" for `=> ({`) at the same
  // indentation; anything else is a one-line declaration.
  let to = i
  const head = lines[i].trimEnd()
  if (/[{(]$/.test(head)) {
    const closer = indent + (head.endsWith("({") ? "})" : "}")
    to = lines.findIndex((l, j) => j > i && l.startsWith(closer))
    if (to === -1) to = i
  }
  const code = lines
    .slice(from, to + 1)
    .map((l) => (l.startsWith(indent) ? l.slice(indent.length) : l))
    .join("\n")
  return { code, line: from + 1 }
}

/** Collapsible "core source" block with one or more excerpts from the same file. */
export function sourceBlock(file: string, source: string, starts: string[], note = "") {
  const parts = starts.map((s) => excerpt(source, s))
  return html`<details class="source">
    <summary>
      <span class="source-label">Core kaynağı</span>
      <code>packages/core/src/${file}</code>
      <span class="muted">${parts.map((p) => `:${p.line}`).join(" ")}</span>
    </summary>
    ${note ? html`<p class="note">${note}</p>` : null}
    ${parts.map((p) => codeBlock(p.code, `${file}:${p.line}`))}
  </details>`
}
