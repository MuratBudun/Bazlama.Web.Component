const Probe = define(tag("x-probe"), {
  props: { name: prop.string("probe") },
  setup(props, ctx) {
    log("▶ setup çalıştı, name =", props.name())
    const started = Date.now()
    onCleanup(() => log("■ dispose: effect'ler ve dinleyiciler temizlendi,", Date.now() - started, "ms yaşadı"))
    ctx.onMount(() => log("  onMount: şablon DOM'da"))
    return html`<span class="badge">${props.name}</span>`
  },
})

const el = new Probe()
log("constructor çalıştı; henüz setup yok (DOM'da değil)")
const boxA = Object.assign(document.createElement("div"), { textContent: "Kutu A: " })
const boxB = Object.assign(document.createElement("div"), { textContent: "Kutu B: " })
output.append(boxA, boxB)

render(
  html`<div class="row">
    <bz-button size="sm" @click=${() => boxA.append(el)}>A'ya ekle</bz-button>
    <bz-button size="sm" @click=${() => boxB.append(el)}>B'ye taşı</bz-button>
    <bz-button size="sm" @click=${() => el.remove()}>Kaldır</bz-button>
    <bz-button size="sm" @click=${() => (el.name = `ad ${Math.floor(Math.random() * 100)}`)}>el.name değiştir</bz-button>
  </div>`,
  output
)
log("Deneyin: A'ya ekle → B'ye taşı (setup tekrar çalışmaz) → Kaldır (dispose) → tekrar ekle (setup yeniden, name korunur)")
