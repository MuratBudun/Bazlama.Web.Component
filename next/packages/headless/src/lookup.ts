import { computed, define, effect, html, prop, signal, uid } from "@bazlama/core"
import { dialogs } from "./dialog"
import { hasIcon, icon } from "./icon"
import { fold } from "./shared"
import type { Column, Row } from "./table"
import "./table"
import type { TreeItem } from "./tree"
import "./tree"

/** What a picker resolves with; `undefined` = dismissed (no change). */
export interface LookupPick {
  value: string
  text: string
  item?: unknown
}

export interface LookupLabels {
  select: string
  clear: string
  search: string
  ok: string
  cancel: string
  empty: string
  required: string
}

export const LOOKUP_LABELS: LookupLabels = {
  select: "Select",
  clear: "Clear",
  search: "Search",
  ok: "Select",
  cancel: "Cancel",
  empty: "No results",
  required: "Please select a value.",
}

function findItem(items: TreeItem[], id: string): TreeItem | undefined {
  for (const item of items) {
    if (item.id === id) return item
    const found = item.children && findItem(item.children, id)
    if (found) return found
  }
  return undefined
}

/**
 * <bz-lookup label value text> — a read-only field whose value is chosen in a dialog
 * (ExtJS "trigger field"). The value (a key) is submitted with the form; the field shows `text`.
 *
 * Pickers, first match wins:
 * - `pick`: your function (host) => Promise<LookupPick | undefined>.
 * - `items` (TreeItem[]): a tree with a filter box; `selection="leaf"` allows only leaves.
 * - `rows` + `columns`: a table with a search box (`row-key`, `display-key`).
 *
 * The trigger button, Enter, F4 or Alt+↓ open the picker; with `clearable`, Delete/Backspace
 * and the × button clear. `change` { value, text, item } (bubbles, like a form field).
 * `text` is looked up in `items`/`rows` when not given.
 *
 * Form-associated: `name`, `required`, reset. Anatomy: [data-part=label|control|input|clear|
 * trigger|hint|error]; picker: [data-part=picker|search|tree|table]. Styling hooks: [disabled],
 * [readonly], [data-invalid], [data-empty].
 */
