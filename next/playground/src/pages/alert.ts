import { html, signal } from "@bazlama/core"
import { icon } from "@bazlama/headless"
import { alertUsage } from "../docs/specs-status"
import { usage } from "../docs/usage"
import { log } from "../log"

export default {
  id: "alert",
  title: "Alert",
  description:
    "Sayfa içi uyarı / bilgi bandı (callout). Varsayılan olarak içeriğin parçası olarak okunur (role=note); sonradan çıkan mesajlar için live ile canlı bölge olur. Geçici bildirimler için toast.",
  render() {
    const error = signal<string | null>(null)
    const save = () => error.set("Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.")
    return html`
      ${usage(alertUsage)}

      <section class="demo">
        <h2>Varyantlar</h2>
        <div class="stack-sm">
          <bz-alert variant="info" heading="Bilgi">Bu teklif 20.07.2029 tarihine kadar geçerlidir.</bz-alert>
          <bz-alert variant="success">Kayıt güncellendi.</bz-alert>
          <bz-alert variant="warning" heading="Bekleyen işler">Bu sayfada 7 günden uzun süredir bekleyen 18 iş var.</bz-alert>
          <bz-alert variant="danger" heading="Yetki yok">Bu adımda işlem yapma yetkiniz bulunmuyor.</bz-alert>
        </div>
      </section>

      <section class="demo">
        <h2>Eylemler, özel ikon, kapatma</h2>
        <div class="stack-sm">
          <bz-alert variant="warning" icon="clock" dismissible @dismiss=${log("onay süresi")}>
            Teklifin geçerlilik süresi: <strong>3 gün</strong>.
            <bz-button slot="actions" size="sm" variant="primary">Onaya gönder</bz-button>
            <bz-button slot="actions" size="sm" variant="ghost">Hatırlat</bz-button>
          </bz-alert>
          <bz-alert variant="info" icon="none">İkonsuz, sade bir not.</bz-alert>
          <bz-alert variant="success">
            <span slot="icon">${icon("star")}</span>
            Favorilere eklendi (slot="icon").
          </bz-alert>
        </div>
      </section>

      <section class="demo">
        <h2>Sonradan çıkan hata (live)</h2>
        <div class="row">
          <bz-button variant="primary" @click=${save}>Kaydet (hata ver)</bz-button>
          <bz-button @click=${() => error.set(null)}>Temizle</bz-button>
        </div>
        ${() =>
          error()
            ? html`<bz-alert variant="danger" heading="Kaydedilemedi" live="assertive" dismissible @dismiss=${() => error.set(null)}>${error()}</bz-alert>`
            : null}
        <p class="note">
          <code>live="assertive"</code> (role=alert): ekran okuyucu mesajı çıktığı anda okur. Sayfanın baştan parçası olan uyarılarda
          <code>live</code> vermeyin; her sayfa açılışında okunmasın.
        </p>
      </section>
    `
  },
}
