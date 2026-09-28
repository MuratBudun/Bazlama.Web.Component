// signal(başlangıç) okunabilir ve yazılabilir bir değer kutusu oluşturur.
const count = signal(0)

// Okumak: fonksiyon gibi çağır. Yazmak: set() veya update().
log("başlangıç:", count())
count.set(5)
count.update((n) => n + 1)
log("şimdi:", count())

// effect: içinde okuduğu signal değişince yeniden çalışır.
effect(() => log("effect gördü →", count()))

// Şablona signal'i doğrudan ver: değişince sadece o metin düğümü güncellenir.
render(
  html`<p>Değer: <strong>${count}</strong> · peek(): ${() => count.peek()} (abone olmaz, güncellenmez)</p>
    <bz-button @click=${() => count.update((n) => n + 1)}>+1</bz-button>
    <bz-button @click=${() => count.set(0)}>Sıfırla</bz-button>`,
  output
)
