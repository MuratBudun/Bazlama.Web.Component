import { define, effect, html, onCleanup, prop, signal, uid } from "@bazlama/core"
import { openDialogs } from "./dialog"
import { hasIcon, icon } from "./icon"
import { hidePopup, place, showPopup, supportsPopover, type Placement } from "./position"
import { fold, isDisabled, toggleAria } from "./shared"

/**
 * Menus (WAI-ARIA menu button pattern) on the Popover API:
 *
 *   <bz-menu>
 *     <bz-button slot="trigger">İşlemler</bz-button>
 *     <bz-menu-item value="edit" icon="edit" shortcut="F2">Düzenle</bz-menu-item>
 *     <bz-menu-separator></bz-menu-separator>
 *     <bz-menu>                                            ← submenu
 *       <bz-menu-item slot="trigger">Dışa aktar</bz-menu-item>
 *       <bz-menu-item value="xlsx">Excel</bz-menu-item>
 *     </bz-menu>
 *   </bz-menu>
 *
 * - The popup is popover="auto": the browser puts it in the top layer and closes it on an
 *   outside click; nested menus stay open because their popups are DOM descendants.
 * - Items get real focus (roving). Keyboard: ↑/↓, Home/End, typeahead, Enter/Space,
 *   → opens a submenu, ← / Escape close one level (focus returns), Tab closes all.
 * - Escape is handled (preventDefault), so a dialog around the menu stays open.
 * - `select` { value, item, checked } bubbles from the menu owning the item (cancelable:
 *   preventDefault keeps the menu open). Checkbox/radio items keep the menu open.
 * - Programmatic: openMenu({ items, anchor }); context menus: see context-menu.ts.
 *
 * Anatomy: bz-menu > [data-part=popup] (role=menu); items: [data-part=check|icon|label|
 * shortcut|submenu-indicator]; bz-menu-group > [data-part=group-label].
 */

// ---------------------------------------------------------------------------------------
// Items

export const MenuItem = define("bz-menu-item", {
  props: {
    disabled: prop.boolean(false, { reflect: true }),
    type: prop.string<"item" | "checkbox" | "radio">("item"),
    checked: prop.boolean(false, { reflect: true }),
    icon: prop.string(),
    shortcut: prop.string(),
  },
  setup(props, ctx) {
    const { host } = ctx
    if (!host.id) host.id = uid("bz-menu-item")
    host.tabIndex = -1
    effect(() => {
      const type = props.type()
      host.setAttribute("role", type === "checkbox" ? "menuitemcheckbox" : type === "radio" ? "menuitemradio" : "menuitem")
      if (type === "item") host.removeAttribute("aria-checked")
      else host.setAttribute("aria-checked", String(props.checked()))
      toggleAria(host, "aria-disabled", props.disabled())
    })
    return html`
      <span data-part="check" aria-hidden="true" ?hidden=${() => props.type() === "item"}></span>
      <span data-part="icon" aria-hidden="true" ?hidden=${() => !props.icon()}>${() =>
        props.icon() && hasIcon(props.icon()) ? icon(props.icon()) : null}</span>
      <span data-part="label">${ctx.slot()}</span>
      <span data-part="shortcut" ?hidden=${() => !props.shortcut()}>${props.shortcut}</span>
      <span data-part="submenu-indicator" aria-hidden="true"></span>
    `
  },
})

export const MenuSeparator = define("bz-menu-separator", {
  setup(_, { host }) {
    host.setAttribute("role", "separator")
  },
})

export const MenuGroup = define("bz-menu-group", {
  props: { label: prop.string() },
  setup(props, ctx) {
    const id = uid("bz-menu-group")
    ctx.host.setAttribute("role", "group")
    effect(() => {
      if (props.label()) ctx.host.setAttribute("aria-labelledby", id)
      else ctx.host.removeAttribute("aria-labelledby")
    })
    return html`<div data-part="group-label" id=${id} ?hidden=${() => !props.label()}>${props.label}</div>${ctx.slot()}`
  },
})

// ---------------------------------------------------------------------------------------
// Menu

type Anchor = Element | { x: number; y: number }
type FocusTarget = "first" | "last" | null

