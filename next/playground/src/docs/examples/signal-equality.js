// set(), eski ve yeni değer Object.is ile aynıysa hiçbir şey yapmaz.
// Dizi/nesneyi yerinde değiştirmek (push, obj.x = …) referansı değiştirmez → güncelleme olmaz.
const todos = signal(["süt al"])
effect(() => log("liste çizildi:", todos().length, "öğe"))

render(
  html`<bz-button @click=${() => {
      todos().push("ekmek al") // yerinde değişiklik
      todos.set(todos()) // aynı referans → yok sayılır
      log("push sonrası dizi uzunluğu:", todos.peek().length, "ama ekran güncellenmedi")
    }}>Yanlış: push + set</bz-button>
    <bz-button variant="primary" @click=${() => todos.update((list) => [...list, "ekmek al"])}>Doğru: yeni dizi</bz-button>
    <ul>
      ${() => todos().map((t) => html`<li>${t}</li>`)}
    </ul>`,
  output
)

// Özel eşitlik: ikinci parametre. Örn. sadece id'si değişince tetiklensin:
const user = signal({ id: 1, name: "Ada" }, (a, b) => a.id === b.id)
effect(() => log("user effect:", user().name))
user.set({ id: 1, name: "Ada (id aynı)" }) // tetiklemez
user.set({ id: 2, name: "Ece" }) // tetikler
