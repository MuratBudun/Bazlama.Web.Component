import { html, signal } from "@bazlama/core"
import { icon, toast } from "@bazlama/headless"
import { toolbarUsage } from "../docs/specs-forms"
import { usage } from "../docs/usage"

export default {
  id: "toolbar",
  title: "Toolbar",
  description:
    "Araç çubuğu (WAI-ARIA toolbar): tek sekme durağı, ←/→ ile kontroller arasında gezinme, ayırıcı ve boşluk. Menüler, arama kutuları ve düğme grupları bir arada.",
  render() {
    const hasSelection = signal(false)
    const bold = signal("false")
    return html`
      ${usage(toolbarUsage)}

      <section class="demo">
        <h2>Tablo araç çubuğu</h2>
        <bz-toolbar label="Doküman işlemleri" class="toolbar-demo">
          <bz-button size="sm" variant="ghost" aria-label="Yenile" data-tooltip="Yenile" @click=${() => toast.info("Yenilendi")}>${icon("refresh")}</bz-button>
          <bz-button size="sm" variant="ghost" ?disabled=${() => !hasSelection()}>${icon("edit")} Görüntüle</bz-button>
          <bz-menu @select=${(e: CustomEvent<{ value: string }>) => toast(`${e.detail.value} eklenecek`)}>
            <bz-button slot="trigger" size="sm" variant="ghost">${icon("plus")} Ekle ▾</bz-button>
            <bz-menu-item value="Form">Form</bz-menu-item>
            <bz-menu-item value="Prosedür">Prosedür</bz-menu-item>
          </bz-menu>
          <bz-button size="sm" variant="ghost" ?disabled=${() => !hasSelection()}>${icon("trash")} Seçileni Sil</bz-button>
          <bz-toolbar-separator></bz-toolbar-separator>
          <bz-switch .checked=${hasSelection} @change=${(e: CustomEvent<{ checked: boolean }>) => hasSelection.set(e.detail.checked)}>Seçim var</bz-switch>
          <bz-toolbar-spacer></bz-toolbar-spacer>
          <bz-input placeholder="Ara…" aria-label="Ara"></bz-input>
          <bz-button size="sm" variant="ghost" @click=${() => toast("Excel'e aktarıldı")}>${icon("table")} Excel</bz-button>
        </bz-toolbar>
        <p class="note">
          Tab ile çubuğa girin, ←/→ ile gezinin: devre dışı düğmeler atlanır, arama kutusunda oklar imleci taşır. "Seçim var"ı açınca düğmeler
          sıraya katılır.
        </p>
      </section>

      <section class="demo">
        <h2>Gruplar, basılı düğmeler, dikey</h2>
        <div class="row" style="align-items: flex-start">
          <bz-toolbar label="Biçim">
            <div role="group" aria-label="Yazı">
              <bz-button size="sm" variant="ghost" .pressed=${bold} @click=${() => bold.set(bold() === "true" ? "false" : "true")}><strong>K</strong></bz-button>
              <bz-button size="sm" variant="ghost" pressed="false"><em>İ</em></bz-button>
              <bz-button size="sm" variant="ghost" pressed="false"><u>A</u></bz-button>
            </div>
            <bz-toolbar-separator></bz-toolbar-separator>
            <div role="group" aria-label="Hizalama">
              <bz-button size="sm" variant="ghost">Sol</bz-button>
              <bz-button size="sm" variant="ghost">Orta</bz-button>
              <bz-button size="sm" variant="ghost">Sağ</bz-button>
            </div>
          </bz-toolbar>
          <bz-toolbar label="Çizim" orientation="vertical" class="toolbar-vertical-demo">
            <bz-button size="sm" variant="ghost" aria-label="Seç">${icon("cursor-click")}</bz-button>
            <bz-button size="sm" variant="ghost" aria-label="Kalem">${icon("edit")}</bz-button>
            <bz-toolbar-separator></bz-toolbar-separator>
            <bz-button size="sm" variant="ghost" aria-label="Sil">${icon("trash")}</bz-button>
          </bz-toolbar>
        </div>
        <p class="note">Dikey çubukta ↑/↓. <code>wrap</code> özniteliği dar ekranda kontrolleri alt satıra geçirir.</p>
      </section>
    `
  },
}
