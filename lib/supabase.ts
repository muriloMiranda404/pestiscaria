import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const authCookieName = "lucrecio-admin-auth";

export function supabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export async function serverSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || process.env.APP_MODE === "demo") {
    throw new Error("Serviço de autenticação indisponível neste ambiente.");
  }
  const jar = await cookies();
  return createServerClient(url, key, {
    cookieOptions: { name: authCookieName, httpOnly: true, secure: process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") ?? false, sameSite: "lax", path: "/" },
    cookies: {
      getAll: () => jar.getAll(),
      setAll(changes) {
        // O proxy renova a sessão antes da renderização de componentes somente leitura.
        try {
          for (const { name, value, options } of changes) jar.set(name, value, options);
        } catch (error) {
          if (!(error instanceof Error) || !error.message.includes("Cookies can only be modified")) throw error;
        }
      },
    },
  });
}
