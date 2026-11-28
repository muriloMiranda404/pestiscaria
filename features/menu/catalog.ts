import type { Category, Product, Promotion, Settings } from "@/types/domain";

const reais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function money(cents: number) {
  return reais.format(cents / 100);
}

export function normalized(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function activePromotion(promotions: Promotion[], productId: string, now = Date.now()) {
  return promotions
    .filter((offer) => offer.product_id === productId && offer.status === "published"
      && Date.parse(offer.starts_at) <= now && Date.parse(offer.ends_at) > now)
    .sort((a, b) => a.price_cents - b.price_cents)[0];
}

export function basePrice(product: Product, offer?: Promotion) {
  if (!offer) return product.price_cents;
  return Math.min(product.price_cents ?? offer.price_cents, offer.price_cents);
}

export function lowestPrice(product: Product, offer?: Promotion) {
  const base = basePrice(product, offer);
  const prices = product.variants.map((variant) => variant.price_cents);
  if (base !== null) prices.push(base);
  return prices.length ? Math.min(...prices) : null;
}

export interface MenuFilters { search: string; category: string; available: boolean; order: "menu" | "asc" | "desc" }

export function visibleProducts(
  products: Product[], categories: Category[], promotions: Promotion[], filters: MenuFilters, now = Date.now(),
) {
  const published = new Map(categories.filter((category) => category.status === "published")
    .map((category) => [category.id, category]));
  const terms = normalized(filters.search).split(/\s+/).filter(Boolean);
  const matching = products.filter((product) => {
    const category = published.get(product.category_id);
    if (!category || product.status !== "published") return false;
    if (filters.category && category.slug !== filters.category) return false;
    if (filters.available && !product.available) return false;
    const searchable = normalized([product.name, product.description, product.ingredients, category.name].join(" "));
    return terms.every((term) => searchable.includes(term));
  });
  if (filters.order === "menu") {
    return matching.sort((a, b) => (published.get(a.category_id)!.position - published.get(b.category_id)!.position)
      || a.position - b.position || a.name.localeCompare(b.name, "pt-BR"));
  }
  // Prices on request stay at the end in both sorting directions.
  const prices = new Map(matching.map((product) => [product.id, lowestPrice(product, activePromotion(promotions, product.id, now))]));
  return matching.sort((a, b) => {
    const first = prices.get(a.id);
    const second = prices.get(b.id);
    if (first == null || second == null) return Number(first == null) - Number(second == null);
    return (first - second) * (filters.order === "desc" ? -1 : 1) || a.position - b.position;
  });
}

export function whatsappNumber(number: string) {
  const digits = number.replace(/\D/g, "");
  if (/^[1-9]\d{9,10}$/.test(digits)) return `55${digits}`;
  return /^[1-9]\d{11,14}$/.test(digits) ? digits : "";
}

export function ordersOpen(settings: Settings) {
  return settings.orders_enabled && settings.whatsapp_confirmed && Boolean(whatsappNumber(settings.whatsapp));
}
