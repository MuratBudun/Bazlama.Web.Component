export const CITIES = [
  "Adana", "Ankara", "Antalya", "Aydın", "Balıkesir", "Bolu", "Bursa", "Çanakkale", "Denizli",
  "Diyarbakır", "Edirne", "Erzurum", "Eskişehir", "Gaziantep", "Hatay", "Isparta", "İstanbul",
  "İzmir", "Kars", "Kayseri", "Kocaeli", "Konya", "Malatya", "Manisa", "Mardin", "Mersin",
  "Muğla", "Nevşehir", "Ordu", "Rize", "Sakarya", "Samsun", "Sivas", "Trabzon", "Van", "Zonguldak",
]

const FIRST = ["Ada", "Ali", "Ayşe", "Berk", "Ceren", "Deniz", "Ece", "Emre", "Elif", "Kaan", "Mert", "Zeynep", "Selin", "Umut", "Yusuf"]
const LAST = ["Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Yıldız", "Aydın", "Öztürk", "Arslan", "Doğan", "Koç", "Kurt"]
const STATUS = ["aktif", "beklemede", "pasif"] as const

export interface Customer {
  [key: string]: unknown
  id: number
  name: string
  email: string
  city: string
  amount: number
  status: (typeof STATUS)[number]
}

/** Deterministic pseudo random numbers, so every run produces the same data. */
function random(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

let rand = random(42)
let lastId = 0

export function customer(id = ++lastId): Customer {
  const pick = <T>(list: readonly T[]) => list[Math.floor(rand() * list.length)]
  const first = pick(FIRST)
  const last = pick(LAST)
  return {
    id,
    name: `${first} ${last}`,
    email: `${first}.${last}${id}@ornek.com`.toLocaleLowerCase("tr-TR").replace(/ı/g, "i").replace(/ş/g, "s").replace(/ç/g, "c").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ğ/g, "g"),
    city: pick(CITIES),
    amount: Math.round(rand() * 250000) / 100,
    status: pick(STATUS),
  }
}

export function customers(count: number): Customer[] {
  return Array.from({ length: count }, () => customer())
}

export function resetData(): void {
  rand = random(42)
  lastId = 0
}
