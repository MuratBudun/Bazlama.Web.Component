import { computed, signal } from "@bazlama/core"
import type { TreeItem } from "@bazlama/headless"
import { daysAgo, emailOf, fullName, pick, random } from "../shared/data"

export type Folder = "gelen" | "yildizli" | "gonderilen" | "taslak" | "arsiv" | "cop"
export interface Mail {
  id: number
  folder: Folder
  from: string
  email: string
  to: string
  subject: string
  body: string
  at: Date
  unread: boolean
  starred: boolean
  labels: string[]
  attachments: string[]
}
export interface Contact {
  [key: string]: unknown
  id: string
  name: string
  email: string
  team: string
}

export const LABELS = ["İş", "Proje", "Fatura", "Kişisel", "Önemli"] as const
export const LABEL_VARIANT: Record<string, string> = { İş: "primary", Proje: "info", Fatura: "warning", Kişisel: "success", Önemli: "danger" }

const rnd = random(7)
const SUBJECTS = [
  ["Q3 bütçe taslağı", "Merhaba, Q3 bütçe taslağını ekte bulabilirsiniz. Pazartesi toplantısından önce yorumlarınızı bekliyorum."],
  ["Sprint 42 retrospektif notları", "Ekip, dünkü retrospektifin notlarını derledim. Aksiyonlar listenin sonunda; sahiplerini kontrol edelim."],
  ["Fatura #2026-0917", "Eylül ayı hizmet faturanız ektedir. Ödeme vadesi 15 gündür."],
  ["Yeni ofis taşınma planı", "Taşınma 14 Ekim hafta sonu yapılacak. Masalarınızdaki kişisel eşyaları cuma akşamına kadar kolilemenizi rica ederiz."],
  ["Müşteri demosu: geri bildirim", "Demo çok iyi geçti. Müşterinin özellikle raporlama ekranı ile ilgili üç talebi var, aşağıda listeledim."],
  ["Doğum günü kutlaması 🎂", "Cuma 16:00'da mutfakta küçük bir kutlama yapıyoruz, herkesi bekleriz!"],
  ["Güvenlik güncellemesi zorunlu", "Tüm dizüstü bilgisayarlar için güvenlik güncellemesi bu akşam 22:00'de otomatik yüklenecek."],
  ["Sözleşme revizyonu", "Hukuk ekibinin istediği değişiklikleri işaretledim. 4.2 ve 7.1 maddelerine özellikle bakar mısınız?"],
  ["Eğitim: erişilebilir arayüzler", "Gelecek hafta erişilebilir arayüzler üzerine yarım günlük bir eğitim düzenliyoruz. Kayıt formu ekte."],
  ["Performans raporu hazır", "Eylül performans raporu hazırlandı. Özet: dönüşüm oranı %3,1 arttı, sepet terk oranı düştü."],
] as const

export const contacts: Contact[] = Array.from({ length: 40 }, (_, i) => {
  const name = fullName(rnd)
  return { id: String(i + 1), name, email: emailOf(name, "firma.com.tr"), team: pick(rnd, ["Satış", "Ürün", "Finans", "İK", "Yazılım", "Pazarlama"]) }
})

function makeMails(): Mail[] {
  const folders: Folder[] = ["gelen", "gelen", "gelen", "gelen", "gonderilen", "arsiv", "taslak", "cop"]
  return Array.from({ length: 90 }, (_, i) => {
    const [subject, body] = SUBJECTS[i % SUBJECTS.length]
    const c = pick(rnd, contacts)
    const folder = i < 30 ? "gelen" : pick(rnd, folders)
    return {
      id: i + 1,
      folder,
      from: c.name,
      email: c.email,
      to: "ada.yilmaz@firma.com.tr",
      subject: i < SUBJECTS.length ? subject : `${subject} (${Math.floor(i / SUBJECTS.length) + 1})`,
      body: `${body}\n\nSaygılarımla,\n${c.name}\n${c.team}`,
      at: daysAgo(Math.floor(i / 4), (i * 5) % 24),
      unread: folder === "gelen" && rnd() < 0.35,
      starred: rnd() < 0.15,
      labels: rnd() < 0.5 ? [pick(rnd, LABELS)] : [],
      attachments: rnd() < 0.3 ? [pick(rnd, ["butce.xlsx", "rapor.pdf", "sozlesme.docx", "sunum.pptx", "fatura.pdf"])] : [],
    }
  })
}

export const mails = signal<Mail[]>(makeMails())

export const FOLDER_LABEL: Record<Folder, string> = {
  gelen: "Gelen kutusu",
  yildizli: "Yıldızlı",
  gonderilen: "Gönderilenler",
  taslak: "Taslaklar",
  arsiv: "Arşiv",
  cop: "Çöp kutusu",
}
export const inFolder = (m: Mail, f: Folder) => (f === "yildizli" ? m.starred && m.folder !== "cop" : m.folder === f)
export const unreadCount = computed(() => mails().filter((m) => m.folder === "gelen" && m.unread).length)
export const folderItems = (href: (f: Folder) => string): TreeItem[] => [
  { id: "gelen", label: FOLDER_LABEL.gelen, icon: "inbox", href: href("gelen") },
  { id: "yildizli", label: FOLDER_LABEL.yildizli, icon: "star", href: href("yildizli") },
  { id: "gonderilen", label: FOLDER_LABEL.gonderilen, icon: "send", href: href("gonderilen") },
  { id: "taslak", label: FOLDER_LABEL.taslak, icon: "file-text", href: href("taslak") },
  { id: "arsiv", label: FOLDER_LABEL.arsiv, icon: "archive", href: href("arsiv") },
  { id: "cop", label: FOLDER_LABEL.cop, icon: "trash", href: href("cop") },
]

export function update(id: number, patch: Partial<Mail>) {
  mails.update((list) => list.map((m) => (m.id === id ? { ...m, ...patch } : m)))
}
export function move(id: number, folder: Folder): Folder {
  const before = mails.peek().find((m) => m.id === id)!.folder
  update(id, { folder })
  return before
}
let nextId = 1000
export function send(to: string, subject: string, body: string) {
  mails.update((list) => [
    { id: ++nextId, folder: "gonderilen", from: "Ada Yılmaz", email: "ada.yilmaz@firma.com.tr", to, subject, body, at: new Date(), unread: false, starred: false, labels: [], attachments: [] },
    ...list,
  ])
}
