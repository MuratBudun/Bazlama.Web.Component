import { computed, define, effect, html, prop, signal } from "@bazlama/core"

/**
 * <bz-avatar name="Ada Yılmaz" src="/ada.jpg" size="sm|md|lg" status="online|away|busy|offline">
 *
 * Shows the image, or the initials of `name` when there is no image or it fails to load.
 * The background hue is derived from the name, so a person keeps the same color.
 * Accessible name: `label` or `name` (role="img"); `decorative` hides it (e.g. next to the
 * visible name inside a button).
 *
 * Anatomy: [data-part=image|initials|status]. Styling hooks: [size], [status],
 * --bz-avatar-hue (set from the name), [data-fallback] while initials are shown.
 */

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return ""
  const first = words[0][0]
  const last = words.length > 1 ? words[words.length - 1][0] : ""
  return (first + last).toLocaleUpperCase("tr-TR")
}

/** Stable 0–359 hue from a string. */
export function hueOf(text: string): number {
  let h = 0
  for (const ch of text) h = (h * 31 + ch.codePointAt(0)!) % 360
  return h
}

export const Avatar = define("bz-avatar", {
  props: {
    name: prop.string(),
    src: prop.string(),
    label: prop.string(),
    status: prop.string<"" | "online" | "away" | "busy" | "offline">("", { reflect: true }),
    decorative: prop.boolean(),
  },
  setup(props, { host }) {
    const failed = signal(false)
    const showImage = computed(() => !!props.src() && !failed())
    // A new src gets a new chance to load.
    effect(() => {
      props.src()
      failed.set(false)
    })
    effect(() => {
      host.style.setProperty("--bz-avatar-hue", String(hueOf(props.name() || props.label())))
      host.toggleAttribute("data-fallback", !showImage())
      if (props.decorative()) {
        host.setAttribute("aria-hidden", "true")
        host.removeAttribute("role")
        host.removeAttribute("aria-label")
      } else {
        host.removeAttribute("aria-hidden")
        host.setAttribute("role", "img")
        const status = props.status() ? ` (${props.status()})` : ""
        host.setAttribute("aria-label", `${props.label() || props.name()}${status}`)
      }
    })
    return html`
      ${() =>
        showImage()
          ? html`<img data-part="image" src=${props.src} alt="" @error=${() => failed.set(true)} />`
          : html`<span data-part="initials" aria-hidden="true">${() => initials(props.name() || props.label())}</span>`}
      <span data-part="status" aria-hidden="true" ?hidden=${() => !props.status()}></span>
    `
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "bz-avatar": InstanceType<typeof Avatar>
  }
}
