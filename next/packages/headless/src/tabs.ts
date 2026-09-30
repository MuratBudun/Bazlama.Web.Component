import { computed, define, effect, onCleanup, prop, signal, uid } from "@bazlama/core"
import { hasIcon, icon } from "./icon"
import { isDisabled, toggleAria } from "./shared"

/**
 * Tabs (WAI-ARIA tabs pattern), all light DOM:
 *
 *   <bz-tabs value="general">
 *     <bz-tab-list>
 *       <bz-tab value="general">Genel</bz-tab>
 *       <bz-tab value="address" closable>Adres</bz-tab>
 *     </bz-tab-list>
 *     <bz-tab-panel value="general">…</bz-tab-panel>
 *     <bz-tab-panel value="address">…</bz-tab-panel>
 *   </bz-tabs>
 *
 * Tabs and panels are matched by `value` (or by position when it is missing). Any element
 * can wrap the tabs; the wrapper gets role=tablist. Tabs may be added or removed at any time
 * (MutationObserver), nested <bz-tabs> are independent.
 */

/**
 * <bz-tab-list>: the tab strip. When the tabs do not fit it scrolls horizontally and shows
 * ‹ › buttons at the overflowing ends; the mouse wheel scrolls it sideways.
 */
export const TabList = define("bz-tab-list", {
  setup(_, ctx) {
    const { host } = ctx
    host.setAttribute("role", "tablist")
    // Scroll buttons: not focusable and hidden from assistive technology (arrow keys already
    // move between tabs and bring them into view). Kept first and last in the strip.
    const arrow = (dir: "prev" | "next") => {
      const el = document.createElement("span")
      el.setAttribute("data-part", `scroll-${dir}`)
      el.setAttribute("aria-hidden", "true")
      el.hidden = true
      el.textContent = dir === "prev" ? "‹" : "›"
      el.addEventListener("pointerdown", (e) => e.preventDefault())
      el.addEventListener("click", (e) => {
        e.stopPropagation()
        host.scrollBy({ left: (dir === "prev" ? -1 : 1) * host.clientWidth * 0.8, behavior: "smooth" })
      })
      return el
    }
    const prev = arrow("prev")
    const next = arrow("next")
    const place = () => {
      if (host.firstElementChild !== prev) host.prepend(prev)
      if (host.lastElementChild !== next) host.append(next)
    }
    const update = () => {
      const rtl = getComputedStyle(host).direction === "rtl"
      const max = host.scrollWidth - host.clientWidth
      const pos = Math.abs(host.scrollLeft)
      const start = max > 1 && pos > 1
      const end = max > 1 && pos < max - 1
      prev.hidden = !(rtl ? end : start)
      next.hidden = !(rtl ? start : end)
      host.toggleAttribute("data-overflow", max > 1)
    }
    place()
    const mutations = new MutationObserver(() => {
      place()
      update()
    })
    mutations.observe(host, { childList: true })
    onCleanup(() => mutations.disconnect())
    if (typeof ResizeObserver !== "undefined") {
      const resize = new ResizeObserver(update)
      resize.observe(host)
      onCleanup(() => resize.disconnect())
    }
    ctx.on(host, "scroll", update, { passive: true })
    // A vertical wheel scrolls the strip sideways (when it overflows).
    ctx.on<WheelEvent>(
      host,
      "wheel",
      (e) => {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || host.scrollWidth <= host.clientWidth) return
        host.scrollLeft += e.deltaY
        e.preventDefault()
      },
      { passive: false }
    )
    queueMicrotask(update)
  },
})

/**
 * <bz-tab value="…" disabled closable>: the label is its content. `closable` adds a close
 * mark (click, middle click or Delete closes; see <bz-tabs> for the close events).
 */
export const Tab = define("bz-tab", {
  props: {
    disabled: prop.boolean(false, { reflect: true }),
    closable: prop.boolean(false, { reflect: true }),
    closeLabel: prop.string("Close"),
  },
  setup(props, { host }) {
    if (!host.id) host.id = uid("bz-tab")
    host.setAttribute("role", "tab")
    let mark: HTMLElement | null = null
    effect(() => {
      toggleAria(host, "aria-disabled", props.disabled())
      if (props.closable()) {
        if (!mark) {
          mark = document.createElement("span")
          mark.setAttribute("data-part", "close")
          mark.setAttribute("aria-hidden", "true")
          mark.append(hasIcon("x") ? icon("x") : "×")
        }
        mark.title = props.closeLabel()
        if (mark.parentElement !== host) host.append(mark)
        host.setAttribute("aria-keyshortcuts", "Delete")
      } else {
        mark?.remove()
        host.removeAttribute("aria-keyshortcuts")
      }
    })
  },
})

/** <bz-tab-panel value="…">: shown while its tab is selected. */
export const TabPanel = define("bz-tab-panel", {
  setup(_, { host }) {
    if (!host.id) host.id = uid("bz-tab-panel")
    host.setAttribute("role", "tabpanel")
  },
})

