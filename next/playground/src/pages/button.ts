import { html, signal } from "@bazlama/core"
import { log, logEntry } from "../log"
import { usage } from "../docs/usage"
import { submitToLog } from "./shared"

export default {
  id: "button",
  title: "Button",
  description:
    "Enhancer bileşen: şablon üretmez, çocuklarını etiket olarak kullanır. role, tabindex, klavye (Enter/Space), disabled/loading ve form submit/reset davranışı headless katmanda.",
  render() {
    const loading = signal(false)
    const clicks = signal(0)
    const save = () => {
      loading.set(true)
      logEntry("kaydet", "click", "1.5 sn sürecek")
      setTimeout(() => loading.set(false), 1500)
    }

    return html`
      ${usage({
        tag: "bz-button",
        html: `
<bz-button>Varsayılan</bz-button>
<bz-button variant="primary">Kaydet</bz-button>
<bz-button variant="danger" size="sm">Sil</bz-button>
<bz-button disabled>Pasif</bz-button>
<bz-button pressed="false">Kalın</bz-button>
<bz-button loading>Yükleniyor</bz-button>`,
        js: `
const save = document.createElement("bz-button")
save.textContent = "Kaydet (1 sn)"
save.setAttribute("variant", "primary")   // görünüm: CSS özniteliği
save.addEventListener("click", () => {
  save.loading = true                      // tıklamalar yutulur, odak korunur
  log("kaydediliyor…")
  setTimeout(() => { save.loading = false; log("kaydedildi") }, 1000)
})

const bold = document.createElement("bz-button")
bold.textContent = "Kalın"
bold.pressed = "false"                     // toggle: her tıklamada çevrilir
bold.addEventListener("click", () => log("pressed =", bold.pressed))

output.append(save, " ", bold)`,
        template: `
const saving = signal(false)
const save = async () => {
  saving.set(true)
  await api.save()
  saving.set(false)
}

html\`
  <bz-button variant="primary" .loading=\${saving} @click=\${save}>
    \${() => (saving() ? "Kaydediliyor…" : "Kaydet")}
  </bz-button>

  <form @submit=\${onSubmit}>
    …
    <bz-button type="submit" variant="primary">Gönder</bz-button>
    <bz-button type="reset">Sıfırla</bz-button>
  </form>
\``,
        props: [
          { name: "disabled", type: "boolean", default: "false", desc: "Tıklanamaz ve sekme sırasından çıkar. Üst <fieldset disabled> de aynı etkiyi yapar." },
          { name: "loading", type: "boolean", default: "false", desc: "Meşgul durumu (aria-busy). Tıklamalar yutulur, odak korunur." },
          { name: "type", type: '"button" | "submit" | "reset"', default: '"button"', desc: "Form içindeyse formu gönderir veya sıfırlar." },
          { name: "pressed", type: '"" | "true" | "false"', default: '""', desc: "Boş değilse toggle butonudur (aria-pressed); her tıklamada çevrilir." },
          { name: "variant", type: '"primary" | "danger" | "ghost"', desc: "Sadece CSS (@bazlama/ui). Headless bileşen bilmez." },
          { name: "size", type: '"sm" | "lg"', desc: "Sadece CSS (@bazlama/ui)." },
        ],
        events: [{ name: "click", detail: "—", desc: "Native click. disabled/loading iken hiç tetiklenmez; Enter ve Space de click üretir." }],
        hooks: ['[aria-disabled="true"]', '[aria-busy="true"]', "[aria-pressed]", "[variant]", "[size]"],
        notes: ["Enhancer bileşendir: şablon üretmez, çocukları (metin, ikon) olduğu gibi etiket olur."],
      })}

      <section class="demo">
        <h2>Varyantlar</h2>
        <div class="row">
          <bz-button @click=${log("varsayılan")}>Varsayılan</bz-button>
          <bz-button variant="primary" @click=${log("primary")}>Primary</bz-button>
          <bz-button variant="danger" @click=${log("danger")}>Danger</bz-button>
          <bz-button variant="ghost" @click=${log("ghost")}>Ghost</bz-button>
          <bz-button disabled @click=${log("disabled (görünmemeli)")}>Disabled</bz-button>
        </div>
        <p class="note">Varyant ve boyut tamamen CSS'tir (<code>[variant]</code>, <code>[size]</code>); headless bileşen bunları bilmez.</p>
      </section>

      <section class="demo">
        <h2>Boyutlar</h2>
        <div class="row">
          <bz-button size="sm">Küçük</bz-button>
          <bz-button>Orta</bz-button>
          <bz-button size="lg">Büyük</bz-button>
        </div>
      </section>

      <section class="demo">
        <h2>Durumlar</h2>
        <div class="row">
          <bz-button variant="primary" .loading=${loading} @click=${save}>
            ${() => (loading() ? "Kaydediliyor…" : "Kaydet (1.5 sn)")}
          </bz-button>
          <bz-button pressed="false" @click=${log("toggle")}>Toggle (aria-pressed)</bz-button>
          <bz-button @click=${() => clicks.update((n) => n + 1)}>Sayaç: ${clicks}</bz-button>
        </div>
        <p class="note">Loading sırasında tıklama yutulur ama odak korunur. Toggle her tıklamada <code>aria-pressed</code> değerini çevirir.</p>
      </section>

      <section class="demo">
        <h2>Form içinde</h2>
        <form class="stack narrow" @submit=${submitToLog("form")}>
          <bz-input name="email" label="E-posta" type="email" placeholder="ad@ornek.com" required></bz-input>
          <div class="row">
            <bz-button type="submit" variant="primary">Gönder</bz-button>
            <bz-button type="reset">Sıfırla</bz-button>
          </div>
        </form>
        <p class="note">
          Gözlem: <code>bz-button</code> native bir submit butonu olmadığı için input içinde Enter ile örtük gönderim
          (implicit submission) çalışmaz. Çözüm seçenekleri README'de.
        </p>
      </section>

      <section class="demo">
        <h2>Kapsamlı tema (scoped token)</h2>
        <div class="row pink-scope">
          <bz-button variant="primary">Primary</bz-button>
          <bz-button>Varsayılan</bz-button>
          <bz-button pressed="true">Seçili</bz-button>
        </div>
        <pre><code>.pink-scope { --bz-color-primary: #d6336c; --bz-color-primary-hover: #b02a5b; --bz-radius: 0; }</code></pre>
      </section>
    `
  },
}
