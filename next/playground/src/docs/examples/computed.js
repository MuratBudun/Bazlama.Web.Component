const price = signal(100)
const qty = signal(2)

// computed tembeldir: okunana kadar hesaplanmaz; sonuç bağımlılıklar değişene kadar saklanır.
const total = computed(() => {
  log("  → total hesaplandı")
  return price() * qty()
})

log("computed oluşturuldu (henüz hesaplanmadı)")
log("total:", total())
log("tekrar okundu:", total(), "(önbellekten, yeniden hesap yok)")
qty.set(3)
log("qty değişti; okununca senkron olarak doğru değer:", total())

render(
  html`<p>${price} ₺ × ${qty} adet = <strong>${total} ₺</strong></p>
    <bz-button @click=${() => qty.update((n) => n + 1)}>Adet +1</bz-button>
    <bz-button @click=${() => price.update((n) => n + 10)}>Fiyat +10</bz-button>`,
  output
)