interface Controller {
  popup: HTMLElement
  isOpen(): boolean
  open(focus?: FocusTarget, anchor?: Anchor): void
  close(restoreFocus?: boolean): void
}

type MenuHost = HTMLElement & { _menu?: Controller }

const menuOf = (el: Element | null) => (el?.closest("bz-menu") as MenuHost | null) ?? null
const parentMenuOf = (menu: Element) => menuOf(menu.parentElement)

/** The menu an item belongs to: a submenu's trigger item belongs to the outer menu. */
function ownerOf(item: Element): MenuHost | null {
  const menu = menuOf(item)
  return menu && item.parentElement === menu ? parentMenuOf(menu) : menu
}
/** The submenu an item opens, if it is a submenu trigger. */
function submenuOf(item: Element): MenuHost | null {
  const menu = menuOf(item)
  return menu && item.parentElement === menu && parentMenuOf(menu) ? menu : null
}
function rootOf(menu: MenuHost): MenuHost {
  let m = menu
  for (let p = parentMenuOf(m); p; p = parentMenuOf(m)) m = p
  return m
}

const MenuBase = define("bz-menu", {
  props: {
    open: prop.boolean(false, { reflect: true }),
    /** Default: bottom-start (right-start for submenus). */
    placement: prop.string<Placement | "">(""),
    /** Accessible name of the menu (defaults to the trigger's text). */
    label: prop.string(),
  },
  setup(props, ctx) {
    const host = ctx.host as unknown as MenuHost
    const id = uid("bz-menu")
    let popup!: HTMLElement
    let anchor: Anchor | null = null
    /** Where focus returns: the trigger, or (for menus without one) the element focused before opening. */
    let returnFocus: HTMLElement | null = null
    const opened = signal(false)
    const trigger = () => ctx.slot("trigger").find((n): n is HTMLElement => n instanceof HTMLElement) ?? null
    const isSubmenu = () => !!parentMenuOf(host)

    const items = () =>
      Array.from(popup.querySelectorAll<HTMLElement>("bz-menu-item")).filter((i) => ownerOf(i) === host && !i.closest("[hidden]"))
    const childMenus = () =>
      Array.from(popup.querySelectorAll<MenuHost>("bz-menu")).filter((m) => parentMenuOf(m) === host)

    const reposition = () => {
      const target = anchor ?? trigger()
      if (!target || !opened.peek()) return
      if (target instanceof Element && !target.isConnected) return close(false)
      place(target, popup, {
        placement: props.placement.peek() || (isSubmenu() ? "right-start" : "bottom-start"),
        offset: isSubmenu() ? 2 : 4,
        fitHeight: true,
      })
    }
    let frame = 0
    const onViewportChange = (e: Event) => {
      if (e.target instanceof Node && popup.contains(e.target)) return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(reposition)
    }
    // Fallback without the Popover API: close on outside pointerdown.
    const onOutside = (e: Event) => {
      if (!rootOf(host).contains(e.target as Node)) close(false)
    }

    const focusItem = (item: HTMLElement | undefined) => item?.focus({ preventScroll: false })

    let openedAt = 0
    const open = (focus: FocusTarget = "first", at?: Anchor) => {
      if (at) anchor = at
      openedAt = performance.now()
      // Already open and given a new place (right click elsewhere): move there.
      if (opened.peek() && at) {
        for (const child of childMenus()) child._menu?.close(false)
        reposition()
      }
      if (!opened.peek()) {
        const active = document.activeElement as HTMLElement | null
        returnFocus = trigger() ?? (active && active !== document.body && !popup.contains(active) ? active : null)
        // One open submenu per level.
        const parent = parentMenuOf(host)
        if (parent) for (const sibling of parent._menu ? childMenusOf(parent) : []) if (sibling !== host) sibling._menu?.close(false)
        showPopup(popup)
        opened.set(true)
        props.open.set(true)
        reposition()
        addEventListener("scroll", onViewportChange, { capture: true, passive: true })
        addEventListener("resize", onViewportChange)
        if (!supportsPopover()) document.addEventListener("pointerdown", onOutside, true)
        ctx.emit("open", undefined, { bubbles: false })
      }
      const list = items()
      if (focus === "first") focusItem(list[0])
      else if (focus === "last") focusItem(list.at(-1))
    }

    /** Bookkeeping for every way of closing (our calls and the browser's light dismiss). */
    const finish = () => {
      if (!opened.peek()) return
      opened.set(false)
      props.open.set(false)
      cancelAnimationFrame(frame)
      removeEventListener("scroll", onViewportChange, { capture: true })
      removeEventListener("resize", onViewportChange)
      document.removeEventListener("pointerdown", onOutside, true)
      for (const child of childMenus()) child._menu?.close(false)
      ctx.emit("close", undefined, { bubbles: false })
    }
    const close = (restoreFocus = false) => {
      if (!opened.peek()) return
      const hadFocus = popup.contains(document.activeElement)
      for (const child of childMenus()) child._menu?.close(false)
      hidePopup(popup)
      finish()
      if ((restoreFocus || hadFocus) && returnFocus?.isConnected) returnFocus.focus({ preventScroll: true })
    }

    host._menu = { get popup() { return popup }, isOpen: () => opened.peek(), open, close }
    onCleanup(() => {
      finish()
      delete host._menu
    })

    // Trigger wiring (root trigger or submenu trigger item).
    effect(() => {
      const t = trigger()
      if (!t) return
      t.setAttribute("aria-haspopup", "menu")
      t.setAttribute("aria-expanded", String(opened()))
      t.setAttribute("aria-controls", `${id}-popup`)
    })
    ctx.onMount(() => {
      const t = trigger()
      if (!t) return
      if (isSubmenu()) {
        // Hover opens after a short delay; click and → are handled by the owner menu.
        let timer: ReturnType<typeof setTimeout> | undefined
        ctx.on(t, "pointerenter", (e) => {
          if ((e as PointerEvent).pointerType === "touch") return
          clearTimeout(timer)
          timer = setTimeout(() => !isDisabled(t) && open(null), 120)
        })
        ctx.on(t, "pointerleave", () => clearTimeout(timer))
        return
      }
      let wasOpen = false
      ctx.on(t, "pointerdown", () => (wasOpen = opened.peek()), { capture: true })
      ctx.on(t, "click", () => {
        // A click on the trigger of an open menu: light dismiss already closed it.
        if (wasOpen || opened.peek()) close(true)
        else open("first")
        wasOpen = false
      })
      ctx.on<KeyboardEvent>(t, "keydown", (e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault()
          open(e.key === "ArrowDown" ? "first" : "last")
        }
      })
    })

    // `open` set from outside.
    ctx.onMount(() =>
      effect(() => {
        if (props.open() && !opened.peek()) open(null)
        else if (!props.open() && opened.peek()) close(false)
      })
    )

    // ------------------------------------------------------------------ popup events
    const activate = (item: HTMLElement) => {
      if (isDisabled(item)) return
      const sub = submenuOf(item)
      if (sub) return sub._menu?.open("first")
      const el = item as HTMLElement & { type: string; checked: boolean }
      if (el.type === "checkbox") el.checked = !el.checked
      else if (el.type === "radio") {
        const name = el.getAttribute("name")
        const group = el.closest("bz-menu-group")
        for (const peer of items() as (HTMLElement & { type: string; checked: boolean })[]) {
          if (peer.type !== "radio") continue
          const same = name ? peer.getAttribute("name") === name : peer.closest("bz-menu-group") === group
          if (same) peer.checked = peer === el
        }
      }
      const value = el.getAttribute("value") ?? el.querySelector("[data-part=label]")?.textContent?.trim() ?? ""
      const allowed = ctx.emit("select", { value, item: el, checked: el.checked }, { cancelable: true })
      if (!allowed || el.type !== "item") return
      rootOf(host)._menu?.close(true)
    }

    let buffer = ""
    let bufferTimer: ReturnType<typeof setTimeout> | undefined
    const onKeydown = (e: KeyboardEvent) => {
      const item = (e.target as Element).closest?.("bz-menu-item") as HTMLElement | null
      if (!item || ownerOf(item) !== host) return
      const list = items()
      const i = list.indexOf(item)
      const rtl = getComputedStyle(popup).direction === "rtl"
      const forward = rtl ? "ArrowLeft" : "ArrowRight"
      const back = rtl ? "ArrowRight" : "ArrowLeft"
      switch (e.key) {
        case "ArrowDown":
          focusItem(list[(i + 1) % list.length])
          break
        case "ArrowUp":
          focusItem(list[(i - 1 + list.length) % list.length])
          break
        case "Home":
        case "PageUp":
          focusItem(list[0])
          break
        case "End":
        case "PageDown":
          focusItem(list.at(-1))
          break
        case forward: {
          const sub = submenuOf(item)
          if (sub && !isDisabled(item)) sub._menu?.open("first")
          break
        }
        case back:
          if (isSubmenu()) close(true)
          break
        case "Enter":
        case " ":
          activate(item)
          break
        case "Escape":
          close(true)
          break
        case "Tab":
          // Focus the root trigger; the default Tab action then moves on from there.
          rootOf(host)._menu?.close(true)
          return
        default: {
          if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return
          clearTimeout(bufferTimer)
          bufferTimer = setTimeout(() => (buffer = ""), 500)
          buffer += fold(e.key)
          const ordered = [...list.slice(i + (buffer.length === 1 ? 1 : 0)), ...list.slice(0, i + 1)]
          focusItem(ordered.find((it) => fold(it.textContent!.trim()).startsWith(buffer)))
        }
      }
      e.preventDefault()
    }
    const onClick = (e: MouseEvent) => {
      const item = (e.target as Element).closest?.("bz-menu-item") as HTMLElement | null
      if (item && ownerOf(item) === host) activate(item)
    }
    let hoverTimer: ReturnType<typeof setTimeout> | undefined
    const onPointermove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return
      const item = (e.target as Element).closest?.("bz-menu-item") as HTMLElement | null
      if (!item || ownerOf(item) !== host || document.activeElement === item) return
      item.focus({ preventScroll: true })
      // Moving to another item closes the open submenu of this level (after a grace delay).
      clearTimeout(hoverTimer)
      const keep = submenuOf(item)
      hoverTimer = setTimeout(() => {
        for (const child of childMenus()) if (child !== keep) child._menu?.close(false)
      }, 150)
    }
    // Desktop behavior: press the right button, move onto an item, release → select. Early
    // releases are the end of the click that opened the menu (macOS opens on press).
    const onPointerup = (e: PointerEvent) => {
      if (e.button !== 2 || performance.now() - openedAt < 250) return
      const item = (e.target as Element).closest?.("bz-menu-item") as HTMLElement | null
      if (item && ownerOf(item) === host) activate(item)
    }
    const onToggle = (e: Event) => {
      if ((e as ToggleEvent).newState === "closed") finish()
    }

    return html`
      ${ctx.slot("trigger")}
      <div
        data-part="popup"
        id=${`${id}-popup`}
        role="menu"
        popover="auto"
        ?hidden=${!supportsPopover()}
        aria-label=${() => props.label() || trigger()?.textContent?.trim() || null}
        @keydown=${onKeydown}
        @click=${onClick}
        @pointermove=${onPointermove}
        @pointerup=${onPointerup}
        @contextmenu=${(e: Event) => e.preventDefault()}
        @toggle=${onToggle}
        ref=${(el: HTMLElement) => (popup = el)}
      >
        ${ctx.slot()}
      </div>
    `
  },
})

