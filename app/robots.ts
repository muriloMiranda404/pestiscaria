import type { MetadataRoute } from "next";
import { absUrl, indexingAllowed } from "@/lib/seo";
export const dynamic = "force-dynamic";
export default function robots(): MetadataRoute.Robots {
  return indexingAllowed() ? { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/pedidos", "/reservas"] }, sitemap: absUrl("/sitemap.xml") } : { rules: { userAgent: "*", disallow: "/" } };
}
