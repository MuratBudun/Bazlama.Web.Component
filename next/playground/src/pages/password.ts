import { html, signal } from "@bazlama/core"
import { passwordStrength } from "@bazlama/headless"
import { passwordUsage } from "../docs/specs-auth"
import { usage } from "../docs/usage"
import { log } from "../log"

const TR_LABELS = {
  show: "Parolayı göster",
  hide: "Parolayı gizle",
  capsLock: "Caps Lock açık",
  strength: ["Çok zayıf", "Zayıf", "Orta", "İyi", "Güçlü"],
}

export default {
  id: "password",
  title: "Password",
  description:
    "Parola alanı: göster/gizle düğmesi, Caps Lock uyarısı ve isteğe bağlı güç göstergesi. İçinde gerçek bir <input name> vardır; form, native doğrulama, reset ve parola yöneticileri olduğu gibi çalışır.",
  render() {
    const value = signal("")
    return html`
      ${usage(passwordUsage)}

      <section class="demo">
        <h2>Temel</h2>
        <div class="stack-sm narrow">
          <bz-password label="Parola" name="password" .labels=${TR_LABELS} @change=${log("password")}></bz-password>
          <bz-password label="Göster/gizle olmadan" hide-toggle .labels=${TR_LABELS}></bz-password>
          <bz-password label="Salt okunur" readonly value="gizli-deger" .labels=${TR_LABELS}></bz-password>
          <bz-password label="Kapalı" disabled value="gizli-deger" .labels=${TR_LABELS}></bz-password>
        </div>
        <p class="note">
          Göster/gizle sadece native input'un <code>type</code>'ını değiştirir: değer, odak ve imleç konumu korunur. Düğme
          <code>tabindex="-1"</code>'dir; Tab sırası alanın kendisidir.
        </p>
      </section>

      <section class="demo">
        <h2>Güç göstergesi</h2>
        <div class="stack-sm narrow">
          <bz-password
            label="Yeni parola"
            autocomplete="new-password"
            strength
            minlength="8"
            hint="En az 8 karakter; büyük/küçük harf, rakam ve sembol karışımı önerilir."
            .labels=${TR_LABELS}
            .value=${value}
            @input=${(e: Event) => value.set((e.currentTarget as HTMLInputElement).value)}
          ></bz-password>
          <p class="note">
            <code>passwordStrength("${() => value() || "…"}")</code> = <strong>${() => passwordStrength(value())}</strong> / 4
          </p>
        </div>
        <p class="note">
          Puan yalnızca uzunluk ve karakter çeşidine bakan kaba bir ipucudur, politika değildir: gerçek kuralı sunucu uygular.
          Alan tarafında <code>required</code>, <code>minlength</code> ve <code>pattern</code> native olarak doğrulanır.
        </p>
      </section>

      <section class="demo">
        <h2>Formda doğrulama</h2>
        <form
          class="stack-sm narrow"
          @submit=${(e: Event) => {
            e.preventDefault()
            log("form")(e)
          }}
        >
          <bz-password label="Mevcut parola" name="current" required .labels=${TR_LABELS}></bz-password>
          <bz-password
            label="Yeni parola"
            name="next"
            required
            minlength="8"
            strength
            autocomplete="new-password"
            .labels=${TR_LABELS}
          ></bz-password>
          <div class="row">
            <bz-button type="submit" variant="primary">Kaydet</bz-button>
            <bz-button type="reset">Sıfırla</bz-button>
          </div>
        </form>
        <p class="note">
          Hata mesajı alandan çıkıldıktan ya da gönderme denendikten sonra görünür (<code>[data-invalid]</code>). Formun
          <code>reset</code>'i değeri ve açık/kapalı durumunu geri alır.
        </p>
      </section>

      <section class="demo">
        <h2>Caps Lock</h2>
        <div class="stack-sm narrow">
          <bz-password label="Caps Lock'u açıp yazmayı deneyin" .labels=${TR_LABELS}></bz-password>
          <bz-password label="Uyarı kapalı" hide-caps-warning .labels=${TR_LABELS}></bz-password>
        </div>
        <p class="note">
          Uyarı yalnızca alan odaktayken görünür; durum klavye olaylarının <code>getModifierState("CapsLock")</code> değerinden
          okunur, bu yüzden ilk tuşa basıldığında belirir.
        </p>
      </section>
    `
  },
}
