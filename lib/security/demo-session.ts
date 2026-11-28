import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { link, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

export const demoCookie = "lucrecio-demo-session";
export const sessionLifetime = 60 * 60 * 4;

export function demoDirectory() {
  return dirname(resolve(/* turbopackIgnore: true */ process.env.DEMO_DB_PATH || ".local/demo.sqlite"));
}

async function readOrCreateKey() {
  if (process.env.APP_MODE !== "demo") throw new Error("A demonstração está desativada.");
  const directory = demoDirectory();
  const keyFile = join(directory, "demo-session.key");
  await mkdir(directory, { recursive: true, mode: 0o700 });
  try {
    return await readFile(keyFile);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  // Linkar um arquivo completo evita que duas primeiras visitas leiam uma chave parcial.
  const temp = join(directory, `.session-${randomBytes(16).toString("hex")}`);
  await writeFile(temp, randomBytes(32), { flag: "wx", mode: 0o600 });
  try {
    await link(temp, keyFile);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  } finally {
    await unlink(temp);
  }
  return readFile(keyFile);
}

function signature(key: Buffer, value: string) {
  if (key.length !== 32) throw new Error("A chave da demonstração precisa ser recriada.");
  return createHmac("sha256", key).update(value).digest("base64url");
}

export async function createDemoSession(now = Date.now()) {
  const payload = `${Math.floor(now / 1000) + sessionLifetime}.${randomBytes(18).toString("base64url")}`;
  return `${payload}.${signature(await readOrCreateKey(), payload)}`;
}

export async function verifyDemoSession(token: string | undefined, now = Date.now()) {
  if (process.env.APP_MODE !== "demo" || !token) return false;
  const match = /^(\d{10,11})\.([a-zA-Z0-9_-]{24})\.([a-zA-Z0-9_-]{43})$/.exec(token);
  if (!match) return false;
  const expires = Number(match[1]);
  const seconds = Math.floor(now / 1000);
  if (expires <= seconds || expires > seconds + sessionLifetime) return false;
  const expected = signature(await readOrCreateKey(), `${match[1]}.${match[2]}`);
  return timingSafeEqual(Buffer.from(expected), Buffer.from(match[3]));
}
