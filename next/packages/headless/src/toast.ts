import { effect, html, render, root, signal, type Cleanup } from "@bazlama/core"
import { openDialogs } from "./dialog"
import { hasIcon, icon } from "./icon"

/**
 * Toast notifications: `toast("Kaydedildi")`, `toast.success(…)`, `toast.promise(…)`.
 *
 * - One container ("toaster") per placement, created on first use. It is a manual popover,
 *   so it renders in the top layer; while modal dialogs are open it moves into the top
 *   dialog, otherwise the modal would make it inert (not clickable).
 * - Timers pause while the pointer or focus is on the toaster and while the page is hidden.
 * - Same `id` updates the existing toast instead of adding one.
 * - Each toast is role="status" (errors role="alert"), so screen readers announce it.
 *
 * Anatomy: [data-bz-toaster][data-placement] > [data-part=toast][data-variant]
 *   > [data-part=icon|content|title|message|action|close|progress]
 */

export type ToastVariant = "info" | "success" | "warning" | "error"
export type ToastPlacement = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"

export interface ToastOptions {
  /** Same id → the existing toast is updated. */
  id?: string
  title?: string
  /** Text, node or html`` template. */
  message?: unknown
  variant?: ToastVariant
  /** Milliseconds; 0 keeps it until closed. Default: toast.defaults.duration (errors ×2). */
  duration?: number
  action?: { label: string; onClick: (ref: ToastRef) => void }
  /** Shows the close button (default true). */
  dismissible?: boolean
  placement?: ToastPlacement
  /** Shows a spinner instead of the icon (toast.promise uses it). */
  loading?: boolean
}

export interface ToastRef {
  id: string
  element: HTMLElement
  close(): void
  update(options: Partial<Omit<ToastOptions, "id" | "placement">>): void
}

interface Item {
  ref: ToastRef
  state: ReturnType<typeof signal<ToastOptions>>
  toaster: HTMLElement
  remaining: number
  startedAt: number
  timer: ReturnType<typeof setTimeout> | undefined
  dispose: Cleanup
  closed: boolean
}

const defaults = { placement: "bottom-right" as ToastPlacement, duration: 5000, max: 5 }
const labels = { close: "Close", region: "Notifications" }
const items = new Map<string, Item>()
const toasters = new Map<ToastPlacement, HTMLElement>()
let counter = 0
let paused = false

const supportsPopover = () => typeof HTMLElement.prototype.showPopover === "function"

function reveal(toaster: HTMLElement): void {
  if (!supportsPopover()) return
  // Re-show so the toaster is above anything that entered the top layer after it.
  if (toaster.matches(":popover-open")) toaster.hidePopover()
  if (toaster.isConnected) toaster.showPopover()
}

/** Parent for toasters: the top modal dialog (so it is not inert) or <body>. */
function host(): HTMLElement {
  const top = openDialogs().at(-1)
  return top?.querySelector<HTMLElement>("dialog") ?? document.body
}

let installed = false
function install(): void {
  if (installed) return
  installed = true
  effect(() => {
    const parent = host()
    for (const toaster of toasters.values()) {
      if (toaster.parentElement !== parent) parent.append(toaster)
      if (toaster.childElementCount) reveal(toaster)
    }
  })
  document.addEventListener("visibilitychange", () => setPaused(document.hidden))
}

function toasterFor(placement: ToastPlacement): HTMLElement {
  let toaster = toasters.get(placement)
  if (toaster) return toaster
  toaster = document.createElement("section")
  toaster.setAttribute("data-bz-toaster", "")
  toaster.setAttribute("data-placement", placement)
  toaster.setAttribute("aria-label", labels.region)
  if (supportsPopover()) toaster.popover = "manual"
  const t = toaster
  const pause = () => setPaused(true)
  const resume = () => {
    if (!t.matches(":hover") && !t.contains(document.activeElement)) setPaused(document.hidden)
  }
  t.addEventListener("pointerenter", pause)
  t.addEventListener("pointerleave", resume)
  t.addEventListener("focusin", pause)
  t.addEventListener("focusout", (e) => {
    if (!t.contains(e.relatedTarget as Node)) resume()
  })
  toasters.set(placement, t)
  install()
  host().append(t)
  return t
}

function setPaused(value: boolean): void {
  if (paused === value) return
  paused = value
  for (const item of items.values()) {
    if (value) stopTimer(item)
    else startTimer(item)
  }
}

function stopTimer(item: Item): void {
  if (item.timer === undefined) return
  clearTimeout(item.timer)
  item.timer = undefined
  item.remaining -= Date.now() - item.startedAt
  item.ref.element.setAttribute("data-paused", "")
}

function startTimer(item: Item): void {
  item.ref.element.removeAttribute("data-paused")
  if (item.timer !== undefined || item.closed || item.remaining <= 0 || paused) return
  item.startedAt = Date.now()
  item.timer = setTimeout(() => item.ref.close(), item.remaining)
}

function durationOf(o: ToastOptions): number {
  if (o.loading) return 0
  if (o.duration !== undefined) return o.duration
  return o.variant === "error" ? defaults.duration * 2 : defaults.duration
}

async function removeElement(el: HTMLElement): Promise<void> {
  el.setAttribute("data-leaving", "")
  const animations = el.getAnimations?.({ subtree: true }) ?? []
  await Promise.all(animations.map((a) => a.finished.catch(() => undefined)))
  el.remove()
}

const VARIANT_ICONS: Record<ToastVariant, string> = { info: "info", success: "circle-check", warning: "alert", error: "alert" }

