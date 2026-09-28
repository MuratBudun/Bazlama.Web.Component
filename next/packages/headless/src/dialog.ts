import { define, effect, html, onCleanup, prop, render, root, signal, uid, type ReadSignal, type TemplateResult } from "@bazlama/core"
import { hasIcon, icon } from "./icon"

/**
 * Modal dialogs: the <bz-dialog> element and the `dialogs` manager.
 *
 * Every open dialog is a native modal <dialog> (showModal): the browser puts it in the top
 * layer and makes everything below it inert, so nesting needs no z-index. The manager keeps
 * the stack and adds what the platform leaves out:
 *
 * - Escape and backdrop clicks close only the top dialog (not while `persistent`).
 * - Closing a dialog first closes the dialogs opened above it; each one's guard
 *   (`beforeClose` / cancelable `before-close` event) may refuse, even asynchronously
 *   (e.g. by opening a "discard changes?" confirm on top).
 * - Focus returns to the element that opened the dialog.
 * - Page scroll is locked while any dialog is open.
 * - `show()` and `dialogs.open()` return the result passed to `close(result)`.
 */

export type CloseReason = "close-button" | "escape" | "backdrop" | "parent" | "api"

export type BeforeClose = (reason: CloseReason, result: unknown) => boolean | Promise<boolean>

interface Entry {
  host: HTMLElement
  dialog: HTMLDialogElement
  opener: Element | null
  persistent: () => boolean
  guard: (reason: CloseReason, result: unknown) => Promise<boolean>
  finish: (result: unknown, reason: CloseReason) => void
  closing: boolean
}

// ---------------------------------------------------------------------------------------
// Stack

const stack: Entry[] = []
const stackSignal = signal<readonly HTMLElement[]>([])
/** Open dialogs, bottom to top (reactive). */
export const openDialogs: ReadSignal<readonly HTMLElement[]> = stackSignal

let scrollLock: { overflow: string; paddingRight: string } | null = null

function syncStack(): void {
  stack.forEach((entry, i) => {
    entry.host.setAttribute("data-depth", String(i + 1))
    entry.host.toggleAttribute("data-covered", i < stack.length - 1)
  })
  stackSignal.set(stack.map((e) => e.host))

  const html = document.documentElement
  if (stack.length && !scrollLock) {
    scrollLock = { overflow: html.style.overflow, paddingRight: html.style.paddingRight }
    const gutter = window.innerWidth - html.clientWidth
    html.style.overflow = "hidden"
    if (gutter > 0) html.style.paddingRight = `${gutter}px`
    document.addEventListener("keydown", onDocumentKeydown)
  } else if (!stack.length && scrollLock) {
    html.style.overflow = scrollLock.overflow
    html.style.paddingRight = scrollLock.paddingRight
    scrollLock = null
    document.removeEventListener("keydown", onDocumentKeydown)
  }
}

// Bubbling listener: components inside the dialog (combobox popup, menus) handle Escape
// first and call preventDefault, which keeps the dialog open.
function onDocumentKeydown(e: KeyboardEvent): void {
  if (e.key !== "Escape" || e.defaultPrevented) return
  const top = stack.at(-1)
  if (!top) return
  // Prevents the native cancel/close of the <dialog>: the manager decides.
  e.preventDefault()
  if (top.persistent()) shake(top)
  else void requestClose(top, undefined, "escape")
}

function shake(entry: Entry): void {
  entry.host.removeAttribute("data-refused")
  void entry.host.offsetWidth
  entry.host.setAttribute("data-refused", "")
  setTimeout(() => entry.host.removeAttribute("data-refused"), 400)
}

/** Closes `entry` and every dialog above it, asking each guard from the top down. */
async function requestClose(entry: Entry, result: unknown, reason: CloseReason): Promise<boolean> {
  const index = stack.indexOf(entry)
  if (index === -1) return true
  if (entry.closing) return false
  entry.closing = true
  try {
    for (let i = stack.length - 1; i > index; i--) {
      const child = stack[i]
      if (!(await child.guard("parent", undefined))) return false
      child.finish(undefined, "parent")
    }
    if (!(await entry.guard(reason, result))) return false
    entry.finish(result, reason)
    return true
  } finally {
    entry.closing = false
  }
}

function push(entry: Entry): void {
  stack.push(entry)
  syncStack()
}

