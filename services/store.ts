import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { serverSupabase, supabaseConfigured } from "@/lib/supabase";
import { emptyCatalog, publicCatalog } from "@/services/publication";
import { databaseFailure, StoreError } from "@/services/errors";
import { appendDemoMetric, appendDemoQr, changeDemo, clearDemo, demoMetrics, demoQr, readDemo } from "@/services/demo-store";
import { identifier, metricSchema, parse, qrSchema, reservationSchema, reservationStatus, settingsSchema, validateEntity } from "@/schemas/catalog";
import type { Catalog, Entity, EntityMap, Metric, QrEntry, Reservation, ReservationStatus, Settings, Photo, NamedPrice, Product } from "@/types/domain";

const tables = { categories: "categories", products: "menu_items", events: "events", promotions: "promotions", gallery: "gallery_images" } as const;
const demo = () => process.env.APP_MODE === "demo";

type DatabaseResult<T> = { data: T; error: { code?: string } | null };
function result<T>(response: DatabaseResult<T>): T {
  if (response.error) databaseFailure(response.error.code);
  return response.data;
}

async function readCatalog(admin: boolean): Promise<Catalog> {
  if (demo()) return readDemo();
  if (!supabaseConfigured()) {
    if (admin) throw new StoreError(503, "Configure o Supabase para gerenciar os cadastros.");
    return emptyCatalog();
  }
  const client = await serverSupabase();
  const settingsRequest = admin ? client.from("restaurant_settings").select("config").eq("id", 1).single() : client.rpc("public_restaurant_settings");
  const [settings, categories, products, events, promotions, gallery] = await Promise.all([
    settingsRequest,
    client.from("categories").select("id,status,position,name,slug").order("position"),
    client.from("menu_items").select("*,menu_item_images(photo,position),menu_item_variants(name,price_cents,position),menu_item_addons(name,price_cents,position)").order("position"),
    client.from("events").select("*").order("starts_at"),
    client.from("promotions").select("*").order("starts_at"),
    client.from("gallery_images").select("*").order("position"),
  ]);
  const settingsValue = result(settings);
  const rows = result(products) ?? [];
  const ordered = <T extends { position: number }>(values: T[]) => values.sort((a, b) => a.position - b.position);
  const catalog: Catalog = {
    settings: { ...emptyCatalog().settings, ...(admin ? settingsValue?.config : settingsValue) },
    categories: result(categories) ?? [],
    products: rows.map(row => {
      const item = row as unknown as Product & {
        menu_item_images: (Photo & { photo: Photo; position: number })[];
        menu_item_variants: (NamedPrice & { position: number })[];
        menu_item_addons: (NamedPrice & { position: number })[];
      };
      return {
        ...item,
        images: ordered(item.menu_item_images ?? []).map(image => image.photo),
        variants: ordered(item.menu_item_variants ?? []).map(({ name, price_cents }) => ({ name, price_cents })),
        addons: ordered(item.menu_item_addons ?? []).map(({ name, price_cents }) => ({ name, price_cents })),
      };
    }),
    events: result(events) ?? [], promotions: result(promotions) ?? [], gallery: result(gallery) ?? [], demo: false,
  };
  return catalog;
}

export async function getCatalog(): Promise<Catalog> {
  return publicCatalog(await readCatalog(false));
}
export async function getAdminCatalog(): Promise<Catalog> { return readCatalog(true); }

function ensureUnique<E extends Entity>(catalog: Catalog, entity: E, value: EntityMap[E], id: string) {
  if ("slug" in value && catalog[entity].some(item => item.id !== id && "slug" in item && item.slug === value.slug)) {
    throw new StoreError(409, "Já existe um cadastro com esse endereço.");
  }
  if (entity === "products" && !catalog.categories.some(category => category.id === (value as EntityMap["products"]).category_id)) {
    throw new StoreError(409, "Selecione uma categoria existente.");
  }
  if (entity === "promotions" && !catalog.products.some(product => product.id === (value as EntityMap["promotions"]).product_id)) {
    throw new StoreError(409, "Selecione um produto existente.");
  }
}

export async function saveEntity<E extends Entity>(entity: E, data: unknown, id?: string): Promise<EntityMap[E]> {
  if (id) parse(identifier, id);
  const parsed = validateEntity(entity, data, Boolean(id));
  if (demo()) return changeDemo(`save:${entity}:${id ?? "new"}`, catalog => {
    const rows = catalog[entity] as EntityMap[E][];
    const index = id ? rows.findIndex(row => row.id === id) : -1;
    if (id && index < 0) throw new StoreError(404, "O cadastro não foi encontrado.");
    const value = { ...validateEntity(entity, { ...(index >= 0 ? rows[index] : {}), ...parsed }, false), id: id ?? randomUUID() } as EntityMap[E];
    ensureUnique(catalog, entity, value, value.id);
    if (index >= 0) rows[index] = value; else rows.push(value);
    return value;
  });
  const client = await serverSupabase();
  if (entity === "products") {
    const savedId = result(await client.rpc("save_menu_item", { p_id: id ?? null, p_data: parsed }));
    const all = await getAdminCatalog();
    const saved = all.products.find(item => item.id === savedId);
    if (!saved) throw new StoreError(503, "Confira o produto no painel antes de repetir a operação.");
    return saved as EntityMap[E];
  }
  const request = id ? client.from(tables[entity]).update(parsed as never).eq("id", id) : client.from(tables[entity]).insert(parsed as never);
  const saved = result(await request.select().maybeSingle());
  if (!saved) throw new StoreError(404, "O cadastro não foi encontrado.");
  return saved as EntityMap[E];
}

