import { computed, define, effect, html, prop, repeat, signal, uid } from "@bazlama/core"
import { icon } from "./icon"
import { fold } from "./shared"

export interface TreeItem {
  id: string
  label: string
  /** Icon name (see defineIcons). */
  icon?: string
  /** Renders the row as a link. */
  href?: string
  badge?: string | number
  disabled?: boolean
  children?: TreeItem[]
  /** Children are loaded with `loadChildren` on first expand. */
  lazy?: boolean
}

type Selection = "single" | "leaf" | "none"
type CheckState = "true" | "false" | "mixed"

interface Row {
  item: TreeItem
  level: number
  posinset: number
  setsize: number
  parent: TreeItem | null
  expandable: boolean
  expanded: boolean
}

/** All ids in a tree (e.g. `tree.expanded = collectIds(items)` to expand everything). */
export function collectIds(items: readonly TreeItem[], onlyParents = true): string[] {
  const out: string[] = []
  const walk = (list: readonly TreeItem[]) => {
    for (const item of list) {
      if (!onlyParents || item.children?.length || item.lazy) out.push(item.id)
      if (item.children) walk(item.children)
    }
  }
  walk(items)
  return out
}

/**
 * <bz-tree> — hierarchical list for navigation menus, explorers and permission trees.
 *
 * Data: `.items` (TreeItem[]). Rows are rendered flat (role=treeitem + aria-level/setsize/
 * posinset), keyed by id: expanding inserts only the new rows.
 *
 * - `value`: selected id. `selection`: "single" (any item), "leaf" (menus: parents only
 *   toggle), "none". Fires `select` and, on click/Enter, `activate` (for navigation).
 * - `expanded`: ids of open items (property). Fires `toggle`.
 * - `checkable`: tri-state checkboxes; `checked` holds the checked leaf ids. Fires `check`.
 * - `filter`: shows matching items with their ancestors (accent/case-insensitive).
 * - `loadChildren(item) => Promise<TreeItem[]>`: for items with `lazy: true`.
 *
 * Keyboard (WAI-ARIA tree): ↑/↓, →/← expand-enter / collapse-parent, Home/End, Enter,
 * Space (check or select), * (expand siblings), typeahead.
 *
 * Anatomy: [data-part=tree|item|toggle|checkbox|icon|label|badge|empty].
 * Styling hooks on items: [aria-expanded], [aria-selected], [aria-checked], [aria-busy],
 * [aria-disabled], [data-match], --bz-tree-level.
 */
