import { getCatalog } from "@/services/store";
import { absUrl } from "@/lib/seo";
import { calendarFile } from "@/features/editorial/events";
import { fullAddress } from "@/features/editorial/visit";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, catalog] = await Promise.all([params, getCatalog()]);
  const event = catalog.events.find(entry => entry.slug === slug && entry.status === "published");
  if (!event) return new Response("Evento não encontrado.", { status: 404 });
  const safeName = event.slug.replace(/[^a-z0-9-]/g, "").slice(0, 100) || "evento";
  return new Response(calendarFile(event, fullAddress(catalog.settings), absUrl(`/eventos/${event.slug}`), catalog.demo), {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="${safeName}.ics"`, "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}
