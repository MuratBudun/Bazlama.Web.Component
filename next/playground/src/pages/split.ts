import { html, signal } from "@bazlama/core"
import { splitUsage } from "../docs/specs-shell"
import { usage } from "../docs/usage"
import { logEntry } from "../log"

export default {
  id: "split",
  title: "Split",
  group: "Navigasyon",
  description:
    "Sürüklenebilir ayırıcılı iki bölme (WAI-ARIA window splitter): gezgin + editör, editör + alt panel gibi IDE yerleşimleri. İç içe kullanılır, boyut ve daraltma saklanabilir.",
  render() {
    const size = signal(220)
    return html`
      ${usage(splitUsage)}

      <section class="demo">
        <h2>IDE yerleşimi</h2>
        <bz-split class="split-demo" size="220" min="140" collapsible label="Gezgini boyutlandır"
          @resize=${(e: CustomEvent<{ size: number }>) => (size.set(e.detail.size), logEntry("bz-split", "resize", `size: ${e.detail.size}`))}
          @toggle=${(e: CustomEvent<{ collapsed: boolean }>) => logEntry("bz-split", "toggle", `collapsed: ${e.detail.collapsed}`)}>
          <nav class="split-pane">Gezgin</nav>
          <bz-split orientation="vertical" primary="end" size="90" min="56" collapsible label="Paneli boyutlandır">
            <main class="split-pane">Editör</main>
            <section class="split-pane">Sorunlar</section>
          </bz-split>
        </bz-split>
        <p class="note">Gezgin: ${() => `${size()} px`}. Ayırıcıya odaklanıp ok tuşları, Home/End ve Enter'ı deneyin; çift tık ilk boyuta döner.</p>
      </section>
    `
  },
}
