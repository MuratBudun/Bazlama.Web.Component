/**
 * @bazlama/icons — a small stroke icon set drawn on a 24×24 grid (stroke width comes from CSS).
 * Each icon is plain data, so bundlers keep only the icons you import:
 *
 *   import { defineIcons } from "@bazlama/headless"
 *   import { home, folder, chevronRight } from "@bazlama/icons"
 *   defineIcons({ home, folder, chevronRight })   // names: "home", "folder", "chevron-right"
 *
 * Or register everything: `import * as icons from "@bazlama/icons"; defineIcons(icons)`.
 */

export interface IconData {
  viewBox?: string
  body: string
  mode?: "stroke" | "fill"
}

const i = (body: string): IconData => ({ body })

// Arrows and chevrons
export const chevronRight = i('<path d="m9 6 6 6-6 6"/>')
export const chevronLeft = i('<path d="m15 6-6 6 6 6"/>')
export const chevronDown = i('<path d="m6 9 6 6 6-6"/>')
export const chevronUp = i('<path d="m6 15 6-6 6 6"/>')
export const arrowRight = i('<path d="M5 12h14M13 6l6 6-6 6"/>')
export const arrowLeft = i('<path d="M19 12H5M11 6l-6 6 6 6"/>')
export const externalLink = i('<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>')

// Actions
export const plus = i('<path d="M12 5v14M5 12h14"/>')
export const minus = i('<path d="M5 12h14"/>')
export const x = i('<path d="M18 6 6 18M6 6l12 12"/>')
export const check = i('<path d="M5 12.5 10 17l9-10"/>')
export const search = i('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>')
export const edit = i('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13 7 4 4"/>')
export const trash = i('<path d="M4 7h16M10 11v6M14 11v6"/><path d="m6 7 1 13h10l1-13"/><path d="M9 7V4h6v3"/>')
export const copy = i('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>')
export const download = i('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>')
export const upload = i('<path d="M12 16V5M7 10l5-5 5 5M5 20h14"/>')
export const refresh = i('<path d="M20 11a8 8 0 0 0-14.3-4.3L4 9"/><path d="M4 4v5h5"/><path d="M4 13a8 8 0 0 0 14.3 4.3L20 15"/><path d="M20 20v-5h-5"/>')
export const filter = i('<path d="M4 5h16l-6 7.5V19l-4 1v-7.5z"/>')
export const moreHorizontal = i('<circle cx="6" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="18" cy="12" r="1"/>')
export const maximize = i('<path d="M15 4h5v5M9 20H4v-5M20 4l-6 6M4 20l6-6"/>')
export const minimize = i('<path d="M4 14h6v6M20 10h-6V4M14 10l6-6M10 14l-6 6"/>')
export const chevronsLeft = i('<path d="m11 17-5-5 5-5M18 17l-5-5 5-5"/>')
export const chevronsRight = i('<path d="m13 17 5-5-5-5M6 17l5-5-5-5"/>')
export const menu = i('<path d="M4 6h16M4 12h16M4 18h16"/>')
export const logOut = i('<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 16l-4-4 4-4M6 12h10"/>')

// Objects
export const home = i('<path d="M4 11 12 4l8 7"/><path d="M6 10v10h12V10"/><path d="M10 20v-5h4v5"/>')
export const dashboard = i('<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>')
export const folder = i('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>')
export const folderOpen = i('<path d="M3 17V7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v1"/><path d="M3 17l2.4-6a1.5 1.5 0 0 1 1.4-1H21l-2.6 7a1.5 1.5 0 0 1-1.4 1H4a1 1 0 0 1-1-1z"/>')
export const file = i('<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>')
export const fileText = i('<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>')
export const user = i('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>')
export const users = i('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M15.5 4.8a3.5 3.5 0 0 1 0 6.4M17.5 14a6.5 6.5 0 0 1 4 6"/>')
export const settings = i('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>')
export const bell = i('<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>')
export const calendar = i('<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>')
export const chart = i('<path d="M4 20h16"/><path d="M7 16v-5M12 16V7M17 16v-8"/>')
export const mail = i('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>')
export const box = i('<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>')
export const cart = i('<path d="M3 4h2l2.4 11h10.2L20 8H6.2"/><circle cx="9" cy="19.5" r="1.5"/><circle cx="17" cy="19.5" r="1.5"/>')
export const lock = i('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>')
export const eye = i('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>')
export const tag = i('<path d="M4 4h7l9 9-7 7-9-9z"/><circle cx="8.5" cy="8.5" r="1.5"/>')
export const database = i('<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/>')
export const code = i('<path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/>')
export const bug = i('<rect x="7" y="8" width="10" height="12" rx="5"/><path d="M9 8V6a3 3 0 0 1 6 0v2M3 13h4M17 13h4M4 7l3 2M20 7l-3 2M4 19l3-2M20 19l-3-2M12 12v8"/>')
export const layers = i('<path d="m12 4 9 5-9 5-9-5z"/><path d="m3 14 9 5 9-5"/>')
export const table = i('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M9 10v9"/>')
export const list = i('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>')
export const cursorClick = i('<path d="m9 9 10 4-4 2-2 4z"/><path d="M5 3v3M3 5h3M9.5 4 8 6.5M4 9.5l2.5-1.5"/>')
export const palette = i('<path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.8 1.8-1.7 0-1.1-.9-1.5-.9-2.5 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>')

// Status
export const info = i('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>')
export const alert = i('<path d="M12 4 2.5 20h19z"/><path d="M12 10v4M12 17v.01"/>')
export const circleCheck = i('<circle cx="12" cy="12" r="9"/><path d="m8 12.5 3 3 5-6"/>')
export const clock = i('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>')

// Filled example (mode: "fill")
export const star: IconData = {
  body: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  mode: "fill",
}
