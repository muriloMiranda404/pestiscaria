import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { demoDirectory } from "@/lib/security/demo-session";

export const runtime = "nodejs";
export async function GET(_request: Request, context: { params: Promise<{ filename: string }> }) {
  const { filename } = await context.params;
  if (process.env.APP_MODE !== "demo" || !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}\.webp$/.test(filename)) return new Response(null, { status: 404 });
  try {
    const file = await readFile(join(demoDirectory(), "media", filename));
    return new Response(new Uint8Array(file), { headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex" } });
  } catch { return new Response(null, { status: 404 }); }
}
