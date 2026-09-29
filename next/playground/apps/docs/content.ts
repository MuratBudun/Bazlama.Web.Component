import type { TreeItem } from "@bazlama/headless"

export interface Section {
  id: string
  title: string
  text: string[]
  note?: { variant: "info" | "warning" | "success" | "danger"; title: string; text: string }
  code?: { html: string; js: string }
}
export interface Article {
  slug: string
  title: string
  category: string
  summary: string
  minutes: number
  updated: string
  level: "Başlangıç" | "Orta" | "İleri"
  sections: Section[]
}
export interface Category {
  id: string
  title: string
  icon: string
  description: string
}

export const CATEGORIES: Category[] = [
  { id: "baslangic", title: "Başlarken", icon: "home", description: "Kurulum, ilk bileşen, temel kavramlar." },
  { id: "bilesenler", title: "Bileşenler", icon: "layers", description: "Form alanları, tablolar, menüler ve daha fazlası." },
  { id: "yerlesim", title: "Yerleşim", icon: "dashboard", description: "Shell, header, footer, kaydırma modları." },
  { id: "veri", title: "Veri ve durum", icon: "database", description: "Signal'ler, router, saklama (persist)." },
]

const lorem = (topic: string) => [
  `${topic} konusunda bu rehber, Bazlama'nın bileşenlerini gerçek bir uygulamada nasıl bir araya getireceğinizi adım adım anlatır. Örnekler kopyalanıp doğrudan kullanılabilir.`,
  `Bazlama bileşenleri ışık DOM'unda çalışır; bu yüzden sayfanızın CSS'i bileşenlerin içine de ulaşır. Görünümü değiştirmek için önce tema değişkenlerini (--bz-color-primary gibi), sonra bileşen değişkenlerini kullanın.`,
  `Her bileşen klavyeyle tam olarak kullanılabilir ve ekran okuyucular için gerekli ARIA özniteliklerini kendisi yönetir. Kendi işaretlemenizde de aynı özeni göstermeyi unutmayın.`,
]

function article(slug: string, title: string, category: string, summary: string, level: Article["level"], minutes: number): Article {
  return {
    slug,
    title,
    category,
    summary,
    minutes,
    level,
    updated: "28.09.2026",
    sections: [
      { id: "genel-bakis", title: "Genel bakış", text: lorem(title) },
      {
        id: "kurulum",
        title: "Kurulum",
        text: ["Paketi projenize ekleyin ve bileşenleri kaydeden modülü bir kez içe aktarın. Görünüm için UI CSS'ini ve bir temayı da ekleyin."],
        code: {
          html: `<link rel="stylesheet" href="bazlama-ui.css" />\n<bz-button variant="primary">Kaydet</bz-button>`,
          js: `import "@bazlama/headless"\nimport "@bazlama/ui/index.css"\n\nconst b = document.createElement("bz-button")\nb.textContent = "Kaydet"\ndocument.body.append(b)`,
        },
        note: { variant: "info", title: "Sıfır bağımlılık", text: "Bazlama tarayıcının kendi özelliklerini (Popover API, <dialog>, Navigation API) kullanır; ek kütüphane gerekmez." },
      },
      {
        id: "kullanim",
        title: "Kullanım",
        text: lorem(`${title} kullanımı`).slice(0, 2),
        note: { variant: "warning", title: "Dikkat", text: "Nesne ve dizi değerlerini öznitelik olarak değil, özellik olarak verin (.items, .columns)." },
      },
      { id: "ipuclari", title: "İpuçları", text: lorem("İpuçları").slice(1) },
    ],
  }
}

