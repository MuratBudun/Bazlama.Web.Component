import { define, html, prop } from "@bazlama/core"
import "./avatar"
import { hasIcon, icon } from "./icon"
import "./menu"

/**
 * <bz-header> — application header (banner): menu button, logo, title/subtitle, a center
 * area (search, breadcrumbs), actions and the user.
 *
 *   <bz-header logo="/logo.svg" title="Demo ERP" subtitle="Muhasebe" href="/"
 *              user-name="Ada Yılmaz" user-src="/ada.jpg" user-detail="Yönetici">
 *     <input slot="center" type="search" />
 *     <bz-button variant="ghost" aria-label="Bildirimler">…</bz-button>   ← default slot: actions
 *     <bz-menu-item slot="user-menu" value="profile">Profil</bz-menu-item>  ← user menu items
 *   </bz-header>
 *
 * - The menu button has data-shell-toggle="start": inside a <bz-shell> it opens/collapses
 *   the start side (hide it with `no-menu-button`).
 * - With `user-name`, the header shows an avatar and the name; with `user-menu` items the
 *   avatar is the trigger of a <bz-menu> (its `select` event bubbles from the header).
 *   Slot "user" replaces the whole user area.
 * - Slot "logo" replaces the logo image.
 *
 * Anatomy: [data-part=bar|menu|brand|logo|titles|title|subtitle|center|actions|user|user-button|
 * user-name|user-detail].
 */
export const Header = define("bz-header", {
  props: {
    title: prop.string(),
    subtitle: prop.string(),
    logo: prop.string(),
    logoAlt: prop.string(),
    /** Link of the brand (logo + title), e.g. "/". */
    href: prop.string(),
    noMenuButton: prop.boolean(),
    menuLabel: prop.string("Menu"),
    userName: prop.string(),
    userSrc: prop.string(),
    userDetail: prop.string(),
    userLabel: prop.string("User menu"),
  },
  setup(props, ctx) {
    const brand = () => html`
      ${ctx.hasSlot("logo")
        ? html`<span data-part="logo">${ctx.slot("logo")}</span>`
        : html`<img data-part="logo" src=${() => props.logo() || null} alt=${() => props.logoAlt()} ?hidden=${() => !props.logo()} />`}
      <span data-part="titles">
        <span data-part="title">${props.title}</span>
        <span data-part="subtitle" ?hidden=${() => !props.subtitle()}>${props.subtitle}</span>
      </span>
    `
    const userButton = () => html`
      <bz-avatar name=${props.userName} src=${props.userSrc} decorative></bz-avatar>
      <span data-part="user-text">
        <span data-part="user-name">${props.userName}</span>
        <span data-part="user-detail" ?hidden=${() => !props.userDetail()}>${props.userDetail}</span>
      </span>
    `
    // The items move into the <bz-menu>'s default slot: their slot="user-menu" attribute
    // would otherwise put them in a slot the menu does not render.
    const menuItems = ctx.slot("user-menu")
    for (const node of menuItems) (node as Element).removeAttribute?.("slot")
    const user = ctx.hasSlot("user")
      ? ctx.slot("user")
      : menuItems.length
        ? html`<bz-menu placement="bottom-end" label=${props.userLabel}>
            <bz-button slot="trigger" variant="ghost" data-part="user-button" aria-label=${() => `${props.userLabel()}: ${props.userName()}`}>
              ${userButton()}
            </bz-button>
            ${menuItems}
          </bz-menu>`
        : html`<span data-part="user-button">${userButton()}</span>`
    const userHidden = () => !ctx.hasSlot("user") && !props.userName()

    return html`
      <header data-part="bar">
        <button
          type="button"
          data-part="menu"
          data-shell-toggle="start"
          aria-label=${props.menuLabel}
          ?hidden=${props.noMenuButton}
        >${hasIcon("menu") ? icon("menu") : "☰"}</button>
        ${() =>
          props.href()
            ? html`<a data-part="brand" href=${props.href}>${brand()}</a>`
            : html`<span data-part="brand">${brand()}</span>`}
        <div data-part="center" ?hidden=${!ctx.hasSlot("center")}>${ctx.slot("center")}</div>
        <div data-part="actions" ?hidden=${!ctx.hasSlot()}>${ctx.slot()}</div>
        <div data-part="user" ?hidden=${userHidden}>${user}</div>
      </header>
    `
  },
})

/**
 * <bz-footer> — application footer (contentinfo). Default slot on the start side, slot "end"
 * on the end side (version, links…).
 *
 * Anatomy: [data-part=bar|start|end].
 */
export const Footer = define("bz-footer", {
  setup: (_, ctx) => html`
    <footer data-part="bar">
      <div data-part="start">${ctx.slot()}</div>
      <div data-part="end" ?hidden=${!ctx.hasSlot("end")}>${ctx.slot("end")}</div>
    </footer>
  `,
})

declare global {
  interface HTMLElementTagNameMap {
    "bz-header": InstanceType<typeof Header>
    "bz-footer": InstanceType<typeof Footer>
  }
}
