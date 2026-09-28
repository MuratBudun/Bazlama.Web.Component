const showClock = signal(true)
const now = signal(new Date())

effect(() => {
  if (!showClock()) return log("saat kapalı")
  log("saat başlatıldı")
  const id = setInterval(() => now.set(new Date()), 1000)
  // onCleanup: sahibi (bu effect) yeniden çalışmadan önce veya yok edilince çağrılır.
  onCleanup(() => {
    clearInterval(id)
    log("interval temizlendi")
  })
})

// untrack: okur ama abone olmaz. Bu effect saniyede bir değil, sadece showClock değişince çalışır.
effect(() => {
  const open = showClock()
  log("aç/kapa:", open, "· o anki saat (untrack):", untrack(now).toLocaleTimeString("tr-TR"))
})

render(
  html`<p class="clock">${() => (showClock() ? now().toLocaleTimeString("tr-TR") : "—")}</p>
    <bz-button @click=${() => showClock.update((v) => !v)}>Saati aç/kapa</bz-button>`,
  output
)

// "Çalıştır"a tekrar basınca bu örneğin root'u dispose edilir: interval da temizlenir.
