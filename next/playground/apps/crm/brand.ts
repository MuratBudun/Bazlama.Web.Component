import { applyTheme, DEFAULT_SETTINGS, isHex, type Neutral, type ThemeSettings } from "@bazlama/themes/builder"

/**
 * The company theme ("Kurum teması"): a brand colour, a grey tone and a corner radius chosen
 * in Ayarlar become a light and a dark bazlama theme at run time (@bazlama/themes/builder).
 * A real app would keep the brand on the server, per tenant; the demo keeps it in localStorage.
 */

export interface Brand {
  primary: string
  neutral: Neutral
  radius: number
}

export const BRAND_DEFAULT: Brand = { primary: "#0f766e", neutral: "cool", radius: 8 }
export const BRAND_SWATCHES = ["#0f766e", "#2563eb", "#4f46e5", "#7c3aed", "#be123c", "#c2410c", "#15803d", "#334155"]
const KEY = "ada-crm:brand"
const NEUTRALS: Neutral[] = ["cool", "neutral", "warm", "brand"]

export function loadBrand(): Brand {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<Brand> | null
    if (raw)
      return {
        primary: isHex(raw.primary ?? "") ? raw.primary! : BRAND_DEFAULT.primary,
        neutral: NEUTRALS.includes(raw.neutral as Neutral) ? raw.neutral! : BRAND_DEFAULT.neutral,
        radius: typeof raw.radius === "number" ? Math.min(16, Math.max(0, raw.radius)) : BRAND_DEFAULT.radius,
      }
  } catch {
    /* storage unavailable or bad data */
  }
  return { ...BRAND_DEFAULT }
}

export function saveBrand(brand: Brand): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(brand))
  } catch {
    /* storage unavailable */
  }
}

export const brandSettings = (brand: Brand): ThemeSettings => ({
  ...DEFAULT_SETTINGS,
  name: "ada-crm-kurum",
  primary: brand.primary,
  neutral: brand.neutral,
  radius: brand.radius,
  overrides: { light: {}, dark: {} },
})

/** Generates and installs the company theme; returns its data-theme names. */
export const applyBrand = (brand: Brand) => applyTheme(brandSettings(brand), { id: "ada-crm-brand" })
