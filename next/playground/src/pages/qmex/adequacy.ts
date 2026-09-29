/** Feature adequacy of bazlama for the QMEX document module (what the mockup needed). */

export interface Adequacy {
  feature: string
  used: string
  status: "ok" | "partial" | "missing"
  note: string
}

export const ADEQUACY: Adequacy[] = [
  { feature: "Uygulama iskeleti (başlık, sol menü, içerik, alt bilgi)", used: "bz-shell + bz-header + bz-footer", status: "ok", note: "Dar ekranda menü çekmeceye döner (QMEX'te yok)." },
  { feature: "Başlıkta kullanıcı, firma, kullanıcı menüsü", used: "bz-header user-name / user-detail / user-menu, bz-avatar", status: "ok", note: "" },
  { feature: "Sol menü ağaçları", used: "bz-tree (selection=leaf)", status: "ok", note: "Klavye, arama, aktif öğe." },
  { feature: "Akordeon (Dokümanlar / Parametreler / Bakım)", used: "bz-accordion fill always-open", status: "ok", note: "Açık bölüm kalan yüksekliği doldurur, kapalı başlıklar alta dizilir (QMEX gibi); Ctrl+F kapalı bölümü açar." },
  { feature: "Kapatılabilir sekmeler (MDI) ve iç sekmeler", used: "bz-tab closable + beforeClose + close olayı", status: "ok", note: "×, Delete, orta tık; kaydedilmemiş formda async onay; çok sekmede ‹ › ile kaydırma. Tüm sekmeleri listeleyen menü yok." },
  { feature: "Ana sayfa: sekmeler, rozetler, filtre çipleri, arama", used: "bz-tabs, bz-badge (count), bz-chip selectable, bz-input", status: "ok", note: "" },
  { feature: "Uyarı bandı (7 günden uzun bekleyen işler)", used: "bz-alert variant=\"warning\"", status: "ok", note: "Kapatılabilir, eylem düğmeli, canlı bölge (live) olabilir." },
  { feature: "Veri tablosu (sıralama, seçim, biçimli hücreler)", used: "bz-table", status: "ok", note: "Durum sütunu şablonla biçimlendi." },
  { feature: "Tablo: çift tıkla / Enter ile aç", used: "bz-table activatable + row-activate", status: "ok", note: "Satırlar ↑/↓ ile gezilir, Enter açar, Space seçer." },
  { feature: "Tablo: sütun genişliği/yeniden boyutlandırma, sütun gizleme, yatay kaydırmada sabit sütun", used: "bz-data-grid + bz-data-grid-columns", status: "ok", note: "Sürükle / Shift+←/→ ile genişlik, ⋮ menüsü ve Sütunlar düğmesi; Doküman No başa, Durum sona sabit; sürükleyerek sıralama; dikey virtual scroll." },
  { feature: "Sayfalama çubuğu", used: "bz-pagination variant=\"compact\" show-info", status: "ok", note: "« ‹ Sayfa [n] / N › », yenile düğmesi slotta; filtre toplamı azaltınca sayfa kısılır." },
  { feature: "Araç çubuğu (ikon düğmeler, ayırıcılar, sağa yaslı gruplar)", used: "bz-toolbar + bz-toolbar-spacer", status: "ok", note: "Tek sekme durağı, ←/→ gezinme. Taşma (…) menüsü yok; sığmayınca alt satıra geçer." },
  { feature: "Açılır menüler (İşlem Yap, Araçlar, Yazdır, Görünüm, Ekle ▾)", used: "bz-menu", status: "ok", note: "Devre dışı tetikleyici, gruplar, radio öğeleri." },
  { feature: "Kolon seçmeli arama kutusu", used: "bz-menu (radio) + bz-input + temizle", status: "partial", note: "Birleşik bir 'search field' bileşeni yok." },
  { feature: "Satır sağ tık menüsü", used: "bz-context-menu selector=\"tbody tr\"", status: "ok", note: "QMEX'te yok; bazlama ile eklendi." },
  { feature: "Form alanları (etiket + salt okunur/düzenlenebilir)", used: "bz-input readonly", status: "ok", note: "" },
  { feature: "Seçim alanı (tetikleyicili, dialogda ağaçtan seçim)", used: "bz-lookup selection=\"leaf\"", status: "ok", note: "Enter / F4 / Alt+↓ açar, seçicide filtre; tablo seçici ve özel pick() de var." },
  { feature: "Açılır seçim (Doküman Türü)", used: "bz-combobox", status: "ok", note: "" },
  { feature: "Tarih alanı", used: "bz-input type=\"date\" (native)", status: "missing", note: "bz-date-picker yok; biçim tarayıcıya bağlı (gg.aa.yyyy değil)." },
  { feature: "Sayı alanı (Revizyon No, Çıktı Sayısı)", used: "bz-input (native)", status: "partial", note: "Ayrı number field yok; biçimleme/adım düğmeleri yok." },
  { feature: "Çok satırlı metin (Notlar)", used: "bz-textarea autosize expandable show-count", status: "ok", note: "Yazdıkça büyür; büyük editörde açılır (Ctrl+Shift+Enter)." },
  { feature: "Onay kutusu / evet-hayır alanları", used: "bz-checkbox (tablo hücresinde)", status: "ok", note: "Düzenleme modunda değiştirilebilir, değilse salt okunur. bz-switch ve bz-radio-group da var." },
  { feature: "Dosya alanı (Orijinal Doküman)", used: "bz-input + dialog", status: "missing", note: "Dosya yükleme bileşeni yok." },
  { feature: "Form düzeni (çok sütunlu alan ızgarası)", used: "bz-form-layout columns=\"8\" + data-span", status: "ok", note: "Dar ekranda sütun sayısı azalır, span'ler kısılır." },
  { feature: "Daraltılabilir bölümler, tümünü aç/kapat", used: "bz-panel collapsible + signal", status: "ok", note: "" },
  { feature: "Düzenleme modu, kaydetme, kaydedilmemiş değişiklik onayı", used: "signal + dialogs.confirm", status: "ok", note: "Sekme kapatırken sorar; router kullanılsaydı onBeforeLeave." },
  { feature: "Onay, bilgi, tarihçe dialogları", used: "dialogs.confirm / alert / open", status: "ok", note: "İç içe dialog (seçim → uyarı) çalışır." },
  { feature: "Bildirimler", used: "toast", status: "ok", note: "Eylemli toast (Oluşturuldu › Aç)." },
  { feature: "İkon düğmelerde ipucu", used: "data-tooltip", status: "ok", note: "" },
  { feature: "Durum etiketi (Yürürlüğe Alma, Hazırlanıyor…)", used: "bz-badge variant", status: "ok", note: "" },
  { feature: "Boş durum (Gösterilebilecek veri yok)", used: "bz-table empty slotu + CSS", status: "partial", note: "Genel bz-empty-state yok." },
  { feature: "Menü ile içerik arası sürüklenebilir ayırıcı", used: "bz-shell resizable", status: "ok", note: "Sürükle / klavye; en küçüğün altına sürükleyince menü daralır. Liste grid'i data-shell-fill ile kalan yüksekliği doldurur, sadece içerik kayar." },
  { feature: "Excel'e aktarma", used: "toast (mockup)", status: "missing", note: "UI kütüphanesinin konusu değil; uygulama/servis tarafı." },
]
