import { notFound } from "next/navigation";
import { getCatalog } from "@/services/store";
import { PageIntro } from "@/components/site/Presentation";
import { ordersOpen } from "@/features/menu/catalog";
import { Bag } from "@/features/menu/Bag";
import { meta } from "@/lib/seo";
import "@/features/menu/menu.css";
export const metadata = { ...meta("Minha sacola", "Revise os itens e consulte o atendimento com a equipe da Lucrécio.", "/pedidos"), robots: { index: false, follow: false } };
export default async function OrdersPage() {
  const catalog = await getCatalog();
  if (!ordersOpen(catalog.settings)) notFound();
  return <><PageIntro eyebrow="Para a sua mesa" title="Minha sacola" description="Confira os itens e envie uma consulta à equipe." /><Bag catalog={catalog} /></>;
}
