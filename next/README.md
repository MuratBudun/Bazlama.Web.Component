# Bazlama next (deneysel)

Bazlama Web Component'in yeniden tasarımı için deneme alanı. Mevcut `libs/core`, `samples/` ve `tests/` klasörlerinden bağımsızdır: kendi `package.json`'ı ve `node_modules`'ı vardır. Çalışma zamanında hiçbir bağımlılığı yoktur.

```
packages/core       signal/computed/effect, html`` şablonları, repeat(), define() + prop
packages/headless   bz-button, bz-input, bz-panel, bz-list/bz-option, bz-combobox, bz-table,
                    bz-tree, bz-icon + icon() / defineIcons() (SVG sprite),
                    bz-dialog + dialogs.open/confirm/alert (modal yığını),
                    bz-tabs/bz-tab-list/bz-tab/bz-tab-panel, toast(), data-tooltip + tooltip(),
                    bz-menu/bz-menu-item/-separator/-group, openMenu(), contextMenu(), place()
packages/icons      çizgi ikon seti (veri; import edilen ikonlar pakete girer)
packages/ui         headless elemanlar için CSS (@layer bazlama.*), JS yok
packages/themes     sadece token dosyaları: light, dark, forest
playground          Core dokümanı (Reaktivite, Şablon, Bileşen) + bileşen sayfaları, tema değiştirici,
                    "UI CSS" anahtarı, olay günlüğü, tablo performans paneli
tests               vitest + jsdom (core, headless ve doküman sayfaları)
```

## Komutlar

```bash
npm install
npm run dev         # playground: http://localhost:5391
npm test            # vitest (jsdom)
npm run typecheck   # tsc --noEmit
npm run size        # esbuild minify + gzip/brotli boyut raporu
npm run build       # playground production build -> dist/
```

## Core dokümanı (playground)

"Core" grubundaki üç sayfa core'u bölüm bölüm anlatır. Her bölümde açıklama, düzenlenip çalıştırılabilen bir örnek ("Kendin dene") ve core'daki ilgili kaynak kod bulunur.

- Örnekler `playground/src/docs/examples/*.js` dosyalarıdır. Bir `root()` içinde çalışırlar; tekrar çalıştırınca veya sayfadan çıkınca oluşturdukları her şey temizlenir. Kapsamda core'un tüm export'ları, `output`, `log()` ve `tag()` vardır (`tag()` benzersiz custom element adı üretir).
- Kaynak alıntıları core dosyalarından `?raw` ile canlı okunur (`excerpt()`, `playground/src/docs/code.ts`). Bir fonksiyonun adı değişirse `tests/docs.test.ts` başarısız olur.

## Debug sayfası (playground → Araçlar → Debug)

- **Sandbox:** Kod localStorage'da saklanır; "Şablon yükle" ile doküman örnekleri açılır. Kod DevTools'ta `bazlama-debug.js` adıyla görünür, yani breakpoint ve `debugger` çalışır.
- **Inspector:** Bileşen ağacı, "⌖ Seç" ile tıklayarak seçim, canlı ve düzenlenebilir prop'lar, attribute'lar, form durumu (ElementInternals) ve `data-part` anatomisi.
- **Olaylar:** `ctx.emit` olayları, native olaylar, DOM değişiklikleri, `log()` ve konsol hataları; kategori filtresi, arama ve duraklatma.
- **Konsol global'leri:** `$el` (seçili bileşen), `$output`, `bz` (core API).

## VS Code ile debug

Ayarlar repo kökündeki `.vscode/` klasöründe (`launch.json`, `tasks.json`). Run and Debug panelinden (Ctrl+Shift+D) seçin, F5 ile başlatın:

| Config | Ne yapar |
|---|---|
| Playground: Chrome / Edge | Dev sunucusunu task olarak başlatır, tarayıcıyı `#debug` sayfasında açar, oturum bitince sunucuyu durdurur. |
| Playground: Chrome (sunucu zaten açık) | `npm run dev` zaten çalışıyorsa bunu kullanın (port 5391 sabit olduğu için ikinci sunucu açılamaz). |
| Vitest: açık test dosyası | Editörde açık olan `tests/*.test.ts` dosyasını debugger altında çalıştırır. |
| Vitest: tüm testler | Bütün testleri debugger altında çalıştırır. |

