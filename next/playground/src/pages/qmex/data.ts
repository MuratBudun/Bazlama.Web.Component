import type { TreeItem } from "@bazlama/headless"

/**
 * Data captured from the QMEX document module (localhost:8085/qmex_dm, 2026-09-28): menus,
 * the "Taslaklar › Doküman No" list and the FRM-008 document form. Used only by the mockup.
 */

const leaf = (group: string, label: string, icon = "file-text"): TreeItem => ({ id: `${group}:${label}`, label, icon })

export const DOCUMENTS_MENU: TreeItem[] = [
  {
    id: "taslaklar",
    label: "Taslaklar",
    icon: "folder",
    children: ["Doküman No", "Doküman Türü", "Doküman Sahibi Bölüm", "Hazırlayan", "Durum", "İlgili Kod", "Müşteri Onayı Alınacaklar"].map((l) =>
      leaf("taslaklar", l)
    ),
  },
  {
    id: "yururluk",
    label: "Yürürlüktekiler",
    icon: "folder",
    children: ["Doküman No", "Doküman Sahibi Bölüm", "Doküman Türü", "Hazırlayan", "Geçerlilik Tarihi", "Yürürlük Tarihi", "İlgili Kod", "Müşteri Onayı Alınanlar"].map(
      (l) => leaf("yururluk", l)
    ),
  },
  ...["Arşiv", "İptal Edilenler", "Geri Çekme Matrisi", "DDİ Formları", "Doküman İçerik Şablonları", "Kullanım Kılavuzu", "Yapay Zeka Destekli Kullanım Kılavuzu"].map(
    (l) => leaf("dok", l, "file")
  ),
]

export const PARAMETERS_MENU: TreeItem[] = [
  ...["Konfigürasyon Ekranı", "Doküman Türü", "Çıktı Türü", "Çıktı Alma Nedeni", "Geri Çekme Nedeni", "Doküman Değişiklik Talep Türü", "Etki Değerlendirmesi", "Revizyon Nedeni", "Diğer Parametreler"].map(
    (l) => leaf("param", l, "settings")
  ),
  {
    id: "param:yetki",
    label: "Yetki Düzenlemeleri",
    icon: "folder",
    children: ["Modül Sorumluları", "Doküman Modülü Kullanıcıları", "Dokümantasyon Sorumluları", "Yürürlük Onaycıları", "Standart Çıktı Alma Yetkilileri", "Word Halinde Önizleme Yetkilileri", "Seçenek Kısıtı"].map(
      (l) => leaf("yetki", l, "users")
    ),
  },
  leaf("param", "QMex Secure Print Tool", "download"),
]

export const MAINTENANCE_MENU: TreeItem[] = [
  "İş Aktarımı",
  "İşlem Yetkilisi Değişikliği",
  "İş Akışı Kullanıcı Grubu Eşitleme",
  "İşlem Yetkilisi Ekleme",
  "Doküman Form Alanı Güncelleme",
  "Zamanlanmış Görev Yöneticisi",
].map((l) => leaf("bakim", l, "refresh"))

export interface DocRow {
  [key: string]: unknown
  id: string
  company: string
  location: string
  no: string
  rev: number
  name: string
  kind: string
  ownerDept: string
  training: string
  nameOther: string
  enforcement: string
  preparedBy: string
  preparedDept: string
  createdAt: string
  status: string
  authority: string
}

const doc = (no: string, name: string, ownerDept: string, training: string, nameOther: string, enforcement: string, createdAt: string, status: string): DocRow => ({
  id: no,
  company: "Firma",
  location: "Varsayılan",
  no,
  rev: 0,
  name,
  kind: "Form",
  ownerDept,
  training,
  nameOther,
  enforcement,
  preparedBy: "Test User 10",
  preparedDept: "Üretim Planlama ve Depo Müdürlüğü",
  createdAt,
  status,
  authority: "Test User 10",
})

export const DOCUMENTS: DocRow[] = [
  doc("N/A-00000142", "Audit deneme dokumani - alt tablo denemesi", "Genel Müdürlük", "", "", "", "14.09.2026 00:45:14", "Hazırlanıyor"),
  doc("N/A-00000015", "Uzay Sapması", "", "", "", "", "24.07.2026 07:49:03", "Hazırlanıyor"),
  doc("FRM-008", "test deneme - audit gozlem", "Kalite Kontrol Müdürlüğü", "Evet", "test deneme", "15.08.2026", "17.07.2026 15:55:17", "Yürürlüğe Alma"),
  doc("FRM-007", "a", "Genel Müdürlük", "Evet", "a", "17.07.2026", "17.07.2026 15:29:18", "Yürürlüğe Alma"),
  doc("FRM-006", "test", "QMex Sistem", "Evet", "test", "17.07.2026", "17.07.2026 15:20:16", "Yürürlük Onayında"),
  doc("FRM-005", "test", "Genel Müdürlük", "Evet", "test", "17.07.2026", "17.07.2026 14:21:52", "Yürürlüğe Alma"),
  doc("FRM-004", "test denme", "Genel Müdürlük", "Evet", "test", "17.07.2026", "17.07.2026 14:18:37", "Yürürlüğe Alma"),
  doc("FRM-003", "testtt", "QMex Sistem", "Evet", "testtt", "17.07.2026", "17.07.2026 14:10:24", "Yürürlük Onayında"),
  doc("FRM-002", "test", "QMex Sistem", "Evet", "test", "17.07.2026", "17.07.2026 13:59:19", "Yürürlük Onayında"),
  doc("FRM-001", "test", "Üretim Müdürlüğü", "Evet", "testn", "25.07.2026", "06.07.2026 08:06:50", "Yürürlüğe Alma"),
]

