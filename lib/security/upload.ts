import "server-only";
import sharp from "sharp";
import { HttpError } from "./request";

export const maxImageBytes = 8 * 1024 * 1024;

export async function optimizeImage(bytes: Uint8Array, contentType: string) {
  if (bytes.byteLength === 0 || bytes.byteLength > maxImageBytes) throw new HttpError(413, "Envie uma imagem de até 8 MB.");
  const input = Buffer.from(bytes);
  const jpeg = input.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  const png = input.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp = input.subarray(0, 4).toString() === "RIFF" && input.subarray(8, 12).toString() === "WEBP";
  const format = jpeg ? "image/jpeg" : png ? "image/png" : webp ? "image/webp" : "";
  if (!format || contentType !== format) throw new HttpError(415, "Escolha uma imagem JPEG, PNG ou WebP válida.");
  try {
    const image = sharp(input, { limitInputPixels: 40_000_000, failOn: "warning", animated: false });
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height || (metadata.pages && metadata.pages > 1)) throw new Error("Unsupported image");
    return await image.rotate().resize(1920, 1920, { fit: "inside", withoutEnlargement: true }).webp({ quality: 84 }).toBuffer();
  } catch { throw new HttpError(422, "A imagem está danificada ou excede as dimensões permitidas."); }
}
