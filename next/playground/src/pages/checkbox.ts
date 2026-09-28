import { computed, html, signal } from "@bazlama/core"
import { toast } from "@bazlama/headless"
import { checkboxUsage } from "../docs/specs-forms"
import { usage } from "../docs/usage"
import { log } from "../log"

const DEPTS = ["Kalite Kontrol", "Üretim", "Depo", "Satın Alma"]

export default {
  id: "checkbox",
  title: "Checkbox",
  description:
    "Native checkbox üzerine etiket, yardım ve hata. Form, doğrulama, reset ve Space tuşu tarayıcıdan; kısmi seçim (indeterminate) ve salt okunur bileşenden.",
  render() {
    const chosen = signal<string[]>(["Üretim"])
    const all = computed(() => chosen().length === DEPTS.length)
    const some = computed(() => chosen().length > 0 && !all())
    const toggle = (d: string, on: boolean) => chosen.update((l) => (on ? [...l, d] : l.filter((x) => x !== d)))
    const result = signal("")
    return html`
      ${usage(checkboxUsage)}

      <section class="demo">
        <h2>Tümünü seç (indeterminate)</h2>
        <div class="stack-sm">
          <bz-checkbox .checked=${all} .indeterminate=${some} @change=${(e: CustomEvent<{ checked: boolean }>) =>
            chosen.set(e.detail.checked ? [...DEPTS] : [])}>Tüm bölümler</bz-checkbox>
          <div class="stack-sm" style="padding-inline-start: 1.6rem">
            ${DEPTS.map(
              (d) => html`<bz-checkbox .checked=${() => chosen().includes(d)} @change=${(e: CustomEvent<{ checked: boolean }>) =>
                toggle(d, e.detail.checked)}>${d}</bz-checkbox>`
            )}
          </div>
          <p class="muted small">Seçili: <code>${() => chosen().join(", ") || "—"}</code></p>
        </div>
      </section>

      <section class="demo">
        <h2>Formda doğrulama ve reset</h2>
        <form
          class="stack-sm"
          @submit=${(e: SubmitEvent) => {
            e.preventDefault()
            result.set(JSON.stringify([...new FormData(e.target as HTMLFormElement)]))
            toast.success("Gönderildi")
          }}
        >
          <bz-checkbox name="terms" value="yes" required @change=${log("terms")}>Kullanım koşullarını kabul ediyorum</bz-checkbox>
          <bz-checkbox name="copy" checked hint="Onaylayanlara e-posta gider.">Bana da kopya gönder</bz-checkbox>
          <bz-checkbox checked readonly>Salt okunur (değişmez)</bz-checkbox>
          <bz-checkbox disabled>Devre dışı</bz-checkbox>
          <div class="row">
            <bz-button type="submit" variant="primary">Gönder</bz-button>
            <bz-button type="reset">Sıfırla</bz-button>
          </div>
          <p class="muted small">FormData: <code>${() => result() || "—"}</code></p>
        </form>
      </section>
    `
  },
}
