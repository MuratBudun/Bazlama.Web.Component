const Card = define(tag("x-card"), {
  props: { heading: prop.string() },
  setup(props, ctx) {
    ctx.onMount(() =>
      log("slotlar →", ["", "actions", "footer"].map((n) => `${n || "default"}: ${ctx.slot(n).length} düğüm`).join(" · "))
    )
    // ctx.on: bileşen dispose edilince otomatik kaldırılan dinleyici
    ctx.on(ctx.host, "click", (e) => log("kartta tıklama:", e.target.localName))
    return html`<div class="demo-card">
      <header>
        <strong>${props.heading}</strong>
        <span>${ctx.slot("actions")}</span>
      </header>
      <div>${ctx.slot()}</div>
      ${ctx.hasSlot("footer") ? html`<footer>${ctx.slot("footer")}</footer>` : null}
    </div>`
  },
})

// Çocuklar ilk bağlanmada yakalanır ve slot adlarına göre şablona taşınır.
const card = new Card()
card.heading = "Light DOM slot'ları"
card.innerHTML = `
  <bz-button slot="actions" size="sm" variant="ghost">Düzenle</bz-button>
  <p>Varsayılan slot içeriği. Etiket içinde <em>slot</em> attribute'u olmayan her şey buraya gelir.</p>
  <small slot="footer">Alt bilgi (footer slot'u)</small>`
output.append(card)

// Footer'sız ikinci kart: hasSlot("footer") false → footer hiç render edilmez.
const plain = new Card()
plain.heading = "Footer'sız kart"
plain.innerHTML = `<p>Sadece içerik.</p>`
output.append(plain)
