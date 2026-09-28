import { computed, define, effect, html, onCleanup, prop, signal, uid } from "@bazlama/core"

/**
 * Accordion (WAI-ARIA accordion pattern):
 *
 *   <bz-accordion value="docs">                 ← multiple / always-open / fill
 *     <bz-accordion-item value="docs" heading="Dokümanlar">…</bz-accordion-item>
 *     <bz-accordion-item value="params" heading="Parametreler">…</bz-accordion-item>
 *   </bz-accordion>
 *
 * - Each header is a button (aria-expanded / aria-controls) inside a heading; the content is a
 *   region labelled by it. ↑/↓/Home/End move between the headers of the same accordion.
 * - Single mode (default): opening an item closes the others; `always-open` keeps one open.
 *   `multiple`: items open independently; `value` is then a comma-separated list.
 * - Closed content uses hidden="until-found" where supported: the browser's find-in-page
 *   (Ctrl+F) searches it and opens the item holding the match.
 * - `fill` (CSS): the accordion fills its container's height, the open item takes the rest
 *   and scrolls (e.g. a sidebar with collapsed section headers stacked below).
 * - Fires `change` { value, open: string[] } (does not bubble).
 *
 * Anatomy: bz-accordion-item > [data-part=heading] > [data-part=trigger] > [data-part=title|indicator],
 * [data-part=actions], [data-part=content]. Styling hooks: bz-accordion-item[open],
 * [disabled], bz-accordion[fill], [multiple].
 */

const untilFound = typeof document !== "undefined" && "onbeforematch" in document.body

type ItemHost = HTMLElement & { open: boolean; disabled: boolean }

export const AccordionItem = define("bz-accordion-item", {
  props: {
    heading: prop.string(),
    open: prop.boolean(false, { reflect: true }),
    disabled: prop.boolean(false, { reflect: true }),
    /** aria-level of the header (2–6). */
    level: prop.number(3),
  },
  setup(props, ctx) {
    const id = uid("bz-accordion")
    let content!: HTMLElement

    // Standalone items toggle themselves; inside an accordion the accordion decides.
    const request = (open: boolean) => {
      if (props.disabled.peek()) return
      // An accordion handles the request with preventDefault; otherwise toggle alone.
      const handled = !ctx.emit("bz-accordion-request", { open }, { cancelable: true })
      if (!handled) props.open.set(open)
    }

    ctx.onMount(() =>
      effect(() => {
        const open = props.open()
        if (open) content.hidden = false
        else if (untilFound) content.setAttribute("hidden", "until-found")
        else content.hidden = true
      })
    )

    return html`
      <div data-part="heading" role="heading" aria-level=${props.level}>
        <button
          type="button"
          data-part="trigger"
          id=${`${id}-trigger`}
          aria-controls=${`${id}-content`}
          aria-expanded=${() => String(props.open())}
          aria-disabled=${() => (props.disabled() ? "true" : null)}
          @click=${() => request(!props.open.peek())}
        >
          <span data-part="title">${ctx.hasSlot("header") ? ctx.slot("header") : props.heading}</span>
          <span data-part="indicator" aria-hidden="true"></span>
        </button>
        ${ctx.hasSlot("actions") ? html`<span data-part="actions">${ctx.slot("actions")}</span>` : null}
      </div>
      <div
        data-part="content"
        id=${`${id}-content`}
        role="region"
        aria-labelledby=${`${id}-trigger`}
        @beforematch=${() => request(true)}
        ref=${(el: HTMLElement) => (content = el)}
      >
        ${ctx.slot()}
      </div>
    `
  },
})

export const Accordion = define("bz-accordion", {
  props: {
    value: prop.string(),
    multiple: prop.boolean(false, { reflect: true }),
    /** Single mode: the open item cannot be closed (one is always open). */
    alwaysOpen: prop.boolean(),
  },
  setup(props, ctx) {
    const { host } = ctx
    const version = signal(0)
    const observer = new MutationObserver(() => version.update((n) => n + 1))
    observer.observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ["value"] })
    onCleanup(() => observer.disconnect())

    const items = computed(() => {
      version()
      return Array.from(host.querySelectorAll<ItemHost>("bz-accordion-item")).filter((i) => i.parentElement?.closest("bz-accordion") === host)
    })
    const valueOf = (item: HTMLElement, list: HTMLElement[]) => item.getAttribute("value") ?? String(list.indexOf(item))
    const openSet = computed(() => new Set(props.value().split(props.multiple() ? "," : "\u0000").filter(Boolean)))

    // Initial value from items with the `open` attribute.
    ctx.onMount(() => {
      if (props.value.peek()) return
      const list = items.peek()
      const initial = list.filter((i) => i.hasAttribute("open")).map((i) => valueOf(i, list))
      props.value.set((props.multiple.peek() ? initial : initial.slice(0, 1)).join(","))
    })

    // value → items
    effect(() => {
      const list = items()
      const set = openSet()
      for (const item of list) item.open = set.has(valueOf(item, list))
    })

    const setOpen = (item: ItemHost, open: boolean) => {
      const list = items.peek()
      const value = valueOf(item, list)
      const current = new Set(openSet.peek())
      if (open) {
        if (!props.multiple.peek()) current.clear()
        current.add(value)
      } else {
        if (!props.multiple.peek() && props.alwaysOpen.peek()) return
        current.delete(value)
      }
      const next = [...current].join(",")
      if (next === props.value.peek()) return
      props.value.set(next)
      const open_ = list.filter((i) => current.has(valueOf(i, list))).map((i) => valueOf(i, list))
      ctx.emit("change", { value: next, open: open_ }, { bubbles: false })
    }

    ctx.on<CustomEvent<{ open: boolean }>>(host, "bz-accordion-request", (e) => {
      const item = e.target as ItemHost
      if (item.parentElement?.closest("bz-accordion") !== host) return
      e.preventDefault()
      e.stopPropagation()
      setOpen(item, e.detail.open)
    })

    ctx.on<KeyboardEvent>(host, "keydown", (e) => {
      const trigger = (e.target as Element).closest?.("[data-part=trigger]") as HTMLElement | null
      const item = trigger?.closest("bz-accordion-item")
      if (!trigger || !item || item.parentElement?.closest("bz-accordion") !== host) return
      const triggers = items.peek().map((i) => i.querySelector<HTMLElement>(":scope > [data-part=heading] > [data-part=trigger]")!).filter(Boolean)
      const i = triggers.indexOf(trigger)
      const target =
        e.key === "ArrowDown" ? triggers[(i + 1) % triggers.length]
        : e.key === "ArrowUp" ? triggers[(i - 1 + triggers.length) % triggers.length]
        : e.key === "Home" ? triggers[0]
        : e.key === "End" ? triggers.at(-1)
        : null
      if (!target) return
      e.preventDefault()
      target.focus()
    })
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "bz-accordion": InstanceType<typeof Accordion>
    "bz-accordion-item": InstanceType<typeof AccordionItem>
  }
}