- Breakpoint'leri doğrudan `.ts` dosyalarına koyabilirsiniz: `packages/core`, `packages/headless` ve `playground` (Vite source map'leri).
- Debug sayfasındaki sandbox kodu "Loaded Scripts" altında `bazlama-debug.js` adıyla görünür; koda `debugger` yazınca VS Code'da durur.
- Önerilen **Vitest** eklentisi (`vitest.explorer`) ile tek bir testi editör kenarındaki simgeden debug edebilirsiniz.
- Tasks: `next: dev server`, `next: test`, `next: typecheck` (Terminal → Run Task).

## Tasarım kararları

- **Reaktivite:** Signal tabanlı. Effect'ler ilk seferde senkron çalışır, sonraki çalıştırmalar bir microtask'ta toplanır (`flush()` ile hemen çalıştırılabilir). Her effect aynı zamanda bir "owner"dır: içinde oluşturulan effect'ler bir sonraki çalıştırmadan önce temizlenir.
- **Şablon:** Her `html` şablonu bir kez `<template>`'e derlenip klonlanır. Her `${}` doğrudan bir DOM düğümüne bağlanır; sanal DOM ve yeniden render yoktur. Fonksiyon olan her değer reaktiftir (signal'ler dahil). Değerler `textContent` veya `setAttribute` ile yazıldığı için XSS riski yoktur.
- **`define()`:** Props şeması + `setup`. Constructor attribute'lara ve çocuklara dokunmaz. Bu sayede `document.createElement`, upgrade ve element tanımlanmadan önce set edilen property'ler doğru çalışır (eski core'daki iki kritik hata burada çözülü ve testli).
- **Light DOM + `data-part` anatomisi:** Headless bileşenler stil içermez. Durum ARIA ve attribute'larla dışarı verilir (`[aria-selected]`, `[open]`, `[data-invalid]`…). Böylece Tailwind veya herhangi bir CSS doğrudan uygulanabilir. Slot'lar light DOM'da taklit edilir (`ctx.slot()`).
- **Form:** `bz-input` gerçek bir `<input name>` render eder, yani doğrulama, reset ve autofill native çalışır. `bz-list`, `bz-combobox` ve `bz-button` ise ElementInternals kullanır.
- **Stil:** `ui` katmanı saf CSS'tir. Tema = token dosyası. Her şey `@layer` içinde olduğundan uygulamanın layer dışı CSS'i her zaman kazanır. Varyant ve boyut (`variant`, `size`) sadece CSS'te tanımlıdır.

## Faz 1: iş uygulaması bileşenleri

| Sıra | Bileşen | Durum |
|---|---|---|
| 1 | SVG ikon altyapısı (`icon()`, `<bz-icon>`, `@bazlama/icons`) | ✅ |
| 2 | `bz-tree` (menü, dosya gezgini, yetki ağacı) | ✅ |
| 3a | Dialog/modal + `dialogs` manager (iç içe yığın) | ✅ |
| 3b | Tabs, toast, tooltip | ✅ |
| 3c | Dropdown menü, alt menü + `place()` konumlandırma | ✅ |
| 3d | Masaüstü tarzı context menu: `<bz-context-menu>`, `contextMenu()` | ✅ |
| 4a | Router (`@bazlama/router`): `createRouter`, `definePage`, `<bz-outlet>`, `<bz-router>`/`<bz-route>` | ✅ |
| 4b | Playground router'a geçirildi | ✅ |
| 4c | `<bz-shell>` yerleşimi (eski `bz-app`), `<bz-header>`, `<bz-footer>`, `<bz-avatar>` | ✅ |
| 4d | Yeterlilik testi: QMEX doküman modülü mockup'ı (`/qmex`) ve eksikler tablosu | ✅ |
| 5 | Checkbox/radio/switch, select, textarea, tarih seçici (mockup'ta eksik çıkanlar) | |
| 4e | `bz-accordion`; `bz-tab closable` + before-close/beforeClose/close, sekme şeridinde kaydırma | ✅ |
| 4f | `bz-alert`, `bz-badge`, `bz-chip`; `bz-table` row-activate (çift tık / Enter) ve satırlarda klavye gezinmesi | ✅ |
| 4g | `bz-checkbox`, `bz-switch`, `bz-radio-group`, `bz-textarea` (autosize, büyük editör), `bz-lookup`, `bz-pagination`, `bz-toolbar`, `bz-form-layout` | ✅ |
| 4h | `bz-data-grid`: sütun genişliği (sürükle / klavye / sığdır), gizleme, başa-sona sabitleme, sürükleyerek sıralama, `columnState`; dikey virtual scroll; `bz-data-grid-columns` | ✅ |
| 5b | Toolbar taşma menüsü, tarih ve sayı alanı, dosya alanı; grid'de değişken satır yüksekliği, hücre düzenleme, gruplama | |
| 6 | Sayfalama, boş durum, mobil uyumluluk fazı | |

**İkonlar:** Tek bir sprite içinde sadece kullanılan ikonlar `<symbol>` olarak durur; her kullanım `<svg><use>` kopyasıdır. `icon()` önbellekteki bir örneği klonlar; tablo/ağaç gibi sık yerlerde `<bz-icon>` yerine bunu kullanın. Tanımlanmadan kullanılan ikon, tanımlanınca kendiliğinden görünür. Shadow root içinde `<use>` sprite'a ulaşamaz; orada `icon(name, { inline: true })` kullanılır.

**Ağaç:** Satırlar düz DOM (`role=treeitem` + `aria-level/setsize/posinset`) ve `repeat()` ile anahtarlı; açma/kapama sadece değişen satırları ekler. Satır başına tek bir effect tüm ARIA durumunu günceller. Seçim modları `single | leaf | none`; `leaf` menüler içindir (üst öğeler sadece açılır). Filtre, sadece yüklenmiş (lazy olmayan veya yüklenmiş) düğümlerde arar.

**Dialog:** Her dialog native `<dialog>.showModal()` ile açılır; top layer, z-index ve alttakileri etkisizleştirme işini tarayıcı çözer. Manager yığını tutar: Esc (bubbling dinlenir; içerideki bir bileşen `preventDefault` ederse dialog açık kalır) ve arka plan tıklaması sadece en üsttekini kapatır. Bir dialog kapanırken önce üstündekiler kapanır ve her birinin guard'ı (`beforeClose`, iptal edilebilir `before-close`) sorulur. Guard async olabilir: "kaydedilmemiş değişiklik" onayı yığına bir seviye daha eklenir. Odak açan elemente döner, sayfa kaydırması kilitlenir. `show()` ve `dialogs.open()` `close(result)` değerini döner; formdan açılan seçim dialogu sonucunu `await` ile forma verir. Chrome'da art arda Esc (close watcher) sonrası durum tutarlılığı elle doğrulandı.

**Tabs:** Enhancer; sekme ve paneller `value` (yoksa sıra) ile eşleşir, alt ağaç MutationObserver ile izlenir (sekmeler `repeat()` ile üretilebilir), iç içe `bz-tabs` birbirini etkilemez. Paneller sadece gizlenir; form durumu korunur.

**Toast:** Konum başına bir kap, manual popover (top layer). Modal açıkken tarayıcı dialog dışındaki her şeyi inert yapar; bu yüzden kap en üstteki dialogun içine taşınır (Chrome'da gerçek tıklamayla doğrulandı). Süre üzerine gelince/odakta ve sekme gizliyken durur.

**Tooltip:** Tek paylaşılan balon, belge düzeyinde delegasyon: tetikleyici başına maliyet bir öznitelik. Klavye odağında gösterilir, tıklamayla gelen odakta gösterilmez (`:focus-visible` yerine son giriş yöntemi izlenir). Esc capture aşamasında yakalanır ve `preventDefault` edilir; dialog manager bunu görüp dialogu açık bırakır.

**Sıfır bağımlılık ilkesi (popup'lar):** Katmanlama, dışarı tıklayınca kapanma ve iç içe popup'lar tarayıcının Popover API'si ile (`popover="auto"` menüler, `popover="manual"` toast/tooltip); modal dialog `<dialog>.showModal()`; konumlandırma kütüphanesiz `place()` (flip, viewport'a sığdırma, `fitHeight`, RTL). CSS anchor positioning tüm hedef tarayıcılarda yaygınlaşınca `place()` onunla değiştirilebilir. İleride bir "tarayıcı uyumluluk" bileşeni, Popover API / `showModal` / `@starting-style` gibi gerekenleri kontrol edip uyumsuz tarayıcıda uygulamayı durduracak; headless kod şimdilik Popover API yoksa `hidden` ile çalışan bir yedek yol içerir (jsdom testleri bu yoldan geçer).

**Menü:** Her menünün popup'ı `popover="auto"`; alt menünün popup'ı üst popup'ın DOM içinde olduğu için tarayıcı iç içe açık tutar, dışarı tıklama hepsini kapatır (`toggle` olayıyla durum eşitlenir). Öğeler gerçek odak alır. Açıkken trigger'a tıklama: light dismiss `pointerdown`'da kapatır, `click` tekrar açmasın diye `pointerdown` anındaki durum tutulur. Esc işlenip `preventDefault` edilir; çevredeki dialog kapanmaz. `openMenu()` modal açıkken menüyü en üstteki dialoga ekler (toast ile aynı inert sorunu). Tek seferlik menüde radio seçimi menüyü kapatıp değeri döndürür.

**Context menu:** `onContextRequest()` üç isteği tek yerden dinler: sağ tık (imleçte), klavye menü tuşu / Shift+F10 (elemanın yanında; Chrome bunu `button: -1` ve elemanın içinden bir koordinatla bildirir, diğerleri (0, 0)) ve dokunmatikte uzun basma (iOS `contextmenu` üretmez; parmak kalkınca oluşan tıklama yutulur). `<bz-context-menu selector="tbody tr">` sadece eşleşen elemanlarda açılır, diğer yerlerde tarayıcının menüsü kalır; hedef `contextTarget`, hazırlık `before-open` olayında. Masaüstü davranışları: `place()` nokta çapada sağa sığmazsa imlecin soluna açar (hizalama da çevrilir), açıkken başka yere sağ tık menüyü taşır, sağ tuşla bas-sürükle-bırak seçer (açılıştan sonraki ilk 250 ms'deki bırakma sayılmaz: macOS menüyü basışta açar).

**Router:** Navigation API üzerinde; tüm aynı-origin gezinmeler tek `navigate` olayında gelir, linkler düz `<a href>`. Olay iptal edilir, leave guard'lar (sayfa `onBeforeLeave`, `router.beforeLeave`), `beforeEnter`/`beforeEach`, lazy import'lar ve `load()`'lar çalışır, sonra gezinme hazırlanmış sonuçla yeniden başlatılır: URL sayfa hazır olunca değişir, reddedilen guard hiçbir şeyi değiştirmez, yeni gezinme eskisini `AbortSignal` ile iptal eder. İptal edilemeyen geri/ileri (kullanıcı etkileşimi olmadan art arda) önce URL'yi değiştirir; guard reddederse eski kayda dönülür. `precommitHandler` yaygınlaşınca bu iptal-yeniden başlat yöntemi onunla değiştirilebilir. Kaydırma geri yükleme tarayıcıda (`scroll: "after-transition"`); odak, ilk değişen derinlikteki outlet'in başlığına taşınır ve başlık duyurulur. Eşleştirme kendi küçük desen derleyicimizle (URLPattern yerine: Node 22 ve jsdom'da yok, özgüllük sıralamasını da biz yapıyoruz). Testlerde `tests/fake-navigation.ts` sahte Navigation API'si kullanılır. Router, headless'a bağımlı değildir; dialog kapatma gibi entegrasyonlar `router.beforeLeave(() => dialogs.closeAll())` ile uygulamada bağlanır.

**Shell (yerleşim):** `<bz-shell>` (eski adıyla `bz-app`) sadece yerleşimi yönetir. `header`, `footer`, `start`, `end` slotları isteğe bağlı, içerik (`<main>`) zorunlu; slotlara ne konacağı uygulamanın tercihi (`<bz-header>`, `<bz-footer>` hazır bileşenler). `variant="classic|sidebar"`, özel yerleşim için `--bz-shell-areas` (`grid-template-areas`). Kenar hücresi ızgarada uzanır, içindeki panel yapışkan ve kendi kayar; hücre içinde kaldığı için footer'a taşmaz. Header/footer yüksekliği `ResizeObserver` ile ölçülüp panellerin konumuna verilir. Genişlik de ölçülür (container query değil: çekmecenin odak, `inert` ve Esc davranışını JS'in bilmesi gerekiyor). Geniş: sol kenar ikon şeridine daralır, sağ kenar gizlenir. Dar: iki kenar da çekmece (aynı anda biri); açıkken geri kalanı `inert`, odak mevcut öğeye, Esc/örtü/bağlantı kapatır ve odak açan düğmeye döner. Açma/kapama düğmeleri bildirimsel: `data-shell-toggle="start|end"` olan herhangi bir düğme; `aria-expanded`/`aria-controls` shell tarafından tutulur, header ile shell arasında özel bir bağ yok. Tarayıcıda bulunan tuzaklar: sabit konumlu çekmecede kenar çubuğundan kalan `align-self: start`, `top/bottom` ile gerilmeyi engeller (`stretch` gerekir); çekmecenin `visibility` geçişi açılışta anında `visible` olmalı, yoksa `focus()` başarısız olur; kapanışta odak vermeden önce `flush()` ile `inert` kaldırılır (jsdom `inert`'i desteklemediği için bu sadece tarayıcıda görüldü).

**Header / Avatar:** `<bz-header>` logo, başlık/alt başlık, orta alan, eylemler ve kullanıcı alanından (avatar + ad + `bz-menu`) oluşur. Kullanıcı menüsü öğeleri `slot="user-menu"` ile gelir ve menüye verilirken `slot` özniteliği kaldırılır; yoksa `bz-menu` onları kendi (çizmediği) `user-menu` slotuna ayırır. Genel kural: bir bileşenin slot içeriğini başka bir slotlu bileşene aktarırken `slot` özniteliği temizlenmeli. `<bz-avatar>` resim yoksa veya yüklenemezse Türkçe kurallarla baş harfleri gösterir; renk tonu addan türetilir, durum noktası isteğe bağlı.

**Accordion:** `<bz-accordion>` + `<bz-accordion-item>`; başlık bir `role=heading` içindeki düğme, içerik `role=region`. Tekli (varsayılan), `multiple`, `always-open`; `fill` ile kabı doldurur (açık öğe kalanı alır, kapalı başlıklar dizilir — QMEX kenar menüsü). Kapalı içerik `hidden="until-found"`: tarayıcının Ctrl+F'i içinde arar ve `beforematch` ile öğe açılır (sıfır bağımlılık, tarayıcı özelliği). Öğe tek başına da çalışır: açma isteği bir olayla accordion'a sorulur, accordion yoksa öğe kendisi açılır.

**Kapatılabilir sekmeler:** `<bz-tab closable>` (×, orta tık, Delete). Sıra: iptal edilebilir `before-close` (anlık) → `beforeClose(value, tab)` (Promise dönebilir: "kaydedilmedi" onayı) → seçim komşuya geçer (odaktaysa odak da) → `close`. Sekmeyi `close`'ta uygulama kaldırır; `remove-on-close` sadece elle yazılmış HTML sekmeler için (`repeat()`'in düğümlerini silmek listeyi bozar). `bz-tab-list` taşınca yatay kayar: yapışkan ‹ › düğmeleri (erişilebilirlik ağacında yok; oklar zaten sekmeler arasında gezinir ve görünür alana getirir), tekerlek yana kaydırır, seçili sekme görünür alana gelir.

**Alert / Badge / Chip:** `bz-alert` varsayılan olarak `role=note`: sayfanın parçası, her açılışta okunmaz. Sonradan çıkan mesajlar için `live="polite|assertive"` → `role=status|alert`. Kapatma iptal edilebilir `dismiss` olayıyla; varsayılan eylem `hidden`. `bz-badge` etkileşimsiz: metin, `count` + `max` → "99+", `dot`; çıplak sayı ve nokta için `label`. `bz-chip` iki rolde: `selectable` → `role=button` + `aria-pressed` (filtre çipi); `removable` → ayrı bir × düğmesi ve `remove` olayı (çipi uygulama kaldırır).

**Tablo satırları:** `row-activate` { row, key, via } çift tıkta her zaman, `activatable` ile Enter'da tetiklenir. `activatable` satırları tek sekme duraklı yapar (roving tabindex): ↑/↓, Home/End, PageUp/PageDown gezinir, Space seçer. Tablo semantiği korunur (grid rolüne geçilmedi); odaklı satır silinince sekme durağı ilk satıra döner.

**Ağaç genişliği:** `bz-tree` ızgarası `minmax(0, 1fr)` sütun kullanır. Yoksa sütun en uzun etiketin tam genişliğinden küçülemiyor; etiketler kısalmıyor ve kenar menüsünde yatay kaydırma çıkıyordu (QMEX mockup'ında görüldü).

**Seçim kontrolleri:** `bz-checkbox`, `bz-switch` (role=switch) ve `bz-radio-group` native input sarar. Form verisi, `required` doğrulaması, reset, Space tuşu, radyolarda ok tuşları ve tek sekme durağı tarayıcıdan gelir. Göstergede ayrı span yok: native input `appearance: none` ile çizilir. İçteki native `change` host'ta **capture** fazında durdurulur (yoksa host'u dinleyen de alırdı) ve yerine `change` { checked, value } / { value } yayınlanır. Radyolar gruptan sonra render olur: `defaultChecked` bir input ilk görüldüğünde yazılır. Reset değeri `checked` yerine `defaultChecked`'ten okunur, çünkü bekleyen mutation bildirimi eski değeri geri yazabiliyordu. Mutation gözlenen efektlerde attribute'lar sadece değişince yazılır; aynı değeri yazmak bile yeni bir kayıt üretip döngüye sokuyordu.

**Textarea:** `autosize` = CSS `field-sizing: content` (+ `max-rows` ile `max-height`); destek yoksa `scrollHeight` ölçülür. `expandable` metni `dialogs.open` ile büyük bir editörde açar (Ctrl+Shift+Enter). Uygula, textarea'dan `input` + `change` yayınlar, yani yazmakla aynı yol.

**Lookup:** form-associated (ElementInternals); değer anahtar, alan metni gösterir. Seçici sırası: `pick()` → `items` (ağaç + filtre) → `rows`/`columns` (tablo + arama). Tetikleyici `mousedown`'da odağı almaz; dialog odağı açıldığı alana geri verir.

**Sayfalama:** sayfa düğmeleri sabit sayıda yuvada (2·boundaries + 2·siblings + 3) yeniden kullanılır; tıklanan düğmede odak kalmaya devam eder. `total` azalınca sayfa kısılır ve `change` yayınlanır.

**Toolbar:** roving tabindex. Öğeler bir kez işaretlenir (`data-toolbar-item`), böylece tabindex -1 verilince kaybolmazlar. `bz-button` devre dışıdan çıkınca kendi tabIndex'ini 0 yapar; MutationObserver bunu geri alır. `apply()` sadece farkları yazdığı için kendi yazdığının bildirimi hemen durulur (önceki "applying" bayrağı gerçek değişiklikleri de yutuyordu).

**Data grid:** `bz-table` basit tablo olarak kaldı; `bz-data-grid` ayrı bileşen, ama yine `<table>` (native semantik, kopyala/yazdır). Temel karar: genişlikler içerikten değil durumdan gelir (`table-layout: fixed` + `<colgroup>`), virtual scroll ancak böyle satırlar değişirken zıplamaz.
- **Sütunlar:** tanım (`columns`) + kullanıcının düzeni (`columnState`: width, hidden, pinned, order). Değişiklik `columns-change` { state, reason } ile gelir; saklamak uygulamanın işi. Sıra her zaman başa sabit → serbest → sona sabit bölgelerinden oluşur. Taşınan sütun, bırakıldığı yerin iki komşusunun bölgeleri arasında kalır: kendi bölgesi uyuyorsa korunur, uymuyorsa en yakınına geçer.
- **Flex sütun:** sabit yerleşim, tablo kaptan genişken fazla genişliği *tüm* sütunlara dağıtır; genişliği verilmemiş sütuna ise 0 verir. Bu yüzden kalan alanı JS hesaplar (kap genişliği − diğerleri) ve her `<col>` açık px alır; kap boyutu değişince yeniden hesaplanır.
- **Sabit sütunlar:** `position: sticky`; ofsetler hücrelere yazılmaz, grid'e özel bir `<style>` içinde `:nth-child` / `:nth-last-child` kurallarıyla verilir. Sabit sütunlar hep satırın başında/sonunda olduğu için konumla seçilebilir; boyutlandırma sırasında sadece bu kural değişir. Başlık ve gövde için ayrı seçici gerekiyor: ortak `:is(thead tr, tr[data-part=row])` özgüllüğü başlığa özel `z-index`'i eziyordu.
- **Boyutlandırma tutamacı** hücrenin *içinde* durur: hücrelerde `overflow: hidden` var ve sonraki başlık hücresi üstte çizilir; dışa taşan yarısı tıklanamıyordu.
- **Satırlar** şablonla değil doğrudan DOM ile ve anahtarlı önbellekle çizilir; seçim ve sekme durağı efektleri sadece çizili satırlara dokunur. Kaydırma yolundaki her DOM yazımı değer değişmediyse atlanır (aynı değerle `setAttribute` bile stil geçersizleştirir).
- **Virtual scroll** sadece dikey ve sabit satır yüksekliğiyle: görünen aralık + `overscan`, üst/alt boşluk satırları, `aria-rowcount`/`aria-rowindex`. Odaklı satır ekrandan çıkarsa odak kaydırma kabına geçer (o an tek sekme durağıdır); ↓ satırı geri getirir.
- **Ölçüm** (Chrome, arka plan sekmesi, 19 sütun): 100 000 satırı vermek 34 ms, sıralama 87 ms, tümünü seçme 70 ms. Kaydırma adımında JS yaklaşık 1,7 ms; yerleşim, aynı işi elle yapan düz tabloya göre 1–2 ms fazla.

**Form layout:** CSS grid `repeat(auto-fill, minmax(max(min, (100% − gaps) / N), 1fr))`: en çok N sütun, dar ekranda azalır. JS sadece o anki sütun sayısını `gridTemplateColumns`'tan okur ve `data-span`'leri kısar. Sütundan geniş span örtük sütun açıp ölçümü şişirdiği için ölçüm kısmadan sonra tekrarlanır. Bölümler `subgrid`.

**Olaylar (iç içe bileşenler):** Bir bileşenin kendi durumunu bildiren olaylar kabarcıklanmaz: `bz-tabs` `change`, `bz-panel`/`bz-tree`/`bz-shell` `toggle`, `bz-dialog` `open`/`close` (native `toggle` gibi). Yoksa iç içe sekmelerde içtekinin `change`'i dıştaki dinleyiciye ulaşıp onun değerini bozuyordu (QMEX mockup'ında görüldü). Yukarı ulaşması gerekenler kabarcıklanır: `bz-menu` `select` (alt menülerden), `bz-list`/`bz-combobox` `change` (native `change` gibi). Native `change` her zaman kabarcıklandığı için kapsayıcı bir bileşende dinlerken `@change.self=${…}` kullanılır; şablon değiştiricileri: `.self` (sadece elementin kendi olayı), `.prevent`, `.stop`, `.once`.

**CSS gözlemi:** Kapsayıcı bileşenlerin (panel, dialog) `bz-x [data-part=…]` seçicileri içerideki başka bileşenlerin aynı adlı parçalarına sızıyordu (ör. dialog içindeki tablonun `tbody[data-part=body]`'si dialog gövdesi gibi stilleniyordu). Bu iki dosya çocuk seçicilere (`>`) çevrildi. Kural: başka içerik barındıran bileşenlerin CSS'i `>` ile yazılır.

## Ölçümler (2026-09-25)

**Boyut** (`npm run size`, minify + gzip):

| paket | gzip |
|---|---|
| core | 3,86 KB |
| button / panel / input + core | 4,1–4,4 KB |
| list + core | 5,0 KB |
| combobox + list + core | 6,2 KB |
| table + core | 4,9 KB |
| tüm headless + core | 8,3 KB |
| ui css (hepsi) | 1,8 KB |
| themes (3 tema) | 0,7 KB |

**Performans:** Chrome, dev build, script ve layout ayrı ölçüldü. Sekme arka plandaydı; öndeki bir sekmede sayılar daha iyi olabilir. Playground'daki tablo panelinden kendiniz tekrar ölçebilirsiniz.

| işlem | script | layout |
|---|---|---|
| 1.000 satır oluştur | 71 ms | 190 ms |
| 1.000 satırda her 10. satırı güncelle | 30 ms | 89 ms |
| 1.000 satırda 2 satır yer değiştir | 7 ms | ~0 ms |
| 1.000 satırı sırala | 35 ms | 165 ms |
| 10.000 satır oluştur | 1.300 ms | 3.300 ms |
| 10.000 satırı sırala | 306 ms | 2.012 ms |
| 10.000 satırı temizle | 341 ms | 6 ms |
| combobox, 2.000 seçenek, filtre ("19" → 139 sonuç) | 12 ms (toplam) | |
| combobox, 2.000 seçeneğin hepsini göster | 173 ms (toplam) | |

## Gözlemler

1. **Büyük listelerde darboğaz script değil, layout.** Satır ve seçenek sayısı arttıkça süreyi tarayıcının layout'u belirliyor; `table-layout: fixed` yardımcı olmadı. Binlerce satır/seçenek için **sanallaştırma (virtualization)** gerekli. Bu, `repeat()` üzerine kurulabilecek ayrı bir primitive olabilir.
2. **Toplu temizleme yavaş:** 10.000 satırı temizlemek 341 ms. `KeyedList` her satırı tek tek dispose edip siliyor. Liste boşaltılırken aralığı tek seferde silen bir hızlı yol (Range) eklenmeli.
3. **Kısmi attribute binding desteklenmiyor:** `href="#${id}"` hata veriyor; `href=${"#" + id}` yazmak gerekiyor. Playground'u yazarken bile takıldım. Derleyici bu durumu destekleyecek şekilde genişletilebilir.
4. **"Fonksiyon = reaktif" kuralı:** Bir property'ye fonksiyon geçmek için `() => fn` şeklinde sarmalamak gerekiyor. Signal'leri bir işaretle ayırt etmek bir alternatif.
5. **Light DOM slot sınırı:** Çocuklar ilk bağlanmada yakalanıyor. Sonradan `appendChild` ile eklenen bir `bz-option`, combobox'ın popup'ına girmiyor. `repeat()` ile verilen dinamik çocuklar çalışıyor, çünkü çapa (anchor) düğümleri de birlikte taşınıyor.
6. **`bz-button` native submitter değil:** Input içinde Enter ile örtük gönderim çalışmıyor ve `submit` olayında `submitter` null geliyor. Seçenekler: form içinde gizli bir native `<button type=submit>` üretmek veya `bz-button`'ın gerçek bir `<button>` render etmesi.
7. **i18n:** Bileşen metinleri ("No results", "Please select an option.", "Show options", "Select row") İngilizce ve sabit kodlu. Native doğrulama mesajları ise tarayıcının dilinde geliyor. Bir mesaj/locale stratejisi gerekli.
8. **Türkçe İ hatası bulundu ve düzeltildi:** `"İstanbul".toLowerCase()` birleşik nokta karakteri ürettiği için "is" araması eşleşmiyordu. `fold()` ile aksan ve büyük/küçük harf duyarsız eşleştirme eklendi ve testlendi.
9. **Popup konumlandırma:** Combobox popup'ı `position: absolute`. `overflow: hidden` olan bir kapsayıcıda (ör. `bz-panel`) kırpılabilir. Popover API (top layer) + CSS anchor positioning değerlendirilmeli.
10. **Test ortamı:** jsdom'da `ElementInternals` form API'leri (`setFormValue`, `setValidity`) yok. Form davranışları gerçek Chrome'da elle doğrulandı. Kalıcı çözüm Vitest browser mode (Playwright).
11. **Ölçüm tuzağı:** Arka plandaki sekmede `requestAnimationFrame` hiç tetiklenmiyor ve zamanlayıcılar kısılıyor. Playground'daki performans paneli öndeki sekmede kullanılmalı.
12. **Yeniden bağlanma:** DOM'dan çıkarılıp sonra tekrar eklenen bileşende `setup` yeniden çalışıyor. Props korunuyor, bileşenin iç durumu (ör. combobox'ın arama metni) sıfırlanıyor. Aynı tick içinde taşımak ise bileşeni canlı tutuyor.
