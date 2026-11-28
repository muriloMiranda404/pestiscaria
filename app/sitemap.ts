import type { MetadataRoute } from "next";
import { getCatalog } from "@/services/store";
import { absUrl, indexingAllowed } from "@/lib/seo";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!indexingAllowed()) return [];
  const { products, events } = await getCatalog();
  return ["/", "/cardapio", "/sobre", "/galeria", "/eventos", "/contato", "/privacidade", ...products.map(p => `/cardapio/${p.slug}`), ...events.map(e => `/eventos/${e.slug}`)].map(path => ({ url: absUrl(path) }));
}
