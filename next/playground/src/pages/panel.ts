import { html } from "@bazlama/core"
import { log } from "../log"
import { panelUsage } from "../docs/specs"
import { usage } from "../docs/usage"

export default {
  id: "panel",
  title: "Panel",
  description:
    "Kart ve açılır/kapanır panel. Light DOM slot'ları (header, actions, default, footer) ile içerik projekte edilir; collapsible modda başlık bir <button> olur (aria-expanded, aria-controls).",
  render() {
    return html`
      ${usage(panelUsage)}

      <section class="demo">
        <h2>Kart</h2>
        <bz-panel heading="Sipariş özeti">
          <bz-button slot="actions" size="sm" variant="ghost">Düzenle</bz-button>
          <p>3 ürün · Toplam <strong>1.249,90 ₺</strong></p>
          <p class="muted">Kargo: Yarın teslim</p>
          <bz-button slot="footer">İptal</bz-button>
          <bz-button slot="footer" variant="primary">Onayla</bz-button>
        </bz-panel>
      </section>

      <section class="demo">
        <h2>Açılır / kapanır</h2>
        <div class="stack">
          <bz-panel heading="Kargo bilgileri" collapsible open @toggle=${log("kargo")}>
            <p>Siparişiniz 1-3 iş günü içinde kargoya verilir.</p>
          </bz-panel>
          <bz-panel heading="İade koşulları" collapsible @toggle=${log("iade")}>
            <p>14 gün içinde koşulsuz iade.</p>
          </bz-panel>
          <bz-panel collapsible @toggle=${log("özel başlık")}>
            <span slot="header">Özel başlık <span class="badge">yeni</span></span>
            <p>Başlık slot'u ile zengin içerik verilebilir.</p>
          </bz-panel>
        </div>
      </section>
    `
  },
}
