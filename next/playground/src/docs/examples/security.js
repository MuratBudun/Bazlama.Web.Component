const input = signal(`<img src=x onerror="document.body.style.background='red'"> <b>kalın mı?</b>`)

render(
  html`<input style="width:100%" .value=${input} @input=${(e) => input.set(e.target.value)} />
    <p>Metin olarak eklenir: ${input}</p>
    <p title=${input}>Attribute olarak da güvenli (üzerine gelin).</p>`,
  output
)

log("Çıktıdaki <img> sayısı:", output.querySelectorAll("img").length)
log("Değerler textContent / setAttribute ile yazılır; HTML olarak ayrıştırılmaz.")
