import { computed, define, effect, html, onCleanup, prop, repeat, signal, uid, type Signal } from "@bazlama/core"
import { hasIcon, icon } from "./icon"

/**
 * <bz-file-upload> — file picker with drag & drop, validation and a file list.
 *
 * Two modes, and the component starts in the first:
 *
 * 1. **UI only** (no `url`, no `uploader`): it only collects and validates files. With a
 *    `name` inside a <form> the files are the form's value (ElementInternals), so a plain
 *    form post carries them. The app can also read `el.files` or listen for `change`.
 * 2. **It uploads** (`url`, or an `uploader` function): each file is sent on its own with
 *    XHR — real upload progress, cancel and retry. It starts as soon as files are added,
 *    unless `manual` is set, and then `el.upload()` starts it. Nothing is in the form value in this
 *    mode, because the files are already on their way.
 *
 * Anatomy: [data-part=label|dropzone|input|icon|prompt|browse|constraints|list|item|thumb|
 * meta|name|size|progress|bar|status|item-error|retry|item-remove|hint|error].
 * Styling hooks: [data-dragover], [data-status] on items, [disabled], [data-invalid].
 */

export type UploadStatus = "pending" | "uploading" | "done" | "error"
export type RejectReason = "accept" | "size" | "count"

/** A file in the list, as reported by `el.files` and the events. */
export interface UploadFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  status: UploadStatus
  /** 0-1. */
  progress: number
  error: string
  response: unknown
}

/** Custom transport: report progress, honour `signal`, resolve with the server's answer. */
export type Uploader = (
  file: File,
  context: { onProgress: (fraction: number) => void; signal: AbortSignal }
) => Promise<unknown>

export interface FileUploadLabels {
  prompt: string
  browse: string
  drop: string
  remove: string
  retry: string
  uploading: string
  done: string
  failed: string
  required: string
  /** `{name}` and `{max}`. */
  tooLarge: string
  /** `{n}`. */
  tooMany: string
  /** `{name}`. */
  wrongType: string
  networkError: string
  /** `{n}`, for the constraints line. */
  maxFilesNote: string
}

export const FILE_UPLOAD_LABELS: FileUploadLabels = {
  prompt: "Drag and drop files here",
  browse: "Choose files",
  drop: "Drop to add",
  remove: "Remove",
  retry: "Retry",
  uploading: "Uploading",
  done: "Uploaded",
  failed: "Failed",
  required: "Add at least one file.",
  tooLarge: "{name} is larger than {max}.",
  tooMany: "At most {n} files.",
  wrongType: "{name} is not an accepted file type.",
  networkError: "Upload failed.",
  maxFilesNote: "up to {n} files",
}

const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (all, key: string) => values[key] ?? all)

const UNITS = ["B", "KB", "MB", "GB", "TB"]

/** 1536 → "1,5 KB" (in the document's locale). */
export function formatBytes(bytes: number, locale?: string): string {
  if (!Number.isFinite(bytes) || bytes < 0) return ""
  let n = bytes
  let unit = 0
  while (n >= 1024 && unit < UNITS.length - 1) {
    n /= 1024
    unit++
  }
  const digits = unit === 0 || n >= 100 ? 0 : n >= 10 ? 1 : 2
  return `${n.toLocaleString(locale, { maximumFractionDigits: digits })} ${UNITS[unit]}`
}

/** Same rules as the native `accept` attribute: ".pdf", "image/*", "text/csv". */
export function matchesAccept(file: File, accept: string): boolean {
  const tokens = accept
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  if (!tokens.length) return true
  const name = file.name.toLowerCase()
  const type = (file.type || "").toLowerCase()
  return tokens.some((token) => {
    if (token.startsWith(".")) return name.endsWith(token)
    if (token.endsWith("/*")) return !!type && type.startsWith(token.slice(0, -1))
    return type === token
  })
}

interface Entry {
  id: string
  file: File
  name: string
  size: number
  type: string
  status: Signal<UploadStatus>
  progress: Signal<number>
  error: Signal<string>
  response: unknown
  preview: string
}