export type TabBeforeClose = (value: string, tab: HTMLElement) => boolean | void | Promise<boolean | void>

interface Controller {
  close(value: string): Promise<boolean>
}

/**
 * <bz-tabs value="…" activation="auto|manual" orientation="horizontal|vertical">
 *
 * `value`: selected tab (defaults to the first enabled one). Fires `change` { value } (does
 * not bubble).
 * Keyboard: ←/→ (↑/↓ when vertical), Home/End; with activation="manual" arrows only move
 * focus and Enter/Space selects; Delete closes a closable tab.
 *
 * Closing (closable tabs, or `tabs.close(value)`): cancelable `before-close` { value, tab }
 * → `beforeClose(value, tab)` (may return a Promise, e.g. an "unsaved changes" confirm;
 * false keeps the tab) → the selection moves to a neighbour → `close` { value, tab }. Remove
 * the tab in the `close` handler (e.g. from the data a repeat() renders), or set
 * `remove-on-close` to let the component remove the tab and its panel.
 *
 * Styling hooks: bz-tab[aria-selected="true"], [aria-disabled="true"], [closable],
 * bz-tab > [data-part=close], bz-tab-list[data-overflow] > [data-part=scroll-prev|scroll-next],
 * [orientation], [fill] (CSS: fills the container's height, the open panel scrolls).
 */
