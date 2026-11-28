import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (process.env.APP_MODE === "demo" || !url || !key ||
    !request.cookies.getAll().some(({ name }) => name.startsWith("lucrecio-admin-auth"))) {
    return NextResponse.next();
  }
  let response = NextResponse.next({ request });
  const client = createServerClient(url, key, {
    cookieOptions: { name: "lucrecio-admin-auth", httpOnly: true, secure: process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") ?? false, sameSite: "lax", path: "/" },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(changes) {
        for (const { name, value } of changes) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of changes) response.cookies.set(name, value, options);
        response.headers.set("Cache-Control", "private, no-store");
      },
    },
  });
  // A autorização final usa getUser() e o perfil administrativo no servidor.
  await client.auth.getClaims();
  return response;
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
