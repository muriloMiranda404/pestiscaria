import "server-only";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { serverSupabase } from "@/lib/supabase";
import { HttpError } from "./request";

const buckets = new Map<string, { count: number; expires: number }>();

export function checkLocalLimit(key: string, limit: number, windowSeconds: number, now = Date.now()) {
  if (buckets.size > 10_000) {
    for (const [name, value] of buckets) if (value.expires <= now) buckets.delete(name);
  }
  const existing = buckets.get(key);
  if (!existing || existing.expires <= now) {
    if (buckets.size > 20_000) throw new HttpError(429, "Muitas solicitações. Aguarde alguns minutos.");
    buckets.set(key, { count: 1, expires: now + windowSeconds * 1000 });
    return;
  }
  existing.count += 1;
  if (existing.count > limit) throw new HttpError(429, "Muitas solicitações. Aguarde alguns minutos.");
}

function clientKey(request: Request) {
  const header = process.env.TRUSTED_CLIENT_IP_HEADER || (process.env.VERCEL === "1" ? "x-vercel-forwarded-for" : "");
  // Só confiar em um cabeçalho que a hospedagem substitui antes de encaminhar a requisição.
  const address = header ? request.headers.get(header)?.split(",")[0].trim() : null;
  if (!address || address.length > 80) return "shared";
  return createHash("sha256").update(`${process.env.SUPABASE_SERVICE_ROLE_KEY || "local"}:${new Date().toISOString().slice(0, 10)}:${address}`).digest("hex");
}

export async function enforceLimit(request: Request, scope: string, limit: number, seconds = 60, adminId?: string) {
  const key = `${scope}:${adminId || clientKey(request)}`;
  checkLocalLimit(key, limit, seconds);
  if (process.env.APP_MODE === "demo") return;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const client = url && serviceKey
    ? createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : adminId ? await serverSupabase() : null;
  // Supabase Auth conserva seus próprios limites quando a chave privilegiada é opcional.
  if (!client) {
    if (scope !== "login") throw new HttpError(503, "Este serviço está temporariamente indisponível.");
    return;
  }
  const { data, error } = await client.rpc("consume_rate_limit", { p_key: key, p_limit: limit, p_window: seconds });
  if (error) throw new HttpError(503, "Este serviço está temporariamente indisponível.");
  if (data !== true) throw new HttpError(429, "Muitas solicitações. Aguarde alguns minutos.");
}
