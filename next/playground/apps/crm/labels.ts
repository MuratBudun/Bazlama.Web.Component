import type { DataGridLabels, LookupLabels, PaginationLabels, TextareaLabels } from "@bazlama/headless"

// Turkish texts for the components (their defaults are English).

export const CRM_GRID_TR: Partial<DataGridLabels> = {
  selectAll: "Tüm satırları seç",
  selectRow: "Satırı seç",
  columnMenu: (h) => `Sütun menüsü: ${h}`,
  resize: (h) => `${h} genişliği`,
  sortAsc: "Artan sırala",
  sortDesc: "Azalan sırala",
  clearSort: "Sıralamayı kaldır",
  pin: "Sabitle",
  pinStart: "Başa sabitle",
  pinEnd: "Sona sabitle",
  unpin: "Sabit değil",
  moveLeft: "Sola taşı",
  moveRight: "Sağa taşı",
  autosize: "İçeriğe sığdır",
  hide: "Sütunu gizle",
  columns: "Sütunlar",
  reset: "Varsayılana dön",
  empty: "Kayıt yok",
}
export const PAGINATION_TR: Partial<PaginationLabels> = {
  nav: "Sayfalama",
  first: "İlk sayfa",
  previous: "Önceki sayfa",
  next: "Sonraki sayfa",
  last: "Son sayfa",
  page: (n) => `Sayfa ${n}`,
  pageInput: "Sayfa",
  of: (n) => `/ ${n}`,
  pageSize: "Sayfa başına",
  info: (a, b, t) => `${a}–${b} / ${t}`,
  empty: "Kayıt yok",
}
export const LOOKUP_TR: Partial<LookupLabels> = { select: "Seç", clear: "Temizle", search: "Ara", ok: "Seç", cancel: "Vazgeç", empty: "Sonuç yok", required: "Bir değer seçin." }
export const TEXTAREA_TR: Partial<TextareaLabels> = { expand: "Genişlet", apply: "Uygula", cancel: "Vazgeç", close: "Kapat" }
