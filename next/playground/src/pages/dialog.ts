import { computed, html, signal, type Signal } from "@bazlama/core"
import { dialogs, type Column, type DialogRef } from "@bazlama/headless"
import { customer, customers, type Customer } from "../data"
import { dialogUsage } from "../docs/specs"
import { usage } from "../docs/usage"
import { log, logEntry } from "../log"

const money = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" })

// ---------------------------------------------------------------------------------------
// Nested scenario: order form → customer picker → new customer form (3 levels).

const customerColumns: Column<Customer>[] = [
  { key: "name", header: "Ad Soyad", sortable: true },
  { key: "city", header: "Şehir", sortable: true },
  { key: "email", header: "E-posta" },
]

/** Level 3: new customer. Resolves with the created customer. */
function newCustomerDialog(): DialogRef<Customer> {
  const name = signal("")
  const city = signal("")
  const dirty = () => name() !== "" || city() !== ""
  return dialogs.open<Customer>({
    heading: "Yeni müşteri",
    size: "sm",
    beforeClose: (reason) =>
      reason === "api" || !dirty() ? true : dialogs.confirm({ message: "Girilen bilgiler kaybolacak. Kapatılsın mı?", variant: "danger", confirmText: "Kapat" }),
    content: (ref) => html`<form
      id="new-customer"
      class="stack"
      @submit=${(e: Event) => {
        e.preventDefault()
        void ref.close({ ...customer(), name: name(), city: city() || "İstanbul" })
      }}
    >
      <bz-input label="Ad Soyad" required autofocus .value=${name} @input=${(e: Event) => name.set((e.currentTarget as HTMLInputElement).value)}></bz-input>
      <bz-input label="Şehir" .value=${city} @input=${(e: Event) => city.set((e.currentTarget as HTMLInputElement).value)}></bz-input>
      <p class="note">Bir şey yazıp Esc'ye basın: kaydedilmemiş değişiklik onayı dördüncü seviyede açılır.</p>
    </form>`,
    footer: (ref) => html`
      <bz-button @click=${() => void ref.close()}>Vazgeç</bz-button>
      <bz-button variant="primary" @click=${() => (document.getElementById("new-customer") as HTMLFormElement).requestSubmit()}>Kaydet</bz-button>
    `,
  })
}

/** Level 2: customer picker. Resolves with the selected customer. */
function customerPicker(list: Signal<Customer[]>): DialogRef<Customer> {
  const query = signal("")
  const filtered = computed(() => {
    const q = query().toLocaleLowerCase("tr-TR")
    return q ? list().filter((c) => c.name.toLocaleLowerCase("tr-TR").includes(q) || c.city.toLocaleLowerCase("tr-TR").includes(q)) : list()
  })
  return dialogs.open<Customer>({
    heading: "Müşteri seç",
    size: "lg",
    content: (ref) => html`<div class="stack-sm">
      <div class="row">
        <bz-input placeholder="Ad veya şehir ara" autofocus .value=${query} @input=${(e: Event) => query.set((e.currentTarget as HTMLInputElement).value)}></bz-input>
        <span class="spacer"></span>
        <bz-button @click=${async () => {
          const created = await newCustomerDialog()
          if (!created) return
          list.update((l) => [created, ...l])
          logEntry("yeni müşteri", "created", created.name)
          void ref.close(created) // picked right away
        }}>+ Yeni müşteri</bz-button>
      </div>
      <div class="dialog-table">
        <bz-table label="Müşteriler" .columns=${customerColumns} .rows=${filtered} @row-click=${(e: CustomEvent<{ row: Customer }>) => void ref.close(e.detail.row)}></bz-table>
      </div>
      <p class="note">Satıra tıklayınca müşteri forma döner. "Yeni müşteri" üçüncü seviyeyi açar.</p>
    </div>`,
  })
}

