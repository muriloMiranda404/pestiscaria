import type { Metadata } from "next";
import { defaults } from "@/config/restaurant";

export function indexingAllowed() {
  return process.env.APP_MODE !== "demo" && process.env.SITE_INDEXABLE === "true" &&
    Boolean(process.env.NEXT_PUBLIC_SITE_URL);
}
export function absUrl(path: string) {
  return new URL(path, process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").href;
}
export function meta(title: string, description: string, path: string): Metadata {
  const fullTitle = title.includes(defaults.name) ? title : `${title} | ${defaults.name}`;
  return {
    title: fullTitle, description, alternates: { canonical: absUrl(path) },
    robots: indexingAllowed() ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: { title: fullTitle, description, url: absUrl(path), siteName: defaults.name, locale: "pt_BR", type: "website", images: [{ url: absUrl("/images/share.webp"), width: 1200, height: 630, alt: "Composição gastronômica ilustrativa da Lucrécio Petiscaria" }] },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [absUrl("/images/share.webp")] },
  };
}
export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
export function breadcrumbs(items: { name: string; path: string }[]) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((item, i) => ({
    "@type": "ListItem", position: i + 1, name: item.name, item: absUrl(item.path),
  })) };
}
