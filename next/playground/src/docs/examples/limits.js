const id = "profil"

// 1) Bağlama, attribute değerinin TAMAMI olmalı. Kısmi değer hata verir:
try {
  render(html`<a href="#${id}">bağlantı</a>`, output)
} catch (e) {
  log("Hata:", e.message)
}
// Doğrusu: değeri JavaScript'te birleştirmek.
render(html`<p><a href=${`#${id}`}>doğru bağlantı</a></p>`, output)

// 2) Fonksiyon değerler reaktif kabul edilir (içleri çağrılır).
//    Bir property'ye fonksiyonun kendisini vermek için sarmalayın: .prop=${() => fn}
const greet = (n) => `Merhaba ${n}`
render(
  html`<p .formatter=${() => greet} ref=${(el) => queueMicrotask(() => log("formatter('Ada') →", el.formatter("Ada")))}>
    formatter property'si bir fonksiyon
  </p>`,
  output
)

// 3) <textarea>, <style>, <title> içinde ${} desteklenmez (içerikleri metin olarak ayrıştırılır).
//    Onun yerine .value=${...} kullanın:
render(html`<textarea .value=${"textarea içeriği .value ile"}></textarea>`, output)