function childMenusOf(menu: MenuHost): MenuHost[] {
  const popup = menu._menu?.popup
  return popup ? Array.from(popup.querySelectorAll<MenuHost>("bz-menu")).filter((m) => parentMenuOf(m) === menu) : []
}

export interface MenuElement extends InstanceType<typeof MenuBase> {
  /** Opens at the trigger, an element or a point; focuses the first item. */
  show(anchor?: Anchor): void
  hide(): void
}

Object.defineProperties(MenuBase.prototype, {
  show: {
    value(this: MenuHost, anchor?: Anchor) {
      if (!this._menu) throw new Error("<bz-menu> must be connected before show()")
      this._menu.open("first", anchor)
    },
    configurable: true,
  },
  hide: {
    value(this: MenuHost) {
      this._menu?.close(false)
    },
    configurable: true,
  },
})

export const Menu = MenuBase as unknown as { new (): MenuElement; prototype: MenuElement }

// ---------------------------------------------------------------------------------------
// Programmatic menus

export interface MenuItemData {
  label?: string
  value?: string
  icon?: string
  shortcut?: string
  disabled?: boolean
  /** CSS hook, e.g. "danger". */
  variant?: string
  type?: "item" | "checkbox" | "radio" | "separator" | "group"
  checked?: boolean
  /** Radio group name. */
  name?: string
  /** Submenu items, or group items when type is "group". */
  children?: MenuItemData[]
  onSelect?: (detail: { value: string; checked: boolean }) => void
}

