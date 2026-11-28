import type { Catalog, Entity, EntityMap, Photo, Status } from "@/types/domain";
import { centsInput, dateInput, instantInSaoPaulo, makeSlug, parseCents } from "./format";

export interface PriceValue { name: string; price: string }
export interface EditorValues {
  name: string; slug: string; status: Status; position: number; category_id: string; description: string;
  image: Photo | null; images: Photo[]; price: string; variants: PriceValue[]; addons: PriceValue[];
  ingredients: string; allergens: string; serves: string; available: boolean; featured: boolean;
  starts_at: string; ends_at: string; artist: string; notes: string; product_id: string;
  category: string; instagram_url: string;
}
export function editorValues(entity: Entity, item: EntityMap[Entity] | null, catalog: Catalog): EditorValues {
  const data = item as Partial<EntityMap['products'] & EntityMap['events'] & EntityMap['promotions'] & EntityMap['gallery']> | null;
  return {
    name: data?.name ?? data?.title ?? "", slug: data?.slug ?? "", status: data?.status ?? "draft", position: data?.position ?? 0,
    category_id: data?.category_id ?? catalog.categories[0]?.id ?? "", description: data?.description ?? "", image: data?.image ?? null,
    images: data?.images ?? [], price: centsInput(entity === "events" ? data?.fee_cents ?? null : data?.price_cents ?? null),
    variants: (data?.variants ?? []).map(v => ({name:v.name, price:centsInput(v.price_cents)})),
    addons: (data?.addons ?? []).map(v => ({name:v.name, price:centsInput(v.price_cents)})),
    ingredients: data?.ingredients ?? "", allergens: data?.allergens ?? "", serves: data?.serves ?? "", available: data?.available ?? true,
    featured: data?.featured ?? false, starts_at: dateInput(data?.starts_at ?? null), ends_at: dateInput(data?.ends_at ?? null),
    artist: data?.artist ?? "", notes: data?.notes ?? "", product_id: data?.product_id ?? catalog.products[0]?.id ?? "",
    category: data?.category ?? "Ambiente", instagram_url: data?.instagram_url ?? "",
  };
}
function prices(values: PriceValue[]) {
  return values.map(value => {
    const cents = parseCents(value.price);
    if (!value.name.trim() || cents === null) throw new Error("Preencha o nome e o preço de cada variação e adicional.");
    return {name:value.name.trim(), price_cents:cents};
  });
}
export function editorPayload(entity: Entity, value: EditorValues) {
  const base = {status:value.status, position:Number(value.position)};
  const name = value.name.trim();
  const slug = value.slug.trim() || makeSlug(name);
  const image = value.image;
  if (image && !image.alt.trim()) throw new Error("Descreva a fotografia para leitores de tela.");
  switch (entity) {
    case 'categories': return {...base, name, slug};
    case 'products': return {...base, name, slug, category_id:value.category_id, description:value.description, image, images:value.images,
      price_cents:parseCents(value.price), variants:prices(value.variants), addons:prices(value.addons), ingredients:value.ingredients,
      allergens:value.allergens, serves:value.serves, available:value.available, featured:value.featured};
    case 'events': return {...base, title:name, slug, description:value.description, image, starts_at:instantInSaoPaulo(value.starts_at),
      ends_at:value.ends_at ? instantInSaoPaulo(value.ends_at) : null, artist:value.artist, fee_cents:parseCents(value.price), notes:value.notes, featured:value.featured};
    case 'promotions': {
      const cents = parseCents(value.price);
      if (cents === null) throw new Error("Informe o preço promocional.");
      return {...base, title:name, product_id:value.product_id, price_cents:cents, starts_at:instantInSaoPaulo(value.starts_at), ends_at:instantInSaoPaulo(value.ends_at), image, featured:value.featured};
    }
    case 'gallery': {
      if (!image) throw new Error("Selecione uma fotografia para a galeria.");
      return {...base, image, category:value.category, instagram_url:value.instagram_url};
    }
  }
}