export interface WorkItem {
  no: string
  title: string
  form: "Doküman Formu" | "Doküman Değişiklik İsteği Formu"
  status: string
  days: number
}

const LOADTEST = "LOADTEST synthetic document - N/A"
export const WORK_ITEMS: WorkItem[] = [
  { no: "N/A-00000142", title: "Audit deneme dokumani - alt tablo denemesi - Form", form: "Doküman Formu", status: "Hazırlanıyor", days: 14 },
  { no: "LOADTEST-DM-102", title: LOADTEST, form: "Doküman Formu", status: "Onay Bekliyor", days: 47 },
  { no: "LOADTEST-DM-110", title: LOADTEST, form: "Doküman Formu", status: "Onay Bekliyor", days: 55 },
  { no: "LOADTEST-DM-118", title: LOADTEST, form: "Doküman Formu", status: "Onay Bekliyor", days: 63 },
  { no: "N/A-00000015", title: "Uzay Sapması - Form", form: "Doküman Formu", status: "Hazırlanıyor", days: 66 },
  { no: "DCR/Test3/2026/00001", title: "Geçerlilik Tarihi Uzatma", form: "Doküman Değişiklik İsteği Formu", status: "Dokümantasyon Sorumlusu Onayı", days: 66 },
  { no: "DCR/Test2/2026/00002", title: "Geçerlilik Tarihi Uzatma", form: "Doküman Değişiklik İsteği Formu", status: "Dokümantasyon Sorumlusu Onayı", days: 66 },
  { no: "LOADTEST-DM-126", title: LOADTEST, form: "Doküman Formu", status: "Onay Bekliyor", days: 71 },
  { no: "FRM-008", title: "test deneme - audit gozlem - Form", form: "Doküman Formu", status: "Yürürlüğe Alma", days: 73 },
  { no: "FRM-007", title: "a - Form", form: "Doküman Formu", status: "Yürürlüğe Alma", days: 73 },
  { no: "FRM-006", title: "test - Form", form: "Doküman Formu", status: "Yürürlük Onayında", days: 73 },
  { no: "FRM-005", title: "test - Form", form: "Doküman Formu", status: "Yürürlüğe Alma", days: 73 },
]

export const RECENT: { no: string; title: string; status: string; when: string }[] = [
  { no: "FRM-008", title: "test deneme - audit gozlem - Form", status: "Yürürlüğe Alma", when: "Bugün" },
  { no: "N/A-00000015", title: "Uzay Sapması - Form", status: "Hazırlanıyor", when: "12 gün önce" },
  { no: "N/A-00000142", title: "Audit deneme dokumani - alt tablo denemesi", status: "Hazırlanıyor", when: "13 gün önce" },
  { no: "FRM-002", title: "test - Form", status: "Yürürlük Onayında", when: "14 gün önce" },
  { no: "FRM-004", title: "test denme - Form", status: "Yürürlüğe Alma", when: "16 gün önce" },
  { no: "LOADTEST-DM-118", title: LOADTEST, status: "Onay Bekliyor", when: "16 gün önce" },
  { no: "FRM-007", title: "a - Form", status: "Yürürlüğe Alma", when: "20 gün önce" },
  { no: "FRM-005", title: "test - Form", status: "Yürürlüğe Alma", when: "20 gün önce" },
]

/** Organization tree for the department lookups (from the form's values and the list). */
export const DEPARTMENTS: TreeItem[] = [
  {
    id: "D001",
    label: "Genel Müdürlük",
    icon: "dashboard",
    children: [
      { id: "D001.3", label: "Kalite Kontrol Müdürlüğü", icon: "users" },
      { id: "D001.5", label: "Üretim Müdürlüğü", icon: "users" },
      { id: "D001.6", label: "Üretim Planlama ve Depo Müdürlüğü", icon: "users" },
      { id: "D001.8", label: "Mühendislik Müdürlüğü", icon: "users" },
    ],
  },
  { id: "SYS", label: "QMex Sistem", icon: "settings" },
]

export const DOC_KINDS = ["Form", "Prosedür", "Talimat", "Şartname", "Kılavuz", "Tablo"]

/** FRM-008 "Genel Bilgiler" as read from the form. */
export const FRM_008 = {
  no: "FRM-008",
  rev: 0,
  createdAt: "17.07.2026 15:55:17",
  preparedBy: "Test User 10",
  preparedDept: "Üretim Planlama ve Depo Müdürlüğü",
  validUntil: "2029-07-20",
  kind: "Form",
  name: "test deneme - audit gozlem",
  ownerDept: "Kalite Kontrol Müdürlüğü",
  nameOther: "test deneme",
  firstEnforcement: "",
  enforcement: "2026-08-15",
  original: { name: "Lorem ipsum-TimesNewRoman (1).docx", size: "20.4 KB" },
  status: "Yürürlüğe Alma",
  location: "Firma, Varsayılan",
  authority: "Test User 10",
}

export const RELATED_ADD_MENU = [
  "Ürün",
  "Hammadde",
  "Yarı Mamul",
  "Ambalaj Malzemesi",
  "Üretici",
  "Tedarikçi",
  "Alan",
  "Ekipman",
  "Sistem",
  "Bilgisayarlı Sistem",
  "Üretim Versiyonu",
  "Müşteri",
]
export const TOOLS_MENU = [
  ["mail", "Gönderilen e-Mailler"],
  ["clock", "Tarihçe"],
  ["bell", "Hatırlatma"],
  ["refresh", "Formu Yeniden Yükle"],
  ["eye", "Önizleme"],
  ["layers", "Revizyon Geçmişi"],
  ["copy", "Önceki Revizyonla Karşılaştır"],
  ["users", "Doküman Eğitim Detayı"],
] as const