function buildItems(parent: HTMLElement, list: MenuItemData[]): void {
  for (const data of list) {
    if (data.type === "separator") {
      parent.append(document.createElement("bz-menu-separator"))
      continue
    }
    if (data.type === "group") {
      const group = document.createElement("bz-menu-group")
      if (data.label) group.setAttribute("label", data.label)
      buildItems(group, data.children ?? [])
      parent.append(group)
      continue
    }
    const item = document.createElement("bz-menu-item")
    item.textContent = data.label ?? data.value ?? ""
    if (data.value !== undefined) item.setAttribute("value", data.value)
    if (data.icon) item.setAttribute("icon", data.icon)
    if (data.shortcut) item.setAttribute("shortcut", data.shortcut)
    if (data.disabled) item.setAttribute("disabled", "")
    if (data.variant) item.setAttribute("variant", data.variant)
    if (data.type && data.type !== "item") item.setAttribute("type", data.type)
    if (data.checked) item.setAttribute("checked", "")
    if (data.name) item.setAttribute("name", data.name)
    if (data.children?.length) {
      const sub = document.createElement("bz-menu")
      item.slot = "trigger"
      sub.append(item)
      buildItems(sub, data.children)
      parent.append(sub)
      continue
    }
    if (data.onSelect) {
      const onSelect = data.onSelect
      item.addEventListener("bz-menu-item-select", (e) => onSelect((e as CustomEvent).detail))
    }
    parent.append(item)
  }
}