export async function removeEntity(entity: Entity, id: string) {
  parse(identifier, id);
  if (demo()) return changeDemo(`delete:${entity}:${id}`, catalog => {
    const rows = catalog[entity];
    const index = rows.findIndex(row => row.id === id);
    if (index < 0) throw new StoreError(404, "O cadastro não foi encontrado.");
    if (entity === "categories" && catalog.products.some(product => product.category_id === id)) throw new StoreError(409, "Esta categoria possui produtos vinculados. Transfira ou exclua esses produtos primeiro.");
    if (entity === "products" && catalog.promotions.some(offer => offer.product_id === id)) throw new StoreError(409, "Este produto possui promoções vinculadas. Exclua as promoções primeiro.");
    rows.splice(index, 1);
  });
  const client = await serverSupabase();
  const removed = result(await client.from(tables[entity]).delete().eq("id", id).select("id").maybeSingle());
  if (!removed) throw new StoreError(404, "O cadastro não foi encontrado.");
}

export async function saveSettings(data: unknown): Promise<Settings> {
  const settings = parse(settingsSchema, data);
  if (demo()) return changeDemo("settings", catalog => { catalog.settings = settings; return settings; });
  const client = await serverSupabase();
  result(await client.from("restaurant_settings").update({ config: settings }).eq("id", 1).select().single());
  return settings;
}

export async function listMetrics(from: string, to: string): Promise<Metric[]> {
  const start = new Date(from), end = new Date(to);
  if (!Number.isFinite(+start) || !Number.isFinite(+end) || start >= end) throw new StoreError(422, "Selecione um período válido.");
  if (demo()) return demoMetrics(start.toISOString(), end.toISOString());
  const client = await serverSupabase();
  const metrics: Metric[] = [];
  // PostgREST paginates large result sets. Reading every page preserves real totals.
  for (let offset = 0; ; offset += 1000) {
    const batch = result(await client.from("analytics_events").select("kind,subject,campaign,created_at").gte("created_at", start.toISOString()).lt("created_at", end.toISOString()).order("created_at").order("id").range(offset, offset + 999)) ?? [];
    metrics.push(...batch);
    if (batch.length < 1000) return metrics;
  }
}

function publicWriter() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || demo()) throw new StoreError(503, "O recebimento de solicitações está indisponível. Utilize o contato da casa.");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
}

export async function recordMetric(data: Omit<Metric, "created_at">) {
  const parsed = parse(metricSchema, data);
  if (demo()) return appendDemoMetric(parsed);
  const catalog = await getCatalog();
  if (!catalog.settings.analytics_enabled) return;
  result(await publicWriter().rpc("append_metric", { p_data: parsed }));
}

export async function listReservations(): Promise<Reservation[]> {
  if (demo()) return [];
  const client = await serverSupabase();
  return result(await client.from("reservation_requests").select("id,date,time,people,name,phone,notes,status,created_at").order("created_at", { ascending: false }).limit(1000)) ?? [];
}

export async function createReservation(data: unknown): Promise<{ id: string; status: "pending" }> {
  const parsed = parse(reservationSchema, data);
  if (demo()) throw new StoreError(403, "A demonstração não envia solicitações de reserva.");
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  if (parsed.date < today) throw new StoreError(422, "Selecione uma data a partir de hoje.");
  const settings = (await getCatalog()).settings;
  if (!settings.reservations_enabled) throw new StoreError(403, "As reservas estão desativadas.");
  const id = result(await publicWriter().rpc("request_reservation", { p_data: parsed }));
  return { id, status: "pending" };
}

export async function updateReservation(id: string, status: ReservationStatus) {
  parse(identifier, id); parse(reservationStatus, status);
  if (demo()) throw new StoreError(403, "A demonstração não recebe reservas reais.");
  const client = await serverSupabase();
  const row = result(await client.from("reservation_requests").update({ status }).eq("id", id).select("id").maybeSingle());
  if (!row) throw new StoreError(404, "A solicitação não foi encontrada.");
}

export async function listQr(): Promise<QrEntry[]> {
  if (demo()) return demoQr();
  const client = await serverSupabase();
  return result(await client.from("qr_codes").select("id,label,table_code,template,created_at").order("created_at", { ascending: false })) ?? [];
}

export async function saveQr(data: unknown): Promise<QrEntry> {
  const parsed = parse(qrSchema, data);
  if (demo()) return appendDemoQr(parsed);
  const client = await serverSupabase();
  const row = result(await client.from("qr_codes").insert(parsed).select("id,label,table_code,template,created_at").single());
  if (!row) throw new StoreError(503, "Confira o QR Code no painel antes de repetir a operação.");
  return row;
}

export async function resetDemo() { clearDemo(); }
