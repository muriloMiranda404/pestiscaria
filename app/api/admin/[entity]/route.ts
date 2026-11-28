import { adminAction, json } from "@/lib/security/api";
import { HttpError, readJson } from "@/lib/security/request";
import { saveEntity } from "@/services/store";
import type { Entity } from "@/types/domain";

const entities: Entity[] = ["categories", "products", "events", "promotions", "gallery"];
export async function POST(request: Request, context: { params: Promise<{ entity: string }> }) {
  return adminAction(request, async () => {
    const { entity } = await context.params;
    if (!entities.includes(entity as Entity)) throw new HttpError(404, "Cadastro não encontrado.");
    return json(await saveEntity(entity as Entity, await readJson(request)), 201);
  });
}
