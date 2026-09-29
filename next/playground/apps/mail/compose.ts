import { html, signal } from "@bazlama/core"
import { dialogs, icon, toast } from "@bazlama/headless"
import { contacts, send, type Mail } from "./store"

const LOOKUP_TR = { select: "Kişi seç", clear: "Temizle", search: "Kişi ara", ok: "Seç", cancel: "Vazgeç", empty: "Kişi bulunamadı", required: "Alıcı seçin." }
const TEXTAREA_TR = { expand: "Genişlet", apply: "Uygula", cancel: "Vazgeç", close: "Kapat" }

/** The compose dialog (new message or reply). Resolves true when sent. */
export async function compose(reply?: Mail): Promise<boolean> {
  const to = signal(reply ? (contacts.find((c) => c.email === reply.email)?.id ?? "") : "")
  const subject = signal(reply ? `Ynt: ${reply.subject}` : "")
  const body = signal(reply ? `\n\n----- ${reply.from} yazdı -----\n${reply.body}` : "")
  const receipt = signal(false)
  const attachments = signal<string[]>([])
  const dirty = () => !!(to() || subject().trim() || body().trim())

  const sent = await dialogs.open<boolean>({
    heading: reply ? "Yanıtla" : "Yeni ileti",
    size: "lg",
    beforeClose: (_reason, result) =>
      result === true || !dirty() || dialogs.confirm({ heading: "Taslak silinsin mi?", message: "Yazdıklarınız kaybolacak.", confirmText: "Sil", cancelText: "Yazmaya devam et", variant: "danger" }),
    content: (ref) => html`<form id="compose" @submit=${(e: SubmitEvent) => {
      e.preventDefault()
      void ref.close(true)
    }}>
      <bz-form-layout columns="1">
        <bz-lookup label="Kime" name="to" required clearable .labels=${LOOKUP_TR}
          .columns=${[{ key: "name", header: "Ad", width: "12rem" }, { key: "email", header: "E-posta" }, { key: "team", header: "Ekip", width: "7rem" }]}
          .rows=${contacts} display-key="name" dialog-size="lg"
          .value=${to} @change=${(e: CustomEvent<{ value: string }>) => to.set(e.detail.value)}></bz-lookup>
        <bz-input label="Konu" name="subject" required .value=${subject} @input=${(e: Event) => subject.set((e.currentTarget as HTMLInputElement).value)}></bz-input>
        <bz-textarea label="İleti" name="body" rows="8" autosize max-rows="18" expandable .labels=${TEXTAREA_TR}
          .value=${body} @input=${(e: Event) => body.set((e.currentTarget as HTMLTextAreaElement).value)}></bz-textarea>
        <div class="row">
          ${() =>
            attachments().map(
              (a) => html`<bz-chip removable icon="paperclip" remove-label="Kaldır" @remove=${() => attachments.update((l) => l.filter((x) => x !== a))}>${a}</bz-chip>`
            )}
          <bz-button size="sm" variant="ghost" @click=${() => attachments.update((l) => [...l, `ek-${l.length + 1}.pdf`])}>${icon("paperclip")} Dosya ekle</bz-button>
        </div>
        <bz-checkbox .checked=${receipt} @change=${(e: CustomEvent<{ checked: boolean }>) => receipt.set(e.detail.checked)}>Okundu bilgisi iste</bz-checkbox>
      </bz-form-layout>
    </form>`,
    footer: (ref) => html`<bz-button @click=${() => void ref.close()}>Vazgeç</bz-button>
      <bz-button variant="primary" @click=${() => (document.getElementById("compose") as HTMLFormElement | null)?.requestSubmit()}>${icon("send")} Gönder</bz-button>`,
  })
  if (!sent) return false
  const recipient = contacts.find((c) => c.id === to.peek())
  await toast.promise(new Promise((r) => setTimeout(r, 900)), { loading: "Gönderiliyor…", success: `İleti ${recipient?.name ?? ""} kişisine gönderildi.`, error: "Gönderilemedi." })
  send(recipient?.email ?? "", subject.peek(), body.peek())
  return true
}