function remove(entry: Entry): void {
  const i = stack.indexOf(entry)
  if (i === -1) return
  stack.splice(i, 1)
  syncStack()
  // The opener may be inside a dialog that closed meanwhile.
  const opener = entry.opener as HTMLElement | null
  if (opener?.isConnected && !opener.closest("dialog:not([open])")) opener.focus?.({ preventScroll: true })
}

const FOCUSABLE = 'input:not([type="hidden"]), select, textarea, button, a[href], [tabindex]:not([tabindex="-1"])'

/**
 * showModal focuses the first [autofocus] only when it is focusable itself; wrappers such as
 * <bz-input autofocus> pass focus to their first focusable descendant. Without autofocus, the
 * first focusable element in the body (not the close button) gets focus.
 */
function focusInitial(dialog: HTMLDialogElement): void {
  const inside = (el: Element | null) => !!el && dialog.contains(el) && !el.closest("[hidden]")
  const first = (scope: Element) =>
    Array.from(scope.querySelectorAll<HTMLElement>(FOCUSABLE)).find((el) => inside(el) && !(el as HTMLButtonElement).disabled)
  const auto = dialog.querySelector<HTMLElement>("[autofocus]")
  const target = auto
    ? auto.matches(FOCUSABLE) ? auto : first(auto)
    : (first(dialog.querySelector("[data-part=body]") ?? dialog) ?? first(dialog.querySelector("[data-part=footer]") ?? dialog))
  if (target && document.activeElement !== target) target.focus({ preventScroll: true })
}

// ---------------------------------------------------------------------------------------
// <bz-dialog>

export const dialogLabels = { close: "Close", ok: "OK", cancel: "Cancel" }

interface Controller {
  show(): Promise<unknown>
  close(result?: unknown): Promise<boolean>
}

const DialogBase = define("bz-dialog", {
  props: {
    open: prop.boolean(false, { reflect: true }),
    heading: prop.string(),
    /** Accessible name when there is no heading. */
    label: prop.string(),
    /** Escape and backdrop clicks do not close. */
    persistent: prop.boolean(),
    hideClose: prop.boolean(),
    closeLabel: prop.string(),
    beforeClose: prop.object<BeforeClose | null>(null),
  },
  setup(props, ctx) {
    const { host } = ctx
    const id = uid("bz-dialog")
    let dialog!: HTMLDialogElement
    let entry: Entry | null = null
    let settle: ((result: unknown) => void) | null = null
    let pending: Promise<unknown> = Promise.resolve(undefined)

    const nativeOpen = () => {
      if (dialog.open) return
      try {
        dialog.showModal()
      } catch {
        dialog.setAttribute("open", "") // environments without showModal (jsdom)
      }
    }
    const nativeClose = () => {
      if (typeof dialog.close === "function") dialog.close()
      else dialog.removeAttribute("open")
    }

    const show = (): Promise<unknown> => {
      if (entry) return pending
      const current: Entry = {
        host,
        dialog,
        opener: document.activeElement,
        persistent: () => props.persistent.peek(),
        closing: false,
        guard: async (reason, result) => {
          const allowed = ctx.emit("before-close", { reason, result }, { cancelable: true })
          if (!allowed) return false
          const fn = props.beforeClose.peek()
          return fn ? (await fn(reason, result)) !== false : true
        },
        finish: (result, reason) => {
          if (entry !== current) return
          entry = null
          nativeClose()
          props.open.set(false)
          remove(current)
          ctx.emit("close", { result, reason }, { bubbles: false })
          settle?.(result)
          settle = null
        },
      }
      entry = current
      pending = new Promise((resolve) => (settle = resolve))
      props.open.set(true)
      nativeOpen()
      focusInitial(dialog)
      push(current)
      ctx.emit("open", undefined, { bubbles: false })
      return pending
    }
    const close = (result?: unknown, reason: CloseReason = "api") =>
      entry ? requestClose(entry, result, reason) : Promise.resolve(true)

    ;(host as unknown as { _dialog: Controller })._dialog = { show, close: (r) => close(r) }

    // `open` set from outside (attribute or property) opens or force-closes.
    ctx.onMount(() =>
      effect(() => {
        if (props.open() && !entry) show()
        else if (!props.open() && entry) entry.finish(undefined, "api")
      })
    )
    // Removed from the DOM while open: take it off the stack.
    onCleanup(() => entry?.finish(undefined, "api"))

    let downOnBackdrop = false
    const onPointerdown = (e: PointerEvent) => (downOnBackdrop = e.target === dialog)
    const onClick = (e: MouseEvent) => {
      if (e.target !== dialog || !downOnBackdrop || !entry) return
      if (props.persistent.peek()) shake(entry)
      else void close(undefined, "backdrop")
    }
    // Close requests the keydown handler did not see (e.g. Android back): route through the manager.
    const onCancel = (e: Event) => {
      e.preventDefault()
      if (!entry || stack.at(-1) !== entry) return
      if (props.persistent.peek()) shake(entry)
      else void close(undefined, "escape")
    }
    // The browser closed it anyway (repeated close requests): keep the stack consistent.
    const onNativeClose = () => entry?.finish(undefined, "escape")

    const headingId = `${id}-title`
    const closeContent = () => (hasIcon("x") ? icon("x") : "×")

    return html`
      <dialog
        data-part="dialog"
        aria-labelledby=${() => (props.heading() || ctx.hasSlot("header") ? headingId : null)}
        aria-label=${() => (!props.heading() && !ctx.hasSlot("header") ? props.label() || null : null)}
        @pointerdown=${onPointerdown}
        @click=${onClick}
        @cancel=${onCancel}
        @close=${onNativeClose}
        ref=${(el: HTMLDialogElement) => (dialog = el)}
      >
        <div data-part="panel">
          <header data-part="header" ?hidden=${() => !props.heading() && !ctx.hasSlot("header") && props.hideClose()}>
            <h2 data-part="title" id=${headingId}>${ctx.hasSlot("header") ? ctx.slot("header") : props.heading}</h2>
            <button
              type="button"
              data-part="close"
              aria-label=${() => props.closeLabel() || dialogLabels.close}
              ?hidden=${props.hideClose}
              @click=${() => void close(undefined, "close-button")}
            >${closeContent()}</button>
          </header>
          <div data-part="body">${ctx.slot()}</div>
          ${ctx.hasSlot("footer") ? html`<footer data-part="footer">${ctx.slot("footer")}</footer>` : null}
        </div>
      </dialog>
    `
  },
})

