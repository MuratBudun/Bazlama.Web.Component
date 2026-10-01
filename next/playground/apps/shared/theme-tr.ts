import type { ContrastCheckId, Neutral } from "@bazlama/themes/builder"

/** Turkish labels for the theme builder (playground theme editor and the CRM's brand theme). */

export const CONTRAST_TR: Record<ContrastCheckId, string> = {
  "text-bg": "Metin / zemin",
  "text-surface": "Metin / yüzey",
  "muted-surface": "Soluk metin / yüzey",
  "muted-bg": "Soluk metin / zemin",
  "primary-button": "Birincil buton yazısı",
  "primary-surface": "Bağlantı, seçili sekme (birincil / yüzey)",
  "primary-soft": "Seçili öğe (birincil / açık ton)",
  "danger-button": "Tehlike butonu yazısı",
  "danger-surface": "Hata metni / yüzey",
  "success-surface": "Başarı / yüzey",
  "warning-surface": "Uyarı / yüzey",
  "info-surface": "Bilgi / yüzey",
  "focus-surface": "Odak halkası / yüzey",
  "border-surface": "Kontrol kenarlığı / yüzey",
}

export const FONT_TR: Record<string, string> = {
  modern: "Modern (Inter → Segoe UI Variable → sistem)",
  system: "Sistem fontu",
  segoe: "Segoe UI",
  roboto: "Roboto",
  serif: "Serif (Georgia)",
}

export const NEUTRAL_TR: Record<Neutral, string> = {
  cool: "Soğuk",
  neutral: "Nötr",
  warm: "Sıcak",
  brand: "Markadan",
}