const snapshot = (e: Entry): UploadFile => ({
  id: e.id,
  file: e.file,
  name: e.name,
  size: e.size,
  type: e.type,
  status: e.status.peek(),
  progress: e.progress.peek(),
  error: e.error.peek(),
  response: e.response,
})

interface Controller {
  addFiles(files: Iterable<File>): UploadFile[]
  upload(): Promise<UploadFile[]>
  retry(id: string): void
  removeFile(id: string): void
  clear(): void
  files(): UploadFile[]
}

const FileUploadBase = define("bz-file-upload", {
  form: true,
  props: {
    name: prop.string(),
    label: prop.string(),
    hint: prop.string(),
    /** Native accept syntax: ".pdf,.docx" or "image/*". */
    accept: prop.string(),
    multiple: prop.boolean(),
    /** Bytes; 0 means no limit. */
    maxSize: prop.number(0),
    /** 0 means no limit. */
    maxFiles: prop.number(0),
    required: prop.boolean(),
    disabled: prop.boolean(false, { reflect: true }),
    /** Custom error message under the field. */
    error: prop.string(),
    /** Thumbnails for images. */
    preview: prop.boolean(),

    /** Upload endpoint. Set it (or `uploader`) to let the component do the transfer. */
    url: prop.string(),
    method: prop.string("POST"),
    /** Form field name for the file; default "file". */
    fieldName: prop.string("file"),
    headers: prop.object<Record<string, string>>({}),
    withCredentials: prop.boolean(),
    /** Wait for `upload()` instead of starting as soon as files are added. */
    manual: prop.boolean(),
    /** Own transport instead of the built-in XHR one. */
    uploader: prop.object<Uploader | null>(null),

    labels: prop.object<Partial<FileUploadLabels>>({}),
  },
  setup(props, ctx) {
    const { host, internals } = ctx
    const id = uid("bz-file-upload")
    const hintId = `${id}-hint`
    const errorId = `${id}-error`
    const entries = signal<Entry[]>([])
    const dragging = signal(false)
    const touched = signal(false)
    const text = computed(() => ({ ...FILE_UPLOAD_LABELS, ...props.labels() }))
    /** The component is responsible for the transfer. */
    const managed = computed(() => !!props.url() || !!props.uploader())
    let input!: HTMLInputElement
    let dropzone!: HTMLElement
    const aborts = new Map<string, () => void>()
    let dragDepth = 0

    const list = () => entries()
    const emitChange = () => ctx.emit("change", { files: entries.peek().map(snapshot) })

    const revoke = (entry: Entry) => {
      if (entry.preview) URL.revokeObjectURL(entry.preview)
    }
    onCleanup(() => {
      for (const abort of aborts.values()) abort()
      aborts.clear()
      entries.peek().forEach(revoke)
    })

    // ---------------------------------------------------------------------------------
    // Adding and validating

    function reject(file: File, reason: RejectReason, message: string): void {
      ctx.emit("reject", { file, reason, message })
      props.error.set(message)
    }

    function addFiles(files: Iterable<File>): UploadFile[] {
      if (props.disabled.peek()) return []
      const accept = props.accept.peek()
      const maxSize = props.maxSize.peek()
      const maxFiles = props.maxFiles.peek()
      const multiple = props.multiple.peek()
      const incoming = [...files]
      const accepted: Entry[] = []
      // Without `multiple` a new pick replaces what is there.
      const current = multiple ? [...entries.peek()] : []
      if (!multiple) entries.peek().forEach(revoke)

      for (const file of incoming) {
        if (accept && !matchesAccept(file, accept)) {
          reject(file, "accept", fill(text.peek().wrongType, { name: file.name }))
          continue
        }
        if (maxSize > 0 && file.size > maxSize) {
          reject(file, "size", fill(text.peek().tooLarge, { name: file.name, max: formatBytes(maxSize) }))
          continue
        }
        const limit = multiple ? maxFiles : 1
        if (limit > 0 && current.length + accepted.length >= limit) {
          reject(file, "count", fill(text.peek().tooMany, { n: String(limit) }))
          continue
        }
        accepted.push({
          id: uid("bz-file"),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          status: signal<UploadStatus>("pending"),
          progress: signal(0),
          error: signal(""),
          response: undefined,
          preview:
            props.preview.peek() && file.type.startsWith("image/") && typeof URL.createObjectURL === "function"
              ? URL.createObjectURL(file)
              : "",
        })
        if (!multiple) break
      }

      if (!accepted.length) return []
      touched.set(true)
      entries.set([...current, ...accepted])
      const added = accepted.map(snapshot)
      ctx.emit("add", { files: added })
      emitChange()
      if (managed.peek() && !props.manual.peek()) void start(accepted)
      return added
    }

    function remove(id: string): void {
      const entry = entries.peek().find((e) => e.id === id)
      if (!entry) return
      aborts.get(id)?.()
      aborts.delete(id)
      revoke(entry)
      entries.update((all) => all.filter((e) => e.id !== id))
      ctx.emit("remove", { file: snapshot(entry) })
      emitChange()
    }

    function clear(): void {
      for (const abort of aborts.values()) abort()
      aborts.clear()
      entries.peek().forEach(revoke)
      entries.set([])
      touched.set(false)
      props.error.set("")
      emitChange()
    }

    // ---------------------------------------------------------------------------------
    // Transfer

    /** XHR, not fetch: only XHR reports upload progress without streaming the body. */
    function xhrUpload(entry: Entry, onProgress: (f: number) => void, signal: AbortSignal): Promise<unknown> {
      return new Promise((resolve, rejectPromise) => {
        const xhr = new XMLHttpRequest()
        xhr.open(props.method.peek() || "POST", props.url.peek())
        xhr.withCredentials = props.withCredentials.peek()
        for (const [key, value] of Object.entries(props.headers.peek() ?? {})) xhr.setRequestHeader(key, value)
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable && e.total > 0) onProgress(e.loaded / e.total)
        })
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const type = xhr.getResponseHeader("content-type") ?? ""
            let body: unknown = xhr.responseText
            if (type.includes("json")) {
              try {
                body = JSON.parse(xhr.responseText) as unknown
              } catch {
                /* not JSON after all: keep the text */
              }
            }
            resolve(body)
          } else rejectPromise(new Error(`${xhr.status} ${xhr.statusText}`.trim()))
        })
        xhr.addEventListener("error", () => rejectPromise(new Error(text.peek().networkError)))
        xhr.addEventListener("timeout", () => rejectPromise(new Error(text.peek().networkError)))
        signal.addEventListener("abort", () => xhr.abort())
        const body = new FormData()
        body.append(props.fieldName.peek() || "file", entry.file, entry.name)
        xhr.send(body)
      })
    }

    async function send(entry: Entry): Promise<void> {
      const controller = new AbortController()
      aborts.set(entry.id, () => controller.abort())
      entry.status.set("uploading")
      entry.progress.set(0)
      entry.error.set("")
      const onProgress = (fraction: number) => {
        const value = Math.max(0, Math.min(1, fraction))
        entry.progress.set(value)
        ctx.emit("upload-progress", { file: snapshot(entry), progress: value })
      }
      try {
        const custom = props.uploader.peek()
        const response = custom
          ? await custom(entry.file, { onProgress, signal: controller.signal })
          : await xhrUpload(entry, onProgress, controller.signal)
        if (controller.signal.aborted) return
        entry.response = response
        entry.progress.set(1)
        entry.status.set("done")
        ctx.emit("upload-success", { file: snapshot(entry), response })
      } catch (error) {
        if (controller.signal.aborted) return
        const message = error instanceof Error ? error.message : String(error)
        entry.error.set(message || text.peek().networkError)
        entry.status.set("error")
        ctx.emit("upload-error", { file: snapshot(entry), error: message })
      } finally {
        aborts.delete(entry.id)
      }
    }

    async function start(targets: Entry[]): Promise<UploadFile[]> {
      await Promise.all(targets.map(send))
      const done = entries.peek().map(snapshot)
      ctx.emit("complete", { files: done })
      emitChange()
      return done
    }

    const upload = () => start(entries.peek().filter((e) => e.status.peek() === "pending" || e.status.peek() === "error"))
    const retry = (id: string) => {
      const entry = entries.peek().find((e) => e.id === id)
      if (entry && managed.peek()) void start([entry])
    }

    // ---------------------------------------------------------------------------------
    // Form value and validity

    ctx.onFormReset(() => clear())
    ctx.onFormDisabled((disabled) => props.disabled.set(disabled))

    ctx.onMount(() => {
      if (!internals) return
      effect(() => {
        const name = props.name()
        // In "it uploads" mode the files are already sent: keep them out of the form post.
        if (!name || managed() || typeof internals.setFormValue !== "function") {
          internals.setFormValue?.(null)
          return
        }
        const data = new FormData()
        for (const entry of list()) data.append(name, entry.file, entry.name)
        internals.setFormValue(data)
      })
      effect(() => {
        if (typeof internals.setValidity !== "function") return
        const custom = props.error()
        const missing = props.required() && list().length === 0
        if (custom) internals.setValidity({ customError: true }, custom, dropzone)
        else if (missing) internals.setValidity({ valueMissing: true }, text().required, dropzone)
        else internals.setValidity({})
      })
    })

    const showError = computed(() => !!props.error() && touched())
    effect(() => host.toggleAttribute("data-invalid", showError()))
    effect(() => host.toggleAttribute("data-dragover", dragging()))

    // ---------------------------------------------------------------------------------
    // Picking and dropping

    const open = () => {
      if (props.disabled.peek()) return
      props.error.set("")
      input.click()
    }
    const onPicked = (e: Event) => {
      const picked = (e.target as HTMLInputElement).files
      if (picked?.length) addFiles(picked)
      // Reset, so picking the same file again still fires `change`.
      input.value = ""
    }
    const hasFiles = (e: DragEvent) => !!e.dataTransfer && [...e.dataTransfer.types].includes("Files")
    const onDragEnter = (e: DragEvent) => {
      if (props.disabled.peek() || !hasFiles(e)) return
      e.preventDefault()
      dragDepth++
      dragging.set(true)
    }
    const onDragOver = (e: DragEvent) => {
      if (props.disabled.peek() || !hasFiles(e)) return
      e.preventDefault()
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy"
    }
    const onDragLeave = () => {
      dragDepth = Math.max(0, dragDepth - 1)
      if (!dragDepth) dragging.set(false)
    }
    const onDrop = (e: DragEvent) => {
      if (props.disabled.peek() || !hasFiles(e)) return
      e.preventDefault()
      dragDepth = 0
      dragging.set(false)
      props.error.set("")
      if (e.dataTransfer?.files.length) addFiles(e.dataTransfer.files)
    }

    ;(host as unknown as { _upload: Controller })._upload = {
      addFiles,
      upload,
      retry,
      removeFile: remove,
      clear,
      files: () => entries.peek().map(snapshot),
    }

    // ---------------------------------------------------------------------------------
    // Template

    const constraints = () => {
      const parts: string[] = []
      if (props.accept()) parts.push(props.accept())
      if (props.maxSize() > 0) parts.push(`≤ ${formatBytes(props.maxSize())}`)
      if (props.multiple() && props.maxFiles() > 0) parts.push(fill(text().maxFilesNote, { n: String(props.maxFiles()) }))
      return parts.join(" · ")
    }

    const statusLabel = (entry: Entry) =>
      entry.status() === "done" ? text().done : entry.status() === "error" ? text().failed : text().uploading

    const row = (entry: Entry) => html`
      <li data-part="item" data-status=${entry.status}>
        <span data-part="thumb" aria-hidden="true">
          ${entry.preview
            ? html`<img src=${entry.preview} alt="" />`
            : hasIcon("file")
              ? icon("file")
              : null}
        </span>
        <div data-part="meta">
          <span data-part="name" title=${entry.name}>${entry.name}</span>
          <span data-part="size">${formatBytes(entry.size)}</span>
          <span data-part="item-error" ?hidden=${() => entry.status() !== "error"}>${entry.error}</span>
        </div>
        <div
          data-part="progress"
          role="progressbar"
          aria-label=${entry.name}
          aria-valuenow=${() => String(Math.round(entry.progress() * 100))}
          ?hidden=${() => entry.status() === "pending" || !managed()}
        >
          <div data-part="bar" style=${() => `width: ${Math.round(entry.progress() * 100)}%`}></div>
        </div>
        <span data-part="status" ?hidden=${() => !managed()}>${() => statusLabel(entry)}</span>
        <button
          type="button"
          data-part="retry"
          aria-label=${() => `${text().retry}: ${entry.name}`}
          ?hidden=${() => entry.status() !== "error" || !managed()}
          @click=${() => retry(entry.id)}
        >
          ${hasIcon("refresh") ? icon("refresh") : "↻"}
        </button>
        <button
          type="button"
          data-part="item-remove"
          aria-label=${() => `${text().remove}: ${entry.name}`}
          ?disabled=${props.disabled}
          @click=${() => remove(entry.id)}
        >
          ${hasIcon("x") ? icon("x") : "×"}
        </button>
      </li>
    `

    return html`
      <span data-part="label" id=${`${id}-label`} ?hidden=${() => !props.label()}>${props.label}</span>
      <input
        data-part="input"
        type="file"
        tabindex="-1"
        aria-hidden="true"
        hidden
        accept=${() => props.accept() || null}
        ?multiple=${props.multiple}
        ?disabled=${props.disabled}
        @change=${onPicked}
        ref=${(el: HTMLInputElement) => (input = el)}
      />
      <button
        type="button"
        data-part="dropzone"
        aria-labelledby=${() => (props.label() ? `${id}-label` : null)}
        aria-describedby=${() =>
          [props.hint() && hintId, showError() && errorId].filter(Boolean).join(" ") || null}
        ?disabled=${props.disabled}
        @click=${open}
        @dragenter=${onDragEnter}
        @dragover=${onDragOver}
        @dragleave=${onDragLeave}
        @drop=${onDrop}
        ref=${(el: HTMLElement) => (dropzone = el)}
      >
        <span data-part="icon" aria-hidden="true">${hasIcon("upload") ? icon("upload") : "⬆"}</span>
        <span data-part="prompt">${() => (dragging() ? text().drop : text().prompt)}</span>
        <span data-part="browse">${() => text().browse}</span>
        <span data-part="constraints" ?hidden=${() => !constraints()}>${constraints}</span>
      </button>
      <ul data-part="list" ?hidden=${() => !list().length}>
        ${repeat(list, (entry) => entry.id, row)}
      </ul>
      <div data-part="hint" id=${hintId} ?hidden=${() => !props.hint()}>${props.hint}</div>
      <div data-part="error" id=${errorId} role="alert" ?hidden=${() => !showError()}>${props.error}</div>
    `
  },
})

