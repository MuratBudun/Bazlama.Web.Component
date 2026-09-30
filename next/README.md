# Bazlama next (deneysel)

Bazlama Web Component'in yeniden tasarımı için deneme alanı. Mevcut `libs/core`, `samples/` ve `tests/` klasörlerinden bağımsızdır: kendi `package.json`'ı ve `node_modules`'ı vardır. Çalışma zamanında hiçbir bağımlılığı yoktur.

```
packages/core       signal/computed/effect, html`` şablonları, repeat(), define() + prop
packages/headless   bz-button, bz-input, bz-panel, bz-list/bz-option, bz-combobox, bz-table,
                    bz-tree, bz-icon + icon() / defineIcons() (SVG sprite),
                    bz-dialog + dialogs.open/confirm/alert (modal yığını),
                    bz-tabs/bz-tab-list/bz-tab/bz-tab-panel, toast(), data-tooltip + tooltip(),
                    bz-menu/bz-menu-item/-separator/-group, openMenu(), contextMenu(), place(),
                    bz-password, bz-login (2FA adımlı giriş kartı), bz-file-upload
packages/icons      çizgi ikon seti (veri; import edilen ikonlar pakete girer)
packages/ui         headless elemanlar için CSS (@layer bazlama.*), JS yok
packages/themes     sadece token dosyaları: light, dark, forest, modern, modern-dark, density (compact)
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

**Modern tema (`data-theme="modern"` / `"modern-dark"`):** Kurumsal ekranlar için nötr, sade görünüm: soğuk griler, ince kenarlık + çok hafif gölge, renk sadece eylem ve durumlarda, tablolarda hizalı rakamlar, sadece sıralı sütunda ok, 12px durum rozetleri, ince kaydırma çubukları, dialog arkasında hafif bulanıklık. Font: Inter (kuruluysa) → Segoe UI Variable → system-ui; font yüklenmez (sıfır bağımlılık). Bileşen CSS'i yeni token'ları varsayılanlı okur, diğer temalar değişmez: `--bz-color-border-strong` / `-hover` (kontrol kenarlıkları), `--bz-shadow-control` / `-surface`, `--bz-radius-lg`, `--bz-font-numeric`, `--bz-table-header-weight` / `-size` / `-fg`, `--bz-sort-idle-opacity`, `--bz-tab-selected-weight`, `--bz-badge-font-size` / `-weight` / `-padding` / `-radius` / `-ring`, `--bz-card-shadow`, `--bz-panel-shadow`, `--bz-dialog-backdrop-filter`, `--bz-shadow-button-solid` (birincil/tehlike butonunda üst parlama), `--bz-button-press-scale` (basınca küçülme), `--bz-tree-selected-weight`, `--bz-toast-accent-width` / `-color` (renkli yan şerit yerine ince kenarlık), `--bz-menu-danger-focus-bg` / `-fg`.

**Yoğunluk (`data-density="compact"`):** `<html>`'e ya da herhangi bir kaba (grid sayfası, yan panel) verilir, her temayla çalışır: 30px kontroller, 13px yazı, sık tablo/grid satırları (30px), menü ve seçim satırları küçülür. Grid'in `row-height`'ı verilmezse satır yüksekliği bu token'dan okunur ve tema/yoğunluk değişince yeniden ölçülür (sanal kaydırma doğru kalır). Playground başlığındaki "Sıkı" ve CRM Ayarlar'daki "Sıkı yerleşim" bunu açar.

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
| 5b | Toolbar taşma menüsü, tarih ve sayı alanı; grid'de değişken satır yüksekliği, hücre düzenleme, gruplama | |
| 5c | `bz-password` (göster/gizle, Caps Lock, güç), `bz-login` (2FA adımı), `bz-file-upload` (sürükle-bırak, ilerleme, tekrar dene) | ✅ |
| 6 | Sayfalama, boş durum, mobil uyumluluk fazı | |

**İkonlar:** Tek bir sprite içinde sadece kullanılan ikonlar `<symbol>` olarak durur; her kullanım `<svg><use>` kopyasıdır. `icon()` önbellekteki bir örneği klonlar; tablo/ağaç gibi sık yerlerde `<bz-icon>` yerine bunu kullanın. Tanımlanmadan kullanılan ikon, tanımlanınca kendiliğinden görünür. Shadow root içinde `<use>` sprite'a ulaşamaz; orada `icon(name, { inline: true })` kullanılır.

**Ağaç:** Satırlar düz DOM (`role=treeitem` + `aria-level/setsize/posinset`) ve `repeat()` ile anahtarlı; açma/kapama sadece değişen satırları ekler. Satır başına tek bir effect tüm ARIA durumunu günceller. Seçim modları `single | leaf | none`; `leaf` menüler içindir (üst öğeler sadece açılır). Filtre, sadece yüklenmiş (lazy olmayan veya yüklenmiş) düğümlerde arar.

**Dialog:** Her dialog native `<dialog>.showModal()` ile açılır; top layer, z-index ve alttakileri etkisizleştirme işini tarayıcı çözer. Manager yığını tutar: Esc (bubbling dinlenir; içerideki bir bileşen `preventDefault` ederse dialog açık kalır) ve arka plan tıklaması sadece en üsttekini kapatır. Bir dialog kapanırken önce üstündekiler kapanır ve her birinin guard'ı (`beforeClose`, iptal edilebilir `before-close`) sorulur. Guard async olabilir: "kaydedilmemiş değişiklik" onayı yığına bir seviye daha eklenir. Odak açan elemente döner, sayfa kaydırması kilitlenir. `show()` ve `dialogs.open()` `close(result)` değerini döner; formdan açılan seçim dialogu sonucunu `await` ile forma verir. Chrome'da art arda Esc (close watcher) sonrası durum tutarlılığı elle doğrulandı.

**Tabs:** Enhancer; sekme ve paneller `value` (yoksa sıra) ile eşleşir, alt ağaç MutationObserver ile izlenir (sekmeler `repeat()` ile üretilebilir), iç içe `bz-tabs` birbirini etkilemez. Paneller sadece gizlenir; form durumu korunur. `fill` (sadece CSS) ile sekmeler kabın yüksekliğini doldurur, şerit sabit kalır ve açık panel kendi kayar; iç içe `fill` sekmeler üst panelin yüksekliğini alır (MDI: sadece en içteki panel kayar). Shell'in `data-shell-fill` zinciri `[fill]` kaplarında durur, çocuklarını kap kendisi boyutlar.

**Alan genişliği:** `bz-input`, `bz-combobox`, `bz-lookup`, `bz-textarea`, `bz-file-upload` tek sütunlu gridler (`minmax(0, 1fr)`): dar bir form hücresinde native input'un kendi genişliğinden (tarih alanı, combobox) küçülür, hücreden taşmaz.

**Toast:** Konum başına bir kap, manual popover (top layer). Modal açıkken tarayıcı dialog dışındaki her şeyi inert yapar; bu yüzden kap en üstteki dialogun içine taşınır (Chrome'da gerçek tıklamayla doğrulandı). Süre üzerine gelince/odakta ve sekme gizliyken durur.

**Tooltip:** Tek paylaşılan balon, belge düzeyinde delegasyon: tetikleyici başına maliyet bir öznitelik. Klavye odağında gösterilir, tıklamayla gelen odakta gösterilmez (`:focus-visible` yerine son giriş yöntemi izlenir). Esc capture aşamasında yakalanır ve `preventDefault` edilir; dialog manager bunu görüp dialogu açık bırakır.

**Sıfır bağımlılık ilkesi (popup'lar):** Katmanlama, dışarı tıklayınca kapanma ve iç içe popup'lar tarayıcının Popover API'si ile (`popover="auto"` menüler, `popover="manual"` toast/tooltip); modal dialog `<dialog>.showModal()`; konumlandırma kütüphanesiz `place()` (flip, viewport'a sığdırma, `fitHeight`, RTL). CSS anchor positioning tüm hedef tarayıcılarda yaygınlaşınca `place()` onunla değiştirilebilir. İleride bir "tarayıcı uyumluluk" bileşeni, Popover API / `showModal` / `@starting-style` gibi gerekenleri kontrol edip uyumsuz tarayıcıda uygulamayı durduracak; headless kod şimdilik Popover API yoksa `hidden` ile çalışan bir yedek yol içerir (jsdom testleri bu yoldan geçer).

**Menü:** Her menünün popup'ı `popover="auto"`; alt menünün popup'ı üst popup'ın DOM içinde olduğu için tarayıcı iç içe açık tutar, dışarı tıklama hepsini kapatır (`toggle` olayıyla durum eşitlenir). Öğeler gerçek odak alır. Açıkken trigger'a tıklama: light dismiss `pointerdown`'da kapatır, `click` tekrar açmasın diye `pointerdown` anındaki durum tutulur. Esc işlenip `preventDefault` edilir; çevredeki dialog kapanmaz. `openMenu()` modal açıkken menüyü en üstteki dialoga ekler (toast ile aynı inert sorunu). Tek seferlik menüde radio seçimi menüyü kapatıp değeri döndürür.

**Context menu:** `onContextRequest()` üç isteği tek yerden dinler: sağ tık (imleçte), klavye menü tuşu / Shift+F10 (elemanın yanında; Chrome bunu `button: -1` ve elemanın içinden bir koordinatla bildirir, diğerleri (0, 0)) ve dokunmatikte uzun basma (iOS `contextmenu` üretmez; parmak kalkınca oluşan tıklama yutulur). `<bz-context-menu selector="tbody tr">` sadece eşleşen elemanlarda açılır, diğer yerlerde tarayıcının menüsü kalır; hedef `contextTarget`, hazırlık `before-open` olayında. Masaüstü davranışları: `place()` nokta çapada sağa sığmazsa imlecin soluna açar (hizalama da çevrilir), açıkken başka yere sağ tık menüyü taşır, sağ tuşla bas-sürükle-bırak seçer (açılıştan sonraki ilk 250 ms'deki bırakma sayılmaz: macOS menüyü basışta açar).

**Router:** Navigation API üzerinde; tüm aynı-origin gezinmeler tek `navigate` olayında gelir, linkler düz `<a href>`. Olay iptal edilir, leave guard'lar (sayfa `onBeforeLeave`, `router.beforeLeave`), `beforeEnter`/`beforeEach`, lazy import'lar ve `load()`'lar çalışır, sonra gezinme hazırlanmış sonuçla yeniden başlatılır: URL sayfa hazır olunca değişir, reddedilen guard hiçbir şeyi değiştirmez, yeni gezinme eskisini `AbortSignal` ile iptal eder. İptal edilemeyen geri/ileri (kullanıcı etkileşimi olmadan art arda) önce URL'yi değiştirir; guard reddederse eski kayda dönülür. `precommitHandler` yaygınlaşınca bu iptal-yeniden başlat yöntemi onunla değiştirilebilir. Kaydırma geri yükleme tarayıcıda (`scroll: "after-transition"`); odak, ilk değişen derinlikteki outlet'in başlığına taşınır ve başlık duyurulur. Eşleştirme kendi küçük desen derleyicimizle (URLPattern yerine: Node 22 ve jsdom'da yok, özgüllük sıralamasını da biz yapıyoruz). Testlerde `tests/fake-navigation.ts` sahte Navigation API'si kullanılır. Router, headless'a bağımlı değildir; dialog kapatma gibi entegrasyonlar `router.beforeLeave(() => dialogs.closeAll())` ile uygulamada bağlanır.

**Shell (yerleşim):** `<bz-shell>` (eski adıyla `bz-app`) sadece yerleşimi yönetir. `header`, `footer`, `start`, `end` slotları isteğe bağlı, içerik (`<main>`) zorunlu; slotlara ne konacağı uygulamanın tercihi (`<bz-header>`, `<bz-footer>` hazır bileşenler). `variant="classic|sidebar"`, özel yerleşim için `--bz-shell-areas` (`grid-template-areas`). Kenar hücresi ızgarada uzanır, içindeki panel yapışkan ve kendi kayar; hücre içinde kaldığı için footer'a taşmaz. Header/footer yüksekliği `ResizeObserver` ile ölçülüp panellerin konumuna verilir. Genişlik de ölçülür (container query değil: çekmecenin odak, `inert` ve Esc davranışını JS'in bilmesi gerekiyor). Geniş: sol kenar ikon şeridine daralır, sağ kenar gizlenir. Dar: iki kenar da çekmece (aynı anda biri); açıkken geri kalanı `inert`, odak mevcut öğeye, Esc/örtü/bağlantı kapatır ve odak açan düğmeye döner. Açma/kapama düğmeleri bildirimsel: `data-shell-toggle="start|end"` olan herhangi bir düğme; `aria-expanded`/`aria-controls` shell tarafından tutulur, header ile shell arasında özel bir bağ yok. Tarayıcıda bulunan tuzaklar: sabit konumlu çekmecede kenar çubuğundan kalan `align-self: start`, `top/bottom` ile gerilmeyi engeller (`stretch` gerekir); çekmecenin `visibility` geçişi açılışta anında `visible` olmalı, yoksa `focus()` başarısız olur; kapanışta odak vermeden önce `flush()` ile `inert` kaldırılır (jsdom `inert`'i desteklemediği için bu sadece tarayıcıda görüldü).

**Shell: kaydırma modu.** Varsayılan `scroll-mode="content"` bir uygulama çerçevesi: shell ekran kadar (`--bz-shell-height`, 100dvh), belge kaymaz; içerik (`<main>`) ve kenar panelleri ayrı ayrı kayar, header/footer kaymaz, kaydırma çubuğu sadece içerikte. `scroll-mode="page"` eski davranış (belge kayar, yapışkan header/paneller). Özellik adı `scroll` olamazdı: her elementteki `element.scroll()` metodunu gölgeliyordu.
- **Router:** Navigation API kaydırmayı sadece belge için geri yükler. Router, ilk outlet'in `[data-scroll-container]` atasını (ya da `scrollElement`) kullanır: yeni sayfa başta açılır, geri/ileri ve yeniden yükleme geçmiş kaydına göre saklanan konuma döner (`sessionStorage`), `#id` öğeyi gösterir, aynı sayfadaki `replace` (sorgu değişikliği) konumu korur.
- **Geri/ileri düzeltmesi:** router her gezinmeyi iptal edip hazırlık bitince yeniden başlatıyordu. Chrome iptal edilmiş bir traverse'ü yeniden başlatmayı (`traverseTo` → "Invalid key") reddediyor, yani geri/ileri düğmeleri hiçbir şey yapmıyordu (jsdom'daki sahte Navigation API bunu göstermedi). Traverse'ler artık iptal edilmiyor: adres hemen değişir, sayfa sonra hazırlanır, reddeden guard önceki kayda geri döndürür.
- **`data-shell-fill`:** içerikteki bir öğe kalan yüksekliği alır. JS yok: içerik ile öğe arasındaki her ata `:has([data-shell-fill])` ile flex sütun olur, diğer çocuklar küçülmez, gizli öğeler (`[hidden]` sekme panelleri) atlanır. Zincir iç içe bir `bz-shell`'de durur (`:not(bz-shell)`, `:not(:has(bz-shell [data-shell-fill]))`); yoksa dış shell iç shell'i de flex yapıp ızgarasını bozuyordu (playground'daki canlı demo tam bu durumdu).

**Kartlar (`bz-card`, `bz-card-group`, `bz-card-list`):** İş uygulamalarındaki modül başlatıcısı (ana sayfa) için tasarlandı. Kart ikonunun tonu `hue` ile verilir ya da başlıktan türetilir (`hueOf`, avatar ile aynı): her modülün kalıcı bir rengi olur. Renk `color-mix(in oklch, …)` ile yüzey / metin rengine karıştırılır, açık ve koyu temada okunur kalır. `href` verilince kart "uzatılmış bağlantı" olur: başlıktaki `<a>`'nın `::after`'ı tüm kartı kaplar. Bağlantının adı başlık olur, açıklama ve durum satırı `aria-describedby` ile bağlanır; `actions` slotundaki düğmeler bağlantının üstünde ayrı kalır, iç içe etkileşimli öğe olmaz. Eylemler üzerine gelince / odakta görünür, basılı olan (favori) ve dokunmatik ekranda hep görünür. Liste tek sekme durağıdır; ↑/↓ satır sarmasını izlemek için kartların konumuna bakar (en yakın alt/üst satır, yatayda en yakın kart). Metin filtresi JS'te (aksan / büyük-küçük harf duyarsız, `keywords` dahil); boş gruplar gizlenir, grup başlığı görünür kart sayısını gösterir.

**Demo uygulamalar (`playground/apps/`):** Bazlama'nın kullanımda nasıl göründüğünü gösteren üç ayrı sayfa (Vite çok sayfalı build; playground'daki "Demo" menüsünden yeni sekmede açılır). Hepsi hash routing kullanır (`#/…`, sunucu ayarı gerekmez) ve birlikte tüm bileşenleri kapsar:
- **Ada CRM** (`apps/crm`): klasik shell, içerik kaydırması, boyutlandırılabilir + saklanan kenarlar, sağda aktivite paneli; gösterge paneli, sayfayı dolduran müşteri grid'i (sütun düzeni saklanır, sağ tık menüsü, geri alınabilir silme), sekmeli müşteri formu (form-layout, lookup, combobox, radio, checkbox, switch, textarea; kaydedilmemiş değişiklik uyarısı), sayfalı siparişler, ayarlar (tema).
- **Posta** (`apps/mail`): `sidebar` varyantı, koyu tema, üç bölme (klasörler | `bz-list` ileti listesi | okuma paneli); dar ekranda okuma paneli çekmece. Kişi seçmeli yazma dialogu (lookup tablo seçici, beforeClose), `contextMenu()` ve `openMenu`, `toast.promise`.
- **Rehber** (`apps/docs`): `scroll-mode="page"`, forest teması, dokümantasyon sitesi (makaleler, kod sekmeleri, SSS akordeonu, sayfalı liste, iletişim formu).

