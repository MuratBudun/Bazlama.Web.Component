import { html, signal } from "@bazlama/core"
import { dialogs, icon, openMenu } from "@bazlama/headless"
import { menuUsage } from "../docs/specs-feedback"
import { usage } from "../docs/usage"
import { log, logEntry } from "../log"

export default {
  id: "menu",
  title: "Menü",
  description:
    "Açılır menü ve alt menüler. Popup tarayıcının Popover API'si ile açılır (top layer, dışarı tıklayınca kapanma); konumlandırma kütüphanesiz place() ile yapılır. Klavye WAI-ARIA menü desenine uyar.",
  render() {
    const density = signal("normal")
    const grid = signal(true)

    return html`
      ${usage(menuUsage)}

      <section class="demo">
        <h2>Araç çubuğu</h2>
        <div class="row">
          <bz-menu @select=${log("dosya")}>
            <bz-button slot="trigger">Dosya</bz-button>
            <bz-menu-item value="new" icon="plus" shortcut="Ctrl+N">Yeni</bz-menu-item>
            <bz-menu-item value="open" icon="folder-open" shortcut="Ctrl+O">Aç…</bz-menu-item>
            <bz-menu-item value="save" icon="download" shortcut="Ctrl+S">Kaydet</bz-menu-item>
            <bz-menu-separator></bz-menu-separator>
            <bz-menu>
              <bz-menu-item slot="trigger" icon="upload">Dışa aktar</bz-menu-item>
              <bz-menu-item value="xlsx">Excel (.xlsx)</bz-menu-item>
              <bz-menu-item value="csv">CSV</bz-menu-item>
              <bz-menu>
                <bz-menu-item slot="trigger">PDF</bz-menu-item>
                <bz-menu-item value="pdf-a4">A4 dikey</bz-menu-item>
                <bz-menu-item value="pdf-a4l">A4 yatay</bz-menu-item>
              </bz-menu>
            </bz-menu>
            <bz-menu-item value="print" icon="file-text" shortcut="Ctrl+P" disabled>Yazdır</bz-menu-item>
            <bz-menu-separator></bz-menu-separator>
            <bz-menu-item value="close" variant="danger" icon="x">Kapat</bz-menu-item>
          </bz-menu>

          <bz-menu @select=${(e: CustomEvent<{ value: string; checked: boolean }>) => {
            const { value, checked } = e.detail
            if (value === "grid") grid.set(checked)
            else density.set(value)
            log("görünüm")(e)
          }}>
            <bz-button slot="trigger">Görünüm</bz-button>
            <bz-menu-item type="checkbox" value="grid" .checked=${grid}>Izgara çizgileri</bz-menu-item>
            <bz-menu-separator></bz-menu-separator>
            <bz-menu-group label="Yoğunluk">
              ${["compact", "normal", "comfortable"].map(
                (v, i) => html`<bz-menu-item type="radio" name="density" value=${v} .checked=${() => density() === v}>${["Sıkı", "Normal", "Rahat"][i]}</bz-menu-item>`
              )}
            </bz-menu-group>
          </bz-menu>

          <bz-menu placement="bottom-end" @select=${log("hesap")}>
            <bz-button slot="trigger" variant="ghost" aria-label="Hesap">${icon("user")} Ada Yılmaz</bz-button>
            <bz-menu-group label="ada@ornek.com">
              <bz-menu-item value="profile" icon="user">Profil</bz-menu-item>
              <bz-menu-item value="settings" icon="settings">Ayarlar</bz-menu-item>
            </bz-menu-group>
            <bz-menu-separator></bz-menu-separator>
            <bz-menu-item value="logout" icon="log-out">Çıkış yap</bz-menu-item>
          </bz-menu>
        </div>
        <p class="muted small">Görünüm: ızgara = <code>${() => String(grid())}</code>, yoğunluk = <code>${density}</code></p>
        <p class="note">
          Checkbox ve radio öğeleri seçilince menü açık kalır. "Hesap" menüsü <code>placement="bottom-end"</code> ile sağa hizalı açılır;
          yer yoksa yukarı döner, uzun menüler ekran yüksekliğine sığdırılıp kaydırılır.
        </p>
      </section>

      <section class="demo">
        <h2>Context menu</h2>
        <p>Masaüstü tarzı context menu için <a href="/context-menu"><code>&lt;bz-context-menu&gt;</code> ve <code>contextMenu()</code></a> sayfasına bakın.</p>
      </section>

      <section class="demo">
        <h2>Programatik ve dialog içinde</h2>
        <div class="row">
          <bz-button @click=${async (e: Event) => {
            const value = await openMenu({
              anchor: e.currentTarget as Element,
              items: [
                { label: "Bugün", value: "today" },
                { label: "Son 7 gün", value: "7d" },
                { label: "Bu ay", value: "month" },
                { type: "separator" },
                { label: "Özel aralık…", value: "custom", icon: "calendar" },
              ],
            })
            logEntry("openMenu", "sonuç", String(value))
          }}>openMenu() → Promise</bz-button>
          <bz-button @click=${() =>
            dialogs.open({
              heading: "Menü dialog içinde",
              content: html`<p>Menü dialogun içinde açılır ve tıklanabilir. Esc önce menüyü kapatır, dialog açık kalır.</p>
                <bz-menu @select=${log("dialog menüsü")}>
                  <bz-button slot="trigger">Seçenekler</bz-button>
                  <bz-menu-item value="a">Birinci</bz-menu-item>
                  <bz-menu>
                    <bz-menu-item slot="trigger">Alt menü</bz-menu-item>
                    <bz-menu-item value="b">İkinci</bz-menu-item>
                  </bz-menu>
                </bz-menu>`,
            })}>Dialog içinde menü</bz-button>
        </div>
      </section>

      <section class="demo">
        <h2>Klavye</h2>
        <table class="api">
          <tbody>
            <tr><td><kbd>Enter</kbd> <kbd>Space</kbd> <kbd>↓</kbd></td><td>Trigger üzerinde: menüyü açar, ilk öğeye odaklanır (<kbd>↑</kbd> son öğeye)</td></tr>
            <tr><td><kbd>↑</kbd> <kbd>↓</kbd> <kbd>Home</kbd> <kbd>End</kbd></td><td>Öğeler arasında gezinir (sonda başa döner); devre dışı öğeler odaklanır ama seçilemez</td></tr>
            <tr><td>harf</td><td>O harfle başlayan öğeye gider</td></tr>
            <tr><td><kbd>→</kbd> / <kbd>←</kbd></td><td>Alt menüyü açar / kapatıp üst öğeye döner (RTL'de tersi)</td></tr>
            <tr><td><kbd>Enter</kbd> <kbd>Space</kbd></td><td>Öğeyi seçer; checkbox/radio değiştirir ve menü açık kalır</td></tr>
            <tr><td><kbd>Esc</kbd></td><td>Bir seviye kapatır, odak açan öğeye döner (içindeki dialogu kapatmaz)</td></tr>
            <tr><td><kbd>Tab</kbd></td><td>Tüm menüyü kapatır, odak sıradaki elemana geçer</td></tr>
          </tbody>
        </table>
      </section>
    `
  },
}
