import { html, signal } from "@bazlama/core"
import { formatBytes, type FileUploadElement, type Uploader } from "@bazlama/headless"
import { fileUploadUsage } from "../docs/specs-forms"
import { usage } from "../docs/usage"
import { log, logEntry } from "../log"

const TR_LABELS = {
  prompt: "Dosyaları buraya sürükleyip bırakın",
  browse: "Dosya seçin",
  drop: "Bırakın",
  remove: "Kaldır",
  retry: "Tekrar dene",
  uploading: "Yükleniyor",
  done: "Yüklendi",
  failed: "Başarısız",
  required: "En az bir dosya ekleyin.",
  tooLarge: "{name} dosyası {max} sınırını aşıyor.",
  tooMany: "En fazla {n} dosya ekleyebilirsiniz.",
  wrongType: "{name} kabul edilen bir dosya türü değil.",
  networkError: "Yükleme başarısız.",
  maxFilesNote: "en fazla {n} dosya",
}

/**
 * A fake transport for the demos: no server here. It reports progress on a timer, honours
 * cancel, and fails every third file so "retry" can be tried.
 */
function demoUploader(failEvery = 3): Uploader {
  let sent = 0
  return (file, { onProgress, signal }) =>
    new Promise((resolve, reject) => {
      const index = ++sent
      // Bigger files "take" longer, but never more than a few seconds.
      const step = Math.max(0.04, 0.25 - Math.min(0.2, file.size / (20 * 1024 * 1024)))
      let done = 0
      const timer = setInterval(() => {
        done += step
        onProgress(Math.min(1, done))
        if (done < 1) return
        clearInterval(timer)
        if (failEvery > 0 && index % failEvery === 0) reject(new Error("Sunucu 500 döndü"))
        else resolve({ id: index, name: file.name })
      }, 180)
      signal.addEventListener("abort", () => clearInterval(timer))
    })
}

export default {
  id: "file-upload",
  title: "File upload",
  description:
    "Dosya alanı: seçim, sürükle-bırak, tür/boyut/sayı doğrulaması ve dosya listesi. Varsayılan olarak sadece toplar (dosyalar formun değeri olur); url ya da uploader verilirse dosyaları kendisi gönderir — gerçek ilerleme, iptal ve tekrar deneme ile.",
  render() {
    const picked = signal<string[]>([])
    let manual: FileUploadElement | null = null
    // A function in a binding is reactive, so a function *value* is passed as `${() => fn}`.
    const failingUploader = demoUploader(3)
    const steadyUploader = demoUploader(0)
    return html`
      ${usage(fileUploadUsage)}

      <section class="demo">
        <h2>Sadece toplar (form değeri)</h2>
        <form
          class="stack-sm"
          @submit=${(e: Event) => {
            e.preventDefault()
            const data = new FormData(e.currentTarget as HTMLFormElement)
            logEntry("form", "submit", [...data.getAll("ekler")].map((f) => (f as File).name).join(", ") || "(boş)")
          }}
        >
          <bz-file-upload
            name="ekler"
            label="Ekler"
            multiple
            preview
            accept=".pdf,.png,.jpg,.jpeg"
            max-size=${5 * 1024 * 1024}
            max-files="5"
            hint="PDF ve görseller. Form gönderildiğinde dosyalar formla birlikte gider."
            .labels=${TR_LABELS}
            @change=${(e: Event) => picked.set((e as CustomEvent<{ files: { name: string }[] }>).detail.files.map((f) => f.name))}
            @reject=${log("file-upload")}
          ></bz-file-upload>
          <div class="row">
            <bz-button type="submit" variant="primary">Gönder</bz-button>
            <bz-button type="reset">Sıfırla</bz-button>
          </div>
        </form>
        <p class="note">
          Seçili: <code>${() => picked().join(", ") || "—"}</code>. Bu modda ağ isteği yoktur: dosyalar
          <code>ElementInternals.setFormValue</code> ile formun değeri olur, sıradan bir <code>multipart/form-data</code> gönderimiyle
          gider.
        </p>
      </section>

      <section class="demo">
        <h2>Kendi yükler (ilerleme, hata, tekrar dene)</h2>
        <bz-file-upload
          label="Belgeler"
          multiple
          preview
          max-size=${20 * 1024 * 1024}
          hint="Demo: gerçek sunucu yok, sahte bir taşıyıcı ilerlemeyi üretir ve her üçüncü dosyayı hata verir."
          .labels=${TR_LABELS}
          .uploader=${() => failingUploader}
          @upload-success=${log("upload")}
          @upload-error=${log("upload")}
          @complete=${log("upload")}
        ></bz-file-upload>
        <p class="note">
          Gerçekte <code>url="/api/upload"</code> yeterli: bileşen her dosyayı ayrı ayrı XHR ile gönderir (<code>field-name</code>,
          <code>method</code>, <code>headers</code>, <code>with-credentials</code> ile ayarlanır). Yükleme fetch ile değil XHR ile
          yapılır; gövdeyi akıtmadan gerçek yükleme ilerlemesini yalnızca XHR bildirir. Bir dosyayı yüklenirken kaldırmak isteği
          iptal eder.
        </p>
      </section>

      <section class="demo">
        <h2>manual: gönderimi uygulama başlatır</h2>
        <bz-file-upload
          label="Toplu yükleme"
          multiple
          manual
          .labels=${TR_LABELS}
          .uploader=${() => steadyUploader}
          ref=${(el: FileUploadElement) => (manual = el)}
        ></bz-file-upload>
        <div class="row">
          <bz-button variant="primary" @click=${() => void manual?.upload()}>Yüklemeyi başlat</bz-button>
          <bz-button @click=${() => manual?.clear()}>Listeyi boşalt</bz-button>
        </div>
        <p class="note">
          <code>manual</code> ile dosyalar eklenince beklenir; <code>el.upload()</code> bekleyen ve hatalı olanları gönderir.
          Ayrıca <code>el.files</code>, <code>el.addFiles(list)</code>, <code>el.retry(id)</code>, <code>el.removeFile(id)</code>
          ve <code>el.clear()</code> vardır.
        </p>
      </section>

      <section class="demo">
        <h2>Tek dosya, zorunlu ve kapalı</h2>
        <div class="stack-sm">
          <bz-file-upload
            label="Profil fotoğrafı"
            accept="image/*"
            preview
            max-size=${512 * 1024}
            hint=${`Tek görsel, en çok ${formatBytes(512 * 1024)}.`}
            .labels=${TR_LABELS}
          ></bz-file-upload>
          <bz-file-upload label="Zorunlu alan" required .labels=${TR_LABELS}></bz-file-upload>
          <bz-file-upload label="Kapalı" disabled .labels=${TR_LABELS}></bz-file-upload>
        </div>
        <p class="note">
          <code>multiple</code> yokken yeni seçim eskisinin yerine geçer. <code>required</code> alanı
          <code>ElementInternals.setValidity</code> ile forma geçersiz bildirir, yani gönderim native olarak engellenir.
        </p>
      </section>
    `
  },
}
