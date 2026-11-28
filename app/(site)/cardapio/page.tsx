import { PageIntro } from "@/components/site/Presentation";
import { ViewMetric } from "@/components/site/Metrics";
import { getCatalog } from "@/services/store";
import { meta } from "@/lib/seo";
import { MenuBrowser } from "@/features/menu/MenuBrowser";
import { ordersOpen } from "@/features/menu/catalog";
import "@/features/menu/menu.css";

export const metadata = meta("Cardápio", "Consulte o cardápio digital da Lucrécio Petiscaria em Linhares. Encontre porções, petiscos e bebidas publicados pela casa.", "/cardapio");

export default async function MenuPage({ searchParams }: { searchParams: Promise<{ categoria?: string | string[] }> }) {
  const [catalog, params] = await Promise.all([getCatalog(), searchParams]);
  return <>
    <PageIntro eyebrow="À mesa" title="Cardápio da casa" description="Escolha uma categoria ou procure o que combina com a sua mesa." />
    <MenuBrowser products={catalog.products} categories={catalog.categories} promotions={catalog.promotions}
      initialCategory={typeof params.categoria === "string" ? params.categoria : ""} name={catalog.settings.name} hasOrders={ordersOpen(catalog.settings)} />
    <ViewMetric kind="menu" />
  </>;
}
