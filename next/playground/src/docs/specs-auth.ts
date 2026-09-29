import type { UsageSpec } from "./usage"

// "Kullanım" content of the bz-password and bz-login pages (see usage.ts).

export const passwordUsage: UsageSpec = {
  tag: "bz-password",
  html: `
<bz-password label="Parola" name="password" required
  hint="Göz düğmesi parolayı geçici olarak açar."></bz-password>
<bz-password label="Yeni parola" name="new-password" autocomplete="new-password"
  strength minlength="8" hint="En az 8 karakter."></bz-password>`,
  js: `
const pw = document.createElement("bz-password")
pw.label = "Yeni parola"
pw.autocomplete = "new-password"
pw.strength = true
pw.minlength = 8
pw.labels = { show: "Göster", hide: "Gizle", capsLock: "Caps Lock açık", strength: ["Çok zayıf", "Zayıf", "Orta", "İyi", "Güçlü"] }
pw.addEventListener("input", () => log("güç", passwordStrength(pw.value) + "/4"))
output.append(pw)`,
  template: `
html\`
  <bz-password label="Parola" name="password" required
    .value=\${pw} @input=\${(e) => pw.set(e.currentTarget.value)}>
  </bz-password>
\``,
  props: [
    { name: "value", type: "string", desc: "Parola metni." },
    { name: "name", type: "string", desc: "Form alan adı (içteki native input taşır)." },
    { name: "label / hint / placeholder", attr: "label, hint, placeholder", type: "string", desc: "Etiket, yardım metni, ipucu." },
    { name: "autocomplete", type: "string", default: '"current-password"', desc: 'Girişte "current-password", kayıt / değiştirmede "new-password".' },
    { name: "revealed", type: "boolean", default: "false", desc: "Parola şu an açık mı; yansıtılır ([revealed])." },
    { name: "hideToggle", attr: "hide-toggle", type: "boolean", default: "false", desc: "Göster/gizle düğmesini kaldırır." },
    { name: "hideCapsWarning", attr: "hide-caps-warning", type: "boolean", default: "false", desc: "Caps Lock uyarısını kapatır." },
    { name: "strength", type: "boolean", default: "false", desc: "Güç göstergesi (0-4). Yansıtılır." },
    { name: "minlength / maxlength / pattern / readonly", attr: "minlength, maxlength, pattern, readonly", type: "number / string / boolean", desc: "Native input'a geçer." },
    { name: "required", type: "boolean", default: "false", desc: "Native doğrulama; hata dokunduktan sonra görünür." },
    { name: "disabled", type: "boolean", default: "false", desc: "Yansıtılır." },
    { name: "error", type: "string", desc: "Özel hata mesajı; dolu ise alan geçersiz." },
    { name: "labels", attr: false, type: "Partial<PasswordLabels>", desc: "{ show, hide, capsLock, strength[] } metinleri." },
  ],
  events: [{ name: "input / change", detail: "native", desc: "İçteki input'tan; değer e.currentTarget.value." }],
  api: [
    { name: "passwordStrength(value)", desc: "0-4 arası kaba güç puanı (uzunluk + karakter çeşidi). Politika değil, ipucu: gerçek kuralı sunucu uygular." },
    { name: "PASSWORD_LABELS", desc: "Varsayılan metinler; uygulama açılışında topluca değiştirilebilir." },
  ],
  parts: [{ name: "label / control / input / toggle / caps / strength / meter / bar / strength-label / hint / error", desc: "Parçalar." }],
  hooks: ["[revealed]", "[strength]", "[data-caps-lock]", "[data-invalid]", "[disabled]", '[data-part="strength"][data-score]'],
  notes: [
    "Göster/gizle sadece native input'un type'ını değiştirir: değer, odak ve imleç yerinde kalır, parola yöneticisi alanı tanımaya devam eder.",
    "Düğme tabindex=-1: Tab sırası alanın kendisidir, düğmeye ekran okuyucu ve fare erişir (aria-pressed durumu okur).",
    "Caps Lock uyarısı yalnızca alan odaktayken görünür; durum klavye olaylarının getModifierState'inden okunur.",
  ],
}

