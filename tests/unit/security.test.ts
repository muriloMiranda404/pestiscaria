import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { assertSameOrigin, HttpError, readBytes, readJson } from "@/lib/security/request";
import { createDemoSession, verifyDemoSession, sessionLifetime } from "@/lib/security/demo-session";
import { optimizeImage } from "@/lib/security/upload";
import { checkLocalLimit } from "@/lib/security/rate-limit";

let temporary = "";
beforeAll(async () => { temporary = await mkdtemp(join(tmpdir(), "lucrecio-auth-test-")); });
afterEach(() => { vi.unstubAllEnvs(); });
afterAll(async () => { await rm(temporary, { recursive: true, force: true }); });

function post(body = "{}", headers: Record<string, string> = {}) {
  return new Request("https://example.test/api/admin/settings", { method: "POST", body,
    headers: { origin: "https://example.test", "content-type": "application/json", ...headers } });
}

describe("origem e limites do corpo", () => {
  it("aceita origem do site e recusa requisições de outro site", () => {
    expect(() => assertSameOrigin(post())).not.toThrow();
    expect(() => assertSameOrigin(post("{}", { origin: "https://outside.test" }))).toThrow(HttpError);
    expect(() => assertSameOrigin(post("{}", { "sec-fetch-site": "cross-site" }))).toThrow(HttpError);
    expect(() => assertSameOrigin(new Request("https://example.test"))).toThrow(HttpError);
  });
  it("valida JSON e limita bytes mesmo sem content-length", async () => {
    await expect(readJson(post('{"name":"Mesa"}'))).resolves.toEqual({ name: "Mesa" });
    await expect(readJson(post("invalid"))).rejects.toMatchObject({ status: 400 });
    await expect(readJson(post("{}", { "content-type": "text/html" }))).rejects.toMatchObject({ status: 415 });
    await expect(readBytes(post("abcdefghijkl"), 10)).rejects.toMatchObject({ status: 413 });
    await expect(readBytes(post("{}", { "content-length": "100" }), 10)).rejects.toMatchObject({ status: 413 });
  });
});

describe("sessão de demonstração", () => {
  it("assina sessões diferentes, rejeita adulteração e expiração", async () => {
    vi.stubEnv("APP_MODE", "demo");
    vi.stubEnv("DEMO_DB_PATH", join(temporary, "demo.sqlite"));
    const now = Date.now();
    const [first, second] = await Promise.all([createDemoSession(now), createDemoSession(now)]);
    expect(first).not.toBe(second);
    await expect(verifyDemoSession(first, now)).resolves.toBe(true);
    await expect(verifyDemoSession(`${first.slice(0, -1)}${first.endsWith("a") ? "b" : "a"}`, now)).resolves.toBe(false);
    await expect(verifyDemoSession(first, now + sessionLifetime * 1000)).resolves.toBe(false);
    vi.stubEnv("APP_MODE", "production");
    await expect(verifyDemoSession(first, now)).resolves.toBe(false);
    await expect(createDemoSession()).rejects.toThrow("desativada");
  });
});

describe("upload de imagem", () => {
  it("recodifica e redimensiona uma imagem válida", async () => {
    const png = await sharp({ create: { width: 2100, height: 100, channels: 3, background: "#a94026" } }).png().toBuffer();
    const converted = await optimizeImage(png, "image/png");
    const info = await sharp(converted).metadata();
    expect(info.format).toBe("webp");
    expect(info.width).toBe(1920);
    expect(info.exif).toBeUndefined();
  });
  it("recusa conteúdo incompatível com o tipo declarado", async () => {
    await expect(optimizeImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'), "image/png")).rejects.toMatchObject({ status: 415 });
    const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: "red" } }).png().toBuffer();
    await expect(optimizeImage(png, "image/jpeg")).rejects.toMatchObject({ status: 415 });
    await expect(optimizeImage(new Uint8Array(), "image/png")).rejects.toMatchObject({ status: 413 });
  });
});

it("limita tentativas e reabre a janela após expiração", () => {
  checkLocalLimit("unit-login", 2, 10, 1000);
  checkLocalLimit("unit-login", 2, 10, 1001);
  expect(() => checkLocalLimit("unit-login", 2, 10, 1002)).toThrow(HttpError);
  expect(() => checkLocalLimit("unit-login", 2, 10, 11000)).not.toThrow();
});
