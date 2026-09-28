import { html } from "@bazlama/core"
import { dialogs, icon, tooltip } from "@bazlama/headless"
import { tooltipUsage } from "../docs/specs-feedback"
import { usage } from "../docs/usage"

export default {
  id: "tooltip",
  title: "Tooltip",
  description:
    "Tek bir paylaşılan balon ve belge düzeyinde olay yakalama: her tetikleyici için bileşen veya dinleyici oluşmaz. data-tooltip özniteliği yeter; zengin içerik için tooltip(el, içerik).",
  render() {
    const rich = (el: HTMLElement) =>
      tooltip(el, html`<b>Kredi limiti</b><br />Kullanılan: 42.000 ₺ / 100.000 ₺<br /><span style="opacity:.75">Son güncelleme: bugün 09:12</span>`, { placement: "bottom" })

    return html`
      ${usage(tooltipUsage)}

      <section class="demo">
        <h2>Araç çubuğu</h2>
        <div class="row toolbar">
          ${[
            ["plus", "Yeni kayıt (Ctrl+N)"],
            ["edit", "Düzenle (F2)"],
            ["copy", "Kopyala"],
            ["download", "Excel'e aktar"],
            ["trash", "Sil (Del)"],
          ].map(
            ([name, text]) => html`<bz-button size="sm" variant="ghost" aria-label=${text.replace(/ \(.*\)$/, "")} data-tooltip=${text}>${icon(name)}</bz-button>`
          )}
        </div>
        <p class="note">
          Fareyle bir ikonun üzerine gelin (500 ms), sonra yandakine geçin: ikinci tooltip beklemeden açılır ("warm"). Tab ile gezinince
          anında görünür, tıklamayla gelen odakta görünmez. İkon butonlarının adı <code>aria-label</code>'dan gelir; tooltip açıklamadır.
        </p>
      </section>

      <section class="demo">
        <h2>Yönler ve kenarlar</h2>
        <div class="row">
          <bz-button data-tooltip="Üstte (varsayılan)">top</bz-button>
          <bz-button data-tooltip="Altta" data-tooltip-placement="bottom">bottom</bz-button>
          <bz-button data-tooltip="Solda" data-tooltip-placement="left">left</bz-button>
          <bz-button data-tooltip="Sağda" data-tooltip-placement="right">right</bz-button>
          <span class="spacer"></span>
          <bz-button data-tooltip="Sağ kenarda yer yoksa taşmaz; ok yine tetikleyiciyi gösterir." data-tooltip-placement="right">Kenarda</bz-button>
        </div>
        <p class="note">Tercih edilen tarafta yer yoksa karşı tarafa döner, yatayda ekran içine sıkıştırılır.</p>
      </section>

      <section class="demo">
        <h2>Zengin içerik ve tablo</h2>
        <div class="row">
          <span class="chip" tabindex="0" ref=${rich}>Limit: %42</span>
          <span class="muted small">← <code>tooltip(el, html\`…\`, { placement: "bottom" })</code>; fareyle balonun üzerine geçilebilir.</span>
        </div>
        <table class="results">
          <thead><tr><th>Ürün</th><th>Durum</th></tr></thead>
          <tbody>
            ${["Masa", "Sandalye", "Dolap", "Raf"].map(
              (name, i) => html`<tr>
                <td>${name}</td>
                <td><span class="badge" data-tooltip=${i % 2 ? "Tedarikçiden bekleniyor, tahmini 3 gün" : "Depoda 24 adet"}>${i % 2 ? "bekleniyor" : "stokta"}</span></td>
              </tr>`
            )}
          </tbody>
        </table>
        <p class="note">Satır başına maliyet sadece bir öznitelik: binlerce satırlık tablolarda da güvenle kullanılabilir.</p>
      </section>

      <section class="demo">
        <h2>Dialog içinde</h2>
        <bz-button @click=${() =>
          dialogs.open({
            heading: "Tooltip ve Esc",
            content: html`<p>Butona Tab ile gelin: tooltip görünür. İlk Esc sadece tooltip'i kapatır, ikincisi dialogu.</p>
              <bz-button data-tooltip="Dialog içindeki tooltip, top layer'da dialogun üstünde">Odaklan</bz-button>`,
          })}>Dialog aç</bz-button>
      </section>
    `
  },
}