export interface OpenMenuOptions {
  items: MenuItemData[]
  /** Element or viewport point ({ x, y } in client coordinates). */
  anchor: Anchor
  placement?: Placement
  label?: string
}

/**
 * Opens a temporary menu and resolves with the selected value (undefined when dismissed).
 * Items and radio items close it with their value; checkbox items keep it open and report
 * through their `onSelect`.
 * Inside a modal dialog it is attached to the dialog, so it stays interactive.
 */
export function openMenu(options: OpenMenuOptions): Promise<string | undefined> {
  const menu = document.createElement("bz-menu") as MenuElement
  menu.setAttribute("data-temporary", "")
  if (options.placement) menu.setAttribute("placement", options.placement)
  if (options.label) menu.setAttribute("label", options.label)
  buildItems(menu, options.items)
  const top = openDialogs().at(-1)?.querySelector("dialog") ?? document.body
  top.append(menu)
  return new Promise((resolve) => {
    let result: string | undefined
    menu.addEventListener("select", (e) => {
      const { value, item, checked } = (e as CustomEvent<{ value: string; item: HTMLElement; checked: boolean }>).detail
      item.dispatchEvent(new CustomEvent("bz-menu-item-select", { detail: { value, checked } }))
      const type = (item as HTMLElement & { type: string }).type
      // One-shot menu: a radio choice is the answer (checkboxes stay open for several toggles).
      if (type === "item" || type === "radio") result = value
      if (type === "radio") queueMicrotask(() => menu.hide())
    })
    menu.addEventListener("close", () => {
      resolve(result)
      queueMicrotask(() => menu.remove())
    })
    menu.show(options.anchor)
  })
}

declare global {
  interface HTMLElementTagNameMap {
    "bz-menu": MenuElement
    "bz-menu-item": InstanceType<typeof MenuItem>
    "bz-menu-separator": InstanceType<typeof MenuSeparator>
    "bz-menu-group": InstanceType<typeof MenuGroup>
  }
}