/** Level 1: order form. */
function orderForm(list: Signal<Customer[]>) {
  const picked = signal<Customer | null>(null)
  const amount = signal("")
  const note = signal("")
  const dirty = () => !!picked() || amount() !== "" || note() !== ""
  const ref = dialogs.open<{ customer: Customer; amount: number }>({
    heading: "Yeni sipariş",
    beforeClose: (reason) =>
      reason === "api" || !dirty()
        ? true
        : dialogs.confirm({ heading: "Kaydedilmemiş değişiklikler", message: "Sipariş formunu kapatırsanız girdiğiniz bilgiler kaybolur.", variant: "danger", confirmText: "Kapat", cancelText: "Düzenlemeye devam et" }),
    content: html`<form id="order-form" class="stack" @submit=${(e: Event) => {
      e.preventDefault()
      const c = picked()
      if (!c) {
        void dialogs.alert({ heading: "Eksik bilgi", message: "Önce bir müşteri seçin." })
        return
      }
      void ref.close({ customer: c, amount: Number(amount()) || 0 })
    }}>
      <div class="picker-field">
        <span class="muted small">Müşteri</span>
        <div class="row">
          <strong>${() => picked()?.name ?? "Seçilmedi"}</strong>
          <span class="muted small">${() => picked()?.city ?? ""}</span>
          <span class="spacer"></span>
          <bz-button size="sm" @click=${async () => {
            const c = await customerPicker(list)
            if (c) picked.set(c)
          }}>Müşteri seç…</bz-button>
        </div>
      </div>
      <bz-input label="Tutar (₺)" type="number" .value=${amount} @input=${(e: Event) => amount.set((e.currentTarget as HTMLInputElement).value)}></bz-input>
      <bz-input label="Not" .value=${note} @input=${(e: Event) => note.set((e.currentTarget as HTMLInputElement).value)}></bz-input>
    </form>`,
    footer: html`
      <bz-button @click=${() => void ref.close()}>Vazgeç</bz-button>
      <bz-button variant="primary" @click=${() => (document.getElementById("order-form") as HTMLFormElement).requestSubmit()}>Siparişi kaydet</bz-button>
    `,
  })
  return ref
}

