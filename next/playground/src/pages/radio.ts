import { html, signal } from "@bazlama/core"
import { toast } from "@bazlama/headless"
import { radioUsage } from "../docs/specs-forms"
import { usage } from "../docs/usage"
import { log } from "../log"

const KINDS = [
  { id: "form", label: "Form", hint: "Doldurulan belge" },
  { id: "proc", label: "Prosedür", hint: "Süreç tanımı" },
  { id: "inst", label: "Talimat", hint: "Adım adım iş tarifi" },
]

export default {
  id: "radio",
  title: "Radio",
  description:
    "bz-radio-group + bz-radio: native radyolar (aynı name). Ok tuşları, tek sekme durağı ve required doğrulaması tarayıcıdan; grup etiketi, yatay dizilim ve change { value } bileşenden.",
  render() {
    const kind = signal("form")
    const priority = signal("normal")
    return html`
      ${usage(radioUsage)}

      <section class="demo">
        <h2>Kontrollü grup</h2>
        <div class="stack-sm">
          <bz-radio-group label="Doküman türü" .value=${kind} @change=${(e: CustomEvent<{ value: string }>) => kind.set(e.detail.value)}>
            ${KINDS.map((k) => html`<bz-radio value=${k.id} hint=${k.hint}>${k.label}</bz-radio>`)}
            <bz-radio value="ext" disabled>Dış kaynaklı (yetki yok)</bz-radio>
          </bz-radio-group>
          <div class="row">
            <span class="muted small">Seçili: <code>${kind}</code></span>
            <bz-button size="sm" @click=${() => kind.set("inst")}>Dışarıdan: Talimat</bz-button>
          </div>
        </div>
      </section>

      <section class="demo">
        <h2>Yatay, formda zorunlu</h2>
        <form class="stack-sm" @submit=${(e: SubmitEvent) => (e.preventDefault(), toast.success(JSON.stringify([...new FormData(e.target as HTMLFormElement)])))}>
          <bz-radio-group label="Öncelik" name="priority" orientation="horizontal" required hint="Ok tuşlarıyla değiştirin."
            .value=${priority} @change=${(e: CustomEvent<{ value: string }>) => (priority.set(e.detail.value), log("öncelik")(e))}>
            <bz-radio value="low">Düşük</bz-radio>
            <bz-radio value="normal">Normal</bz-radio>
            <bz-radio value="high">Yüksek</bz-radio>
          </bz-radio-group>
          <bz-radio-group label="Onay yöntemi" name="approval" orientation="horizontal" required>
            <bz-radio value="seq">Sıralı</bz-radio>
            <bz-radio value="par">Paralel</bz-radio>
          </bz-radio-group>
          <div class="row">
            <bz-button type="submit" variant="primary">Gönder</bz-button>
            <bz-button type="reset">Sıfırla</bz-button>
          </div>
        </form>
      </section>
    `
  },
}