export const Lookup = define("bz-lookup", {
  form: true,
  props: {
    value: prop.string(),
    text: prop.string(),
    label: prop.string(),
    placeholder: prop.string(),
    hint: prop.string(),
    required: prop.boolean(),
    disabled: prop.boolean(false, { reflect: true }),
    readonly: prop.boolean(false, { reflect: true }),
    clearable: prop.boolean(),
    /** Dialog heading (default: the label). */
    heading: prop.string(),
    dialogSize: prop.string("md"),
    items: prop.object<TreeItem[]>([]),
    selection: prop.string<"single" | "leaf">("single"),
    columns: prop.object<Column[]>([]),
    rows: prop.object<Row[]>([]),
    rowKey: prop.string("id"),
    displayKey: prop.string(),
    pick: prop.object<((host: HTMLElement) => Promise<LookupPick | undefined | null>) | null>(null),
    labels: prop.object<Partial<LookupLabels>>({}),
  },
  setup(props, ctx) {
    const { host, internals } = ctx
    const id = uid("bz-lookup")
    let input!: HTMLInputElement
    const touched = signal(false)
    const formDisabled = signal(false)
    const text = computed(() => ({ ...LOOKUP_LABELS, ...props.labels() }))
    const blocked = computed(() => props.disabled() || formDisabled())
    const locked = computed(() => blocked() || props.readonly())
    const displayKey = () => props.displayKey() || props.columns()[0]?.key || props.rowKey()

    const shown = computed(() => {
      const value = props.value()
      if (props.text()) return props.text()
      if (!value) return ""
      const item = findItem(props.items(), value)
      if (item) return item.label
      const row = props.rows().find((r) => String(r[props.rowKey()]) === value)
      return row ? String(row[displayKey()] ?? value) : value
    })
    const missing = computed(() => props.required() && !props.value())
    const showError = computed(() => touched() && missing())

    effect(() => {
      host.toggleAttribute("data-invalid", showError())
      host.toggleAttribute("data-empty", !props.value())
    })
    ctx.onMount(() =>
      effect(() => {
        internals?.setFormValue(props.value() || null)
        if (missing()) internals?.setValidity({ valueMissing: true }, text().required, input)
        else internals?.setValidity({})
      })
    )
    ctx.onFormReset(() => {
      props.value.set(host.getAttribute("value") ?? "")
      props.text.set(host.getAttribute("text") ?? "")
      touched.set(false)
    })
    ctx.onFormDisabled((d) => formDisabled.set(d))
    ctx.on(host, "invalid", () => touched.set(true))

    const commit = (pick: LookupPick | null) => {
      const value = pick?.value ?? ""
      const shownText = pick?.text ?? ""
      touched.set(true)
      if (value === props.value.peek() && shownText === (props.text.peek() || shown.peek())) return
      props.value.set(value)
      props.text.set(shownText)
      ctx.emit("change", { value, text: shownText, item: pick?.item })
    }

    const treePicker = (heading: string) => {
      let chosen: TreeItem | null = null
      const filter = signal("")
      return dialogs.open<LookupPick>({
        heading,
        size: props.dialogSize.peek(),
        attrs: { "data-lookup-picker": "tree" },
        content: (ref) => html`<div data-part="picker">
          <input data-part="search" type="search" placeholder=${text.peek().search} aria-label=${text.peek().search}
            autofocus @input=${(e: Event) => filter.set((e.target as HTMLInputElement).value)}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === "ArrowDown") {
                e.preventDefault()
                // The tree's tab stop (roving tabindex), else its first visible item.
                const items = [...ref.element.querySelectorAll<HTMLElement>("bz-tree [role=treeitem]")].filter((i) => !i.hidden)
                ;(items.find((i) => i.tabIndex === 0) ?? items[0])?.focus()
              }
            }} />
          <bz-tree
            data-part="tree"
            label=${heading}
            selection=${props.selection.peek()}
            .items=${props.items.peek()}
            .value=${props.value.peek()}
            .filter=${filter}
            .expanded=${props.items.peek().map((i) => i.id)}
            empty-text=${text.peek().empty}
            @select=${(e: CustomEvent<{ item: TreeItem }>) => (chosen = e.detail.item)}
            @activate=${(e: CustomEvent<{ item: TreeItem }>) =>
              void ref.close({ value: e.detail.item.id, text: e.detail.item.label, item: e.detail.item })}
          ></bz-tree>
        </div>`,
        footer: (ref) => html`<bz-button @click=${() => void ref.close()}>${text.peek().cancel}</bz-button>
          <bz-button variant="primary" @click=${() =>
            void ref.close(chosen ? { value: chosen.id, text: chosen.label, item: chosen } : undefined)}>${text.peek().ok}</bz-button>`,
      }).result
    }

    const tablePicker = (heading: string) => {
      const query = signal("")
      const key = props.rowKey.peek()
      const selection = signal<unknown[]>(props.value.peek() ? [props.value.peek()] : [])
      const all = props.rows.peek()
      const rows = computed(() => {
        const q = fold(query().trim())
        return q ? all.filter((r) => Object.values(r).some((v) => fold(String(v ?? "")).includes(q))) : all
      })
      const toPick = (row: Row): LookupPick => ({ value: String(row[key]), text: String(row[displayKey()] ?? row[key]), item: row })
      const selectedRow = () => all.find((r) => selection().includes(r[key]))
      return dialogs.open<LookupPick>({
        heading,
        size: props.dialogSize.peek(),
        attrs: { "data-lookup-picker": "table" },
        content: (ref) => html`<div data-part="picker">
          <input data-part="search" type="search" placeholder=${text.peek().search} aria-label=${text.peek().search}
            autofocus @input=${(e: Event) => query.set((e.target as HTMLInputElement).value)}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === "ArrowDown") {
                e.preventDefault()
                ;(ref.element.querySelector("[data-part=table] tbody tr[tabindex='0']") as HTMLElement | null)?.focus()
              } else if (e.key === "Enter" && rows().length === 1) {
                e.preventDefault()
                void ref.close(toPick(rows()[0]))
              }
            }} />
          <bz-table
            data-part="table"
            label=${heading}
            activatable
            .columns=${props.columns.peek()}
            .rows=${rows}
            row-key=${key}
            .selection=${selection}
            @row-click=${(e: CustomEvent<{ row: Row }>) => selection.set([e.detail.row[key]])}
            @row-activate=${(e: CustomEvent<{ row: Row }>) => void ref.close(toPick(e.detail.row))}
          ><span slot="empty">${text.peek().empty}</span></bz-table>
        </div>`,
        footer: (ref) => html`<bz-button @click=${() => void ref.close()}>${text.peek().cancel}</bz-button>
          <bz-button variant="primary" ?disabled=${() => !selectedRow()} @click=${() => {
            const row = selectedRow()
            void ref.close(row ? toPick(row) : undefined)
          }}>${text.peek().ok}</bz-button>`,
      }).result
    }

    const open = async () => {
      if (locked.peek()) return
      // The dialog returns focus to what had it: make that the field, not the trigger.
      input.focus()
      const heading = props.heading.peek() || props.label.peek() || text.peek().select
      const custom = props.pick.peek()
      const result = custom
        ? await custom(host)
        : props.items.peek().length
          ? await treePicker(heading)
          : props.columns.peek().length
            ? await tablePicker(heading)
            : undefined
      input.focus()
      if (result) commit(result)
    }
    const clear = () => {
      if (locked.peek() || !props.value.peek()) return
      commit(null)
      input.focus()
    }

    /** Buttons do not take focus from the field (like a combobox trigger). */
    const keepFocus = (e: MouseEvent) => e.preventDefault()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "F4" || (e.key === "ArrowDown" && e.altKey)) {
        e.preventDefault()
        void open()
      } else if ((e.key === "Delete" || e.key === "Backspace") && props.clearable.peek()) {
        e.preventDefault()
        clear()
      }
    }

    return html`
      <label data-part="label" for=${id} ?hidden=${() => !props.label()}>${props.label}</label>
      <div data-part="control">
        ${ctx.slot("prefix")}
        <input
          data-part="input"
          id=${id}
          type="text"
          readonly
          placeholder=${() => props.placeholder() || null}
          ?disabled=${blocked}
          aria-required=${() => (props.required() ? "true" : null)}
          aria-invalid=${() => (showError() ? "true" : null)}
          aria-haspopup="dialog"
          aria-keyshortcuts="Enter F4 Alt+ArrowDown"
          aria-describedby=${() =>
            [props.hint() && `${id}-hint`, showError() && `${id}-error`].filter(Boolean).join(" ") || null}
          .value=${shown}
          @keydown=${onKey}
          @dblclick=${() => void open()}
          @blur=${() => touched.set(true)}
          ref=${(el: HTMLInputElement) => (input = el)}
        />
        <button type="button" data-part="clear" tabindex="-1" @mousedown=${keepFocus} aria-label=${() => text().clear}
          ?hidden=${() => !props.clearable() || !props.value() || locked()} @click=${clear}
        >${hasIcon("x") ? icon("x") : "×"}</button>
        <button type="button" data-part="trigger" tabindex="-1" aria-haspopup="dialog" @mousedown=${keepFocus}
          aria-label=${() => `${text().select}: ${props.label() || ""}`.trim()}
          title=${() => text().select}
          ?disabled=${locked}
          @click=${() => void open()}
        >${hasIcon("search") ? icon("search") : "…"}</button>
      </div>
      <div data-part="hint" id=${`${id}-hint`} ?hidden=${() => !props.hint()}>${props.hint}</div>
      <div data-part="error" id=${`${id}-error`} ?hidden=${() => !showError()}>${() => text().required}</div>
    `
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "bz-lookup": InstanceType<typeof Lookup>
  }
}