Uygulamaları yazarken bulunan kütüphane düzeltmeleri:
- **Router, hash modu:** aynı origin'deki her adresi kapsam içi sayıyordu; bir demo uygulamasından playground'a dönüş bağlantısı uygulama içi rota olarak yakalanıyordu. Kapsam artık yalnızca router'ın çalıştığı belgenin yolu; `href` de bu yolu kullanır (`/apps/crm/#/…`, `base` gerekmez).
- **`bz-tree`, bağlantı öğeleri:** tıklama `value`'yu hemen değiştiriyordu; router gezinmeyi reddedince (kaydedilmemiş form) menü yanlış öğede kalıyordu. `href`'li bir öğeyi artık gidilen sayfa seçer (`value` rotadan bağlanır). Yeni `TreeItem.target` (`_blank` → `rel="noopener"`).
- **Prototip metodları** (`bz-data-grid`): `configurable: true`; paket aynı sayfada iki kez yüklenirse (HMR, test ortamı) hata vermez.

**Saklama (`persist`):** kullanıcının düzeni (shell: kenar genişlikleri ve daraltma; grid: sütun durumu ve sıralama) isteğe bağlı olarak tarayıcıda saklanır: `persist="anahtar"` → `localStorage["bz-shell:anahtar"]` / `["bz-data-grid:anahtar"]`. Anahtar zorunlu (aynı sayfada birden çok bileşen çakışmasın; bileşen adı ön eki shell ile grid'in aynı adı kullanmasına izin verir). Açılışta kayıtlı değer başlangıç özniteliklerinin önüne geçer (kullanıcının tercihi geliştiricinin varsayılanından önce gelir), okunan değerler doğrulanır / sınırlara kısılır, bozuk JSON yok sayılır, depolama yoksa (gizli pencere) sessizce saklanmaz. Anahtar değişirse önce onun kaydı yüklenir, eski değerler yeni anahtarın üstüne yazılmaz. Olaylar yine gelir: sunucuda, kullanıcı başına saklamak isteyen uygulama `persist` vermeden olaylarla kendi yöntemini kullanır. Grid, kayıttan yüklediğini `columns-change` (reason "restore") ve `sort` olaylarıyla bildirir; bağlı uygulama durumu böylece eşitlenir.

**Shell: kenarları boyutlandırma.** `resizable` her kenarın iç kenarına bir ayırıcı koyar (`role="separator"`, `aria-valuenow/min/max`, odaklanabilir). Fareyle sürüklenir; klavyede ←/→ (Shift ile daha büyük adım), Home/End, Enter ile değişir; çift tık varsayılana döner. Genişlik CSS değişkenine (`--bz-shell-start-width` / `--bz-shell-end-width`) yazılır. Durum `start-width` / `end-width` özelliklerinde tutulur, `resize` olayıyla bildirilir; saklamak uygulamanın işi, grid'deki `columnState` gibi. En büyük genişlik, diğer kenar ve içerik için 320 px bırakacak şekilde kısılır. En küçüğün yarısının altına sürüklenirse bırakınca kenar daralır (VS Code gibi), kayıtlı genişlik ise korunur. Dar modda (çekmeceler) ayırıcı yoktur. Sürükleme sırasında genişlik geçişi kapatılır; klavyeyle değişimde açık kalır.

**Header / Avatar:** `<bz-header>` logo, başlık/alt başlık, orta alan, eylemler ve kullanıcı alanından (avatar + ad + `bz-menu`) oluşur. Kullanıcı menüsü öğeleri `slot="user-menu"` ile gelir ve menüye verilirken `slot` özniteliği kaldırılır; yoksa `bz-menu` onları kendi (çizmediği) `user-menu` slotuna ayırır. Genel kural: bir bileşenin slot içeriğini başka bir slotlu bileşene aktarırken `slot` özniteliği temizlenmeli. `<bz-avatar>` resim yoksa veya yüklenemezse Türkçe kurallarla baş harfleri gösterir; renk tonu addan türetilir, durum noktası isteğe bağlı.

**Accordion:** `<bz-accordion>` + `<bz-accordion-item>`; başlık bir `role=heading` içindeki düğme, içerik `role=region`. Tekli (varsayılan), `multiple`, `always-open`; `fill` ile kabı doldurur (açık öğe kalanı alır, kapalı başlıklar dizilir — masaüstü tarzı kenar menüsü). Kapalı içerik `hidden="until-found"`: tarayıcının Ctrl+F'i içinde arar ve `beforematch` ile öğe açılır (sıfır bağımlılık, tarayıcı özelliği). Öğe tek başına da çalışır: açma isteği bir olayla accordion'a sorulur, accordion yoksa öğe kendisi açılır.

**Kapatılabilir sekmeler:** `<bz-tab closable>` (×, orta tık, Delete). Sıra: iptal edilebilir `before-close` (anlık) → `beforeClose(value, tab)` (Promise dönebilir: "kaydedilmedi" onayı) → seçim komşuya geçer (odaktaysa odak da) → `close`. Sekmeyi `close`'ta uygulama kaldırır; `remove-on-close` sadece elle yazılmış HTML sekmeler için (`repeat()`'in düğümlerini silmek listeyi bozar). `bz-tab-list` taşınca yatay kayar: yapışkan ‹ › düğmeleri (erişilebilirlik ağacında yok; oklar zaten sekmeler arasında gezinir ve görünür alana getirir), tekerlek yana kaydırır, seçili sekme görünür alana gelir.

