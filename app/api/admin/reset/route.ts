import { adminAction, json } from "@/lib/security/api";
import { HttpError } from "@/lib/security/request";
import { resetDemo } from "@/services/store";
export async function POST(request: Request) {
  return adminAction(request, async (session) => {
    if (!session.demo) throw new HttpError(404, "Recurso indisponível.");
    await resetDemo();
    return json({ ok: true });
  }, "reset", 5);
}
