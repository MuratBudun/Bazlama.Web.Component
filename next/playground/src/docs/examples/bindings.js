const name = signal("Ada")
const disabled = signal(false)
const color = signal("#2f5bea")

render(
  html`
    <div class="stack-sm">
      <!-- .value: property bağlama · @input: olay · ?disabled: boolean attribute -->
      <label>Ad: <input .value=${name} @input=${(e) => name.set(e.target.value)} ?disabled=${disabled} /></label>
      <label><input type="checkbox" @change=${(e) => disabled.set(e.target.checked)} /> input'u devre dışı bırak</label>
      <label>Renk: <input type="color" .value=${color} @input=${(e) => color.set(e.target.value)} /></label>

      <!-- attr=fonksiyon: reaktif attribute; null/false kaldırır, true boş değer yazar -->
      <p style=${() => `color:${color()}`} title=${() => `Merhaba ${name()}`}>Merhaba, ${name}! (üzerine gelin)</p>
      <p data-empty=${() => name() === ""}>Ad boşken bu paragrafta data-empty attribute'u var: ${() => String(name() === "")}</p>

      <!-- ref: elemanın kendisini alır -->
      <button ref=${(el) => log("ref ile alındı:", el.tagName)} @click=${() => log("tıklandı")}>ref + @click</button>
    </div>
  `,
  output
)
