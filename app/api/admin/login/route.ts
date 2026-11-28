import { cookies } from "next/headers";
import { z } from "zod";
import { serverSupabase, supabaseConfigured } from "@/lib/supabase";
import { createDemoSession, demoCookie, sessionLifetime } from "@/lib/security/demo-session";
import { assertSameOrigin, HttpError, readJson } from "@/lib/security/request";
import { enforceLimit } from "@/lib/security/rate-limit";
import { apiError, json } from "@/lib/security/api";

export const runtime = "nodejs";
const credentials = z.object({ email: z.email().max(254), password: z.string().min(1).max(200) });

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await enforceLimit(request, "login", process.env.APP_MODE === "demo" ? 60 : 15, 300);
    const body = await readJson(request, 4096);
    if (process.env.APP_MODE === "demo") {
      if (!z.object({ demo: z.literal(true) }).safeParse(body).success) throw new HttpError(400, "Use o acesso de demonstração.");
      const jar = await cookies();
      const secure = new URL(request.headers.get("origin") || request.url).protocol === "https:";
      jar.set(demoCookie, await createDemoSession(), { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: sessionLifetime });
      return json({ ok: true });
    }
    if (!supabaseConfigured()) throw new HttpError(503, "O painel está aguardando a configuração do responsável técnico.");
    const parsed = credentials.safeParse(body);
    if (!parsed.success) throw new HttpError(422, "Informe um e-mail válido e sua senha.");
    const client = await serverSupabase();
    const { data, error } = await client.auth.signInWithPassword(parsed.data);
    if (error || !data.user) throw new HttpError(401, "Confira o e-mail e a senha cadastrados.");
    const profile = await client.from("admin_profiles").select("id").eq("id", data.user.id).maybeSingle();
    if (profile.error || !profile.data) {
      await client.auth.signOut({ scope: "local" });
      throw new HttpError(403, "Esta conta não possui acesso ao painel.");
    }
    return json({ ok: true });
  } catch (error) { return apiError(error); }
}
