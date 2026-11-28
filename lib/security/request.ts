export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "HttpError";
  }
}

function asOrigin(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol) ? url.origin : null;
  } catch {
    return null;
  }
}

/** Apenas os destinos deste site podem originar ações que recebem cookies de sessão. */
export function assertSameOrigin(request: Request) {
  const originHeader = request.headers.get("origin");
  const origin = asOrigin(originHeader ?? request.headers.get("referer"));
  if (!origin || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new HttpError(403, "Atualize a página para enviar esta solicitação pelo site.");
  }
  const requestOrigin = new URL(request.url);
  const allowed = [requestOrigin.origin, asOrigin(process.env.NEXT_PUBLIC_SITE_URL)];
  // Na prévia com proxy, o Next pode montar request.url com o host interno.
  const host = request.headers.get("host");
  if (host && /^[a-z0-9.[\]:-]+$/i.test(host)) {
    allowed.push(asOrigin(`${requestOrigin.protocol}//${host}`));
    // TLS pode terminar no proxy. A origem HTTPS ainda deve coincidir com Host.
    allowed.push(asOrigin(`https://${host}`));
  }
  if (!allowed.includes(origin)) throw new HttpError(403, "Origem da solicitação inválida.");
}

export async function readBytes(request: Request, maximum: number): Promise<Uint8Array<ArrayBuffer>> {
  const size = request.headers.get("content-length");
  if (size && (!/^\d+$/.test(size) || Number(size) > maximum)) {
    throw new HttpError(413, "O conteúdo enviado ultrapassa o limite permitido.");
  }
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Nenhum conteúdo foi enviado.");
  const parts: Uint8Array[] = [];
  let length = 0;
  try {
    for (let part = await reader.read(); !part.done; part = await reader.read()) {
      length += part.value.byteLength;
      if (length > maximum) {
        await reader.cancel();
        throw new HttpError(413, "O conteúdo enviado ultrapassa o limite permitido.");
      }
      parts.push(part.value);
    }
  } finally {
    reader.releaseLock();
  }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.byteLength;
  }
  return result;
}

export async function readJson(request: Request, maximum = 128 * 1024) {
  const contentType = (request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json" && contentType !== "text/plain") {
    throw new HttpError(415, "Envie os dados no formato JSON.");
  }
  const body = await readBytes(request, maximum);
  try {
    return JSON.parse(new TextDecoder().decode(body)) as unknown;
  } catch {
    throw new HttpError(400, "Confira o formato dos dados enviados.");
  }
}