const TabsBase = define("bz-tabs", {
  props: {
    value: prop.string(),
    activation: prop.string<"auto" | "manual">("auto"),
    orientation: prop.string<"horizontal" | "vertical">("horizontal", { reflect: true }),
    beforeClose: prop.object<TabBeforeClose | null>(null),
    removeOnClose: prop.boolean(),
  },
  setup(props, ctx) {
    const host = ctx.host as HTMLElement & { _tabs?: Controller }
    const version = signal(0)
    const observer = new MutationObserver(() => version.update((n) => n + 1))
    observer.observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ["value", "disabled"] })
    onCleanup(() => observer.disconnect())

    // Only this instance's tabs: nested <bz-tabs> manage their own.
    const own = (selector: string) => {
      version()
      return Array.from(host.querySelectorAll<HTMLElement>(selector)).filter((el) => el.closest("bz-tabs") === host)
    }
    const tabs = computed(() => own("bz-tab"))
    const panels = computed(() => own("bz-tab-panel"))
    const valueOf = (el: HTMLElement, list: HTMLElement[]) => el.getAttribute("value") ?? String(list.indexOf(el))

    const selected = computed(() => {
      const list = tabs()
      const value = props.value()
      return list.find((t) => valueOf(t, list) === value && !isDisabled(t)) ?? list.find((t) => !isDisabled(t)) ?? null
    })

    // An empty value becomes the first enabled tab. An unknown value is shown as the first tab
    // but kept: its tab may be about to render (e.g. value set together with a new tab in a
    // repeat()), and then it gets selected.
    effect(() => {
      const tab = selected()
      if (!tab || props.value()) return
      props.value.set(valueOf(tab, tabs()))
    })

    effect(() => {
      const list = tabs()
      const panelList = panels()
      const current = selected()
      const byValue = new Map(panelList.map((p) => [valueOf(p, panelList), p]))
      for (const parent of new Set(list.map((t) => t.parentElement))) {
        if (!parent || parent === host) continue
        parent.setAttribute("role", "tablist")
        parent.setAttribute("aria-orientation", props.orientation())
      }
      // Children may upgrade after this effect ran: make sure the ids exist for aria-* references.
      for (const el of [...list, ...panelList]) if (!el.id) el.id = uid(el.localName)
      for (const tab of list) {
        const isSelected = tab === current
        tab.setAttribute("aria-selected", String(isSelected))
        tab.tabIndex = isSelected ? 0 : -1
        const panel = byValue.get(valueOf(tab, list))
        if (panel) tab.setAttribute("aria-controls", panel.id)
        else tab.removeAttribute("aria-controls")
      }
      const selectedValue = current ? valueOf(current, list) : null
      for (const panel of panelList) {
        const value = valueOf(panel, panelList)
        const tab = list.find((t) => valueOf(t, list) === value)
        if (tab) panel.setAttribute("aria-labelledby", tab.id)
        panel.hidden = value !== selectedValue
        if (!panel.hasAttribute("tabindex")) panel.tabIndex = 0
      }
    })

    // Keep the selected tab visible in a scrolling strip.
    effect(() => {
      const tab = selected()
      if (tab) queueMicrotask(() => tab.scrollIntoView?.({ block: "nearest", inline: "nearest" }))
    })

    const setValue = (value: string) => {
      if (value === props.value.peek()) return
      props.value.set(value)
      // Not bubbling: nested tabs (and their ancestors) must not see each other's changes.
      ctx.emit("change", { value }, { bubbles: false })
    }
    const select = (tab: HTMLElement) => {
      if (isDisabled(tab)) return
      setValue(valueOf(tab, tabs.peek()))
    }

    const closing = new Set<string>()
    const close = async (value: string): Promise<boolean> => {
      const list = tabs.peek()
      const tab = list.find((t) => valueOf(t, list) === value)
      if (!tab || closing.has(value)) return false
      closing.add(value)
      try {
        if (!ctx.emit("before-close", { value, tab }, { cancelable: true, bubbles: false })) return false
        const guard = props.beforeClose.peek()
        if (guard && (await guard(value, tab)) === false) return false
        const current = tabs.peek()
        const hadFocus = tab.contains(document.activeElement)
        if (valueOf(tab, current) === props.value.peek()) {
          // Select the next enabled tab (or the previous one at the end).
          const i = current.indexOf(tab)
          const neighbour =
            current.slice(i + 1).find((t) => !isDisabled(t)) ?? current.slice(0, i).reverse().find((t) => !isDisabled(t))
          if (neighbour) {
            setValue(valueOf(neighbour, current))
            if (hadFocus) neighbour.focus()
          }
        }
        ctx.emit("close", { value, tab }, { bubbles: false })
        if (props.removeOnClose.peek()) {
          const panelList = panels.peek()
          panelList.find((p) => valueOf(p, panelList) === value)?.remove()
          tab.remove()
        }
        return true
      } finally {
        closing.delete(value)
      }
    }
    host._tabs = { close }
    onCleanup(() => delete host._tabs)

    const ownTab = (e: Event) => {
      const tab = (e.target as Element).closest?.("bz-tab") as HTMLElement | null
      return tab && tab.closest("bz-tabs") === host ? tab : null
    }
    const isClosable = (tab: HTMLElement) => tab.hasAttribute("closable") && !isDisabled(tab)

    ctx.on(host, "click", (e) => {
      const tab = ownTab(e)
      if (!tab || isDisabled(tab)) return
      if ((e.target as Element).closest("[data-part=close]") && isClosable(tab)) {
        e.stopPropagation()
        void close(valueOf(tab, tabs.peek()))
        return
      }
      select(tab)
      tab.focus()
    })
    // Middle click closes, as in browsers.
    ctx.on<MouseEvent>(host, "auxclick", (e) => {
      const tab = ownTab(e)
      if (e.button !== 1 || !tab || !isClosable(tab)) return
      e.preventDefault()
      void close(valueOf(tab, tabs.peek()))
    })
    ctx.on<MouseEvent>(host, "mousedown", (e) => {
      // Keep the middle button from starting autoscroll on a closable tab.
      if (e.button === 1 && ownTab(e) && isClosable(ownTab(e)!)) e.preventDefault()
    })
    ctx.on<KeyboardEvent>(host, "keydown", (e) => {
      const tab = ownTab(e)
      if (!tab || e.target !== tab || e.altKey || e.ctrlKey || e.metaKey) return
      const enabled = tabs.peek().filter((t) => !isDisabled(t))
      const i = enabled.indexOf(tab)
      const vertical = props.orientation.peek() === "vertical"
      const rtl = getComputedStyle(host).direction === "rtl"
      let next: HTMLElement | undefined
      switch (e.key) {
        case vertical ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight":
          next = enabled[(i + 1) % enabled.length]
          break
        case vertical ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft":
          next = enabled[(i - 1 + enabled.length) % enabled.length]
          break
        case "Home":
          next = enabled[0]
          break
        case "End":
          next = enabled.at(-1)
          break
        case "Enter":
        case " ":
          e.preventDefault()
          select(tab)
          return
        case "Delete":
          if (!isClosable(tab)) return
          e.preventDefault()
          void close(valueOf(tab, tabs.peek()))
          return
        default:
          return
      }
      e.preventDefault()
      if (!next) return
      next.focus()
      next.scrollIntoView?.({ block: "nearest", inline: "nearest" })
      if (props.activation.peek() === "auto") select(next)
    })
  },
})

export interface TabsElement extends InstanceType<typeof TabsBase> {
  /** Closes a tab through the before-close / beforeClose checks. Resolves false if refused. */
  close(value: string): Promise<boolean>
}

Object.defineProperty(TabsBase.prototype, "close", {
  value(this: HTMLElement & { _tabs?: Controller }, value: string) {
    return this._tabs ? this._tabs.close(value) : Promise.resolve(false)
  },
  configurable: true,
})

export const Tabs = TabsBase as unknown as { new (): TabsElement; prototype: TabsElement }

declare global {
  interface HTMLElementTagNameMap {
    "bz-tabs": TabsElement
    "bz-tab-list": InstanceType<typeof TabList>
    "bz-tab": InstanceType<typeof Tab>
    "bz-tab-panel": InstanceType<typeof TabPanel>
  }
}