export interface FileUploadElement extends InstanceType<typeof FileUploadBase> {
  /** The current list (snapshots; `file` is the original File). */
  readonly files: UploadFile[]
  /** Adds files as if they were picked: validates, emits `add`/`reject`, may start uploading. */
  addFiles(files: Iterable<File>): UploadFile[]
  /** Uploads everything still pending or failed (`auto="false"` mode). */
  upload(): Promise<UploadFile[]>
  retry(id: string): void
  /** Takes a file out of the list (and cancels it if it is still uploading). */
  removeFile(id: string): void
  clear(): void
}

const controllerOf = (el: unknown) => (el as { _upload?: Controller })._upload
Object.defineProperties(FileUploadBase.prototype, {
  files: {
    get(this: unknown) {
      return controllerOf(this)?.files() ?? []
    },
    configurable: true,
  },
  addFiles: {
    value(this: unknown, files: Iterable<File>) {
      return controllerOf(this)?.addFiles(files) ?? []
    },
    configurable: true,
  },
  upload: {
    value(this: unknown) {
      return controllerOf(this)?.upload() ?? Promise.resolve([])
    },
    configurable: true,
  },
  retry: {
    value(this: unknown, id: string) {
      controllerOf(this)?.retry(id)
    },
    configurable: true,
  },
  removeFile: {
    value(this: unknown, id: string) {
      controllerOf(this)?.removeFile(id)
    },
    configurable: true,
  },
  clear: {
    value(this: unknown) {
      controllerOf(this)?.clear()
    },
    configurable: true,
  },
})

export const FileUpload = FileUploadBase as unknown as {
  new (): FileUploadElement
  prototype: FileUploadElement
}

declare global {
  interface HTMLElementTagNameMap {
    "bz-file-upload": FileUploadElement
  }
}
