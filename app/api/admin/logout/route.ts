import { cookies } from "next/headers";
import { serverSupabase, supabaseConfigured } from "@/lib/supabase";
import { demoCookie } from "@/lib/security/demo-session";
import { assertSameOrigin } from "@/lib/security/request";
import { apiError, json } from "@/lib/security/api";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const jar = await cookies();
    jar.delete(demoCookie);
    if (process.env.APP_MODE !== "demo" && supabaseConfigured()) {
      const client = await serverSupabase();
      await client.auth.signOut({ scope: "local" });
      for (const cookie of jar.getAll()) if (cookie.name.startsWith("lucrecio-admin-auth")) jar.delete(cookie.name);
    }
    return json({ ok: true });
  } catch (error) { return apiError(error); }
}
