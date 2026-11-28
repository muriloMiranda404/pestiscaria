import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
vi.mock("@/lib/supabase", () => ({ serverSupabase: vi.fn(), supabaseConfigured: () => false }));
import { createReservation, getAdminCatalog, getCatalog, listMetrics, listQr, recordMetric, removeEntity, resetDemo, saveEntity, saveQr, saveSettings } from "@/services/store";
import { emptyCatalog, publicCatalog } from "@/services/publication";

let directory: string;
beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), "lucrecio-store-"));
  vi.stubEnv("APP_MODE", "demo"); vi.stubEnv("DEMO_DB_PATH", join(directory, "demo.sqlite"));
});
afterAll(async () => { vi.unstubAllEnvs(); await rm(directory, { recursive: true, force: true }); });

describe("catálogo demonstrativo isolado", () => {
  it("persiste edição e impede exclusão de categoria vinculada", async () => {
    const catalog = await getAdminCatalog();
    expect(catalog.demo).toBe(true);
    const product = catalog.products[0];
    await saveEntity("products", { available: false, price_cents: 3790 }, product.id);
    const saved = (await getAdminCatalog()).products.find(item => item.id === product.id);
    expect(saved?.price_cents).toBe(3790); expect(saved?.available).toBe(false);
    await expect(removeEntity("categories", product.category_id)).rejects.toThrow("produtos vinculados");
  });
  it("valida a combinação final de datas no PATCH parcial", async () => {
    const event = (await getAdminCatalog()).events[0];
    await expect(saveEntity("events", { ends_at: "2020-01-01T00:00:00Z" }, event.id)).rejects.toThrow("término");
    expect((await getAdminCatalog()).events[0].ends_at).toBe(null);
  });
  it("impede slugs duplicados e relações inexistentes", async () => {
    const category = (await getAdminCatalog()).categories[0];
    await expect(saveEntity("categories", category)).rejects.toThrow("endereço");
    const product = (await getAdminCatalog()).products[0];
    await expect(saveEntity("products", { category_id: "00000000-0000-4000-8000-000000000001" }, product.id)).rejects.toThrow("categoria existente");
    await expect(saveEntity("products", { price_cents: 1.2 }, product.id)).rejects.toThrow("formato");
  });
  it("retira produtos de categorias arquivadas da leitura pública", async () => {
    const category = (await getAdminCatalog()).categories[0];
    await saveEntity("categories", { status: "archived" }, category.id);
    expect((await getCatalog()).products.some(product => product.category_id === category.id)).toBe(false);
    expect((await getAdminCatalog()).products.some(product => product.category_id === category.id)).toBe(true);
  });
  it("grava métricas apenas quando habilitadas e filtra o período", async () => {
    const input = { kind: "menu" as const, subject: "", campaign: "" };
    await recordMetric(input);
    const from = "2000-01-01T00:00:00.000Z", to = "2100-01-01T00:00:00.000Z";
    expect(await listMetrics(from, to)).toHaveLength(0);
    await saveSettings({ ...(await getAdminCatalog()).settings, analytics_enabled: true });
    await recordMetric(input);
    expect(await listMetrics(from, to)).toHaveLength(1);
    expect(await listMetrics(from, "2001-01-01T00:00:00Z")).toHaveLength(0);
  });
  it("rejeita dados pessoais em reserva demo e redefine o banco", async () => {
    await expect(createReservation({ date: "2099-01-01", time: "20:00", people: 2, name: "Teste", phone: "27999999999", notes: "" })).rejects.toThrow("demonstração");
    await saveQr({ label: "Mesa 1", table_code: "1", template: "classico" });
    expect(await listQr()).toHaveLength(1);
    await resetDemo();
    expect(await listQr()).toHaveLength(0);
    expect((await getAdminCatalog()).products[0].price_cents).toBe(3200);
    expect((await getAdminCatalog()).settings.analytics_enabled).toBe(false);
  });
});

describe("publicação", () => {
  it("oculta canais não confirmados, CNPJ sem autorização e avisos expirados", () => {
    const catalog = emptyCatalog();
    catalog.settings.whatsapp = "27999999999";
    catalog.settings.announcement = "Aviso antigo";
    catalog.settings.announcement_until = "2020-01-01T00:00:00Z";
    const result = publicCatalog(catalog);
    expect(result.settings.whatsapp).toBe("");
    expect(result.settings.cnpj).toBe("");
    expect(result.settings.announcement).toBe("");
  });
});
