import { html } from "@bazlama/core"
import signalSource from "../../../packages/core/src/signal.ts?raw"
import { codeBlock, sourceBlock } from "../docs/code"
import batching from "../docs/examples/batching.js?raw"
import computedExample from "../docs/examples/computed.js?raw"
import ownership from "../docs/examples/ownership.js?raw"
import signalBasic from "../docs/examples/signal-basic.js?raw"
import signalEquality from "../docs/examples/signal-equality.js?raw"
import { runner } from "../docs/runner"
import { toc } from "./doc-shared"

const sections = [
  ["model", "Zihinsel model"],
  ["signal", "signal()"],
  ["computed", "computed()"],
  ["effect", "effect() ve toplu çalışma"],
  ["owner", "Sahiplik ve temizlik"],
  ["cheatsheet", "Ne zaman ne?"],
] as const

export default {
  id: "core-signals",
  group: "Core",
  title: "Reaktivite",
  description:
    "Bazlama'nın bütün reaktivitesi üç yapıya dayanır: signal (değer), computed (türetilmiş değer) ve effect (yan etki). Şablonlar ve bileşen prop'ları da bunların üzerine kuruludur.",
  render() {
    return html`
      ${toc(sections)}

      <section class="doc" id="model">
        <h2>Zihinsel model</h2>
        <div class="flow">
          <div class="flow-box"><b>signal</b><span>değer tutar</span></div>
          <div class="flow-arrow">→</div>
          <div class="flow-box"><b>computed</b><span>değer türetir (tembel)</span></div>
          <div class="flow-arrow">→</div>
          <div class="flow-box"><b>effect</b><span>yan etki çalıştırır</span></div>
          <div class="flow-arrow">→</div>
          <div class="flow-box"><b>DOM</b><span>şablon parçaları</span></div>
        </div>
        <ul>
          <li><strong>Abonelik otomatiktir.</strong> Bir effect veya computed çalışırken hangi signal'leri okursa onlara bağlanır. Abone listesi elle tutulmaz.</li>
          <li><strong>Bağımlılıklar her çalıştırmada yeniden toplanır.</strong> <code>if (a()) b()</code> gibi koşullu okumalar doğru takip edilir: <code>a</code> false iken <code>b</code> değişse de effect çalışmaz.</li>
          <li><strong>Şablondaki her reaktif <code>\${…}</code> küçük bir effect'tir.</strong> Değişiklikte sadece o metin düğümü veya o attribute güncellenir; bileşen "yeniden render" edilmez.</li>
        </ul>
      </section>

      <section class="doc" id="signal">
        <h2>signal()</h2>
        <p>Değiştirilebilir durumun tek kaynağı. Fonksiyon gibi çağrılarak okunur, <code>set</code> / <code>update</code> ile yazılır.</p>
        <table class="api">
          <thead><tr><th>Kullanım</th><th>Anlamı</th></tr></thead>
          <tbody>
            <tr><td><code>const s = signal(0)</code></td><td>Başlangıç değeriyle oluşturur.</td></tr>
            <tr><td><code>s()</code></td><td>Okur; effect/computed içindeyse abone olur.</td></tr>
            <tr><td><code>s.peek()</code></td><td>Okur ama abone olmaz.</td></tr>
            <tr><td><code>s.set(v)</code></td><td>Yazar. Değer <code>Object.is</code> ile aynıysa hiçbir şey olmaz.</td></tr>
            <tr><td><code>s.update(fn)</code></td><td><code>s.set(fn(s.peek()))</code> kısayolu.</td></tr>
            <tr><td><code>signal(v, equals)</code></td><td>Özel eşitlik fonksiyonu.</td></tr>
          </tbody>
        </table>
        ${runner(signalBasic, "Temel kullanım")}
        <h3>Dikkat: değişmezlik (immutability)</h3>
        <p>Signal referansa bakar. Diziyi veya nesneyi yerinde değiştirmek (<code>push</code>, <code>obj.x = 1</code>) kimseyi uyandırmaz; her zaman yeni bir değer verin.</p>
        ${runner(signalEquality, "Eşitlik ve değişmezlik")}
        ${sourceBlock("signal.ts", signalSource, ["export function signal", "function track"],
          "Signal, kendini okuyan reaction'ları bir Set'te tutar (track). set() değeri değiştirince hepsine notify() der.")}
      </section>

      <section class="doc" id="computed">
        <h2>computed()</h2>
        <ul>
          <li><strong>Tembel:</strong> Kimse okumadıkça hesaplanmaz.</li>
          <li><strong>Önbellekli:</strong> Bağımlılıkları değişmedikçe tekrar okumak hesaplamayı çalıştırmaz.</li>
          <li><strong>Senkron doğru:</strong> <code>a.set(2)</code> satırından hemen sonra <code>double()</code> okumak güncel değeri verir; effect'ler gibi microtask beklemez.</li>
          <li><strong>Salt okunur:</strong> <code>set</code> yoktur.</li>
        </ul>
        ${runner(computedExample, "Tembel ve önbellekli hesaplama")}
        ${sourceBlock("signal.ts", signalSource, ["export function computed"],
          "computed bir Reaction'dır (kind = COMPUTED). notify() geldiğinde yeniden hesaplamaz, sadece 'dirty' işaretler ve kendi abonelerine haber verir. Hesaplama bir sonraki okumada yapılır.")}
      </section>

      <section class="doc" id="effect">
        <h2>effect() ve toplu çalışma</h2>
        <ul>
          <li><strong>İlk çalıştırma senkron,</strong> sonrakiler <strong>microtask'ta toplu</strong>dur. Aynı tick'te 10 signal değişse de effect bir kez çalışır.</li>
          <li><code>flush()</code> bekleyen effect'leri hemen çalıştırır. Testlerde ve ölçümlerde kullanılır.</li>
          <li>Effect bir fonksiyon döndürürse bu fonksiyon temizlik olarak kaydedilir (bir sonraki çalıştırmadan önce çağrılır).</li>
          <li>Bir effect hata fırlatırsa hata konsola yazılır, diğer effect'ler çalışmaya devam eder. Birbirini sonsuza kadar tetikleyen effect'ler 100 turdan sonra durdurulur.</li>
          <li><code>effect()</code> bir <code>dispose</code> fonksiyonu döndürür.</li>
        </ul>
        ${runner(batching, "Toplu çalışma ve flush()")}
        ${sourceBlock("signal.ts", signalSource, ["export function effect", "function schedule", "export function flush", "class Reaction"],
          "Reaction sınıfı hem computed hem effect'in ortak motorudur: run() bağımlılıkları sıfırlayıp fonksiyonu çalıştırır, okunan signal'ler track() ile yeniden bağlanır.")}
      </section>

      <section class="doc" id="owner">
        <h2>Sahiplik ve temizlik</h2>
        <p>
          Her effect aynı zamanda bir <strong>sahip (owner)</strong>dir. Çalışırken oluşturulan effect'ler, computed'ler ve <code>onCleanup</code> kayıtları
          o effect'e aittir ve effect yeniden çalışmadan önce veya yok edilince temizlenir. Böylece koşullu şablonlar, listeler ve bileşenler
          ardında dinleyici veya interval bırakmaz.
        </p>
        <table class="api">
          <thead><tr><th>API</th><th>Ne işe yarar</th></tr></thead>
          <tbody>
            <tr><td><code>onCleanup(fn)</code></td><td>Mevcut sahibe temizlik fonksiyonu ekler.</td></tr>
            <tr><td><code>root(dispose =&gt; …)</code></td><td>Bağımsız bir sahip oluşturur; içindeki her şey tek <code>dispose()</code> ile temizlenir. Her bileşen bir root içinde çalışır; bu sayfadaki "Kendin dene" alanları da öyle.</td></tr>
            <tr><td><code>untrack(fn)</code></td><td><code>fn</code> içinde okunan signal'lere abone olmaz.</td></tr>
          </tbody>
        </table>
        ${runner(ownership, "onCleanup, untrack ve yeniden çalıştırma")}
        ${sourceBlock("signal.ts", signalSource, ["export function onCleanup", "export function root", "export function untrack"])}
      </section>

      <section class="doc" id="cheatsheet">
        <h2>Ne zaman ne?</h2>
        <table class="api">
          <thead><tr><th>İhtiyaç</th><th>Kullan</th></tr></thead>
          <tbody>
            <tr><td>Değişebilen durum</td><td><code>signal</code></td></tr>
            <tr><td>Ucuz türetilmiş değer, tek yerde</td><td>Düz fonksiyon: <code>\${() =&gt; a() * 2}</code></td></tr>
            <tr><td>Pahalı veya birçok yerde okunan türetilmiş değer</td><td><code>computed</code></td></tr>
            <tr><td>DOM dışı yan etki (log, fetch, localStorage, dış kütüphane)</td><td><code>effect</code></td></tr>
            <tr><td>Olay işleyicide mevcut değeri okumak</td><td><code>s.peek()</code> (veya <code>s()</code>; handler effect değildir)</td></tr>
            <tr><td>Interval, dinleyici, observer temizliği</td><td><code>onCleanup</code></td></tr>
          </tbody>
        </table>
        ${codeBlock(
          `// Kötü: effect ile türetilmiş durum senkronlamak
const total = signal(0)
effect(() => total.set(price() * qty()))

// İyi: türetilmiş değer türetilir
const total = computed(() => price() * qty())`,
          "Sık yapılan hata"
        )}
      </section>
    `
  },
}
