const first = signal("Ada")
const last = signal("Yılmaz")
let runs = 0

// İlk çalıştırma senkrondur.
effect(() => {
  runs++
  log(`effect #${runs}:`, first(), last())
})

// İki signal art arda değişir, effect ise bir kez (bir microtask sonra) çalışır.
first.set("Ece")
last.set("Kaya")
log("set'lerden hemen sonra runs =", runs, "(henüz çalışmadı)")
queueMicrotask(() => log("microtask sonrası runs =", runs))

// flush() bekleyen effect'leri hemen çalıştırır (ölçüm ve testlerde işe yarar).
render(
  html`<bz-button @click=${() => {
    first.set("Can")
    flush()
    log("set + flush() sonrası runs =", runs)
  }}>set + flush()</bz-button>`,
  output
)
