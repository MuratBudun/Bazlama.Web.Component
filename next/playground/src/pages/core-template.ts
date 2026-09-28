import { html } from "@bazlama/core"
import templateSource from "../../../packages/core/src/template.ts?raw"
import { codeBlock, sourceBlock } from "../docs/code"
import bindings from "../docs/examples/bindings.js?raw"
import conditional from "../docs/examples/conditional.js?raw"
import fineGrained from "../docs/examples/fine-grained.js?raw"
import limits from "../docs/examples/limits.js?raw"
import lists from "../docs/examples/lists.js?raw"
import security from "../docs/examples/security.js?raw"
import { runner } from "../docs/runner"
import { toc } from "./doc-shared"

const sections = [
  ["how", "Nasıl çalışır"],
  ["bindings", "Bağlama türleri"],
  ["fine", "İnce taneli güncelleme"],
  ["conditional", "Koşullu içerik"],
  ["lists", "Listeler: repeat()"],
  ["security", "Güvenlik"],
  ["limits", "Sınırlar"],
] as const

export default {
  id: "core-template",
  group: "Core",
  title: "Şablon (html)",
  description:
    "html`` etiketli şablonlar sanal DOM kullanmaz: şablon bir kez ayrıştırılır, her kullanımda klonlanır ve her ${…} doğrudan bir DOM düğümüne bağlanır.",
  render() {
    return html`
      ${toc(sections)}

      <section class="doc" id="how">
        <h2>Nasıl çalışır</h2>
        <ol>
          <li><code>html\`…\`</code> sadece <code>{ strings, values }</code> taşıyan bir <code>TemplateResult</code> döndürür; henüz DOM yoktur.</li>
          <li>İlk kullanımda <code>strings</code> dizisi <strong>bir kez derlenir</strong>: her <code>\${}</code> yerine bir işaretçi konur ve bir <code>&lt;template&gt;</code> oluşturulur. JavaScript aynı şablon için her zaman aynı <code>strings</code> dizisini verdiğinden sonuç bir WeakMap'te önbelleğe alınır.</li>
          <li>Her render'da template <code>importNode</code> ile klonlanır ve işaretçiler TreeWalker ile bulunur.</li>
          <li>Her işaretçi bir <strong>parça (part)</strong> olur ve değerine bağlanır. Değer fonksiyonsa parça bir effect içinde güncellenir.</li>
        </ol>
        ${codeBlock(
          `// Yazdığınız:
html\`<p class=\${cls} @click=\${onClick}>Merhaba \${name}</p>\`

// Derlenen <template> (bir kez):
<p bz$0="class" bz$1="@click">Merhaba <!--bz$2--></p>
//   bz$0="class"  → attribute parçası, değer values[0]
//   bz$1="@click" → olay parçası,      değer values[1]
//   <!--bz$2-->    → içerik parçası,    değer values[2]`,
          "Derleme sonucu"
        )}
        ${sourceBlock("template.ts", templateSource, ["export function html", "function compile", "function instantiate"])}
      </section>

      <section class="doc" id="bindings">
        <h2>Bağlama türleri</h2>
        <table class="api">
          <thead><tr><th>Yazım</th><th>Ne yapar</th><th>Fonksiyon verilirse</th></tr></thead>
          <tbody>
            <tr><td><code>\${değer}</code></td><td>İçerik: metin, şablon, düğüm, dizi, <code>repeat()</code>. <code>null</code>/<code>false</code> hiçbir şey çizmez.</td><td>reaktif</td></tr>
            <tr><td><code>attr=\${değer}</code></td><td><code>setAttribute</code>; <code>null</code>/<code>false</code> kaldırır, <code>true</code> boş değer yazar.</td><td>reaktif</td></tr>
            <tr><td><code>?attr=\${değer}</code></td><td>Boolean attribute (<code>toggleAttribute</code>).</td><td>reaktif</td></tr>
            <tr><td><code>.prop=\${değer}</code></td><td>Element property'si (<code>input.value</code>, bileşen prop'ları).</td><td>reaktif</td></tr>
            <tr><td><code>@olay=\${fn}</code></td><td><code>addEventListener</code>.</td><td>işleyicinin kendisi</td></tr>
            <tr><td><code>@olay.self=\${fn}</code></td><td>Değiştiriciler: <code>.self</code> sadece elementin kendi olayı (içeriden kabarcıklananlar değil), <code>.prevent</code>, <code>.stop</code>, <code>.once</code>. Birleştirilebilir: <code>@click.prevent.stop</code>.</td><td>işleyicinin kendisi</td></tr>
            <tr><td><code>ref=\${fn}</code></td><td>Elemanla bir kez çağrılır.</td><td>çağrılır</td></tr>
          </tbody>
        </table>
        ${runner(bindings, "Bütün bağlama türleri")}
        ${sourceBlock("template.ts", templateSource, ["function bind"],
          "Aynı değer tekrar gelirse DOM'a yazılmaz (prev karşılaştırması). Bu yüzden bir signal'e bağlı attribute'lar gereksiz stil yeniden hesaplamasına yol açmaz.")}
      </section>

      <section class="doc" id="fine">
        <h2>İnce taneli güncelleme</h2>
        <p>
          Bileşen fonksiyonu yeniden çalışmaz, diff yapılmaz. Bir signal değişince yalnızca onu okuyan parçalar güncellenir.
          Aşağıdaki örnek, her güncellemede DOM'da olan her değişikliği MutationObserver ile log'a yazıyor.
        </p>
        ${runner(fineGrained, "Sadece değişen düğüm güncellenir")}
      </section>

      <section class="doc" id="conditional">
        <h2>Koşullu içerik ve iç içe şablonlar</h2>
        <p>
          İçerik parçasına şablon döndüren bir fonksiyon verin. Fonksiyon sadece okuduğu signal'ler değişince yeniden çalışır.
          Dal değişince eski dalın DOM'u kaldırılır, içindeki effect'ler temizlenir.
        </p>
        ${runner(conditional, "Koşullu şablon")}
        ${sourceBlock("template.ts", templateSource, ["function childPart"],
          "İçerik parçası bir başlangıç (boş metin) ve bir bitiş (yorum) düğümü arasındaki alanı yönetir. Metin değerleri için var olan metin düğümünün data'sı güncellenir.")}
      </section>

      <section class="doc" id="lists">
        <h2>Listeler: repeat()</h2>
        <ul>
          <li><code>repeat(items, key, render)</code>: Her anahtar için satır bir kez oluşturulur; sıra değişince DOM düğümleri <strong>taşınır</strong>.</li>
          <li>Bir satırı güncellemek için o satırın nesnesini <strong>yenisiyle değiştirin</strong>; aynı nesne kalırsa satır yeniden çizilmez.</li>
          <li><code>items</code> olarak signal'in kendisini verin (<code>repeat(items, …)</code>). Böylece liste yapısı güncellemeler arasında korunur.</li>
          <li>Anahtarsız <code>items().map(…)</code> küçük ve statik listeler için yeterlidir, ama her değişiklikte tüm satırları yeniden oluşturur.</li>
        </ul>
        ${runner(lists, "Anahtarlı ve anahtarsız liste")}
        ${sourceBlock("template.ts", templateSource, ["export function repeat", "class KeyedList"])}
      </section>

      <section class="doc" id="security">
        <h2>Güvenlik</h2>
        <p>
          Değerler hiçbir zaman HTML olarak ayrıştırılmaz: içerik <code>Text</code> düğümü, attribute <code>setAttribute</code> ile yazılır.
          Kullanıcı verisini şablona doğrudan koymak güvenlidir. Eski sürümdeki <code>innerHTML</code> + string birleştirme riskini ortadan kaldıran fark budur.
        </p>
        ${runner(security, "XSS denemesi")}
      </section>

      <section class="doc" id="limits">
        <h2>Sınırlar</h2>
        <ul>
          <li>Attribute bağlaması değerin tamamı olmalı: <code>href=\${"#" + id}</code> çalışır, <code>href="#\${id}"</code> açık bir hata verir.</li>
          <li>Fonksiyon değerleri reaktif kabul edilir. Property'ye fonksiyonun kendisini vermek için sarmalayın: <code>.fn=\${() =&gt; fn}</code>.</li>
          <li><code>&lt;textarea&gt;</code>, <code>&lt;style&gt;</code>, <code>&lt;title&gt;</code> içinde <code>\${}</code> desteklenmez; <code>.value</code> kullanın.</li>
          <li>Etiket içinde attribute adı olmadan (<code>&lt;div \${attrs}&gt;</code>) yayma desteklenmez.</li>
        </ul>
        ${runner(limits, "Sınırlar ve çözümleri")}
      </section>
    `
  },
}
