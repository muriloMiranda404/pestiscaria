import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { adminAction, json } from "@/lib/security/api";
import { HttpError, readBytes } from "@/lib/security/request";
import { demoDirectory } from "@/lib/security/demo-session";
import { maxImageBytes, optimizeImage } from "@/lib/security/upload";
import { serverSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export async function POST(request: Request) {
  return adminAction(request, async (session) => {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.startsWith("multipart/form-data;")) throw new HttpError(415, "Envie a imagem pelo formulário de upload.");
    const bytes = await readBytes(request, maxImageBytes + 32 * 1024);
    let form: FormData;
    try { form = await new Response(bytes, { headers: { "content-type": contentType } }).formData(); }
    catch { throw new HttpError(400, "Não foi possível ler o arquivo enviado."); }
    const file = form.get("file");
    if (!(file instanceof File) || form.getAll("file").length !== 1) throw new HttpError(400, "Selecione uma imagem.");
    const image = await optimizeImage(new Uint8Array(await file.arrayBuffer()), file.type);
    const filename = `${randomUUID()}.webp`;
    if (session.demo) {
      const directory = join(demoDirectory(), "media");
      await mkdir(directory, { recursive: true, mode: 0o700 });
      await writeFile(join(directory, filename), image, { flag: "wx", mode: 0o600 });
      return json({ url: `/api/media/${filename}` }, 201);
    }
    const client = await serverSupabase();
    const storage = client.storage.from("restaurant-media");
    const { error } = await storage.upload(filename, image, { contentType: "image/webp", upsert: false, cacheControl: "31536000" });
    if (error) throw new HttpError(503, "O armazenamento está indisponível. Tente novamente.");
    return json({ url: storage.getPublicUrl(filename).data.publicUrl }, 201);
  }, "upload", 20);
}

export async function DELETE(request: Request) {
  return adminAction(request, async (session) => {
    const { readJson } = await import("@/lib/security/request");
    const { getAdminCatalog } = await import("@/services/store");
    const body = await readJson(request, 2048);
    const url = typeof body === "object" && body !== null && "url" in body && typeof body.url === "string" ? body.url : "";
    const prefix = session.demo ? "/api/media/" : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/restaurant-media/`;
    if (!url.startsWith(prefix)) throw new HttpError(422, "Selecione uma imagem enviada pelo painel.");
    const filename = url.slice(prefix.length);
    if (!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}\.webp$/.test(filename)) throw new HttpError(422, "Imagem inválida.");
    const catalog = await getAdminCatalog();
    const references = [catalog.settings.logo,
      ...catalog.products.flatMap(item => [item.image?.src, ...item.images.map(image => image.src)]),
      ...catalog.events.map(item => item.image?.src), ...catalog.promotions.map(item => item.image?.src),
      ...catalog.gallery.map(item => item.image.src)];
    if (references.includes(url)) throw new HttpError(409, "Remova a imagem dos cadastros antes de excluí-la do armazenamento.");
    if (session.demo) {
      const { unlink } = await import("node:fs/promises");
      try { await unlink(join(demoDirectory(), "media", filename)); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    } else {
      const client = await serverSupabase();
      const { error } = await client.storage.from("restaurant-media").remove([filename]);
      if (error) throw new HttpError(503, "Não foi possível excluir a imagem. Tente novamente.");
    }
    return json({ ok: true });
  });
}