function create(options: ToastOptions): ToastRef {
  const existing = options.id ? items.get(options.id) : undefined
  if (existing && !existing.closed) {
    existing.ref.update(options)
    return existing.ref
  }
  const id = options.id ?? `bz-toast-${++counter}`
  const placement = options.placement ?? defaults.placement
  const toaster = toasterFor(placement)
  const state = signal<ToastOptions>({ variant: "info", dismissible: true, ...options })
  const el = document.createElement("div")
  el.setAttribute("data-part", "toast")
  el.id = id

  const ref: ToastRef = {
    id,
    element: el,
    close: () => {
      const item = items.get(id)
      if (!item || item.closed) return
      item.closed = true
      clearTimeout(item.timer)
      items.delete(id)
      void removeElement(el).then(() => {
        item.dispose()
        if (!toaster.childElementCount && supportsPopover() && toaster.matches(":popover-open")) toaster.hidePopover()
      })
    },
    update: (patch) => {
      const item = items.get(id)
      if (!item || item.closed) return
      state.set({ ...state.peek(), ...patch })
      clearTimeout(item.timer)
      item.timer = undefined
      item.remaining = durationOf(state.peek())
      startTimer(item)
    },
  }

  const dispose = root((d) => {
    effect(() => {
      const s = state()
      el.setAttribute("data-variant", s.variant ?? "info")
      el.setAttribute("role", s.variant === "error" ? "alert" : "status")
      el.toggleAttribute("data-loading", !!s.loading)
      const duration = durationOf(s)
      el.style.setProperty("--bz-toast-duration", `${duration}ms`)
      el.toggleAttribute("data-timed", duration > 0)
    })
    const iconName = () => VARIANT_ICONS[state().variant ?? "info"]
    render(
      html`
        <span data-part="icon" aria-hidden="true">${() => (state().loading ? null : hasIcon(iconName()) ? icon(iconName()) : null)}</span>
        <div data-part="content">
          <div data-part="title" ?hidden=${() => !state().title}>${() => state().title ?? ""}</div>
          <div data-part="message" ?hidden=${() => state().message == null || state().message === ""}>${() => state().message ?? ""}</div>
        </div>
        ${() => {
          const action = state().action
          return action
            ? html`<button type="button" data-part="action" @click=${() => action.onClick(ref)}>${action.label}</button>`
            : null
        }}
        <button type="button" data-part="close" aria-label=${labels.close} ?hidden=${() => state().dismissible === false} @click=${() => ref.close()}>
          ${hasIcon("x") ? icon("x") : "×"}
        </button>
        <span data-part="progress" aria-hidden="true"></span>
      `,
      el
    )
    return d
  })

  const item: Item = { ref, state, toaster, remaining: durationOf(state.peek()), startedAt: 0, timer: undefined, dispose, closed: false }
  items.set(id, item)
  // Newest next to the screen edge: top placements prepend, bottom ones append.
  if (placement.startsWith("top")) toaster.prepend(el)
  else toaster.append(el)
  reveal(toaster)
  // Keep at most `max` toasts per toaster.
  const open = [...items.values()].filter((i) => i.toaster === toaster && !i.closed)
  for (const extra of open.slice(0, Math.max(0, open.length - defaults.max))) extra.ref.close()
  startTimer(item)
  return ref
}

type Message = string | Omit<ToastOptions, "variant">
const normalize = (message: Message, extra?: Partial<ToastOptions>): ToastOptions =>
  typeof message === "string" ? { message, ...extra } : { ...message, ...extra }

export interface PromiseMessages<T> {
  loading: string | ToastOptions
  success: string | ToastOptions | ((value: T) => string | ToastOptions)
  error: string | ToastOptions | ((error: unknown) => string | ToastOptions)
}

/** Shows a toast. `toast("Metin")` or `toast({ title, message, variant, duration, action })`. */
export const toast = Object.assign((message: string | ToastOptions) => create(normalize(message)), {
  info: (message: Message, options?: Partial<ToastOptions>) => create(normalize(message, { ...options, variant: "info" })),
  success: (message: Message, options?: Partial<ToastOptions>) => create(normalize(message, { ...options, variant: "success" })),
  warning: (message: Message, options?: Partial<ToastOptions>) => create(normalize(message, { ...options, variant: "warning" })),
  error: (message: Message, options?: Partial<ToastOptions>) => create(normalize(message, { ...options, variant: "error" })),
  /** Loading toast that turns into success or error when the promise settles. Returns the promise. */
  promise<T>(promise: Promise<T>, messages: PromiseMessages<T>, options?: Partial<ToastOptions>): Promise<T> {
    const asOptions = (m: string | ToastOptions) => (typeof m === "string" ? { message: m } : m)
    const ref = create({ ...options, ...asOptions(messages.loading), loading: true, dismissible: false })
    promise.then(
      (value) => {
        const m = typeof messages.success === "function" ? messages.success(value) : messages.success
        ref.update({ duration: undefined, ...asOptions(m), variant: "success", loading: false, dismissible: true })
      },
      (error) => {
        const m = typeof messages.error === "function" ? messages.error(error) : messages.error
        ref.update({ duration: undefined, ...asOptions(m), variant: "error", loading: false, dismissible: true })
      }
    )
    return promise
  },
  /** Closes one toast, or all of them. */
  dismiss(id?: string): void {
    if (id) items.get(id)?.ref.close()
    else for (const item of [...items.values()]) item.ref.close()
  },
  /** Default placement, duration (ms) and maximum per placement. */
  defaults,
  /** Texts for the close button and the region, e.g. Object.assign(toast.labels, { close: "Kapat" }). */
  labels,
})
