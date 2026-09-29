import { defineIcons } from "@bazlama/headless"
import * as icons from "@bazlama/icons"
import "../../../packages/themes/src/index.css"
import "../../../packages/ui/src/index.css"
import "./demo.css"

/** Every demo app starts here: icons, the theme on <html>, bazlama's CSS. */
export function boot(theme: "light" | "dark" | "forest") {
  defineIcons(icons)
  document.documentElement.dataset.theme = theme
}

export const PLAYGROUND_URL = "/"

/** Number and date formatting for the demos (Turkish). */
export const money = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 })
export const number = new Intl.NumberFormat("tr-TR")
export const dateText = (d: Date) => d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" })
export const timeAgo = (d: Date) => {
  const minutes = Math.round((Date.now() - d.getTime()) / 60000)
  if (minutes < 1) return "şimdi"
  if (minutes < 60) return `${minutes} dk önce`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} sa önce`
  return `${Math.round(hours / 24)} gün önce`
}
