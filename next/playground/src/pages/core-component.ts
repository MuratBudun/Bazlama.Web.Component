import { html } from "@bazlama/core"
import componentSource from "../../../packages/core/src/component.ts?raw"
import { codeBlock, sourceBlock } from "../docs/code"
import ctxSlots from "../docs/examples/ctx-slots.js?raw"
import defineBasic from "../docs/examples/define-basic.js?raw"
import enhancer from "../docs/examples/enhancer.js?raw"
import formExample from "../docs/examples/form.js?raw"
import lifecycle from "../docs/examples/lifecycle.js?raw"
import props from "../docs/examples/props.js?raw"
import { runner } from "../docs/runner"
import { toc } from "./doc-shared"

const sections = [
  ["define", "define()"],
  ["props", "prop türleri"],
  ["lifecycle", "Yaşam döngüsü"],
  ["ctx", "ctx ve slot'lar"],
  ["kinds", "Şablon ve enhancer"],
  ["form", "Form bileşeni"],
] as const

export default {
  id: "core-component",
  group: "Core",
  title: "Bileşen (define)",
  description:
    "define(tag, { props, setup }) bir custom element sınıfı üretir ve kaydeder. Prop'lar signal'dir; setup bağlanınca bir kez çalışır ve bir şablon döndürür (ya da hiçbir şey döndürmez).",
  render() {
    return html`
      ${toc(sections)}

      <section class="doc" id="define">
        <h2>define()</h2>
        ${codeBlock(
          `define("bz-ornek", {
  props: { /* prop.string(), prop.number(), prop.boolean(), prop.object() */ },
  form: false,      // true → ElementInternals, form alanı gibi davranır
  shadow: false,    // true → shadow root içine render (varsayılan: light DOM)
  styles: "",       // shadow kullanılırsa paylaşılan CSSStyleSheet
  setup(props, ctx) {
    // props.x() okur, props.x.set(v) yazar (hepsi signal)
    // ctx: host, internals, emit, slot, hasSlot, on, onMount, onFormReset, onFormDisabled
    return html\`…\`  // veya undefined (enhancer)
  },
})`,
          "Seçenekler"
        )}
        <ul>
          <li><strong>Sınıf yazmazsınız,</strong> decorator gerekmez; derleyici ayarı gerekmez, düz JavaScript'te de çalışır.</li>
          <li>Her <code>define()</code> çağrısı ayrı bir sınıf üretir. Prop tanımları bileşenler arasında paylaşılmaz.</li>
          <li>Aynı etiket ikinci kez tanımlanırsa hata vermez, mevcut sınıfı döndürür (HMR ve çift import için).</li>
        </ul>
        ${runner(defineBasic, "İlk bileşen")}
      </section>

      <section class="doc" id="props">
        <h2>prop türleri</h2>
        <table class="api">
          <thead><tr><th>Tanım</th><th>Tip</th><th>Attribute → değer</th><th>Değer → attribute (reflect)</th></tr></thead>
          <tbody>
            <tr><td><code>prop.string("x")</code></td><td><code>string</code></td><td>olduğu gibi; yoksa varsayılan</td><td>boş metin → attribute kaldırılır</td></tr>
            <tr><td><code>prop.string&lt;"a" | "b"&gt;("a")</code></td><td>dar birleşim</td><td>olduğu gibi</td><td>olduğu gibi</td></tr>
            <tr><td><code>prop.number(0)</code></td><td><code>number</code></td><td><code>Number()</code>; geçersizse varsayılan (yuvarlama yok)</td><td><code>String(n)</code></td></tr>
            <tr><td><code>prop.boolean()</code></td><td><code>boolean</code></td><td>attribute <strong>varsa</strong> true (HTML kuralı)</td><td>true → <code>attr=""</code>, false → kaldır</td></tr>
            <tr><td><code>prop.object&lt;T&gt;(v)</code></td><td><code>T</code></td><td>varsayılan: attribute yok</td><td>—</td></tr>
          </tbody>
        </table>
        <ul>
          <li>İki seçenek var: <code>{ reflect: true }</code> değeri attribute'a geri yazar (CSS'te <code>[open]</code> gibi seçiciler için); <code>{ attribute: false }</code> attribute okumayı kapatır.</li>
          <li>camelCase prop adları kebab-case attribute olur: <code>maxItems</code> ↔ <code>max-items</code>.</li>
          <li>Her prop elementte bir getter/setter'dır ve getter signal okuduğu için <code>el.value</code> bir effect içinde reaktiftir.</li>
          <li>Prop adı olarak <code>title</code>, <code>hidden</code>, <code>role</code> gibi <code>HTMLElement</code> üzerinde zaten bulunan adları kullanmayın.</li>
        </ul>
        ${runner(props, "Attribute ↔ property senkronu")}
        ${sourceBlock("component.ts", componentSource, [
          "export const prop",
          "function fromAttribute",
          "function toAttribute",
          "    attributeChangedCallback",
          "Object.defineProperty(BazlamaElement.prototype",
        ])}
      </section>

      <section class="doc" id="lifecycle">
        <h2>Yaşam döngüsü</h2>
        <ol class="steps">
          <li><strong>constructor:</strong> Prop signal'leri oluşturulur; <code>attachInternals</code>/<code>attachShadow</code> yapılır. Attribute'lara ve çocuklara <em>dokunulmaz</em> (spesifikasyon gereği). Bu yüzden <code>document.createElement</code> çalışır.</li>
          <li><strong>attributeChangedCallback:</strong> Markup'taki attribute'lar signal'lere yazılır (upgrade sırasında da).</li>
          <li><strong>connectedCallback:</strong> Bir <code>root()</code> açılır, reflect effect'leri kurulur, light DOM çocukları yakalanır, <code>setup</code> çalışır, şablon render edilir, <code>onMount</code>'lar çağrılır.</li>
          <li><strong>Taşıma:</strong> Aynı tick içinde çıkarıp başka yere eklemek bileşeni canlı tutar; setup tekrar çalışmaz.</li>
          <li><strong>disconnectedCallback:</strong> Bir microtask sonra hâlâ DOM dışındaysa root dispose edilir: effect'ler, <code>ctx.on</code> dinleyicileri ve <code>onCleanup</code>'lar temizlenir.</li>
          <li><strong>Yeniden ekleme:</strong> Setup tekrar çalışır. Prop'lar korunur, setup içindeki iç durum sıfırdan başlar.</li>
        </ol>
        ${runner(lifecycle, "Ekle, taşı, kaldır")}
        ${sourceBlock("component.ts", componentSource, ["    constructor()", "    connectedCallback", "    disconnectedCallback"])}
      </section>

      <section class="doc" id="ctx">
        <h2>ctx ve light DOM slot'ları</h2>
        <table class="api">
          <thead><tr><th>Üye</th><th>Ne yapar</th></tr></thead>
          <tbody>
            <tr><td><code>host</code></td><td>Elementin kendisi (prop'larıyla tipli).</td></tr>
            <tr><td><code>emit(type, detail)</code></td><td>Kabarcıklanan (<code>bubbles</code>, <code>composed</code>) bir <code>CustomEvent</code> gönderir.</td></tr>
            <tr><td><code>slot(name?)</code> / <code>hasSlot(name?)</code></td><td>İlk bağlanmada yakalanan çocuklar; <code>slot="…"</code> attribute'u olmayanlar varsayılan slot.</td></tr>
            <tr><td><code>on(target, type, fn)</code></td><td>Bileşen dispose edilince otomatik kaldırılan dinleyici.</td></tr>
            <tr><td><code>onMount(fn)</code></td><td>Şablon DOM'a eklendikten sonra çalışır (ref'ler hazır).</td></tr>
            <tr><td><code>internals</code>, <code>onFormReset</code>, <code>onFormDisabled</code></td><td>Form bileşenleri için (<code>form: true</code>).</td></tr>
          </tbody>
        </table>
        <p class="note">
          Sınır: slot'lar sadece ilk bağlanmada yakalanır. Sonradan <code>appendChild</code> ile eklenen çocuk şablona taşınmaz.
          Dinamik çocuklar için <code>repeat()</code> kullanın (çapa düğümleri de birlikte taşınır) veya bileşeni enhancer olarak yazın.
        </p>
        ${runner(ctxSlots, "Slot'lar, emit ve on")}
        ${sourceBlock("component.ts", componentSource, ["const ctx: Context<P> = {", "    _captureSlots"])}
      </section>

      <section class="doc" id="kinds">
        <h2>Şablon bileşeni ve enhancer</h2>
        <table class="api">
          <thead><tr><th></th><th>Şablon bileşeni</th><th>Enhancer</th></tr></thead>
          <tbody>
            <tr><td>setup döndürür</td><td><code>html\`…\`</code></td><td>hiçbir şey</td></tr>
            <tr><td>Çocuklar</td><td>Slot olarak şablona taşınır</td><td>Yerinde kalır; dinamik eklemeler sorunsuz</td></tr>
            <tr><td>Uygun olduğu yer</td><td>Kendi yapısı olan bileşenler: input, panel, combobox, table</td><td>Mevcut içeriğe davranış ekleyenler: button, list</td></tr>
          </tbody>
        </table>
        ${runner(enhancer, "Enhancer: kopyala düğmesi")}
        ${sourceBlock("component.ts", componentSource, ["    _setup()"],
          "setup'ın dönüş değeri undefined değilse host boşaltılır ve şablon render edilir; aksi hâlde host'un çocuklarına dokunulmaz.")}
      </section>

      <section class="doc" id="form">
        <h2>Form bileşeni</h2>
        <p>
          <code>form: true</code> ile element <code>ElementInternals</code> alır ve bir <code>&lt;form&gt;</code> içinde gerçek bir alan gibi davranır:
          <code>setFormValue</code> ile FormData'ya katılır, <code>setValidity</code> ile doğrulamaya girer, <code>form.reset()</code> ile sıfırlanır.
        </p>
        ${runner(formExample, "Puanlama alanı")}
      </section>
    `
  },
}
