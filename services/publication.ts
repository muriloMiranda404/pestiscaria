import { defaults } from "@/config/restaurant";
import type { Catalog } from "@/types/domain";

export function emptyCatalog(demo = false): Catalog {
  return { settings: structuredClone(defaults), categories: [], products: [], events: [], promotions: [], gallery: [], demo };
}

export function publicCatalog(all: Catalog, now = Date.now()): Catalog {
  const visibleCategories = all.categories.filter(c => c.status === "published");
  const permitted = new Set(visibleCategories.map(c => c.id));
  const products = all.products.filter(p => p.status === "published" && permitted.has(p.category_id));
  const usedCategories = new Set(products.map(p => p.category_id));
  const publishedProducts = new Set(products.map(p => p.id));
  const settings = { ...all.settings };
  if (!settings.show_cnpj) settings.cnpj = "";
  if (!settings.whatsapp_confirmed) settings.whatsapp = "";
  if (settings.announcement_until && Date.parse(settings.announcement_until) <= now) settings.announcement = "";
  return {
    settings, demo: all.demo, products,
    categories: visibleCategories.filter(c => usedCategories.has(c.id)),
    events: all.events.filter(e => e.status === "published"),
    promotions: all.promotions.filter(p => p.status === "published" && publishedProducts.has(p.product_id) &&
      Date.parse(p.starts_at) <= now && now < Date.parse(p.ends_at)),
    gallery: all.gallery.filter(g => g.status === "published"),
  };
}
