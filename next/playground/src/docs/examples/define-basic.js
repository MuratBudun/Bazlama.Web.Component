// tag("x-counter") her çalıştırmada benzersiz bir ad üretir (bir etiket sadece bir kez tanımlanabilir).
const Counter = define(tag("x-counter"), {
  props: {
    label: prop.string("Sayaç"),
    step: prop.number(1),
  },
  // setup bağlanınca bir kez çalışır. props: her prop bir signal. ctx: host, emit, slot, on…
  setup(props, ctx) {
    const count = signal(0) // bileşenin iç durumu
    const inc = () => {
      count.update((n) => n + props.step())
      ctx.emit("count-change", { count: count() })
    }
    return html`<bz-button @click=${inc}>${props.label}: ${count}</bz-button>`
  },
})

// Oluşturmanın üç yolu da aynı şekilde çalışır:
const a = new Counter()
const b = document.createElement(a.localName)
b.label = "Beşer beşer" // property
b.setAttribute("step", "5") // attribute → number'a çevrilir
output.append(a, " ", b)

output.addEventListener("count-change", (e) => log(e.target === a ? "a" : "b", "→", e.detail))
log("etiket adı:", a.localName, "· b.step tipi:", typeof b.step)
