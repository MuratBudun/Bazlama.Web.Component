const Demo = define(tag("x-props"), {
  props: {
    heading: prop.string("Başlık"), // attribute: heading
    size: prop.number(1), // "42.5" → 42.5, geçersiz → varsayılan
    active: prop.boolean(false, { reflect: true }), // attribute varsa true; değer attribute'a geri yazılır
    maxItems: prop.number(10), // camelCase → attribute: max-items
    tags: prop.object(["a", "b"]), // sadece property (attribute yok)
  },
  setup(props) {
    effect(() =>
      log("props →", JSON.stringify({ heading: props.heading(), size: props.size(), active: props.active(), maxItems: props.maxItems(), tags: props.tags() }))
    )
    return html`<p><strong>${props.heading}</strong> · size=${props.size} (${() => typeof props.size()}) · active=${props.active} · tags=${() => props.tags().join(",")}</p>`
  },
})

const el = new Demo()
output.append(el)

// Attribute değişikliklerini izleyelim (reflect'i görmek için):
const observer = new MutationObserver((records) =>
  records.forEach((r) => log("  attribute", r.attributeName, "=", JSON.stringify(el.getAttribute(r.attributeName))))
)
observer.observe(el, { attributes: true })
onCleanup(() => observer.disconnect())

render(
  html`<div class="row">
    <bz-button size="sm" @click=${() => el.setAttribute("size", "42.5")}>size="42.5"</bz-button>
    <bz-button size="sm" @click=${() => el.setAttribute("size", "abc")}>size="abc"</bz-button>
    <bz-button size="sm" @click=${() => el.setAttribute("max-items", "3")}>max-items="3"</bz-button>
    <bz-button size="sm" @click=${() => el.toggleAttribute("active")}>toggleAttribute("active")</bz-button>
    <bz-button size="sm" @click=${() => (el.active = !el.active)}>el.active = !el.active</bz-button>
    <bz-button size="sm" @click=${() => (el.tags = [...el.tags, "c"])}>el.tags = [...]</bz-button>
    <bz-button size="sm" @click=${() => el.tags.push("x")}>el.tags.push (güncellemez)</bz-button>
  </div>`,
  output
)
