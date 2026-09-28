import { html, signal } from "@bazlama/core"
import { dialogs, toast, type ToastPlacement } from "@bazlama/headless"
import { toastUsage } from "../docs/specs-feedback"
import { usage } from "../docs/usage"
import { logEntry } from "../log"

const PLACEMENTS: ToastPlacement[] = ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"]

const wait = <T>(ms: number, value: T, fail = false) =>
  new Promise<T>((resolve, reject) => setTimeout(() => (fail ? reject(new Error("Sunucuya ulaşılamadı")) : resolve(value)), ms))

export default {
  id: "toast",
  title: "Toast",
  description:
    "Kısa süreli bildirimler. toast(), toast.success/error/warning/info ve toast.promise. Süre dolunca kapanır; üzerine gelince veya odaklanınca durur. Modal açıkken de görünür ve tıklanabilir.",
  render() {
    const placement = signal<ToastPlacement>(toast.defaults.placement)
    let count = 0

    return html`
      ${usage(toastUsage)}

      <section class="demo">
        <h2>Türler</h2>
        <div class="row">
          <bz-button @click=${() => toast("Ayarlar kaydedildi.")}>toast()</bz-button>
          <bz-button @click=${() => toast.success("Sipariş #1042 oluşturuldu.", { title: "Kaydedildi" })}>success</bz-button>
          <bz-button @click=${() => toast.warning("Stok 5'in altına düştü.", { title: "Uyarı" })}>warning</bz-button>
          <bz-button @click=${() => toast.error("Sunucuya ulaşılamadı. Tekrar deneyin.", { title: "Hata" })}>error</bz-button>
          <bz-button @click=${() => toast.info({ title: "Bilgi", message: html`Yeni sürüm hazır: <b>v2.4</b>` })}>zengin içerik</bz-button>
        </div>
        <p class="note">Hatalar <code>role="alert"</code> ile anında okunur ve varsayılan olarak iki kat uzun kalır; diğerleri <code>role="status"</code>.</p>
      </section>

      <section class="demo">
        <h2>Eylem, kalıcı ve güncelleme</h2>
        <div class="row">
          <bz-button @click=${() => {
            const n = ++count
            toast({
              message: `Kayıt #${n} silindi.`,
              action: { label: "Geri al", onClick: (ref) => {
                ref.close()
                toast.success(`Kayıt #${n} geri alındı.`)
                logEntry("toast", "geri al", `#${n}`)
              } },
            })
          }}>Sil (geri al)</bz-button>
          <bz-button @click=${() => toast({ title: "Bakım", message: "Bu akşam 22:00'de 15 dk kesinti olacak.", duration: 0 })}>Kalıcı (duration: 0)</bz-button>
          <bz-button @click=${() => {
            toast({ id: "sync", message: "Eşitleniyor…", loading: true })
            setTimeout(() => toast({ id: "sync", message: "Eşitleme tamamlandı.", variant: "success" }), 1500)
          }}>Aynı id ile güncelle</bz-button>
          <bz-button variant="ghost" @click=${() => toast.dismiss()}>Hepsini kapat</bz-button>
        </div>
      </section>

      <section class="demo">
        <h2>Promise</h2>
        <div class="row">
          <bz-button variant="primary" @click=${() =>
            toast.promise(wait(1500, 128), {
              loading: "Rapor hazırlanıyor…",
              success: (n) => ({ title: "Rapor hazır", message: `${n} satır` }),
              error: (e) => ({ title: "Rapor hatası", message: String((e as Error).message) }),
            })}>Başarılı işlem</bz-button>
          <bz-button @click=${() =>
            toast.promise(wait(1500, 0, true), {
              loading: "Kaydediliyor…",
              success: "Kaydedildi",
              error: (e) => ({ title: "Kaydedilemedi", message: String((e as Error).message) }),
            }).catch(() => logEntry("toast", "promise reddedildi"))}>Başarısız işlem</bz-button>
        </div>
        <p class="note"><code>toast.promise</code> promise'in kendisini döner; hata işleme sizde kalır.</p>
      </section>

      <section class="demo">
        <h2>Konum</h2>
        <div class="row">
          ${PLACEMENTS.map(
            (p) => html`<bz-button size="sm" pressed=${() => String(placement() === p)} @click=${() => {
              placement.set(p)
              toast({ message: `Konum: ${p}`, placement: p })
            }}>${p}</bz-button>`
          )}
        </div>
        <p class="note">Varsayılan: <code>toast.defaults.placement</code>. Konum başına en fazla <code>toast.defaults.max</code> (5) bildirim; fazlası en eskiden kapanır.</p>
      </section>

      <section class="demo">
        <h2>Modal açıkken</h2>
        <div class="row">
          <bz-button @click=${() =>
            dialogs.open({
              heading: "Toast modal üstünde",
              content: html`<p>Dialog açıkken gelen bildirim üstte görünür ve kapatma/eylem butonları çalışır.</p>
                <bz-button @click=${() => toast.success("Dialog içinden gönderildi.", { action: { label: "Tamam", onClick: (r) => r.close() } })}>Toast göster</bz-button>`,
            })}>Dialog aç</bz-button>
        </div>
        <p class="note">
          Toast kabı bir manual popover'dır (top layer). Modal açıkken tarayıcı sayfanın geri kalanını etkisiz (inert) yapar; bu yüzden kap
          en üstteki dialogun içine taşınır, dialog kapanınca geri döner.
        </p>
      </section>
    `
  },
}