export const ARTICLES: Article[] = [
  article("kurulum", "Kurulum ve ilk bileşen", "baslangic", "Bazlama'yı projenize ekleyin ve ilk bileşeninizi çizin.", "Başlangıç", 5),
  article("temalar", "Temalar ve tasarım belirteçleri", "baslangic", "Renkleri, yazı tipini ve köşe yuvarlaklığını tek yerden değiştirin.", "Başlangıç", 7),
  article("signal", "Signal'ler ile reaktif durum", "veri", "signal, computed ve effect ile arayüzü veriye bağlayın.", "Orta", 9),
  article("router", "Router: sayfalar ve gezinme", "veri", "Navigation API tabanlı router ile sayfalar, guard'lar ve load().", "Orta", 11),
  article("persist", "Kullanıcı düzenini saklama", "veri", "persist ile kenar genişliklerini ve tablo düzenini tarayıcıda saklayın.", "Başlangıç", 4),
  article("formlar", "Formlar ve doğrulama", "bilesenler", "Input, checkbox, radio, lookup ve form-layout ile formlar.", "Orta", 10),
  article("tablolar", "Tablolar ve data grid", "bilesenler", "bz-table ile basit listeler, bz-data-grid ile büyük veri.", "İleri", 14),
  article("dialoglar", "Dialog, toast ve menüler", "bilesenler", "İç içe dialoglar, geri alınabilir bildirimler, bağlam menüleri.", "Orta", 8),
  article("shell", "Uygulama iskeleti: bz-shell", "yerlesim", "Header, footer ve kenar panelleriyle uygulama yerleşimi.", "Orta", 12),
  article("kaydirma", "Kaydırma modları", "yerlesim", "scroll-mode=content ve page farkı, data-shell-fill.", "İleri", 6),
  article("erisilebilirlik", "Erişilebilirlik kontrol listesi", "baslangic", "Klavye, odak ve ekran okuyucu için pratik kontroller.", "Orta", 8),
  article("performans", "Performans ipuçları", "veri", "Büyük listeler, virtual scroll ve verimli bağlamalar.", "İleri", 9),
]

export const FAQ = [
  { q: "Bazlama hangi tarayıcılarda çalışır?", a: "Navigation API ve Popover API'yi destekleyen güncel Chromium tabanlı tarayıcılarda (Chrome, Edge) tam olarak; diğerlerinde router dışındaki bileşenler çalışır." },
  { q: "Shadow DOM kullanıyor mu?", a: "Hayır, bileşenler ışık DOM'unda çizilir. Böylece sayfanızın CSS'i ve formları bileşenlerle doğal olarak çalışır." },
  { q: "React veya Vue ile kullanabilir miyim?", a: "Evet; bileşenler standart özel elementlerdir. Nesne değerlerini özellik (property) olarak vermeniz yeterlidir." },
  { q: "Tema nasıl değiştirilir?", a: "<html data-theme=\"dark\"> gibi bir tema seçin ya da --bz-color-* değişkenlerini kendi CSS'inizde tanımlayın." },
  { q: "Türkçe metinler nasıl verilir?", a: "Bileşenlerin varsayılan metinleri İngilizcedir; labels özelliğiyle (ör. .labels=${TR}) hepsini değiştirebilirsiniz." },
  { q: "Kullanıcının tablo düzeni saklanabilir mi?", a: "Evet: bz-data-grid'e persist=\"anahtar\" verin; sütun düzeni ve sıralama tarayıcıda saklanır." },
]

export const categoryOf = (id: string) => CATEGORIES.find((c) => c.id === id)
export const articleBySlug = (slug: string) => ARTICLES.find((a) => a.slug === slug)

/** The start side: categories with their articles (links). */
export const navTree = (href: (path: string) => string): TreeItem[] => [
  { id: "/", label: "Ana sayfa", icon: "home", href: href("/") },
  ...CATEGORIES.map((c) => ({
    id: `kategori:${c.id}`,
    label: c.title,
    icon: c.icon,
    children: ARTICLES.filter((a) => a.category === c.id).map((a) => ({ id: `/makale/${a.slug}`, label: a.title, href: href(`/makale/${a.slug}`) })),
  })),
  { id: "/makaleler", label: "Tüm makaleler", icon: "list", href: href("/makaleler") },
  { id: "/sss", label: "Sık sorulanlar", icon: "info", href: href("/sss") },
  { id: "/iletisim", label: "İletişim", icon: "mail", href: href("/iletisim") },
]
