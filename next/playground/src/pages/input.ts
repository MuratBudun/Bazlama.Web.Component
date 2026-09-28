import { html, signal } from "@bazlama/core"
import { log } from "../log"
import { usage } from "../docs/usage"
import { submitToLog } from "./shared"

export default {
  id: "input",
  title: "Input",
  description:
    "Light DOM'da gerçek bir <input> üretir; form gönderimi, doğrulama, otomatik doldurma ve reset tarayıcının kendi mekanizmasıyla çalışır. Hata mesajı alana dokunulduktan (blur) veya gönderim denemesinden sonra görünür.",
  render() {
    const name = signal("Ada")
    const taken = signal(false)

    return html`
      ${usage({
        tag: "bz-input",
        html: `
<form>
  <bz-input name="email" label="E-posta" type="email" required
            placeholder="ad@ornek.com" hint="İş adresiniz"></bz-input>
  <bz-input name="amount" label="Tutar" type="number">
    <span slot="prefix">₺</span>
  </bz-input>
</form>`,
        js: `
const email = document.createElement("bz-input")
email.label = "E-posta"
email.name = "email"
email.type = "email"
email.required = true
email.addEventListener("input", () => log("value =", email.value))

const check = document.createElement("bz-button")
check.textContent = "Sunucu hatası ver"
check.addEventListener("click", () => {
  email.error = email.error ? "" : "Bu adres kayıtlı."   // boş olmayan error alanı geçersiz yapar
})

output.append(email, check)`,
        template: `
const name = signal("")

html\`
  <bz-input
    label="Ad"
    required
    .value=\${name}
    @input=\${(e) => name.set(e.currentTarget.value)}
    .error=\${() => (taken() ? "Bu ad alınmış." : "")}
  ></bz-input>
  <p>Merhaba \${name}</p>
\``,
        props: [
          { name: "value", type: "string", default: '""', desc: "Alanın değeri; yazdıkça güncellenir." },
          { name: "name", type: "string", desc: "İç <input>'a verilir; form gönderiminde bu adla gider." },
          { name: "type", type: "string", default: '"text"', desc: "Native input tipi: text, email, number, password, search…" },
          { name: "label", type: "string", desc: "Görünen etiket (<label for>)." },
          { name: "hint", type: "string", desc: "Alan altında yardım metni (aria-describedby)." },
          { name: "placeholder", type: "string", desc: "" },
          { name: "autocomplete", type: "string", desc: "" },
          { name: "required", type: "boolean", default: "false", desc: "" },
          { name: "readonly", type: "boolean", default: "false", desc: "" },
          { name: "disabled", type: "boolean", default: "false", desc: "Yansıtılır ([disabled])." },
          { name: "pattern / minlength / maxlength", attr: "pattern, minlength, maxlength", type: "string / number", desc: "Native doğrulama kuralları." },
          { name: "error", type: "string", desc: "Özel hata mesajı (ör. sunucu doğrulaması). Boş değilse alan geçersizdir." },
        ],
        events: [
          { name: "input", detail: "—", desc: "Native: her tuşta. Değer için e.currentTarget.value." },
          { name: "change", detail: "—", desc: "Native: değer değişip odak çıkınca." },
        ],
        slots: [
          { name: "prefix", desc: "Alanın solunda (birim, ikon)." },
          { name: "suffix", desc: "Alanın sağında." },
        ],
        parts: [
          { name: "label", desc: "Etiket" },
          { name: "control", desc: "prefix + input + suffix kutusu" },
          { name: "input", desc: "Native <input>" },
          { name: "hint", desc: "Yardım metni" },
          { name: "error", desc: "Hata mesajı" },
        ],
        hooks: ["[data-invalid]", "[disabled]", '[aria-invalid="true"] (iç input)'],
        notes: ["Hata mesajı alana dokunulduktan (blur) veya gönderim denemesinden sonra görünür; mesaj metni tarayıcının doğrulama mesajıdır."],
      })}

      <section class="demo">
        <h2>Temel ve iki yönlü bağlama</h2>
        <div class="grid-2">
          <bz-input
            label="Ad"
            hint="Yazdıkça aşağıdaki metin güncellenir."
            .value=${name}
            @input=${(e: Event) => name.set((e.currentTarget as HTMLElement & { value: string }).value)}
          ></bz-input>
          <bz-input label="Salt okunur" value="Değiştirilemez" readonly></bz-input>
        </div>
        <p>Merhaba, <strong>${() => name() || "…"}</strong></p>
      </section>

      <section class="demo">
        <h2>Doğrulama</h2>
        <form class="stack" novalidate @submit=${(e: Event) => {
          const form = e.target as HTMLFormElement
          if (!form.reportValidity()) {
            e.preventDefault()
            return
          }
          submitToLog("doğrulama formu")(e)
        }}>
          <div class="grid-2">
            <bz-input name="username" label="Kullanıcı adı" required minlength="3" .error=${() => (taken() ? "Bu kullanıcı adı alınmış." : "")}></bz-input>
            <bz-input name="email" label="E-posta" type="email" required placeholder="ad@ornek.com"></bz-input>
            <bz-input name="tckn" label="T.C. kimlik no" pattern="[0-9]{11}" hint="11 haneli sayı" maxlength="11"></bz-input>
            <bz-input name="password" label="Parola" type="password" required minlength="8" autocomplete="new-password"></bz-input>
          </div>
          <label class="check"><input type="checkbox" @change=${(e: Event) => taken.set((e.target as HTMLInputElement).checked)} /> Sunucu hatası simüle et (<code>error</code> prop)</label>
          <div class="row">
            <bz-button type="submit" variant="primary">Gönder</bz-button>
            <bz-button type="reset">Sıfırla</bz-button>
          </div>
        </form>
      </section>

      <section class="demo">
        <h2>Prefix / suffix slotları</h2>
        <div class="grid-2">
          <bz-input label="Tutar" type="number" placeholder="0" @change=${log("tutar")}>
            <span slot="prefix">₺</span>
            <span slot="suffix">,00</span>
          </bz-input>
          <bz-input label="Ara" type="search" placeholder="Bir şey yazın">
            <span slot="prefix" aria-hidden="true">⌕</span>
          </bz-input>
          <bz-input label="Devre dışı" value="Pasif alan" disabled></bz-input>
        </div>
      </section>
    `
  },
}
