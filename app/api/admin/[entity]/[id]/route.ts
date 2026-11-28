import { adminAction, json } from "@/lib/security/api";
import { HttpError, readJson } from "@/lib/security/request";
import { removeEntity, saveEntity } from "@/services/store";
import type { Entity } from "@/types/domain";

const entities: Entity[] = ["categories", "products", "events", "promotions", "gallery"];
type Context = { params: Promise<{ entity: string; id: string }> };
function allowed(entity: string): asserts entity is Entity {
  if (!entities.includes(entity as Entity)) throw new HttpError(404, "Cadastro não encontrado.");
}
export async function PATCH(request: Request, context: Context) {
  return adminAction(request, async () => {
    const { entity, id } = await context.params;
    allowed(entity);
    return json(await saveEntity(entity, await readJson(request), id));
  });
}
export async function DELETE(request: Request, context: Context) {
  return adminAction(request, async () => {
    const { entity, id } = await context.params;
    allowed(entity);
    await removeEntity(entity, id);
    return json({ ok: true });
  });
}