export const loginUsage: UsageSpec = {
  tag: "bz-login",
  html: `
<bz-login id="giris" heading="Bazlama'ya giriş" description="Devam etmek için hesabınızla giriş yapın."
  forgot-href="#" resend-seconds="30" code-length="6">
  <span slot="footer">Hesabınız yok mu? <a href="#">Kayıt olun</a></span>
</bz-login>
<script>
  giris.addEventListener("submit", (e) => console.log(e.detail))
</script>`,
  preview: (root) => {
    const el = root.querySelector("bz-login") as HTMLElement & { loading: boolean; error: string; step: string }
    el.addEventListener("submit", () => {
      el.loading = true
      setTimeout(() => {
        el.loading = false
        el.error = "Bu bir önizleme: giriş isteği gönderilmiyor."
      }, 400)
    })
  },
  js: `
const el = document.createElement("bz-login")
el.heading = "Giriş"
el.description = "Örnek: e-posta demo@bazlama.dev, parola 1234"
el.resendSeconds = 10
el.labels = { identifier: "E-posta", password: "Parola", remember: "Beni hatırla",
  forgot: "Parolamı unuttum", submit: "Giriş yap", verify: "Doğrula", back: "Geri",
  code: "Doğrulama kodu", codeNote: "{destination} adresine gönderilen {n} haneli kodu girin.",
  resend: "Kodu yeniden gönder", resendIn: "Yeniden gönder ({s} sn)" }

el.addEventListener("submit", (e) => {
  log("submit", e.detail)
  el.loading = true
  setTimeout(() => {
    el.loading = false
    if (e.detail.step === "credentials") {
      if (e.detail.password !== "1234") return (el.error = "E-posta veya parola hatalı.")
      el.error = ""
      el.step = "code"            // ikinci adım: doğrulama kodu
    } else {
      el.error = e.detail.code === "123456" ? "" : "Kod hatalı."
      if (!el.error) log("giriş başarılı")
    }
  }, 600)
})
el.addEventListener("forgot", (e) => log("forgot", e.detail))
el.addEventListener("resend", () => log("yeni kod gönderildi"))
output.append(el)`,
  template: `
html\`
  <bz-login heading="Giriş" .loading=\${busy} .error=\${error} .step=\${step}
    @submit=\${async (e) => {
      busy.set(true)
      const r = await api.signIn(e.detail)
      busy.set(false)
      r.needsCode ? step.set("code") : error.set(r.message ?? "")
    }}>
    <bz-icon slot="logo" name="layers"></bz-icon>
    <bz-button slot="providers" variant="ghost">Google ile devam et</bz-button>
  </bz-login>
\``,
  props: [
    { name: "heading / description", attr: "heading, description", type: "string", desc: "Kart başlığı ve alt metni." },
    { name: "step", type: '"credentials" | "code"', default: '"credentials"', desc: "Görünen adım; yansıtılır. İkinci adıma geçiren uygulamadır." },
    { name: "loading", type: "boolean", default: "false", desc: "Alanları kilitler, düğmeyi meşgul yapar; yansıtılır." },
    { name: "error", type: "string", desc: "Formun üstünde role=alert bandı; boşsa gizli." },
    { name: "identifier / password / code", attr: "identifier, password, code", type: "string", desc: "Alan değerleri (iki yönlü)." },
    { name: "identifierLabel / identifierName / identifierType / identifierAutocomplete / identifierPlaceholder", attr: "identifier-label, identifier-name, identifier-type, identifier-autocomplete, identifier-placeholder", type: "string", default: '· "username" · "email" · "username" ·', desc: "Kimlik alanının etiketi, form adı ve tipi (kullanıcı adıyla giriş için identifier-type=\"text\")." },
    { name: "passwordLabel / passwordName", attr: "password-label, password-name", type: "string", default: '· "password"', desc: "Parola alanı." },
    { name: "passwordStrength", attr: "password-strength", type: "boolean", default: "false", desc: "Parolada güç göstergesi (kayıt formu görünümü); autocomplete new-password olur." },
    { name: "remember", type: "boolean", default: "false", desc: '"Beni hatırla" durumu; yansıtılır.' },
    { name: "hideRemember / hideForgot", attr: "hide-remember, hide-forgot", type: "boolean", default: "false", desc: "İlgili kontrolü gizler." },
    { name: "forgotHref", attr: "forgot-href", type: "string", desc: "Doluysa bağlantı, boşsa forgot olayı veren düğme." },
    { name: "codeLength", attr: "code-length", type: "number", default: "6", desc: "Kod uzunluğu; alan sadece rakam kabul eder." },
    { name: "codeDestination", attr: "code-destination", type: "string", desc: "Kod notunda gösterilen hedef (maskelenmiş telefon/e-posta)." },
    { name: "noAutoSubmit", attr: "no-auto-submit", type: "boolean", default: "false", desc: "Kod tamamlanınca kendiliğinden gönderme." },
    { name: "resendSeconds", attr: "resend-seconds", type: "number", default: "0", desc: "Yeniden gönderme için bekleme; 0 düğmeyi gizler." },
    { name: "labels", attr: false, type: "Partial<LoginLabels>", desc: "Tüm metinler; {n}, {s}, {destination} yer tutucuları doldurulur." },
  ],
  events: [
    { name: "submit", detail: "{ step, identifier, password, remember } · { step: \"code\", code, identifier }", desc: "Gönderim isteği. İçteki native submit dışarı çıkmaz; ağ işi uygulamanındır." },
    { name: "forgot", detail: "{ identifier }", desc: "forgot-href yokken düğmeye basıldı." },
    { name: "resend", detail: "{ identifier }", desc: "Yeni kod istendi; sayaç yeniden başlar." },
    { name: "back", detail: "—", desc: "Kod adımından geri dönüldü (kod ve hata temizlenir)." },
  ],
  api: [{ name: "LOGIN_LABELS", desc: "Varsayılan metinler; uygulama açılışında topluca değiştirilebilir." }],
  slots: [
    { name: "logo", desc: "Başlığın üstünde marka / ikon." },
    { name: "header", desc: "Başlık + açıklamanın tamamının yerine geçer." },
    { name: "extra", desc: "Alanlarla gönder düğmesi arasına ek içerik." },
    { name: "providers", desc: "SSO düğmeleri; verilirse üstünde ayraç çıkar." },
    { name: "footer", desc: "Kartın altı (ör. \"Kayıt olun\")." },
  ],
  parts: [{ name: "card / header / logo / heading / description / error / form / identifier / password / row / remember / forgot / code / code-note / resend / back / submit / divider / providers / footer", desc: "Parçalar." }],
  hooks: ["[step=\"code\"]", "[loading]", "[remember]", "--bz-login-width", "--bz-login-padding", "--bz-login-align"],
  notes: [
    "Bileşen kimlik doğrulaması yapmaz: submit olayını dinleyip loading / error / step'i uygulama yönetir.",
    "Alanlar gerçek <bz-input>/<bz-password>/<bz-checkbox> ve gerçek bir <form> içindedir: Enter gönderir, required native doğrulanır, parola yöneticileri formu tanır.",
    "Kod alanı autocomplete=\"one-time-code\": iOS/Android SMS kodunu doldurur ve kod tamamlanınca form kendiliğinden gönderilir (no-auto-submit kapatır).",
  ],
}
