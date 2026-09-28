const count = signal(0)

render(
  html`<p>Sayaç: <strong>${count}</strong> · İki katı: ${() => count() * 2}</p>
    <input placeholder="Sayaç artarken buraya yazın" />
    <bz-button @click=${() => count.update((n) => n + 1)}>+1</bz-button>`,
  output
)

// Saniyede bir artış. Input yeniden oluşturulmadığı için odak ve yazdığınız metin korunur.
const id = setInterval(() => count.update((n) => n + 1), 1000)
onCleanup(() => clearInterval(id))

// Her artışta DOM'da tam olarak neyin değiştiğini izleyelim:
const observer = new MutationObserver((records) =>
  records.forEach((r) =>
    log(r.type, "→", r.target.nodeName, r.type === "characterData" ? JSON.stringify(r.target.data) : "")
  )
)
observer.observe(output, { subtree: true, childList: true, characterData: true, attributes: true })
onCleanup(() => observer.disconnect())
// Beklenen: her saniye yalnızca 2 "characterData" kaydı (iki metin düğümü). Başka hiçbir şey.