export const Tree = define("bz-tree", {
  props: {
    items: prop.object<TreeItem[]>([]),
    value: prop.string(),
    selection: prop.string<Selection>("single"),
    expanded: prop.object<string[]>([]),
    checkable: prop.boolean(),
    checked: prop.object<string[]>([]),
    filter: prop.string(),
    label: prop.string(),
    emptyText: prop.string("No items"),
    loadChildren: prop.object<((item: TreeItem) => Promise<TreeItem[]>) | null>(null),
  },
  setup(props, ctx) {
    const base = uid("bz-tree")
    const domId = (id: string) => `${base}-${id.replace(/[^\w-]/g, "_")}`

    // ---------------------------------------------------------------- data
    const loaded = signal(new Map<string, TreeItem[]>())
    const loading = signal(new Set<string>())
    const childrenOf = (item: TreeItem): TreeItem[] | undefined => item.children ?? loaded().get(item.id)
    const isExpandable = (item: TreeItem) => {
      const kids = childrenOf(item)
      return kids ? kids.length > 0 : !!item.lazy
    }

    /** id → { item, parent } for every known item (collapsed ones included). */
    const index = computed(() => {
      const map = new Map<string, { item: TreeItem; parent: TreeItem | null }>()
      const walk = (list: TreeItem[], parent: TreeItem | null) => {
        for (const item of list) {
          map.set(item.id, { item, parent })
          const kids = childrenOf(item)
          if (kids) walk(kids, item)
        }
      }
      walk(props.items(), null)
      return map
    })
    const expandedSet = computed(() => new Set(props.expanded()))
    const checkedSet = computed(() => new Set(props.checked()))

    const filterState = computed(() => {
      const q = fold(props.filter().trim())
      if (!q) return null
      const visible = new Set<string>()
      const open = new Set<string>()
      const matches = new Set<string>()
      const visit = (item: TreeItem): boolean => {
        let descendant = false
        for (const kid of childrenOf(item) ?? []) if (visit(kid)) descendant = true
        const self = fold(item.label).includes(q)
        if (self) matches.add(item.id)
        if (self || descendant) visible.add(item.id)
        if (descendant) open.add(item.id)
        return self || descendant
      }
      props.items().forEach(visit)
      return { visible, open, matches }
    })

    const rows = computed(() => {
      const expanded = expandedSet()
      const f = filterState()
      const out: Row[] = []
      const walk = (list: TreeItem[], level: number, parent: TreeItem | null) => {
        const shown = f ? list.filter((item) => f.visible.has(item.id)) : list
        shown.forEach((item, i) => {
          const expandable = isExpandable(item)
          const open = expandable && (expanded.has(item.id) || !!f?.open.has(item.id))
          out.push({ item, level, posinset: i + 1, setsize: shown.length, parent, expandable, expanded: open })
          const kids = childrenOf(item)
          if (open && kids) walk(kids, level + 1, item)
        })
      }
      walk(props.items(), 1, null)
      return out
    })
    const visibleItems = computed(() => rows().map((r) => r.item))
    const rowById = computed(() => new Map(rows().map((r) => [r.item.id, r])))

    const checkStates = computed(() => {
      const states = new Map<string, CheckState>()
      if (!props.checkable()) return states
      const set = checkedSet()
      const visit = (item: TreeItem): CheckState => {
        const kids = childrenOf(item)
        let state: CheckState
        if (!kids?.length) state = set.has(item.id) ? "true" : "false"
        else {
          const kidStates = kids.map(visit)
          state = kidStates.every((s) => s === "true") ? "true" : kidStates.every((s) => s === "false") ? "false" : "mixed"
        }
        states.set(item.id, state)
        return state
      }
      props.items().forEach(visit)
      return states
    })

    // ---------------------------------------------------------------- actions
    const active = signal<string | null>(null)
    const canSelect = (item: TreeItem) =>
      !item.disabled && props.selection.peek() !== "none" && (props.selection.peek() !== "leaf" || !isExpandable(item))

    const load = async (item: TreeItem) => {
      const fn = props.loadChildren.peek()
      if (!fn || !item.lazy || item.children || loaded.peek().has(item.id) || loading.peek().has(item.id)) return
      loading.set(new Set(loading.peek()).add(item.id))
      try {
        const kids = await fn(item)
        loaded.set(new Map(loaded.peek()).set(item.id, kids))
        // A checked lazy leaf becomes a checked parent: carry the state to its children.
        const checked = checkedSet.peek()
        if (checked.has(item.id)) {
          const next = new Set(checked)
          next.delete(item.id)
          kids.forEach((kid) => next.add(kid.id))
          props.checked.set([...next])
        }
      } catch (error) {
        console.error(`<bz-tree> loadChildren failed for "${item.id}"`, error)
      } finally {
        const next = new Set(loading.peek())
        next.delete(item.id)
        loading.set(next)
      }
    }

    const setExpanded = (item: TreeItem, open: boolean) => {
      if (!isExpandable(item) || item.disabled) return
      const set = new Set(expandedSet.peek())
      if (set.has(item.id) === open) return
      if (open) set.add(item.id)
      else set.delete(item.id)
      props.expanded.set([...set])
      ctx.emit("toggle", { id: item.id, expanded: open, item }, { bubbles: false })
      if (open) void load(item)
    }
    const toggle = (item: TreeItem) => setExpanded(item, !rowById.peek().get(item.id)?.expanded)

    const select = (item: TreeItem) => {
      if (!canSelect(item) || props.value.peek() === item.id) return
      props.value.set(item.id)
      ctx.emit("select", { id: item.id, item })
    }
    const activate = (item: TreeItem) => {
      if (item.disabled) return
      select(item)
      ctx.emit("activate", { id: item.id, item })
    }

    const leavesOf = (item: TreeItem): string[] => {
      const kids = childrenOf(item)
      return kids?.length ? kids.flatMap(leavesOf) : [item.id]
    }
    const toggleCheck = (item: TreeItem) => {
      if (item.disabled || !props.checkable.peek()) return
      const turnOn = checkStates.peek().get(item.id) !== "true"
      const next = new Set(checkedSet.peek())
      for (const id of leavesOf(item)) {
        if (turnOn) next.add(id)
        else next.delete(id)
      }
      props.checked.set([...next])
      ctx.emit("check", { checked: [...next], id: item.id })
    }

    const focusItem = (id: string | null) => {
      if (!id) return
      active.set(id)
      queueMicrotask(() => document.getElementById(domId(id))?.focus())
    }

    // Initially expanded lazy items (expanded prop set from outside) load their children.
    effect(() => {
      for (const id of expandedSet()) {
        const entry = index().get(id)
        if (entry) void load(entry.item)
      }
    })
    // A value set from outside (e.g. the current page) moves the tab stop while the tree
    // does not have focus.
    effect(() => {
      const value = props.value()
      if (!rowById().has(value)) return
      if (document.activeElement?.closest?.("bz-tree") !== ctx.host) active.set(value)
    })
    // Keep the roving tab stop on a visible row.
    effect(() => {
      const map = rowById()
      const current = active()
      if (current && map.has(current)) return
      const selected = props.value.peek()
      active.set(map.has(selected) ? selected : (visibleItems()[0]?.id ?? null))
    })

    // ---------------------------------------------------------------- keyboard
    let buffer = ""
    let timer: ReturnType<typeof setTimeout> | undefined
    const onKeydown = (e: KeyboardEvent) => {
      const list = rows()
      const i = list.findIndex((r) => r.item.id === active.peek())
      const row = list[i]
      if (!row) return
      const item = row.item
      const go = (index: number) => {
        const target = list[Math.max(0, Math.min(list.length - 1, index))]
        if (target) focusItem(target.item.id)
      }
      switch (e.key) {
        case "ArrowDown":
          go(i + 1)
          break
        case "ArrowUp":
          go(i - 1)
          break
        case "Home":
          go(0)
          break
        case "End":
          go(list.length - 1)
          break
        case "ArrowRight":
          if (row.expandable && !row.expanded) setExpanded(item, true)
          else if (row.expanded) go(i + 1)
          break
        case "ArrowLeft":
          if (row.expanded) setExpanded(item, false)
          else if (row.parent) focusItem(row.parent.id)
          break
        case "Enter":
          // Links activate natively (click); other rows here.
          if (item.href) return
          if (!canSelect(item) && row.expandable) toggle(item)
          else activate(item)
          break
        case " ":
          if (props.checkable.peek()) toggleCheck(item)
          else if (canSelect(item)) select(item)
          else if (row.expandable) toggle(item)
          break
        case "*":
          for (const sibling of list.filter((r) => r.parent === row.parent)) setExpanded(sibling.item, true)
          break
        default: {
          if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return
          clearTimeout(timer)
          timer = setTimeout(() => (buffer = ""), 500)
          buffer += fold(e.key)
          const ordered = [...list.slice(i + (buffer.length === 1 ? 1 : 0)), ...list.slice(0, i + 1)]
          const match = ordered.find((r) => fold(r.item.label).startsWith(buffer))
          if (match) focusItem(match.item.id)
        }
      }
      e.preventDefault()
    }

    // ---------------------------------------------------------------- rows
    const onRowClick = (e: MouseEvent, item: TreeItem) => {
      const part = (e.target as Element).closest("[data-part]")?.getAttribute("data-part")
      active.set(item.id)
      if (item.disabled) {
        e.preventDefault()
        return
      }
      if (part === "toggle") {
        e.preventDefault()
        toggle(item)
        return
      }
      if (part === "checkbox") {
        e.preventDefault()
        toggleCheck(item)
        return
      }
      const row = rowById.peek().get(item.id)
      if (!canSelect(item) && row?.expandable && !item.href) toggle(item)
      else activate(item)
    }

    const renderRow = (checkable: boolean) => (item: TreeItem) => {
      const content = html`<span data-part="toggle" aria-hidden="true"></span>
        ${checkable ? html`<span data-part="checkbox" aria-hidden="true"></span>` : null}
        ${item.icon ? html`<span data-part="icon">${icon(item.icon)}</span>` : null}
        <span data-part="label">${item.label}</span>
        ${item.badge != null && item.badge !== "" ? html`<span data-part="badge">${String(item.badge)}</span>` : null}`

      // One effect per row keeps every ARIA/state attribute in sync.
      const sync = (el: HTMLElement) =>
        effect(() => {
          const row = rowById().get(item.id)
          if (!row) return
          el.style.setProperty("--bz-tree-level", String(row.level - 1))
          el.setAttribute("aria-level", String(row.level))
          el.setAttribute("aria-setsize", String(row.setsize))
          el.setAttribute("aria-posinset", String(row.posinset))
          if (row.expandable) el.setAttribute("aria-expanded", String(row.expanded))
          else el.removeAttribute("aria-expanded")
          const selectable = props.selection() !== "none"
          if (selectable) el.setAttribute("aria-selected", String(props.value() === item.id))
          else el.removeAttribute("aria-selected")
          const check = checkStates().get(item.id)
          if (check) el.setAttribute("aria-checked", check)
          else el.removeAttribute("aria-checked")
          el.toggleAttribute("aria-busy", loading().has(item.id))
          el.toggleAttribute("data-match", !!filterState()?.matches.has(item.id))
          el.tabIndex = active() === item.id ? 0 : -1
          if (props.value() === item.id && item.href) el.setAttribute("aria-current", "page")
          else el.removeAttribute("aria-current")
        })

      return item.href
        ? html`<a
            role="treeitem"
            data-part="item"
            data-id=${item.id}
            id=${domId(item.id)}
            href=${item.href}
            aria-disabled=${item.disabled ? "true" : null}
            @click=${(e: MouseEvent) => onRowClick(e, item)}
            ref=${sync}
          >${content}</a>`
        : html`<div
            role="treeitem"
            data-part="item"
            data-id=${item.id}
            id=${domId(item.id)}
            aria-disabled=${item.disabled ? "true" : null}
            @click=${(e: MouseEvent) => onRowClick(e, item)}
            ref=${sync}
          >${content}</div>`
    }

    return html`
      <div
        role="tree"
        data-part="tree"
        aria-label=${() => props.label() || null}
        aria-multiselectable=${() => (props.checkable() ? "true" : null)}
        @keydown=${onKeydown}
        @focusin=${(e: FocusEvent) => {
          const id = (e.target as Element).closest?.("[data-id]")?.getAttribute("data-id")
          if (id) active.set(id)
        }}
      >
        ${() => repeat(visibleItems, (item) => item.id, renderRow(props.checkable()))}
      </div>
      <div data-part="empty" ?hidden=${() => rows().length > 0}>${props.emptyText}</div>
    `
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "bz-tree": InstanceType<typeof Tree>
  }
}
