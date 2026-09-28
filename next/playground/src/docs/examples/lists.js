let nextId = 4
const items = signal([
  { id: 1, text: "Bir" },
  { id: 2, text: "İki" },
  { id: 3, text: "Üç" },
])

// Her satır OLUŞTURULDUĞUNDA rastgele bir renk alır.
// Renk değişmiyorsa aynı DOM düğümü yeniden kullanılmıştır.
const color = () => `hsl(${Math.floor(Math.random() * 360)} 70% 80%)`
const row = (item) => html`<li style=${`background:${color()}`}>${item.text}</li>`

render(
  html`
    <div class="row">
      <bz-button size="sm" @click=${() => items.update((l) => [...l, { id: nextId, text: `Yeni ${nextId++}` }])}>Ekle</bz-button>
      <bz-button size="sm" @click=${() => items.update((l) => [...l].reverse())}>Ters çevir</bz-button>
      <bz-button size="sm" @click=${() => items.update((l) => l.slice(1))}>İlkini sil</bz-button>
      <bz-button size="sm" @click=${() => items.update((l) => l.map((x, i) => (i === 0 ? { ...x, text: x.text + "!" } : x)))}>İlkini güncelle</bz-button>
    </div>
    <div class="grid-2">
      <div>
        <strong>repeat() — anahtarlı</strong>
        <ul class="color-list">${repeat(items, (i) => i.id, row)}</ul>
      </div>
      <div>
        <strong>map() — anahtarsız</strong>
        <ul class="color-list">${() => items().map(row)}</ul>
      </div>
    </div>
  `,
  output
)
log("Ters çevirin: solda renkler satırlarla birlikte taşınır, sağda hepsi yeniden oluşturulur.")
log("İlkini güncelle: solda sadece ilk satır (yeni nesne) yeniden çizilir.")
