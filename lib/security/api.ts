import "server-only";
import { NextResponse } from "next/server";
import { currentAdmin, type AdminSession } from "@/lib/auth";
import { StoreError } from "@/services/errors";
import { assertSameOrigin, HttpError } from "./request";
import { enforceLimit } from "./rate-limit";

export function json(value: unknown, status = 200) {
  return NextResponse.json(value, { status, headers: { "Cache-Control": "private, no-store" } });
}

export function apiError(error: unknown) {
  if (error instanceof HttpError || error instanceof StoreError) return json({ error: error.message }, error.status);
  // Mensagens de SDKs podem incluir cabeçalhos, endpoints ou dados pessoais.
  console.error("Falha interna de operação", error instanceof Error ? error.name : "UnknownError");
  return json({ error: "Não foi possível concluir a operação. Tente novamente em instantes." }, 500);
}

export async function adminAction(request: Request, action: (session: AdminSession) => Promise<Response>, scope = "admin", limit = 180) {
  try {
    assertSameOrigin(request);
    const session = await currentAdmin();
    if (!session) throw new HttpError(401, "Sua sessão expirou. Entre novamente no painel.");
    await enforceLimit(request, scope, limit, 60, session.id);
    return await action(session);
  } catch (error) { return apiError(error); }
}
