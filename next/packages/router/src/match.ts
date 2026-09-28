/**
 * Path patterns: "/customers/:id", "/files/:path*"-style rest with "*" or "*name",
 * optional segments ":tab?". Case-insensitive, a trailing slash is ignored.
 * Specificity per segment: static (3) > param (2) > optional (1) > rest (0).
 */

export type Params = Record<string, string>

export interface CompiledPath {
  pattern: string
  regex: RegExp
  keys: string[]
  score: number[]
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

/** Joins a parent and a child pattern ("" = the parent itself, "/x" = absolute). */
export function joinPaths(parent: string, child: string): string {
  if (child.startsWith("/")) return normalizePath(child)
  if (!child) return normalizePath(parent)
  return normalizePath(`${parent.replace(/\/+$/, "")}/${child}`)
}

export function normalizePath(path: string): string {
  const p = `/${path}`.replace(/\/{2,}/g, "/")
  return p.length > 1 ? p.replace(/\/+$/, "") : p
}

export function compilePath(pattern: string): CompiledPath {
  const segments = normalizePath(pattern).split("/").filter(Boolean)
  const keys: string[] = []
  const score: number[] = []
  let source = "^"
  for (const segment of segments) {
    if (segment.startsWith("*")) {
      keys.push(segment.slice(1) || "*")
      source += "(?:/(.*))?"
      score.push(0)
      break
    }
    if (segment.startsWith(":")) {
      const optional = segment.endsWith("?")
      keys.push(segment.slice(1, optional ? -1 : undefined))
      source += optional ? "(?:/([^/]+))?" : "/([^/]+)"
      score.push(optional ? 1 : 2)
      continue
    }
    source += `/${escape(segment)}`
    score.push(3)
  }
  source += "/?$"
  return { pattern, regex: new RegExp(source, "i"), keys, score }
}

export function matchPath(compiled: CompiledPath, path: string): Params | null {
  const m = compiled.regex.exec(normalizePath(path))
  if (!m) return null
  const params: Params = {}
  compiled.keys.forEach((key, i) => {
    const value = m[i + 1]
    if (value === undefined) return
    try {
      params[key] = decodeURIComponent(value)
    } catch {
      params[key] = value
    }
  })
  return params
}

/** Sort order: more specific first. A missing segment ranks between optional and param. */
export function compareScores(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 1.5
    const y = b[i] ?? 1.5
    if (x !== y) return y - x
  }
  return 0
}

/** Fills a pattern with params: fillPath("/customers/:id", { id: 7 }) → "/customers/7". */
export function fillPath(pattern: string, params: Record<string, string | number> = {}): string {
  return normalizePath(
    normalizePath(pattern)
      .split("/")
      .map((segment) => {
        if (segment.startsWith(":")) {
          const optional = segment.endsWith("?")
          const value = params[segment.slice(1, optional ? -1 : undefined)]
          if (value === undefined) {
            if (optional) return ""
            throw new Error(`fillPath: missing param "${segment}" for "${pattern}"`)
          }
          return encodeURIComponent(String(value))
        }
        if (segment.startsWith("*")) return String(params[segment.slice(1) || "*"] ?? "")
        return segment
      })
      .join("/")
  )
}
