/** Deterministic sample data for the demo apps (same data on every load). */

export function random(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 2 ** 32
  }
}
export const pick = <T>(rnd: () => number, list: readonly T[]): T => list[Math.floor(rnd() * list.length)]

export const FIRST = ["Ada", "Deniz", "Ekin", "Mert", "Zeynep", "Can", "Elif", "Kerem", "Selin", "Emre", "Derya", "Umut", "Ece", "Burak", "Nazlı", "Onur", "Pelin", "Tolga", "İpek", "Barış"]
export const LAST = ["Yılmaz", "Demir", "Kaya", "Şahin", "Çelik", "Aydın", "Öztürk", "Arslan", "Doğan", "Kılıç", "Aslan", "Koç", "Kurt", "Özdemir", "Polat", "Tekin"]
export const CITIES = ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Konya", "Eskişehir", "Kayseri", "Gaziantep", "Trabzon"]
export const COMPANY_A = ["Anadolu", "Ege", "Marmara", "Kuzey", "Güney", "Toros", "Kapadokya", "Boğaziçi", "Yıldız", "Mavi"]
export const COMPANY_B = ["Tekstil", "Gıda", "Lojistik", "Yazılım", "Enerji", "Makine", "Kimya", "İnşaat", "Medikal", "Tarım"]
export const COMPANY_C = ["A.Ş.", "Ltd. Şti.", "Tic. A.Ş.", "Sanayi A.Ş."]

export const fullName = (rnd: () => number) => `${pick(rnd, FIRST)} ${pick(rnd, LAST)}`
export const company = (rnd: () => number) => `${pick(rnd, COMPANY_A)} ${pick(rnd, COMPANY_B)} ${pick(rnd, COMPANY_C)}`
export const emailOf = (name: string, domain = "ornek.com.tr") =>
  `${name
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/\s+/g, ".")}@${domain}`
export const phoneOf = (rnd: () => number) =>
  `0 (5${Math.floor(rnd() * 5) + 30}) ${String(Math.floor(rnd() * 900) + 100)} ${String(Math.floor(rnd() * 90) + 10)} ${String(Math.floor(rnd() * 90) + 10)}`
/** A date `days` back from a fixed "today", so the data looks the same on every run. */
export const daysAgo = (days: number, hours = 0) => new Date(Date.now() - days * 86400000 - hours * 3600000)
