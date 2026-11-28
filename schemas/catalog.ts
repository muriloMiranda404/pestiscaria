import { z } from "zod";
import type { Entity, EntityMap } from "@/types/domain";
import { StoreError } from "@/services/errors";

const text = (max: number) => z.string().trim().max(max);
const required = (max: number) => text(max).min(1);
const cents = z.number().int().min(0).max(99_999_999);
const instant = z.iso.datetime({ offset: true });
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100);
const clock = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const phone = z.string().trim().max(24).regex(/^\+?[\d()\s.-]+$/).refine(v => /^\d{10,15}$/.test(v.replace(/\D/g, "")));
export const identifier = z.uuid();

export function validPhotoSource(src: string) {
  if (/^\/images\/[a-zA-Z0-9/_-]+\.(avif|webp|jpe?g|png)$/i.test(src)) return true;
  if (/^\/api\/media\/[a-f0-9-]{36}\.webp$/.test(src)) return true;
  try {
    const url = new URL(src);
    const origin = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return Boolean(origin && url.origin === new URL(origin).origin && !url.username && !url.password &&
      (url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) &&
      /^\/storage\/v1\/object\/public\/restaurant-media\/[\w-]+\.(avif|webp|jpe?g|png)$/i.test(url.pathname) &&
      !url.search && !url.hash);
  } catch { return false; }
}

function link(check: (url: URL) => boolean) {
  return text(500).refine(value => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return url.protocol === "https:" && !url.username && !url.password && !url.port && check(url);
    } catch { return false; }
  });
}

const instagram = link(u => ["instagram.com", "www.instagram.com"].includes(u.hostname));
const maps = link(u => u.hostname === "maps.app.goo.gl" || u.hostname === "maps.google.com" ||
  (["google.com", "www.google.com", "www.google.com.br"].includes(u.hostname) && /^\/maps(?:\/|$)/.test(u.pathname)));
const photoSource = required(700).refine(validPhotoSource);
export const photoSchema = z.object({ src: photoSource, alt: required(240), illustrative: z.boolean() });
const base = { status: z.enum(["draft", "published", "archived"]), position: z.number().int().min(0).max(1_000_000) };
const namedPrices = z.array(z.object({ name: required(100), price_cents: cents })).max(50);
const entitySchemas = {
  categories: z.object({ ...base, name: required(120), slug }),
  products: z.object({
    ...base, name: required(160), slug, category_id: identifier, description: text(4000),
    image: photoSchema.nullable(), images: z.array(photoSchema).max(20), price_cents: cents.nullable(),
    variants: namedPrices, addons: namedPrices, ingredients: text(2000), allergens: text(2000),
    serves: text(120), available: z.boolean(), featured: z.boolean(),
  }),
  events: z.object({
    ...base, title: required(160), slug, description: text(6000), image: photoSchema.nullable(),
    starts_at: instant, ends_at: instant.nullable(), artist: text(200), fee_cents: cents.nullable(), notes: text(2000), featured: z.boolean(),
  }),
  promotions: z.object({
    ...base, title: required(160), product_id: identifier, price_cents: cents, starts_at: instant,
    ends_at: instant, image: photoSchema.nullable(), featured: z.boolean(),
  }),
  gallery: z.object({ ...base, image: photoSchema, category: required(100), instagram_url: instagram }),
};

export function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map(i => i.path.join(".")).filter(Boolean))];
    throw new StoreError(422, fields.length ? `Confira os campos obrigatórios e o formato dos dados (${fields.slice(0, 4).join(", ")}).` : "Confira o formato dos dados informados.");
  }
  return parsed.data;
}

export function validateEntity<E extends Entity>(entity: E, data: unknown, partial: boolean) {
  const schema = entitySchemas[entity];
  const result = parse<unknown>(partial ? schema.partial() : schema, data) as Partial<EntityMap[E]>;
  if (!Object.keys(result).length) throw new StoreError(422, "Informe pelo menos um campo.");
  if ("starts_at" in result && "ends_at" in result && result.starts_at && result.ends_at &&
      new Date(String(result.ends_at)) <= new Date(String(result.starts_at))) {
    throw new StoreError(422, "O término precisa ocorrer depois do início.");
  }
  return result;
}

const hex = z.string().regex(/^#[\da-f]{6}$/i);
const hoursSchema = z.object({ day: z.number().int().min(0).max(6), opens: clock, closes: clock })
  .refine(h => h.opens !== h.closes);
const specialHoursSchema = z.object({ date: z.iso.date(), label: required(160), opens: z.union([clock, z.literal("")]), closes: z.union([clock, z.literal("")]) })
  .refine(h => (!h.opens && !h.closes) || (!!h.opens && !!h.closes && h.opens !== h.closes));
export const settingsSchema = z.object({
  name: required(150), logo: z.union([photoSource, z.literal("")]), primary_color: hex, accent_color: hex,
  phone, whatsapp: z.union([phone, z.literal("")]), whatsapp_confirmed: z.boolean(), instagram,
  street: required(220), district: required(120), city: required(120), state: z.string().regex(/^[A-Z]{2}$/),
  postal_code: z.string().regex(/^(?:\d{5}-?\d{3})?$/), reference: text(300), maps_url: maps,
  about: text(6000), announcement: text(700), announcement_until: instant.nullable(),
  hours: z.array(hoursSchema).max(35), special_hours: z.array(specialHoursSchema).max(370),
  seo_title: text(180), seo_description: text(350), cnpj: z.string().regex(/^(?:\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})?$/),
  show_cnpj: z.boolean(), orders_enabled: z.boolean(), reservations_enabled: z.boolean(),
  analytics_enabled: z.boolean(), pickup_enabled: z.boolean(), delivery_enabled: z.boolean(), maintenance: z.boolean(),
}).superRefine((s, ctx) => {
  if (s.whatsapp_confirmed && !s.whatsapp) ctx.addIssue({ code: "custom", path: ["whatsapp"], message: "Informe o WhatsApp confirmado." });
  if (s.orders_enabled && !s.whatsapp_confirmed) ctx.addIssue({ code: "custom", path: ["whatsapp_confirmed"], message: "Confirme o WhatsApp antes de habilitar pedidos." });
  if (new Set(s.special_hours.map(h => h.date)).size !== s.special_hours.length) ctx.addIssue({ code: "custom", path: ["special_hours"], message: "Cada data admite um funcionamento excepcional." });
  if (new Set(s.hours.map(h => h.day + ":" + h.opens)).size !== s.hours.length) ctx.addIssue({ code: "custom", path: ["hours"], message: "Há uma faixa de horário repetida." });
});

export const qrSchema = z.object({ label: required(80), table_code: z.string().regex(/^[a-zA-Z0-9_-]{0,32}$/), template: z.enum(["classico", "terracota"]) });
export const reservationStatus = z.enum(["pending", "confirmed", "declined", "cancelled", "completed"]);
export const reservationSchema = z.object({ date: z.iso.date(), time: clock, people: z.number().int().min(1).max(100), name: required(100), phone, notes: text(500) });
export const metricSchema = z.object({
  kind: z.enum(["menu", "product", "category", "contact", "directions", "qr", "reservation"]),
  subject: z.string().trim().max(100).regex(/^[\p{L}\p{N}\s._-]*$/u), campaign: z.string().trim().max(80).regex(/^[\p{L}\p{N}\s._-]*$/u),
});
