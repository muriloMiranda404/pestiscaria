import { adminAction, json } from "@/lib/security/api";
import { HttpError, readJson } from "@/lib/security/request";
import { updateReservation } from "@/services/store";
import { reservationStatus } from "@/schemas/catalog";
import { z } from "zod";
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return adminAction(request, async () => {
    const parsed = z.object({ status: reservationStatus }).safeParse(await readJson(request));
    if (!parsed.success) throw new HttpError(422, "Selecione uma situação válida.");
    const { id } = await context.params;
    await updateReservation(id, parsed.data.status);
    return json({ ok: true });
  });
}
