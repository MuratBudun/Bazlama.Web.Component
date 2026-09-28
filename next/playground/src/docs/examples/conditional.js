const loggedIn = signal(false)
const user = signal("Ada")

render(
  html`
    ${() =>
      loggedIn()
        ? html`<p>Hoş geldin, <strong>${user}</strong>!
            <bz-button size="sm" @click=${() => loggedIn.set(false)}>Çıkış</bz-button></p>`
        : html`<p>Giriş yapılmadı.
            <bz-button size="sm" variant="primary" @click=${() => loggedIn.set(true)}>Giriş</bz-button></p>`}
    <label>Kullanıcı: <input .value=${user} @input=${(e) => user.set(e.target.value)} /></label>
  `,
  output
)

// Dış fonksiyon sadece loggedIn'e bağlıdır; ad değişince dal yeniden oluşturulmaz,
// sadece içteki ${user} metni güncellenir. Dal değişince eski daldaki effect'ler temizlenir.
effect(() => log("dal:", loggedIn() ? "giriş yapılmış" : "misafir"))
