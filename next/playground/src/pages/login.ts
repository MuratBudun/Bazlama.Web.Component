import { html, signal } from "@bazlama/core"
import { loginUsage } from "../docs/specs-auth"
import { usage } from "../docs/usage"
import { logEntry } from "../log"

const TR_LABELS = {
  identifier: "E-posta",
  password: "Parola",
  remember: "Beni hatırla",
  forgot: "Parolamı unuttum",
  submit: "Giriş yap",
  code: "Doğrulama kodu",
  codeNote: "{destination} adresine gönderilen {n} haneli kodu girin.",
  verify: "Doğrula",
  resend: "Kodu yeniden gönder",
  resendIn: "Yeniden gönder ({s} sn)",
  back: "Geri",
  or: "veya",
}

interface LoginEl extends HTMLElement {
  loading: boolean
  error: string
  step: string
  code: string
}
interface SubmitDetail {
  step: string
  identifier?: string
  password?: string
  remember?: boolean
  code?: string
}

/** Fake sign-in: demo@bazlama.dev / 1234, then the code 123456. */
const fakeAuth = (el: LoginEl) => (event: Event) => {
  const detail = (event as CustomEvent<SubmitDetail>).detail
  logEntry("login", "submit", JSON.stringify({ ...detail, password: detail.password ? "•••" : undefined }))
  el.loading = true
  setTimeout(() => {
    el.loading = false
    if (detail.step === "credentials") {
      if (detail.password !== "1234") {
        el.error = "E-posta veya parola hatalı."
        return
      }
      el.error = ""
      el.step = "code"
    } else {
      if (detail.code !== "123456") {
        el.error = "Kod hatalı ya da süresi dolmuş."
        el.code = ""
        return
      }
      el.error = ""
      logEntry("login", "success", detail.identifier ?? "")
    }
  }, 700)
}

export default {
  id: "login",
  title: "Login",
  description:
    "Giriş kartı: kimlik + parola, beni hatırla, parolamı unuttum ve ikinci adım olarak doğrulama kodu (2FA). Bileşen kimlik doğrulaması yapmaz; submit olayını dinleyip loading / error / step'i uygulama yönetir.",
  render() {
    const withCode = signal<LoginEl | null>(null)
    return html`
      ${usage(loginUsage)}

      <section class="demo">
        <h2>Çalışan örnek (2FA'lı)</h2>
        <p class="note">
          Deneyin: <code>demo@bazlama.dev</code> / <code>1234</code> → ikinci adımda kod <code>123456</code>. Yanlış değerler hata
          bandını gösterir. Olaylar sağdaki günlüğe düşer.
        </p>
        <bz-login
          heading="Bazlama'ya giriş"
          description="Devam etmek için hesabınızla giriş yapın."
          code-destination="demo@bazlama.dev"
          resend-seconds="20"
          .labels=${TR_LABELS}
          ref=${(el: LoginEl) => {
            withCode.set(el)
            el.addEventListener("submit", fakeAuth(el))
            el.addEventListener("forgot", () => logEntry("login", "forgot"))
            el.addEventListener("resend", () => logEntry("login", "resend", "yeni kod gönderildi"))
            el.addEventListener("back", () => logEntry("login", "back"))
          }}
        >
          <bz-icon slot="logo" name="layers" size="32"></bz-icon>
          <bz-button slot="providers" variant="ghost">
            <bz-icon name="mail"></bz-icon>
            Google ile devam et
          </bz-button>
          <bz-button slot="providers" variant="ghost">SSO ile devam et</bz-button>
          <span slot="footer">Hesabınız yok mu? <a href="#">Kayıt olun</a></span>
        </bz-login>
        <div class="row">
          <bz-button size="sm" @click=${() => withCode() && (withCode()!.step = "code")}>step = "code"</bz-button>
          <bz-button size="sm" @click=${() => withCode() && (withCode()!.step = "credentials")}>step = "credentials"</bz-button>
          <bz-button size="sm" @click=${() => withCode() && (withCode()!.error = "Sunucuya ulaşılamadı.")}>Hata göster</bz-button>
          <bz-button size="sm" @click=${() => withCode() && (withCode()!.loading = !withCode()!.loading)}>loading aç/kapa</bz-button>
        </div>
      </section>

      <section class="demo">
        <h2>Sade: kullanıcı adı ile, tek adım</h2>
        <bz-login
          heading="Yönetim paneli"
          identifier-type="text"
          identifier-label="Kullanıcı adı"
          identifier-autocomplete="username"
          hide-forgot
          .labels=${TR_LABELS}
          @submit=${(e: Event) => logEntry("login-basit", "submit", JSON.stringify((e as CustomEvent<SubmitDetail>).detail.identifier))}
        ></bz-login>
        <p class="note">
          <code>identifier-type="text"</code> kimlik alanını e-posta doğrulamasından çıkarır; <code>hide-forgot</code> ve
          <code>hide-remember</code> ilgili kontrolleri kaldırır.
        </p>
      </section>

      <section class="demo">
        <h2>Kayıt görünümü (parola gücüyle)</h2>
        <bz-login
          heading="Hesap oluştur"
          description="E-postanızı ve yeni bir parola belirleyin."
          password-strength
          hide-remember
          hide-forgot
          .labels=${{ ...TR_LABELS, password: "Yeni parola", submit: "Hesap oluştur" }}
          @submit=${(e: Event) => logEntry("kayit", "submit", JSON.stringify((e as CustomEvent<SubmitDetail>).detail.identifier))}
        >
          <span slot="footer">Zaten hesabınız var mı? <a href="#">Giriş yapın</a></span>
        </bz-login>
        <p class="note">
          <code>password-strength</code> parola alanını güç göstergeli ve <code>autocomplete="new-password"</code> yapar. Aynı kart
          böylece kayıt formu olarak da kullanılabilir.
        </p>
      </section>
    `
  },
}
