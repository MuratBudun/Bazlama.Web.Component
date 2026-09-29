import { computed, signal } from "@bazlama/core"
import type { TreeItem } from "@bazlama/headless"
import { CITIES, company, daysAgo, emailOf, fullName, phoneOf, pick, random } from "../shared/data"

export type CustomerStatus = "Aktif" | "Potansiyel" | "Pasif"
export type OrderStatus = "Hazırlanıyor" | "Kargoda" | "Teslim edildi" | "İptal"

export interface Customer {
  [key: string]: unknown
  id: number
  name: string
  company: string
  sector: string
  city: string
  email: string
  phone: string
  status: CustomerStatus
  segment: "kurumsal" | "kobi" | "bireysel"
  owner: string
  revenue: number
  lastContact: Date
  vip: boolean
  newsletter: boolean
  notes: string
}
export interface Order {
  [key: string]: unknown
  id: number
  no: string
  customerId: number
  customer: string
  date: Date
  total: number
  items: number
  status: OrderStatus
}
export interface Activity {
  id: number
  who: string
  text: string
  at: Date
  icon: string
}

/** Sector tree for the lookup (leaves are selectable). */
export const SECTORS: TreeItem[] = [
  {
    id: "uretim",
    label: "Üretim",
    icon: "building",
    children: [
      { id: "tekstil", label: "Tekstil" },
      { id: "gida", label: "Gıda" },
      { id: "makine", label: "Makine" },
      { id: "kimya", label: "Kimya" },
    ],
  },
  {
    id: "hizmet",
    label: "Hizmet",
    icon: "users",
    children: [
      { id: "yazilim", label: "Yazılım" },
      { id: "lojistik", label: "Lojistik" },
      { id: "saglik", label: "Sağlık" },
      { id: "egitim", label: "Eğitim" },
    ],
  },
  { id: "enerji", label: "Enerji", icon: "chart", children: [{ id: "yenilenebilir", label: "Yenilenebilir enerji" }, { id: "dagitim", label: "Enerji dağıtımı" }] },
]
const SECTOR_LEAVES = SECTORS.flatMap((s) => s.children ?? [])
export const sectorLabel = (id: string) => SECTOR_LEAVES.find((s) => s.id === id)?.label ?? id
export const OWNERS = ["Ada Yılmaz", "Mert Kaya", "Selin Demir", "Onur Çelik"]
export const CITY_LIST = CITIES

const rnd = random(42)
const STATUSES: CustomerStatus[] = ["Aktif", "Aktif", "Aktif", "Potansiyel", "Potansiyel", "Pasif"]

function makeCustomers(n: number): Customer[] {
  return Array.from({ length: n }, (_, i) => {
    const name = fullName(rnd)
    return {
      id: i + 1,
      name,
      company: company(rnd),
      sector: pick(rnd, SECTOR_LEAVES).id,
      city: pick(rnd, CITIES),
      email: emailOf(name),
      phone: phoneOf(rnd),
      status: pick(rnd, STATUSES),
      segment: pick(rnd, ["kurumsal", "kobi", "kobi", "bireysel"] as const),
      owner: pick(rnd, OWNERS),
      revenue: Math.round(rnd() * 2_500_000),
      lastContact: daysAgo(Math.floor(rnd() * 120), Math.floor(rnd() * 12)),
      vip: rnd() < 0.12,
      newsletter: rnd() < 0.5,
      notes: "",
    }
  })
}
const ORDER_STATUSES: OrderStatus[] = ["Hazırlanıyor", "Kargoda", "Teslim edildi", "Teslim edildi", "Teslim edildi", "İptal"]
function makeOrders(customers: Customer[], n: number): Order[] {
  return Array.from({ length: n }, (_, i) => {
    const c = pick(rnd, customers)
    return {
      id: i + 1,
      no: `SP-${String(2026_00000 + n - i)}`,
      customerId: c.id,
      customer: c.company,
      date: daysAgo(Math.floor((i / n) * 180), Math.floor(rnd() * 20)),
      total: Math.round(rnd() * 180_000 + 1_500),
      items: Math.floor(rnd() * 12) + 1,
      status: i < 12 ? pick(rnd, ["Hazırlanıyor", "Kargoda"] as const) : pick(rnd, ORDER_STATUSES),
    }
  })
}

export const customers = signal<Customer[]>(makeCustomers(420))
export const orders = signal<Order[]>(makeOrders(customers.peek(), 1200))
export const activity = signal<Activity[]>([
  { id: 1, who: "Mert Kaya", text: "Anadolu Tekstil A.Ş. için teklif gönderdi", at: daysAgo(0, 1), icon: "send" },
  { id: 2, who: "Selin Demir", text: "SP-202601199 kargoya verildi", at: daysAgo(0, 3), icon: "box" },
  { id: 3, who: "Ada Yılmaz", text: "Ege Yazılım Ltd. Şti. ile toplantı notu ekledi", at: daysAgo(0, 5), icon: "edit" },
  { id: 4, who: "Onur Çelik", text: "3 yeni potansiyel müşteri içe aktardı", at: daysAgo(1, 2), icon: "upload" },
  { id: 5, who: "Mert Kaya", text: "Toros Enerji Sanayi A.Ş. VIP olarak işaretlendi", at: daysAgo(2), icon: "star" },
])
let nextActivity = 100
export function logActivity(text: string, icon = "info") {
  activity.update((list) => [{ id: ++nextActivity, who: "Ada Yılmaz", text, at: new Date(), icon }, ...list].slice(0, 30))
}

export const customerById = (id: number) => customers.peek().find((c) => c.id === id)
export const ordersOf = (id: number) => computed(() => orders().filter((o) => o.customerId === id))

export function saveCustomer(next: Customer) {
  customers.update((list) => list.map((c) => (c.id === next.id ? next : c)))
  logActivity(`${next.company} kaydı güncellendi`, "edit")
}
export function addCustomer(data: Pick<Customer, "name" | "company" | "email" | "city" | "status">): Customer {
  const id = Math.max(...customers.peek().map((c) => c.id)) + 1
  const c: Customer = {
    ...data,
    id,
    sector: "yazilim",
    phone: "",
    segment: "kobi",
    owner: "Ada Yılmaz",
    revenue: 0,
    lastContact: new Date(),
    vip: false,
    newsletter: false,
    notes: "",
  }
  customers.update((list) => [c, ...list])
  logActivity(`${c.company} müşteri olarak eklendi`, "plus")
  return c
}
export function removeCustomers(ids: unknown[]): Customer[] {
  const set = new Set(ids)
  const removed = customers.peek().filter((c) => set.has(c.id))
  customers.update((list) => list.filter((c) => !set.has(c.id)))
  return removed
}
export function restoreCustomers(list: Customer[]) {
  customers.update((all) => [...list, ...all].sort((a, b) => a.id - b.id))
}