**Alert / Badge / Chip:** `bz-alert` varsayılan olarak `role=note`: sayfanın parçası, her açılışta okunmaz. Sonradan çıkan mesajlar için `live="polite|assertive"` → `role=status|alert`. Kapatma iptal edilebilir `dismiss` olayıyla; varsayılan eylem `hidden`. `bz-badge` etkileşimsiz: metin, `count` + `max` → "99+", `dot`; çıplak sayı ve nokta için `label`. `bz-chip` iki rolde: `selectable` → `role=button` + `aria-pressed` (filtre çipi); `removable` → ayrı bir × düğmesi ve `remove` olayı (çipi uygulama kaldırır).

**Tablo satırları:** `row-activate` { row, key, via } çift tıkta her zaman, `activatable` ile Enter'da tetiklenir. `activatable` satırları tek sekme duraklı yapar (roving tabindex): ↑/↓, Home/End, PageUp/PageDown gezinir, Space seçer. Tablo semantiği korunur (grid rolüne geçilmedi); odaklı satır silinince sekme durağı ilk satıra döner.

**Ağaç genişliği:** `bz-tree` ızgarası `minmax(0, 1fr)` sütun kullanır. Yoksa sütun en uzun etiketin tam genişliğinden küçülemiyor; etiketler kısalmıyor ve kenar menüsünde yatay kaydırma çıkıyordu (QMEX mockup'ında görüldü).

**Seçim kontrolleri:** `bz-checkbox`, `bz-switch` (role=switch) ve `bz-radio-group` native input sarar. Form verisi, `required` doğrulaması, reset, Space tuşu, radyolarda ok tuşları ve tek sekme durağı tarayıcıdan gelir. Göstergede ayrı span yok: native input `appearance: none` ile çizilir. İçteki native `change` host'ta **capture** fazında durdurulur (yoksa host'u dinleyen de alırdı) ve yerine `change` { checked, value } / { value } yayınlanır. Radyolar gruptan sonra render olur: `defaultChecked` bir input ilk görüldüğünde yazılır. Reset değeri `checked` yerine `defaultChecked`'ten okunur, çünkü bekleyen mutation bildirimi eski değeri geri yazabiliyordu. Mutation gözlenen efektlerde attribute'lar sadece değişince yazılır; aynı değeri yazmak bile yeni bir kayıt üretip döngüye sokuyordu.

