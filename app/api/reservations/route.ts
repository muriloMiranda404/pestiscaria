import { apiError, json } from "@/lib/security/api";
import { assertSameOrigin, HttpError, readJson } from "@/lib/security/request";
import { enforceLimit } from "@/lib/security/rate-limit";
import { createReservation } from "@/services/store";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    if (process.env.APP_MODE === "demo") throw new HttpError(403, "A demonstração não recebe solicitações de reserva.");
    await enforceLimit(request, "reservations", 5, 600);
    return json(await createReservation(await readJson(request, 4096)), 201);
  } catch (error) { return apiError(error); }
}