export default {
  id: "dialog",
  title: "Dialog / Modal",
  description:
    "Native <dialog> (showModal) üzerine kurulu modal ve bir dialog manager. İç içe açılan dialoglar bir yığında yönetilir: Esc ve arka plana tıklama sadece en üsttekini kapatır, bir dialog kapanırken üstündekiler de kapanır, odak açan elemente döner, sayfa kaydırması kilitlenir.",
  render() {
    const list = signal(customers(30))
    const orders = signal<{ id: number; text: string }[]>([])
    const declarativeOpen = signal(false)
    let orderId = 0

    const startOrder = async () => {
      const order = await orderForm(list)
      if (!order) return logEntry("sipariş", "iptal")
      orders.update((l) => [{ id: ++orderId, text: `${order.customer.name} · ${money.format(order.amount)}` }, ...l])
      logEntry("sipariş", "kaydedildi", order.customer.name)
    }

    return html`
      ${usage(dialogUsage)}

      <section class="demo">
        <h2>İç içe dialoglar: sipariş formu</h2>
        <div class="grid-2">
          <div class="stack-sm">
            <div class="row">
              <bz-button variant="primary" @click=${startOrder}>Yeni sipariş…</bz-button>
            </div>
            <ol class="plain-list" ?hidden=${() => orders().length === 0}>
              ${() => orders().map((o) => html`<li>${o.text}</li>`)}
            </ol>
          </div>
          <div class="stack-sm">
            <p class="note">
              <b>1.</b> Sipariş formu → <b>2.</b> "Müşteri seç" tablosu → <b>3.</b> "Yeni müşteri" formu → <b>4.</b> kaydedilmemiş
              değişiklik onayı. Her seviye <code>await</code> ile sonucunu bir alttakine verir.
            </p>
            <p class="note">
              Formda bir şey değiştirip Esc'ye basın veya arka plana tıklayın: <code>beforeClose</code> bir onay dialogu açar,
              "Düzenlemeye devam et" kapanmayı iptal eder.
            </p>
          </div>
        </div>
      </section>

      <section class="demo">
        <h2>Yığın (canlı)</h2>
        <p class="muted small">Açık dialoglar alttan üste; <code>dialogs.stack()</code> reaktif bir signal'dir.</p>
        <ol class="dialog-stack">
          ${() =>
            dialogs.stack().length
              ? dialogs.stack().map(
                  (el, i) => html`<li>
                    <code>${`#${i + 1}`}</code> ${(el as HTMLElement & { heading: string }).heading || "(başlıksız)"}
                    ${i === dialogs.stack().length - 1 ? html`<span class="badge">üstte</span>` : null}
                  </li>`
                )
              : html`<li class="muted">Açık dialog yok</li>`}
        </ol>
      </section>

      <section class="demo">
        <h2>Onay ve bilgi</h2>
        <div class="row">
          <bz-button @click=${async () => logEntry("confirm", "sonuç", String(await dialogs.confirm("Devam edilsin mi?")))}>dialogs.confirm()</bz-button>
          <bz-button variant="danger" @click=${async () => {
            const ok = await dialogs.confirm({ heading: "Kaydı sil", message: "Bu işlem geri alınamaz.", variant: "danger", confirmText: "Sil" })
            logEntry("silme onayı", "sonuç", String(ok))
          }}>Silme onayı (danger)</bz-button>
          <bz-button @click=${async () => {
            await dialogs.alert({ heading: "Bilgi", message: "İşlem tamamlandı." })
            logEntry("alert", "kapandı")
          }}>dialogs.alert()</bz-button>
        </div>
        <p class="note">Danger onayında ilk odak "Vazgeç" butonundadır; Enter'a yanlışlıkla basmak silmez.</p>
      </section>

      <section class="demo">
        <h2>HTML ile tanımlı dialog</h2>
        <div class="row">
          <bz-button @click=${() => declarativeOpen.set(true)}>Aç (open özelliği)</bz-button>
          <span class="muted small">open = ${() => String(declarativeOpen())}</span>
        </div>
        <bz-dialog
          heading="Profil"
          .open=${declarativeOpen}
          @open=${log("profil")}
          @close=${(e: CustomEvent) => {
            declarativeOpen.set(false)
            log("profil")(e)
          }}
        >
          <div class="stack">
            <bz-input label="Ad" value="Ada Yılmaz"></bz-input>
            <bz-combobox label="Şehir" value="izmir">
              <bz-option value="istanbul">İstanbul</bz-option>
              <bz-option value="ankara">Ankara</bz-option>
              <bz-option value="izmir">İzmir</bz-option>
            </bz-combobox>
            <p class="note">Combobox açıkken Esc sadece listeyi kapatır, dialog açık kalır.</p>
          </div>
          <bz-button slot="footer" @click=${(e: Event) => void (e.currentTarget as HTMLElement).closest("bz-dialog")!.close()}>Kapat</bz-button>
          <bz-button slot="footer" variant="primary" @click=${(e: Event) => void (e.currentTarget as HTMLElement).closest("bz-dialog")!.close("saved")}>Kaydet</bz-button>
        </bz-dialog>
      </section>

      <section class="demo">
        <h2>Boyutlar ve kalıcı dialog</h2>
        <div class="row">
          ${["sm", "md", "lg", "xl", "full"].map(
            (size) => html`<bz-button size="sm" @click=${() =>
              dialogs.open({ heading: `size="${size}"`, size, content: html`<p>Genişlik <code>--bz-dialog-width</code> ile de ayarlanabilir.</p>` })}>${size}</bz-button>`
          )}
          <bz-button size="sm" variant="ghost" @click=${() =>
            dialogs.open({
              heading: "Kalıcı (persistent)",
              persistent: true,
              content: html`<p>Esc ve arka plana tıklama kapatmaz; dialog kısa bir sarsıntıyla (<code>[data-refused]</code>) tepki verir.</p>`,
              footer: (r: DialogRef) => html`<bz-button variant="primary" @click=${() => void r.close()}>Anladım</bz-button>`,
            })}>persistent</bz-button>
          <bz-button size="sm" variant="ghost" @click=${() =>
            dialogs.open({
              heading: "Uzun içerik",
              content: html`${Array.from({ length: 40 }, (_, i) => html`<p>Paragraf ${i + 1}</p>`)}`,
              footer: (r: DialogRef) => html`<bz-button @click=${() => void r.close()}>Kapat</bz-button>`,
            })}>Uzun içerik</bz-button>
        </div>
        <p class="note">Uzun içerikte başlık ve alt bölüm sabit kalır, sadece gövde kayar.</p>
      </section>

      <section class="demo">
        <h2>Davranış</h2>
        <table class="api">
          <tbody>
            <tr><td><kbd>Esc</kbd></td><td>En üstteki dialogu kapatır (persistent değilse). İçerideki bir bileşen Esc'yi kullanırsa (<code>preventDefault</code>) dialog açık kalır.</td></tr>
            <tr><td>Arka plan</td><td>Tıklama en üstteki dialogu kapatır. İçeride basılıp dışarıda bırakılan sürükleme kapatmaz.</td></tr>
            <tr><td><kbd>Tab</kbd></td><td>Odak en üstteki dialogun içinde kalır; alttakiler ve sayfa etkisizdir (native top layer).</td></tr>
            <tr><td>Kapanma sırası</td><td>Bir dialog kapanırken önce üstündekiler kapanır; herhangi birinin guard'ı reddederse işlem durur.</td></tr>
            <tr><td>Odak dönüşü</td><td>Dialog kapanınca odak onu açan elemente döner.</td></tr>
            <tr><td>İlk odak</td><td><code>autofocus</code> özniteliği olan eleman, yoksa ilk odaklanabilir eleman.</td></tr>
          </tbody>
        </table>
      </section>
    `
  },
}