**Textarea:** `autosize` = CSS `field-sizing: content` (+ `max-rows` ile `max-height`); destek yoksa `scrollHeight` ölçülür. `expandable` metni `dialogs.open` ile büyük bir editörde açar (Ctrl+Shift+Enter). Uygula, textarea'dan `input` + `change` yayınlar, yani yazmakla aynı yol.

**Parola:** `bz-password` alanın görünümünü `bz-input` ile paylaşır (CSS'te aynı kural kümesi); farkı göster/gizle düğmesi, Caps Lock uyarısı ve güç göstergesidir. Göster/gizle yalnızca native input'un `type`'ını değiştirir, bu yüzden değer, odak, imleç konumu ve parola yöneticisinin alanı tanıması korunur; düğme `tabindex="-1"`'dir, Tab sırası alanın kendisi olsun diye. Caps Lock durumu klavye olaylarının `getModifierState`'inden okunur (ayrı bir API yok) ve sadece alan odaktayken gösterilir. `passwordStrength()` dışa aktarılır: uzunluk + karakter çeşidine bakan 0-4 arası kaba bir ipucu, politika değil.

**Login:** `bz-login` kimlik doğrulaması yapmaz; `submit` olayını yayar, `loading` / `error` / `step`'i uygulama yönetir. Alanlar gerçek `bz-input`/`bz-password`/`bz-checkbox` ve gerçek bir `<form>` içindedir: Enter gönderir, `required` native doğrulanır, parola yöneticileri formu tanır. İçteki native `submit` host'ta durdurulur, dışarı sadece detaylı CustomEvent çıkar. İkinci adım (`step="code"`) aynı kartta açılır; kod alanı `autocomplete="one-time-code"` ve tamamlanınca formu kendiliğinden gönderir (`no-auto-submit` kapatır), yeniden gönderme sayacı adıma girildiğinde başlar.

**Dosya alanı:** `bz-file-upload`'ın iki modu var. `url`/`uploader` yoksa sadece toplar ve doğrular; dosyalar `ElementInternals.setFormValue(FormData)` ile formun değeri olur, sıradan bir form gönderimiyle giderler. `url` (ya da kendi `uploader` fonksiyonunuz) verilirse dosyaları tek tek kendisi gönderir ve form değerine **yazmaz**, yoksa aynı dosya iki kez giderdi. Gönderim fetch ile değil XHR ile yapılır: gövdeyi akıtmadan gerçek yükleme ilerlemesini yalnızca XHR bildirir; iptal `AbortController` ile, tekrar deneme dosya bazında. Liste satırları `repeat()` ile anahtarlı ve her dosyanın durumu/ilerlemesi **kendi signal'ıdır**, böylece ilerleme tiki tüm satırı değil sadece çubuğu günceller. Bırakma alanı bir `<button>`: Enter/Space seçiciyi açar, sürükle-bırak aynı elemanda çalışır; `dragleave` titremesin diye giriş/çıkış sayılır.

**Varsayılanı açık olan bayraklar:** `prop.boolean(true, …)` kullanılmaz. Attribute'ta HTML semantiği geçerli (varlık = true), bu yüzden varsayılanı `true` olan bir bayrak markup'tan kapatılamaz. Bunun yerine kapalı durum adlandırılır: `hide-toggle`, `hide-caps-warning`, `hide-remember`, `hide-forgot`, `no-auto-submit`, `manual` (mevcut `hide-close`, `hide-zero` ile aynı çizgi).

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
