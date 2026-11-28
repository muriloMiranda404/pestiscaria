import { z } from "zod";
import { apiError, json } from "@/lib/security/api";
import { assertSameOrigin, HttpError, readJson } from "@/lib/security/request";
import { enforceLimit } from "@/lib/security/rate-limit";
import { recordMetric } from "@/services/store";
import { metricSchema } from "@/schemas/catalog";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const schema = metricSchema.extend({ consent: z.literal(true) });
    const parsed = schema.safeParse(await readJson(request, 2048));
    if (!parsed.success) throw new HttpError(422, "A métrica requer consentimento e dados válidos.");
    await enforceLimit(request, "metrics", 120, 60);
    const { kind, subject, campaign } = parsed.data;
    await recordMetric({ kind, subject, campaign });
    return json({ ok: true });
  } catch (error) { return apiError(error); }
}
