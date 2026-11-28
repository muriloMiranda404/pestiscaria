import { NextResponse } from "next/server";
import { getCatalog } from "@/services/store";
import { ordersOpen } from "@/features/menu/catalog";

export async function GET() {
  try {
    const { products, promotions, settings, demo } = await getCatalog();
    if (demo || !ordersOpen(settings)) return NextResponse.json({ error: "Os pedidos pelo site estão desativados neste ambiente." }, { status: 403, headers: { "Cache-Control": "no-store" } });
    return NextResponse.json({ products, promotions, settings: {
      whatsapp: settings.whatsapp, whatsapp_confirmed: settings.whatsapp_confirmed, orders_enabled: settings.orders_enabled,
      pickup_enabled: settings.pickup_enabled, delivery_enabled: settings.delivery_enabled,
    } }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Não foi possível atualizar o cardápio. Tente novamente em instantes." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
