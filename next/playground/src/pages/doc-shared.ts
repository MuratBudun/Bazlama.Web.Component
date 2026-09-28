import { html } from "@bazlama/core"

/** In-page table of contents. Buttons scroll instead of links: the hash is used for routing. */
export function toc(sections: readonly (readonly [string, string])[]) {
  return html`<nav class="toc" aria-label="Bu sayfada">
    <span class="muted small">Bu sayfada:</span>
    ${sections.map(
      ([id, title]) =>
        html`<button type="button" class="link" @click=${() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}>${title}</button>`
    )}
  </nav>`
}
