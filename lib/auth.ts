import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { serverSupabase, supabaseConfigured } from "@/lib/supabase";
import { demoCookie, verifyDemoSession } from "@/lib/security/demo-session";

export type AdminSession = { id: string; demo: boolean };

export async function currentAdmin(): Promise<AdminSession | null> {
  if (process.env.APP_MODE === "demo") {
    const jar = await cookies();
    if (await verifyDemoSession(jar.get(demoCookie)?.value)) return { id: "demo", demo: true };
    return null;
  }
  if (!supabaseConfigured()) return null;
  const client = await serverSupabase();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return null;
  const profile = await client.from("admin_profiles").select("id").eq("id", user.id).maybeSingle();
  if (profile.error || !profile.data) return null;
  return { id: user.id, demo: false };
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await currentAdmin();
  if (!session) redirect("/admin/login");
  return session;
}