export interface DialogElement extends InstanceType<typeof DialogBase> {
  /** Opens as a modal on top of the current stack; resolves with the close result. */
  show(): Promise<unknown>
  /** Asks the guards and closes (with dialogs opened above it). Resolves false if refused. */
  close(result?: unknown): Promise<boolean>
}

Object.defineProperties(DialogBase.prototype, {
  show: {
    value(this: { _dialog?: Controller }) {
      if (!this._dialog) throw new Error("<bz-dialog> must be connected before show()")
      return this._dialog.show()
    },
    configurable: true,
  },
  close: {
    value(this: { _dialog?: Controller }, result?: unknown) {
      return this._dialog ? this._dialog.close(result) : Promise.resolve(true)
    },
    configurable: true,
  },
})

/**
 * <bz-dialog heading="…"> — modal dialog. Open with `open` (attribute/property) or `show()`,
 * close with `close(result)`. Slots: default (body), header, footer. Fires `open`,
 * cancelable `before-close` { reason, result } and `close` { result, reason }.
 *
 * Anatomy: [data-part=dialog|panel|header|title|close|body|footer].
 * Styling hooks: [open], [size] (CSS), [data-depth], [data-covered], [data-refused].
 */
export const Dialog = DialogBase as unknown as {
  new (): DialogElement
  prototype: DialogElement
}

// ---------------------------------------------------------------------------------------
// dialogs manager: programmatic dialogs

export interface DialogRef<R = unknown> extends PromiseLike<R | undefined> {
  element: DialogElement
  /** Resolves with the value given to close(); undefined when dismissed. */
  result: Promise<R | undefined>
  close(result?: R): Promise<boolean>
}

/** What a dialog body/footer can be; a function receives the ref (to close with a result). */
export type DialogContent<R = unknown> =
  | string
  | number
  | Node
  | TemplateResult
  | readonly unknown[]
  | null
  | ((ref: DialogRef<R>) => unknown)

export interface DialogOptions<R = unknown> {
  heading?: string
  label?: string
  /** Text, node, html`` template, or a function receiving the ref (to close with a result). */
  content?: DialogContent<R>
  footer?: DialogContent<R>
  /** CSS size hook: "sm" | "md" | "lg" | "xl" | "full". */
  size?: string
  persistent?: boolean
  hideClose?: boolean
  beforeClose?: BeforeClose
  /** Extra attributes on the <bz-dialog>, e.g. { class: "wizard" }. */
  attrs?: Record<string, string>
}

