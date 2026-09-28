import { logEntry } from "../log"

/** Submit handler that prevents navigation and logs the FormData. */
export function submitToLog(source: string) {
  return (event: Event) => {
    event.preventDefault()
    const form = event.target as HTMLFormElement
    const data: Record<string, string | string[]> = {}
    for (const [key, value] of new FormData(form)) {
      const text = String(value)
      const current = data[key]
      data[key] = current === undefined ? text : Array.isArray(current) ? [...current, text] : [current, text]
    }
    logEntry(source, "submit", JSON.stringify(data))
  }
}
