import type { Product, Promotion } from "@/types/domain";
import { activePromotion, basePrice } from "./catalog";

export interface BagItem { key: string; product_id: string; variant: string; addons: string[]; quantity: number; notes: string }
export interface BagLine { item: BagItem; product: Product; unitPrice: number; subtotal: number }
export const bagKey = "lucrecio-bag-v1";
export const bagLifetime = 6 * 60 * 60 * 1000;

export function parseBag(value: string | null, now = Date.now()): BagItem[] {
  try {
    const stored: unknown = JSON.parse(value || "null");
    if (!stored || typeof stored !== "object" || !("expires" in stored) || typeof stored.expires !== "number" || stored.expires <= now || !("items" in stored) || !Array.isArray(stored.items)) return [];
    return stored.items.filter((item): item is BagItem => Boolean(item && typeof item === "object" &&
      typeof item.key === "string" && typeof item.product_id === "string" && typeof item.variant === "string" &&
      Array.isArray(item.addons) && item.addons.length <= 50 && item.addons.every((addon: unknown) => typeof addon === "string") &&
      Number.isInteger(item.quantity) && item.quantity >= 1 && item.quantity <= 30 && typeof item.notes === "string" && item.notes.length <= 300)).slice(0, 50);
  } catch { return []; }
}

export function priceBag(items: BagItem[], products: Product[], promotions: Promotion[], now = Date.now()) {
  const lines: BagLine[] = [];
  const removed: BagItem[] = [];
  for (const item of items) {
    const product = products.find((entry) => entry.id === item.product_id && entry.status === "published" && entry.available);
    const variant = product?.variants.find((entry) => entry.name === item.variant);
    const price = product ? (item.variant ? variant?.price_cents : basePrice(product, activePromotion(promotions, product.id, now))) : null;
    const addons = [...new Set(item.addons)].map((name) => product?.addons.find((entry) => entry.name === name));
    if (!product || price == null || addons.some((entry) => !entry)) { removed.push(item); continue; }
    const unitPrice = price + addons.reduce((sum, addon) => sum + (addon?.price_cents ?? 0), 0);
    lines.push({ item, product, unitPrice, subtotal: unitPrice * item.quantity });
  }
  return { lines, removed, total: lines.reduce((sum, line) => sum + line.subtotal, 0) };
}