function afterAnimations(el: Element): Promise<void> {
  const animations = el.getAnimations?.({ subtree: true }) ?? []
  return Promise.all(animations.map((a) => a.finished.catch(() => undefined))).then(() => undefined)
}

function open<R = unknown>(options: DialogOptions<R>): DialogRef<R> {
  const el = document.createElement("bz-dialog") as DialogElement
  if (options.heading) el.heading = options.heading
  if (options.label) el.label = options.label
  if (options.persistent) el.persistent = true
  if (options.hideClose) el.hideClose = true
  if (options.beforeClose) el.beforeClose = options.beforeClose
  if (options.size) el.setAttribute("size", options.size)
  for (const [name, value] of Object.entries(options.attrs ?? {})) el.setAttribute(name, value)

  let result!: Promise<R | undefined>
  const ref: DialogRef<R> = {
    element: el,
    get result() {
      return result
    },
    close: (value) => el.close(value),
    then: (onFulfilled, onRejected) => result.then(onFulfilled, onRejected),
  }
  const resolveContent = (content: DialogContent<R>) => (typeof content === "function" ? (content as (r: DialogRef<R>) => unknown)(ref) : content)

  // Content is rendered in its own root, disposed when the dialog is removed.
  const dispose = root((d) => {
    const wrap = (value: unknown, slot?: string) => {
      const box = document.createElement("div")
      box.style.display = "contents"
      if (slot) box.slot = slot
      render(value, box)
      el.append(box)
    }
    if (options.content !== undefined) wrap(resolveContent(options.content))
    if (options.footer !== undefined) wrap(resolveContent(options.footer), "footer")
    return d
  })

  document.body.append(el)
  result = el.show() as Promise<R | undefined>
  void result.then(async () => {
    await afterAnimations(el)
    el.remove()
    dispose()
  })
  return ref
}

function button(label: string, variant: string, onClick: () => void, autofocus = false) {
  const b = document.createElement("bz-button")
  b.textContent = label
  if (variant) b.setAttribute("variant", variant)
  if (autofocus) b.setAttribute("autofocus", "")
  b.addEventListener("click", onClick)
  return b
}

export interface ConfirmOptions {
  heading?: string
  message: DialogContent
  confirmText?: string
  cancelText?: string
  /** "danger" styles the confirm button and focuses Cancel first. */
  variant?: "primary" | "danger"
}

/** Resolves true on confirm, false on cancel/Escape/backdrop. */
function confirm(options: ConfirmOptions | string): Promise<boolean> {
  const o = typeof options === "string" ? { message: options } : options
  const danger = o.variant === "danger"
  const ref = open<boolean>({
    heading: o.heading,
    label: o.heading ? undefined : typeof o.message === "string" ? o.message : undefined,
    size: "sm",
    attrs: { role: "alertdialog" },
    content: o.message,
    footer: (r: DialogRef<boolean>) => [
      button(o.cancelText ?? dialogLabels.cancel, "", () => void r.close(false), danger),
      button(o.confirmText ?? dialogLabels.ok, danger ? "danger" : "primary", () => void r.close(true), !danger),
    ],
  })
  return ref.result.then((v) => v === true)
}

/** Message with a single OK button. */
function alert(options: { heading?: string; message: DialogContent; okText?: string } | string): Promise<void> {
  const o = typeof options === "string" ? { message: options } : options
  const ref = open<void>({
    heading: o.heading,
    size: "sm",
    attrs: { role: "alertdialog" },
    content: o.message,
    footer: (r: DialogRef<void>) => [button(o.okText ?? dialogLabels.ok, "primary", () => void r.close(), true)],
  })
  return ref.result.then(() => undefined)
}

/** Closes every open dialog from the top, asking guards; resolves false if one refused. */
async function closeAll(): Promise<boolean> {
  const bottom = stack[0]
  return bottom ? requestClose(bottom, undefined, "api") : true
}

export const dialogs = {
  open,
  confirm,
  alert,
  closeAll,
  /** Open dialogs, bottom to top (reactive). */
  stack: openDialogs,
  /** Default button/close texts, e.g. `Object.assign(dialogs.labels, { ok: "Tamam" })`. */
  labels: dialogLabels,
  get top(): DialogElement | null {
    return (stack.at(-1)?.host as DialogElement) ?? null
  },
}

declare global {
  interface HTMLElementTagNameMap {
    "bz-dialog": DialogElement
  }
}
