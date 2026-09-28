import { computed, html, signal, type Signal } from "@bazlama/core"
import { dialogs, icon, toast, type Column } from "@bazlama/headless"
import { DEPARTMENTS, DOC_KINDS, FRM_008, RELATED_ADD_MENU, TOOLS_MENU, type DocRow } from "./data"
import { gridPanel, lookupField, statusTag } from "./ui"

/**
 * "Doküman Formu" (FRM-008): toolbar with Güncelle (edit mode), İşlem Yap / Araçlar / print
 * menus, 7 tabs, "Genel Bilgiler" fields with lookups, and collapsible grid panels.
 */

type R = Record<string, unknown> & { id: string }
const TEXTAREA_TR = { expand: "Genişlet", apply: "Uygula", cancel: "Vazgeç", close: "Kapat" }
const col = <T extends R>(key: string, header: string, extra: Partial<Column<T>> = {}): Column<T> => ({ key, header, sortable: true, ...extra })

export interface FormHandle {
  view: unknown
  /** Asks before closing when there are unsaved changes. */
  canClose: () => Promise<boolean>
  isDirty: () => boolean
}

export function documentForm(docRow: DocRow, onClose: () => void): FormHandle {
  const isFrm008 = docRow.no === "FRM-008"
  const base = isFrm008
    ? FRM_008
    : { ...FRM_008, no: docRow.no, name: docRow.name, ownerDept: docRow.ownerDept, nameOther: docRow.nameOther, status: docRow.status, createdAt: docRow.createdAt }

  // ------------------------------------------------------------------ state
  const editing = signal(false)
  const kind = signal(base.kind)
  const name = signal(base.name)
  const nameOther = signal(base.nameOther)
  const ownerDept = signal(base.ownerDept)
  const preparedDept = signal(base.preparedDept)
  const validUntil = signal(base.validUntil)
  const enforcement = signal(base.enforcement)
  const favorite = signal(false)
  const tab = signal("general")
  const snapshot = () => JSON.stringify([kind(), name(), nameOther(), ownerDept(), preparedDept(), validUntil(), enforcement()])
  let saved = snapshot()
  const dirty = computed(() => editing() && snapshot() !== saved)

  const attachments = signal<R[]>([])
  const relatedDocs = signal<R[]>([])
  const replaced = signal<R[]>([])
  const external = signal<R[]>([])
  const eDistribution = signal<R[]>(
    isFrm008 ? [{ id: "8", code: "D001.8", dept: "Genel Müdürlük\\Mühendislik Müdürlüğü", sub: "Hayır" }] : []
  )
  const printed = signal<R[]>([])
  const relatedItems = signal<R[]>(isFrm008 ? [{ id: "10", kind: "Ürün", code: "U003", name: "Ürün 003", desc: "Üretim Yeri 001" }] : [])
  const reviewers = signal<R[]>([])
  const customerMails = signal<R[]>([])
  const positions = signal<R[]>([])
  const sourceForms = signal<R[]>([])
  const notes = signal<{ id: number; text: string; at: string }[]>([])
  const note = signal("")

  const panelsOpen = [0, 1, 2, 3, 4, 5, 6].map(() => signal(true))
  const setAll = (open: boolean) => panelsOpen.forEach((s) => s.set(open))

  // ------------------------------------------------------------------ actions
  const startEdit = () => {
    saved = snapshot()
    editing.set(true)
    toast.info("Düzenleme modu: alanlar ve tablo eylemleri açıldı.")
  }
  const save = () => {
    if (!name().trim()) {
      void dialogs.alert({ heading: "Eksik bilgi", message: "Dokümanın Adı boş olamaz." })
      return
    }
    saved = snapshot()
    editing.set(false)
    toast.success(`${base.no} kaydedildi (mockup: sunucuya gönderilmedi).`)
  }
  const cancelEdit = async () => {
    if (dirty() && !(await dialogs.confirm({ heading: "Değişiklikler", message: "Yaptığınız değişiklikler geri alınsın mı?", confirmText: "Geri al", variant: "danger" }))) return
    const [k, n, no, od, pd, vu, en] = JSON.parse(saved) as string[]
    kind.set(k), name.set(n), nameOther.set(no), ownerDept.set(od), preparedDept.set(pd), validUntil.set(vu), enforcement.set(en)
    editing.set(false)
  }
  const canClose = async () =>
    !dirty() ||
    dialogs.confirm({
      heading: "Kaydedilmemiş değişiklikler",
      message: `${base.no} formunda kaydedilmemiş değişiklikler var. Kapatılsın mı?`,
      variant: "danger",
      confirmText: "Kapat",
      cancelText: "Forma dön",
    })
  // The tab's beforeClose guard asks about unsaved changes (the × of the tab goes the same way).
  const close = () => onClose()
  const showHistory = () =>
    dialogs.open({
      heading: `${base.no} · Tarihçe`,
      size: "lg",
      content: html`<bz-table
        .columns=${[col("at", "Tarih/Saat"), col("step", "Adım"), col("user", "Kullanıcı"), col("note", "Açıklama")]}
        .rows=${[
          { id: 1, at: "17.07.2026 15:55", step: "Hazırlama", user: "Test User 10", note: "Form oluşturuldu" },
          { id: 2, at: "17.07.2026 16:02", step: "Dokümantasyon Sorumlusu Onayı", user: "Test User 10", note: "Onaylandı" },
          { id: 3, at: "18.07.2026 09:10", step: "Yürürlüğe Alma", user: "Test User 10", note: "Bekliyor" },
        ]}
      ></bz-table><p class="note">Örnek veri (mockup).</p>`,
      footer: (ref) => html`<bz-button @click=${() => void ref.close()}>Kapat</bz-button>`,
    })
  const onTool = (value: string) => {
    if (value === "Tarihçe") return void showHistory()
    if (value === "Formu Yeniden Yükle") return toast.info("Form yeniden yüklendi (mockup).")
    toast.info(`${value} (mockup)`)
  }
  const showOriginal = () =>
    dialogs.open({
      heading: "Orijinal Doküman",
      size: "sm",
      content: html`<div class="stack-sm">
        <div class="row">${icon("file-text", { size: 32 })}<div><strong>${base.original.name}</strong><br /><span class="muted small">${base.original.size}</span></div></div>
        <p class="note">Word dosyası; önizleme ve indirme mockup'ta devre dışı.</p>
      </div>`,
      footer: (ref) => html`<bz-button @click=${() => (toast.info("İndirme (mockup)"), void ref.close())}>${icon("download")} İndir</bz-button>
        <bz-button variant="primary" @click=${() => (toast.info("Önizleme (mockup)"), void ref.close())}>${icon("eye")} Önizle</bz-button>`,
    })
  let nextId = 100
  const addRelated = (kindName?: string) => {
    relatedItems.update((rows) => [...rows, { id: String(++nextId), kind: kindName ?? "", code: `YENİ-${nextId}`, name: `${kindName} kaydı`, desc: "Mockup ile eklendi" }])
    toast.success(`${kindName} eklendi.`)
  }
  const addNote = () => {
    if (!note().trim()) return
    notes.update((n) => [{ id: Date.now(), text: note().trim(), at: new Date().toLocaleString("tr-TR") }, ...n])
    note.set("")
  }

  // ------------------------------------------------------------------ view
  /** Evet/Hayır cell: a checkbox, editable in edit mode. */
  const yesNo = <T extends R>(rows: Signal<T[]>, key: string, label: string) => (value: unknown, row: T) =>
    html`<bz-checkbox aria-label=${label} .checked=${value === "Evet"} ?readonly=${() => !editing()}
      @change=${(e: CustomEvent<{ checked: boolean }>) =>
        rows.update((list) => list.map((r) => (r === row ? { ...r, [key]: e.detail.checked ? "Evet" : "Hayır" } : r)))}
    >${value === "Evet" ? "Evet" : "Hayır"}</bz-checkbox>`
  const ro = () => !editing()
  const field = (label: string, value: () => string, extra = "") =>
    html`<bz-input label=${label} .value=${value} readonly class=${extra}></bz-input>`
  const text = (label: string, s: typeof name, required = false) =>
    html`<bz-input label=${label} .value=${s} ?readonly=${ro} ?required=${required} @input=${(e: Event) => s.set((e.currentTarget as HTMLInputElement).value)}></bz-input>`
  const date = (label: string, s: typeof name) =>
    html`<bz-input label=${label} type="date" .value=${s} ?readonly=${ro} @input=${(e: Event) => s.set((e.currentTarget as HTMLInputElement).value)}></bz-input>`

  const general = html`
    <bz-form-layout class="qx-fields" columns="8" min-column-width="7.5rem">
      ${field("Doküman Numarası", () => base.no)}
      ${field("Revizyon No", () => String(base.rev))}
      ${field("Tarih/Saat", () => base.createdAt)}
      <div data-span="2">${field("Hazırlayan", () => base.preparedBy)}</div>
      <div data-span="2">${lookupField({ label: "Hazırlayan Bölüm", value: preparedDept, editable: editing, items: DEPARTMENTS })}</div>
      ${date("Geçerlilik Tarihi", validUntil)}

      <bz-combobox label="Doküman Türü" required .value=${kind} ?disabled=${ro} @change=${(e: CustomEvent<{ value: string }>) => kind.set(e.detail.value)}>
        ${DOC_KINDS.map((k) => html`<bz-option value=${k}>${k}</bz-option>`)}
      </bz-combobox>
      <div data-span="3">${text("Dokümanın Adı", name, true)}</div>
      <div data-span="2">${lookupField({ label: "Doküman Sahibi Bölüm", value: ownerDept, editable: editing, items: DEPARTMENTS })}</div>
      <div data-span="2">${text("Dokümanın Adı (Diğer Dil)", nameOther)}</div>

      ${field("İlk Yürürlük Tarihi", () => base.firstEnforcement || "")}
      ${date("Yürürlük Tarihi", enforcement)}
      <div data-span="3">
        <bz-input label="Orijinal Doküman" required readonly .value=${`${base.original.name} (${base.original.size})`}>
          <button slot="suffix" type="button" class="qx-trigger" aria-label="Orijinal dokümanı aç" data-tooltip="Aç / indir" @click=${showOriginal}>${icon("search")}</button>
        </bz-input>
      </div>
    </bz-form-layout>

    ${gridPanel({ title: "Orijinal Dokümanın Ekleri", open: panelsOpen[0], editable: editing, rows: attachments,
      columns: [col("order", "Sıra No", { width: "7rem" }), col("desc", "Açıklama"), col("file", "Orijinal Dokümanın Eki")],
      onAdd: () => { attachments.update((r) => [...r, { id: String(++nextId), order: r.length + 1, desc: "Yeni ek", file: "ek.pdf" }]) } })}
    ${gridPanel({ title: "İlişkili Dokümanlar", open: panelsOpen[1], editable: editing, rows: relatedDocs,
      columns: [col("no", "Doküman No"), col("rev", "Rev. No", { width: "6rem", align: "end" }), col("name", "Doküman Adı"), col("status", "Durum")],
      view: (r) => toast.info(`${r.no} açılır (mockup)`),
      onAdd: () => relatedDocs.update((r) => [...r, { id: String(++nextId), no: "FRM-007", rev: 0, name: "a", status: "Yürürlüğe Alma" }]) })}
    ${gridPanel({ title: "Yerine Geçtiği Dokümanlar", open: panelsOpen[2], editable: editing, rows: replaced,
      columns: [col("no", "Doküman No"), col("name", "Doküman Adı")],
      view: (r) => toast.info(`${r.no} açılır (mockup)`),
      onAdd: () => replaced.update((r) => [...r, { id: String(++nextId), no: "FRM-001", name: "test" }]) })}
    ${gridPanel({ title: "Dış Kaynaklı Dokümanlar", open: panelsOpen[3], editable: editing, rows: external,
      columns: [col("no", "Doküman No"), col("date", "Doküman Tarihi"), col("desc", "Açıklama"), col("file", "Dış Kaynaklı Doküman")],
      onAdd: () => external.update((r) => [...r, { id: String(++nextId), no: "ISO 9001", date: "15.09.2015", desc: "Standart", file: "iso9001.pdf" }]) })}
    ${gridPanel({ title: "Elektronik Dağıtım Listesi", open: panelsOpen[4], editable: editing, rows: eDistribution,
      columns: [col("code", "Bölüm Kodu", { width: "8rem" }), col("dept", "Bölüm"), col("sub", "Alt Bölüm Dağıtımı", { width: "10rem", format: yesNo(eDistribution, "sub", "Alt bölüm dağıtımı") })],
      onAdd: () => eDistribution.update((r) => [...r, { id: String(++nextId), code: "D001.3", dept: "Genel Müdürlük\\Kalite Kontrol Müdürlüğü", sub: "Evet" }]) })}
    ${gridPanel({ title: "Basılı Kopya Dağıtım Listesi", open: panelsOpen[5], editable: editing, rows: printed,
      columns: [col("code", "Bölüm Kodu", { width: "8rem" }), col("dept", "Bölüm"), col("count", "Çıktı Sayısı", { width: "8rem", align: "end" })],
      onAdd: () => printed.update((r) => [...r, { id: String(++nextId), code: "D001.5", dept: "Genel Müdürlük\\Üretim Müdürlüğü", count: 2 }]) })}
    ${gridPanel({ title: "Doküman ile İlgili Olanlar", open: panelsOpen[6], editable: editing, rows: relatedItems, addMenu: RELATED_ADD_MENU, onAdd: addRelated,
      columns: [col("kind", "İlgili", { width: "9rem" }), col("code", "Kodu", { width: "8rem" }), col("name", "Adı"), col("desc", "Açıklama")] })}
  `

  const view = html`
    <div class="qx-form">
      <div class="qx-form-head">
        <h2>Doküman Formu</h2>
        <span class="spacer"></span>
        <span class="small">Lokasyon: <a href="#lokasyon" class="qx-link">${base.location}</a> · İşlem Yetkilisi: <a href="#yetkili" class="qx-link">${base.authority}</a></span>
      </div>

      <bz-toolbar class="qx-toolbar qx-form-toolbar" label="Form işlemleri">
        ${() =>
          editing()
            ? html`<bz-button size="sm" variant="primary" @click=${save}>${icon("check")} Kaydet</bz-button>
                <bz-button size="sm" @click=${cancelEdit}>Vazgeç</bz-button>`
            : html`<bz-button size="sm" variant="ghost" @click=${startEdit}>${icon("edit")} Güncelle</bz-button>`}
        <bz-menu>
          <bz-button slot="trigger" size="sm" variant="ghost" disabled data-tooltip="Bu adımda işlem yetkiniz yok">İşlem Yap ▾</bz-button>
          <bz-menu-item value="enforce">Yürürlüğe Al</bz-menu-item>
          <bz-menu-item value="cancel" variant="danger">İptal Et</bz-menu-item>
        </bz-menu>
        <bz-menu @select=${(e: CustomEvent<{ value: string }>) => onTool(e.detail.value)}>
          <bz-button slot="trigger" size="sm" variant="ghost">${icon("settings")} Araçlar ▾</bz-button>
          ${TOOLS_MENU.map(([ic, label]) => html`<bz-menu-item value=${label} icon=${ic}>${label}</bz-menu-item>`)}
        </bz-menu>
        <bz-toolbar-spacer></bz-toolbar-spacer>
        <bz-button size="sm" variant="ghost" aria-label="Görüşler" data-tooltip="Görüşler" @click=${() => tab.set("reviews")}>${icon("list")}</bz-button>
        <bz-button size="sm" variant="ghost" aria-label="Dosyalar" data-tooltip="Dosyalar" @click=${showOriginal}>${icon("file")}</bz-button>
        <bz-button size="sm" variant="ghost" aria-label="Favorilere ekle" pressed=${() => String(favorite())}
          data-tooltip=${() => (favorite() ? "Favorilerden çıkar" : "Favorilere ekle")}
          @click=${() => (favorite.set(!favorite()), toast(favorite() ? "Favorilere eklendi." : "Favorilerden çıkarıldı."))}>${icon("star")}</bz-button>
        <span class="qx-docno">${base.no}</span>
        ${statusTag(base.status)}
        ${() => (dirty() ? html`<span class="qx-dirty" data-tooltip="Kaydedilmemiş değişiklik var">● değişti</span>` : null)}
        <bz-button size="sm" variant="ghost" aria-label="Tüm panelleri aç" data-tooltip="Tüm panelleri aç" @click=${() => setAll(true)}>${icon("plus")}</bz-button>
        <bz-button size="sm" variant="ghost" aria-label="Tüm panelleri kapat" data-tooltip="Tüm panelleri kapat" @click=${() => setAll(false)}>${icon("minus")}</bz-button>
        <bz-menu placement="bottom-end" @select=${() => toast.info("Form çıktısı hazırlanıyor (mockup).")}>
          <bz-button slot="trigger" size="sm" variant="ghost" aria-label="Yazdır" data-tooltip="Yazdır">${icon("download")}▾</bz-button>
          <bz-menu-item value="print" icon="file-text">Form Çıktısı</bz-menu-item>
        </bz-menu>
        <bz-button size="sm" variant="ghost" @click=${close}>${icon("x")} Kapat</bz-button>
      </bz-toolbar>

      <bz-tabs class="qx-form-tabs" .value=${tab} @change.self=${(e: CustomEvent<{ value: string }>) => tab.set(e.detail.value)}>
        <bz-tab-list>
          <bz-tab value="general">Genel Bilgiler</bz-tab>
          <bz-tab value="reviews">Görüşler</bz-tab>
          <bz-tab value="customer">Müşteri Onayı</bz-tab>
          <bz-tab value="training">Eğitim Gerekliliği</bz-tab>
          <bz-tab value="forms">İlişkili Formlar</bz-tab>
          <bz-tab value="notes">Notlar <bz-badge variant="primary" hide-zero .count=${() => notes().length}></bz-badge></bz-tab>
          <bz-tab value="mail">Yazışmalar</bz-tab>
        </bz-tab-list>
        <bz-tab-panel value="general">${general}</bz-tab-panel>
        <bz-tab-panel value="reviews">
          ${gridPanel({ title: "Görüş Bildirecek Kişiler", editable: editing, rows: reviewers,
            columns: [col("owner", "Sorumlu"), col("has", "Görüşünüz var mı?", { format: yesNo(reviewers, "has", "Görüşünüz var mı") }), col("opinion", "Görüş"), col("status", "Durum"), col("authority", "İşlem Yetkilisi")],
            onAdd: () => reviewers.update((r) => [...r, { id: String(++nextId), owner: "Test User 10", has: "Hayır", opinion: "", status: "Bekliyor", authority: "Test User 10" }]) })}
        </bz-tab-panel>
        <bz-tab-panel value="customer">
          ${gridPanel({ title: "Müşteri Onay Maili", editable: editing, rows: customerMails,
            columns: [col("def", "Dosya Tanımı"), col("size", "Boyut"), col("by", "Ekleyen"), col("date", "Tarih"), col("file", "Dosya Adı"), col("desc", "Açıklama")],
            onAdd: () => customerMails.update((r) => [...r, { id: String(++nextId), def: "Onay maili", size: "12 KB", by: "Test User 10", date: "28.09.2026", file: "onay.msg", desc: "" }]) })}
        </bz-tab-panel>
        <bz-tab-panel value="training">
          ${gridPanel({ title: "Eğitim Alması Gereken Pozisyonlar", editable: editing, rows: positions,
            columns: [col("code", "Pozisyon Kodu"), col("name", "Pozisyon Adı"), col("deptCode", "Bölüm Kodu"), col("dept", "Bölüm Adı")],
            onAdd: () => positions.update((r) => [...r, { id: String(++nextId), code: "P-014", name: "Kalite Uzmanı", deptCode: "D001.3", dept: "Kalite Kontrol Müdürlüğü" }]) })}
        </bz-tab-panel>
        <bz-tab-panel value="forms">
          ${gridPanel({ title: "Kaynak Formlar", editable: editing, rows: sourceForms,
            columns: [col("kind", "İlgili"), col("no", "Form No"), col("desc", "Açıklama"), col("status", "Durum")] })}
          <bz-panel heading="Referans Gösterilenler" collapsible open>
            <p class="muted small qx-pad">Bu dokümanı referans gösteren kayıt: 1 (QMEX'te sütunlar boş geliyor).</p>
          </bz-panel>
        </bz-tab-panel>
        <bz-tab-panel value="notes">
          <div class="stack-sm qx-pad">
            <bz-textarea label="Yeni not" rows="2" autosize max-rows="10" expandable show-count maxlength="2000" placeholder="Not yazın…"
              expand-heading="Not" .labels=${TEXTAREA_TR} .value=${note} @input=${(e: Event) => note.set((e.currentTarget as HTMLInputElement).value)}></bz-textarea>
            <div class="row"><bz-button size="sm" variant="primary" ?disabled=${() => !note().trim()} @click=${addNote}>Not ekle</bz-button></div>
            ${() =>
              notes().length
                ? html`<ul class="qx-notes">${notes().map((n) => html`<li><bz-avatar name="Test User 10" size="sm" decorative></bz-avatar><div><strong>Test User 10</strong> <span class="muted small">${n.at}</span><p>${n.text}</p></div></li>`)}</ul>`
                : html`<p class="qx-empty">${icon("file-text", { size: 28 })}<br />Henüz not yok.</p>`}
          </div>
        </bz-tab-panel>
        <bz-tab-panel value="mail">
          <p class="qx-empty">${icon("mail", { size: 28 })}<br />Bu doküman için yazışma yok.</p>
        </bz-tab-panel>
      </bz-tabs>
    </div>
  `
  return { view, canClose, isDirty: () => dirty.peek() }
}
